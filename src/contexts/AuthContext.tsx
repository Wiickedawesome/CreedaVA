import { createContext, useContext, useEffect, useState } from 'react'
import { msalInstance, signInWithPopup, signOutInteractive, getActiveAccount, acquireIdToken } from '@/lib/auth'

const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'

interface AuthUser {
  id: string
  email?: string
  name?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: () => Promise<{ error: Error | null }>
  signUp: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Handle local Google ID token stored by Login popup
    const googleToken = localStorage.getItem('google_id_token')
    if (googleToken) {
      try {
        const parts = googleToken.split('.')
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
        setUser({ id: payload.sub || 'google-' + Date.now(), email: payload.email, name: payload.name || payload.email?.split('@')[0] })
        setLoading(false)
        return
      } catch (err) {
        console.error('Failed to parse stored Google ID token', err)
      }
    }

    if (isDevMode) {
      // Dev mode: check localStorage
      const devUser = localStorage.getItem('dev_user')
      console.log('AuthContext: Dev mode - checking localStorage for dev_user:', devUser)
      if (devUser) {
        try {
          const user = JSON.parse(devUser)
          console.log('AuthContext: Found dev user:', user)
          setUser(user)
        } catch (err) {
          console.error('AuthContext: Failed to parse dev_user from localStorage:', err)
        }
      }
      setLoading(false)
    } else {
      // Production: use MSAL
      try {
        // Some MSAL versions may not expose initialize(); guard it
        const init = (msalInstance as any).initialize
        if (typeof init === 'function') {
          init.call(msalInstance).then(() => {
            const account = getActiveAccount()
            if (account) {
              setUser({
                id: account.homeAccountId,
                email: account.username,
                name: account.name,
              })
            }
            setLoading(false)
          }).catch(err => {
            console.warn('MSAL initialize failed, continuing without active account', err)
            const account = getActiveAccount()
            if (account) {
              setUser({
                id: account.homeAccountId,
                email: account.username,
                name: account.name,
              })
            }
            setLoading(false)
          })
        } else {
          // If initialize isn't present, just proceed
          const account = getActiveAccount()
          if (account) {
            setUser({
              id: account.homeAccountId,
              email: account.username,
              name: account.name,
            })
          }
          setLoading(false)
        }
      } catch (err) {
        console.warn('MSAL initialization error, continuing without it', err)
        const account = getActiveAccount()
        if (account) {
          setUser({
            id: account.homeAccountId,
            email: account.username,
            name: account.name,
          })
        }
        setLoading(false)
      }
    }
  }, [])

  const signIn = async () => {
    if (isDevMode) {
      // Dev mode handled in Login component
      return { error: null }
    }
    
    try {
      const result = await signInWithPopup()
      setUser({
        id: result.account.homeAccountId,
        email: result.account.username,
        name: result.account.name,
      })
      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  const signUp = async () => {
    // For Entra ID, sign-up is the same interactive sign-in
    return signIn()
  }

  const signOut = async () => {
    if (isDevMode) {
      localStorage.removeItem('dev_user')
      localStorage.removeItem('google_id_token')
      setUser(null)
    } else {
      localStorage.removeItem('google_id_token')
      await signOutInteractive()
      setUser(null)
    }
  }

  const getToken = async () => {
    const googleToken = localStorage.getItem('google_id_token')
    if (googleToken) return googleToken
    if (isDevMode) {
      return 'dev-token'
    }
    return acquireIdToken()
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    getToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
