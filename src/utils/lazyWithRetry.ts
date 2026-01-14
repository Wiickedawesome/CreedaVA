import { ComponentType, lazy } from 'react'

/**
 * Lazy load a component with automatic retry on failure
 * This fixes the "Failed to fetch dynamically imported module" error
 * that happens when:
 * - Network is temporarily down
 * - Chunk files are missing/moved
 * - Browser cache is stale after deployment
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptLoad = (attemptsLeft: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (attemptsLeft === 1) {
              // Last attempt failed - check if it's a chunk loading error
              const isChunkError = error?.message?.includes('Failed to fetch') ||
                                  error?.message?.includes('dynamically imported module') ||
                                  error?.message?.includes('Importing a module script failed')
              
              if (isChunkError) {
                console.warn('Chunk loading failed after retries, clearing cache and reloading...')
                // Clear any service worker cache and reload
                if ('caches' in window) {
                  caches.keys().then(keys => {
                    keys.forEach(key => caches.delete(key))
                  })
                }
                // Force full page reload to get fresh chunks
                window.location.reload()
                return
              }
              
              reject(error)
              return
            }

            // Retry with exponential backoff
            const waitTime = interval * (retries - attemptsLeft + 1)
            console.warn(
              `Chunk loading failed, retrying in ${waitTime}ms... (${retries - attemptsLeft + 1}/${retries})`,
              error
            )
            
            setTimeout(() => {
              attemptLoad(attemptsLeft - 1)
            }, waitTime)
          })
      }

      attemptLoad(retries)
    })
  })
}

/**
 * Alternative: lazy load with component-specific retry
 * Use this for critical components that should retry more aggressively
 */
export function lazyWithRetryAndTransform<T extends ComponentType<any>>(
  componentImport: () => Promise<any>,
  selector: (module: any) => T,
  retries = 3,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptLoad = (attemptsLeft: number) => {
        componentImport()
          .then(module => resolve({ default: selector(module) }))
          .catch((error) => {
            if (attemptsLeft === 1) {
              const isChunkError = error?.message?.includes('Failed to fetch') ||
                                  error?.message?.includes('dynamically imported module')
              
              if (isChunkError) {
                console.warn('Chunk loading failed, forcing reload...')
                window.location.reload()
                return
              }
              
              reject(error)
              return
            }

            const waitTime = interval * (retries - attemptsLeft + 1)
            setTimeout(() => attemptLoad(attemptsLeft - 1), waitTime)
          })
      }

      attemptLoad(retries)
    })
  })
}
