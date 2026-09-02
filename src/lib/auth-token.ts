// Plain (non-React) module for persisting the JWT access/refresh token pair.
// Stored in localStorage when "remember me" is checked at login, otherwise
// sessionStorage (cleared when the browser tab closes).

const ACCESS_KEY = "atz-access-token";
const REFRESH_KEY = "atz-refresh-token";
const PERSIST_KEY = "atz-token-persist";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function activeStorage(): Storage {
  if (!isBrowser()) throw new Error("auth-token accessed outside the browser");
  const persist = window.localStorage.getItem(PERSIST_KEY) === "1";
  return persist ? window.localStorage : window.sessionStorage;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function setTokens(tokens: TokenPair, persist: boolean): void {
  if (!isBrowser()) return;
  // Always clear both stores first so switching persistence mode doesn't
  // leave a stale copy of the tokens behind in the other one.
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.sessionStorage.removeItem(ACCESS_KEY);
  window.sessionStorage.removeItem(REFRESH_KEY);

  window.localStorage.setItem(PERSIST_KEY, persist ? "1" : "0");
  const storage = persist ? window.localStorage : window.sessionStorage;
  storage.setItem(ACCESS_KEY, tokens.accessToken);
  storage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return activeStorage().getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return activeStorage().getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(PERSIST_KEY);
  window.sessionStorage.removeItem(ACCESS_KEY);
  window.sessionStorage.removeItem(REFRESH_KEY);
}
