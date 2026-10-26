/** JSON client for the backend API: sends the CSRF token and sends signed-out users back to sign in. */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    path: string,
  ) {
    super(`${path} failed with status ${status}`);
  }
}

/** The token Spring Security stores in the XSRF-TOKEN cookie, echoed in a header on every request. */
function csrfToken(): string {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": csrfToken() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // The session is gone (e.g. the server restarted): a full page load back to sign in clears all state.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- no router outside components
  if (response.status === 401 && !path.startsWith("/api/auth/")) window.location.assign("/");
  if (!response.ok) throw new ApiError(response.status, path);
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
