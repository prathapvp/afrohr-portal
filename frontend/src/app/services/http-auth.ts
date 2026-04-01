export const AHRM_TOKEN_KEY = "token";

export function getAhrmToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(AHRM_TOKEN_KEY);
}

export function setAhrmToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AHRM_TOKEN_KEY, token);
}

export function clearAhrmToken() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AHRM_TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAhrmToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
