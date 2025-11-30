import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const dbUrl = import.meta.env.VITE_SUPABASE_URL
const dbKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!dbUrl || !dbKey) {
  throw new Error('Missing database environment variables')
}

export const db = createClient<Database>(dbUrl, dbKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
