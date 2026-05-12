import React, { createContext, useContext, useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface AuthContextType {
  user: any;
  accessToken: string | null;
  isLoading: boolean;
  login: (username: string, password: string, alwaysLoggedIn?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  error: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Token Helpers ─────────────────────────────────────────────────
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

const saveToken = (token: string, always: boolean) => {
  if (always) {
    // Option A: Persistent Cookie (7 days)
    document.cookie = `wb_at_perm=${token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
    // Cleanup temp
    localStorage.removeItem("wb_at");
    document.cookie = "wb_at_sentinel=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  } else {
    // Option B: LocalStorage + Session Cookie Sentinel (survives nav, dies on browser quit)
    localStorage.setItem("wb_at", token);
    document.cookie = "wb_at_sentinel=1; path=/; samesite=lax"; // No max-age = Session Cookie
    // Cleanup perm
    document.cookie = "wb_at_perm=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  }
};

const loadStoredToken = (): string | null => {
  // 1. Check persistent cookie
  const perm = getCookie("wb_at_perm");
  if (perm) return perm;

  // 2. Check LocalStorage + Sentinel
  const stored = localStorage.getItem("wb_at");
  const sentinel = getCookie("wb_at_sentinel");

  if (stored) {
    if (sentinel) {
      return stored; // Valid session
    } else {
      // Browser was quit, sentinel is gone, cleanup
      localStorage.removeItem("wb_at");
    }
  }
  return null;
};

const clearStorageTokens = () => {
  localStorage.removeItem("wb_at");
  document.cookie = "wb_at_sentinel=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie = "wb_at_perm=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return true;
      } else {
        setAccessToken(null);
        setUser(null);
        clearStorageTokens();
        return false;
      }
    } catch (err) {
      console.error("Fetch user failed", err);
      return false;
    }
  };

  const recoverSession = async () => {
    try {
      // Step 1: Check explicit storage (Requested overrides)
      const storedToken = loadStoredToken();
      if (storedToken) {
        setAccessToken(storedToken);
        const success = await fetchUser(storedToken);
        if (success) {
          setIsLoading(false);
          return;
        }
      }

      // Step 2: Fallback to HttpOnly Refresh if set
      const res = await fetch(`${API_URL}/auth/refresh`, { 
        method: "POST",
        credentials: "include" 
      });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.access_token);
        await fetchUser(data.access_token);
      }
    } catch (err) {
      console.error("Session recovery failed", err);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  useEffect(() => {
    recoverSession();
  }, []);

  const login = async (username: string, password: string, alwaysLoggedIn: boolean = false) => {
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Store token based on chosen strategy
        saveToken(data.access_token, alwaysLoggedIn);
        
        setAccessToken(data.access_token);
        await fetchUser(data.access_token);
      } else {
        const errData = await res.json();
        setError(errData.detail || "Login failed");
        throw new Error(errData.detail);
      }
    } catch (err: any) {
      setError(err.message || "Connection error");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    } finally {
      setUser(null);
      setAccessToken(null);
      clearStorageTokens();
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
