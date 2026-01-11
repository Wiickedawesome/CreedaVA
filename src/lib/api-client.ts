import { acquireIdToken } from '@/lib/auth'

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export async function authorizedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'
  const enableGoogleLogin = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === 'true'
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const googleToken = typeof window !== 'undefined' ? localStorage.getItem('google_id_token') : null

  // Prefer MSAL (Entra) for admin. Only use Google when explicitly enabled/configured.
  async function getToken() {
    if (isDevMode) return 'dev-token'
    const msalToken = await acquireIdToken()
    if (msalToken) return msalToken
    if (enableGoogleLogin && googleClientId && googleToken) return googleToken
    return null
  }

  let token = await getToken()
  const headersBase = {
    ...(init?.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  // Make request and handle common auth/error scenarios
  async function doFetch(withHeaders: Record<string, string>) {
    const resp = await fetch(input, { ...init, headers: withHeaders })
    if (resp.status === 401) {
      // Try token refresh once (silent MSAL) unless dev-mode
      if (!isDevMode) {
        const refreshed = await acquireIdToken().catch(() => null)
        if (refreshed && refreshed !== token) {
          token = refreshed
          const retryHeaders = { ...(init?.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` }
          return fetch(input, { ...init, headers: retryHeaders })
        }
      }
      // No refresh possible or still 401: surface an auth error
      const errBody = await safeParseJSON(resp)
      const message = errBody?.error || errBody?.message || 'Unauthorized'
      const error = new Error(message)
      ;(error as any).status = 401
      throw error
    }

    if (!resp.ok) {
      // Handle 429 with a clear message
      if (resp.status === 429) {
        const errBody = await safeParseJSON(resp)
        const retryAfter = resp.headers.get('Retry-After') || 'a short while'
        const message = errBody?.error || `Rate limited - try again in ${retryAfter} seconds`
        const error = new Error(message)
        ;(error as any).status = 429
        throw error
      }

      const errBody = await safeParseJSON(resp)
      const message = errBody?.error || errBody?.message || `Request failed with status ${resp.status}`
      const error = new Error(message)
      ;(error as any).status = resp.status
      throw error
    }

    return resp
  }

  function safeParseJSON(resp: Response) {
    return resp
      .text()
      .then(text => {
        try {
          return text ? JSON.parse(text) : null
        } catch (e) {
          return { message: text }
        }
      })
      .catch(() => null)
  }

  const resp = await doFetch(headersBase)
  return resp
}
