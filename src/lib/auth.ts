/**
 * Google OAuth Authentication
 * Simplified auth module - Entra ID/MSAL removed
 */

/**
 * Get the Google ID token from localStorage
 * This token is set after successful Google OAuth login
 */
export async function acquireIdToken(): Promise<string | null> {
  // Check for Google ID token
  const googleToken = localStorage.getItem('google_id_token')
  if (googleToken) {
    return googleToken
  }

  // Check for dev mode token
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'
  if (isDevMode) {
    const devUser = localStorage.getItem('dev_user')
    if (devUser) {
      return 'dev-token'
    }
  }

  return null
}

/**
 * Get active user account from localStorage
 */
export function getActiveAccount(): { email: string; name: string; id: string } | null {
  const devUser = localStorage.getItem('dev_user')
  if (devUser) {
    try {
      return JSON.parse(devUser)
    } catch {
      return null
    }
  }
  return null
}

/**
 * Sign out - clear tokens and user data
 */
export async function signOutInteractive(): Promise<void> {
  localStorage.removeItem('google_id_token')
  localStorage.removeItem('dev_user')
  window.location.href = '/login'
}

// Legacy exports for backwards compatibility (no-ops)
export const msalInstance = null
export async function signInWithPopup(): Promise<any> {
  throw new Error('MSAL login removed. Use Google OAuth via Login page.')
}
