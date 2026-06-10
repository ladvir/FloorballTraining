// Access token lives in memory only (Variant B). It is short-lived (~15 min) and is
// re-obtained via POST /auth/refresh (httpOnly refresh cookie) on 401 or on app load.
// Never stored in localStorage, so it is not reachable by XSS.
let accessToken: string | null = null

export const getAccessToken = () => accessToken
export const setAccessToken = (token: string | null) => {
  accessToken = token
}
