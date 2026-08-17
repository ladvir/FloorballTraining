// Access token lives in memory only (Variant B). It is short-lived (~15 min) and is
// re-obtained via POST /auth/refresh (httpOnly refresh cookie) on 401 or on app load.
// Never stored in localStorage, so it is not reachable by XSS.
let accessToken: string | null = null

export const getAccessToken = () => accessToken
export const setAccessToken = (token: string | null) => {
  accessToken = token
}

/**
 * Whether a JWT's `exp` claim is still in the future (with a small buffer for clock skew
 * and request latency). Used to tell a genuinely fresh token (e.g. just set by login) apart
 * from one merely *present* but expired (e.g. restored from localStorage on a cold reload)
 * — trusting presence alone let stale tokens through and fired doomed first requests.
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    const expiresAtMs = payload.exp * 1000
    return expiresAtMs - Date.now() > 5_000
  } catch {
    return false
  }
}
