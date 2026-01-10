import { PublicClientApplication, AccountInfo, AuthenticationResult, SilentRequest } from '@azure/msal-browser'

const clientId = import.meta.env.VITE_AAD_CLIENT_ID
const tenantId = import.meta.env.VITE_AAD_TENANT_ID
const authority = import.meta.env.VITE_AAD_AUTHORITY || (tenantId ? `https://login.microsoftonline.com/${tenantId}/v2.0` : undefined)

if (!clientId) {
  // eslint-disable-next-line no-console
  console.warn('VITE_AAD_CLIENT_ID is not set. Admin authentication will fail until configured.')
}

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: clientId || '00000000-0000-0000-0000-000000000000',
    authority,
    redirectUri: import.meta.env.VITE_APP_URL || window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
})

export function getActiveAccount(): AccountInfo | null {
  const current = msalInstance.getActiveAccount()
  if (current) return current
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length === 0) return null
  msalInstance.setActiveAccount(accounts[0])
  return accounts[0]
}

export async function signInWithPopup(): Promise<AuthenticationResult> {
  const result = await msalInstance.loginPopup({
    scopes: ['openid', 'profile', 'email'],
  })
  msalInstance.setActiveAccount(result.account)
  return result
}

export async function acquireIdToken(): Promise<string | null> {
  const account = getActiveAccount()
  if (!account) return null
  const request: SilentRequest = {
    account,
    scopes: ['openid', 'profile', 'email'],
  }
  try {
    const result = await msalInstance.acquireTokenSilent(request)
    return result.idToken
  } catch (silentError) {
    // Fallback to popup if silent fails (e.g., expired refresh token)
    try {
      const popupResult = await msalInstance.acquireTokenPopup(request)
      return popupResult.idToken
    } catch (popupError) {
      console.error('Failed to acquire token', popupError)
      return null
    }
  }
}

export async function signOutInteractive() {
  const account = getActiveAccount()
  await msalInstance.logoutPopup({ account })
}
