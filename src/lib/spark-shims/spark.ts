// Fallback implementation of Spark API when Spark is not available

// Mock spark object for when Spark runtime is not available
export const spark = {
  user: async () => {
    // Return null when no Spark runtime is available
    // This will cause the Admin page to show the login prompt
    return null
  }
}

// Add spark to window object
if (typeof window !== 'undefined') {
  (window as any).spark = spark
}
