// Azure Cosmos DB API Client
// Uses Azure Functions as backend API

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface AuthUser {
  id: string
  email: string
  user_metadata?: { full_name?: string }
}

interface AuthSession {
  user: AuthUser
  access_token: string
}

interface AuthError {
  message: string
  name: string
}

// Simple in-memory auth store (replace with proper JWT implementation)
class AuthClient {
  private session: AuthSession | null = null
  private listeners: ((session: AuthSession | null) => void)[] = []

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      // Mock authentication - in production, call Azure Function for auth
      // For now, accept @creedava.com emails
      if (!email.endsWith('@creedava.com')) {
        return {
          data: { user: null, session: null },
          error: { message: 'Access restricted to @creedava.com email addresses only', name: 'EmailDomainError' } as AuthError
        }
      }

      // Create mock session
      const user: AuthUser = {
        id: btoa(email),
        email,
        user_metadata: { full_name: email.split('@')[0] }
      }
      
      const session: AuthSession = {
        user,
        access_token: btoa(JSON.stringify({ email, timestamp: Date.now() }))
      }

      this.session = session
      localStorage.setItem('auth_session', JSON.stringify(session))
      this.notifyListeners()

      return { data: { user, session }, error: null }
    } catch (error: any) {
      return {
        data: { user: null, session: null },
        error: { message: error.message, name: 'AuthError' } as AuthError
      }
    }
  }

  async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
    try {
      if (!email.endsWith('@creedava.com')) {
        return {
          data: { user: null, session: null },
          error: { message: 'Access restricted to @creedava.com email addresses only', name: 'EmailDomainError' } as AuthError
        }
      }

      const user: AuthUser = {
        id: btoa(email),
        email,
        user_metadata: options?.data
      }
      
      const session: AuthSession = {
        user,
        access_token: btoa(JSON.stringify({ email, timestamp: Date.now() }))
      }

      this.session = session
      localStorage.setItem('auth_session', JSON.stringify(session))
      this.notifyListeners()

      return { data: { user, session }, error: null }
    } catch (error: any) {
      return {
        data: { user: null, session: null },
        error: { message: error.message, name: 'AuthError' } as AuthError
      }
    }
  }

  async signOut() {
    this.session = null
    localStorage.removeItem('auth_session')
    this.notifyListeners()
    return { error: null }
  }

  async getSession() {
    if (!this.session) {
      const stored = localStorage.getItem('auth_session')
      if (stored) {
        try {
          this.session = JSON.parse(stored)
        } catch {
          localStorage.removeItem('auth_session')
        }
      }
    }
    return { data: { session: this.session }, error: null }
  }

  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
    const listener = (session: AuthSession | null) => callback('SIGNED_IN', session)
    this.listeners.push(listener)
    
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(l => l !== listener)
          }
        }
      }
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.session))
  }
}

// Query builder for chaining operations
class QueryBuilder {
  private table: string
  private columns: string = '*'
  private orderColumn?: string
  private orderAscending: boolean = true
  private limitCount?: number
  private filters: Array<{ column: string; value: any }> = []

  constructor(table: string) {
    this.table = table
  }

  select(columns: string = '*') {
    this.columns = columns
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderColumn = column
    this.orderAscending = options?.ascending !== false
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  eq(column: string, value: any) {
    this.filters.push({ column, value })
    return this
  }

  async execute() {
    try {
      const params = new URLSearchParams({
        table: this.table,
        columns: this.columns,
        ...(this.orderColumn && { orderBy: this.orderColumn }),
        ...(this.orderColumn && { orderDirection: this.orderAscending ? 'asc' : 'desc' }),
        ...(this.limitCount && { limit: this.limitCount.toString() }),
      })

      this.filters.forEach((filter, index) => {
        params.append(`filter${index}`, JSON.stringify(filter))
      })

      const response = await fetch(`${API_BASE}/getAnalytics?${params}`)
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      return { data, error: null }
    } catch (error: any) {
      console.error('Database query error:', error)
      return { data: null, error: { message: error.message } }
    }
  }

  // Make it thenable for backwards compatibility with await
  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject)
  }
}

// Azure Cosmos DB API Client via Azure Functions
class DatabaseClient {
  auth = new AuthClient()

  from(table: string) {
    return new QueryBuilder(table)
  }

  async insert(table: string, data: any) {
    try {
      const response = await fetch(`${API_BASE}/submitContact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, data })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      return { data: result, error: null }
    } catch (error: any) {
      console.error('Database insert error:', error)
      return { data: null, error: { message: error.message } }
    }
  }
}

export const db = new DatabaseClient()
export type { AuthUser as User, AuthSession as Session, AuthError }
