import { acquireIdToken } from '@/lib/auth'

export async function authorizedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const token = await acquireIdToken()
  console.log('[authorizedFetch] Token acquired:', token ? `${token.substring(0, 20)}...` : 'null')
  const headers = {
    ...(init?.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  console.log('[authorizedFetch] Headers:', { ...headers, Authorization: headers.Authorization ? '***' : undefined })
  return fetch(input, { ...init, headers })
}
