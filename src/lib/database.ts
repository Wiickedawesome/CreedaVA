// Azure Cosmos DB API Client
// Uses Azure Functions as backend API secured with Entra ID

import { acquireIdToken } from '@/lib/auth'

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

// Entra ID auth bridge
class AuthClient {
  private listeners: ((session: AuthSession | null) => void)[] = []
  private session: AuthSession | null = null

  async signInWithPassword() {
    // Not used with Entra; keep signature for compatibility
    return { data: { user: null, session: null }, error: { message: 'Password auth disabled; use Entra ID', name: 'AuthError' } as AuthError }
  }

  async signUp() {
    return this.signInWithPassword()
  }

  async signOut() {
    this.session = null
    this.notifyListeners()
    return { error: null }
  }

  async getSession() {
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
      const token = await acquireIdToken()
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
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

      const response = await fetch(`${API_BASE}/getAnalytics?${params}`, { headers })
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

  // Update method for chaining
  update(data: any) {
    return {
      eq: async (column: string, value: any) => {
        try {
          const token = await acquireIdToken()
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          }
          const response = await fetch(`${API_BASE}/submitContact`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ 
              table: this.table, 
              data, 
              filter: { column, value } 
            })
          })
          if (!response.ok) throw new Error('Failed to update data')
          const result = await response.json()
          return { data: result, error: null }
        } catch (error: any) {
          return { data: null, error: { message: error.message } }
        }
      }
    }
  }

  // Insert method
  async insert(data: any[]) {
    try {
      const token = await acquireIdToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
      const response = await fetch(`${API_BASE}/submitContact`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ table: this.table, data: data[0] })
      })
      if (!response.ok) throw new Error('Failed to insert data')
      const result = await response.json()
      return { data: result, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  }

  // Delete method
  delete() {
    return {
      eq: async (column: string, value: any) => {
        try {
          const token = await acquireIdToken()
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          }
          const response = await fetch(`${API_BASE}/submitContact`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ 
              table: this.table, 
              filter: { column, value } 
            })
          })
          if (!response.ok) throw new Error('Failed to delete data')
          return { error: null }
        } catch (error: any) {
          return { error: { message: error.message } }
        }
      }
    }
  }
}

// Azure Cosmos DB API Client via Azure Functions
class DatabaseClient {
  auth = new AuthClient()

  from(table: string) {
    return new QueryBuilder(table)
  }
}

export const db = new DatabaseClient()
export type { AuthUser as User, AuthSession as Session, AuthError }
