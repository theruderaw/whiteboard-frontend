export const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

export const saveToken = (token: string, always: boolean) => {
  if (always) {
    document.cookie = `wb_at_perm=${token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
    localStorage.removeItem("wb_at");
    document.cookie = "wb_at_sentinel=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  } else {
    localStorage.setItem("wb_at", token);
    document.cookie = "wb_at_sentinel=1; path=/; samesite=lax";
    document.cookie = "wb_at_perm=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  }
};

export const loadStoredToken = (): string | null => {
  const perm = getCookie("wb_at_perm");
  if (perm) return perm;

  const stored = localStorage.getItem("wb_at");
  const sentinel = getCookie("wb_at_sentinel");

  if (stored) {
    if (sentinel) return stored;
    localStorage.removeItem("wb_at");
  }
  return null;
};

export const clearStorageTokens = () => {
  localStorage.removeItem("wb_at");
  document.cookie = "wb_at_sentinel=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie = "wb_at_perm=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
};
