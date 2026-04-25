/**
 * Client-side auth helpers.
 * Strategy: store token in localStorage AND in a cookie.
 * Middleware checks the cookie for page-level auth.
 * API calls use the header for request-level auth.
 */

const TOKEN_KEY = "golite_token";
const USER_KEY = "golite_user";
const COOKIE_NAME = "golite_session";
const COOKIE_MAX_AGE = 72 * 60 * 60; // 3 days in seconds

/** Save auth state to localStorage AND cookie */
export function saveAuth(token: string, user: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    // Set a cookie so middleware can read it
    document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    // silent
  }
}

/** Clear auth state from localStorage AND cookie */
export function clearAuth() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  } catch {
    // silent
  }
}

/** Get stored user from localStorage (for instant UI) */
export function getStoredUser(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Get stored token from localStorage */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Fetch wrapper that sends the token via x-session-token header.
 * This ensures API auth works regardless of cookie handling.
 */
export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set("x-session-token", token);
  }
  return fetch(url, {
    ...options,
    headers,
  });
}
