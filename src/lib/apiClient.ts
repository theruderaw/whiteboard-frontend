import { loadStoredToken, saveToken, clearStorageTokens } from "./authHelpers";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
};

const tryRefresh = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Must include existing refresh cookie!
    });
    
    if (!response.ok) throw new Error("Refresh failed");
    
    const data = await response.json();
    const newToken = data.access_token;
    
    // Preserve active storage paradigm by checking which one was used
    const wasAlways = !!document.cookie.includes("wb_at_perm");
    saveToken(newToken, wasAlways);
    
    return newToken;
  } catch (err) {
    clearStorageTokens();
    return null;
  }
};

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
  
  // Hydrate custom Headers if missing
  const headers = new Headers(options.headers || {});
  
  // Auto-inject access token if missing from existing headers
  let token = loadStoredToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // Setup initial configuration
  const config: RequestInit = { ...options, headers };
  
  try {
    let response = await fetch(url, config);
    
    // Intercept 401 and attempt recovery flow
    if (response.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await tryRefresh();
        isRefreshing = false;
        
        if (newToken) {
          onRefreshed(newToken);
        } else {
          // Final death - fully unauthorized
          refreshSubscribers = [];
          return response; 
        }
      }
      
      // Await the existing/pending refresh cycle promise and retry
      const retryPromise = new Promise<Response>((resolve) => {
        subscribeTokenRefresh((newToken) => {
          headers.set("Authorization", `Bearer ${newToken}`);
          resolve(fetch(url, { ...options, headers }));
        });
      });
      return await retryPromise;
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};
