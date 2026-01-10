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
    if (isDevMode) {
      // Dev mode: check localStorage
      const devUser = localStorage.getItem('dev_user')
      if (devUser) {
        setUser(JSON.parse(devUser))
      }
      setLoading(false)
    } else {
      // Production: use MSAL
      msalInstance.initialize().then(() => {
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
      setUser(null)
    } else {
      await signOutInteractive()
      setUser(null)
    }
  }

  const getToken = async () => {
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
