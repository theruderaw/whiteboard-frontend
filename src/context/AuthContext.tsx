import React, { createContext, useContext, useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface AuthContextType {
  user: any;
  accessToken: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      } else {
        setAccessToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error("Fetch user failed", err);
    }
  };

  const recoverSession = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, { method: "POST" });
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

  const login = async (username: string, password: string) => {
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
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
      await fetch(`${API_URL}/auth/logout`, { method: "POST" });
    } finally {
      setUser(null);
      setAccessToken(null);
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
