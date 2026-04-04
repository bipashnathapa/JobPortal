/** Central API fetch: Bearer access token + httpOnly refresh cookie + 401 refresh retry. */
export const API_BASE = "http://127.0.0.1:8000/api";

let refreshInFlight = null;

export async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/token/refresh/`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.access) {
        localStorage.setItem("access", data.access);
        return data.access;
      }
      localStorage.removeItem("access");
      localStorage.removeItem("username");
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/**
 * @param {string} url - Full URL or path under API_BASE (e.g. "/student-profile/" or full http...)
 * @param {RequestInit} [options]
 */
export async function fetchWithAuth(url, options = {}) {
  const fullUrl =
    url.startsWith("http") || url.startsWith("//")
      ? url
      : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;

  const token = localStorage.getItem("access");
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const run = () =>
    fetch(fullUrl, {
      ...options,
      headers,
      credentials: "include",
    });

  let res = await run();
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(fullUrl, {
        ...options,
        headers,
        credentials: "include",
      });
    }
  }
  return res;
}
