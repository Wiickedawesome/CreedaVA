// Fallback implementation of Spark hooks when Spark is not available
import { useState, useEffect } from 'react'

/**
 * useKV fallback - uses localStorage for persistence
 * This is used when Spark runtime is not available
 */
export function useKV<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(`kv:${key}`)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Failed to load from localStorage for key ${key}:`, error)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(`kv:${key}`, JSON.stringify(value))
    } catch (error) {
      console.warn(`Failed to save to localStorage for key ${key}:`, error)
    }
  }, [key, value])

  return [value, setValue]
}
