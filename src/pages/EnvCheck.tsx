// Temporary diagnostic page to check environment variables
export function EnvCheck() {
  const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL
  const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY
  const hasGoogleClient = !!import.meta.env.VITE_GOOGLE_SEARCH_CONSOLE_CLIENT_ID
  const baseUrl = import.meta.env.BASE_URL
  const mode = import.meta.env.MODE

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Environment Configuration Check</h1>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${hasSupabaseUrl ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-medium">VITE_SUPABASE_URL:</span>
            <span className="text-slate-600 dark:text-slate-400">
              {hasSupabaseUrl ? '✓ Configured' : '✗ Missing'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${hasSupabaseKey ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-medium">VITE_SUPABASE_ANON_KEY:</span>
            <span className="text-slate-600 dark:text-slate-400">
              {hasSupabaseKey ? '✓ Configured' : '✗ Missing'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${hasGoogleClient ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-medium">VITE_GOOGLE_SEARCH_CONSOLE_CLIENT_ID:</span>
            <span className="text-slate-600 dark:text-slate-400">
              {hasGoogleClient ? '✓ Configured' : '✗ Missing'}
            </span>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Mode:</span> {mode}</p>
              <p><span className="font-medium">Base URL:</span> {baseUrl}</p>
            </div>
          </div>

          {hasSupabaseUrl && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-200 font-medium">
                ✓ Configuration looks good! You can proceed to login.
              </p>
            </div>
          )}

          {!hasSupabaseUrl && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-200 font-medium mb-2">
                ✗ Missing environment variables
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm">
                Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file for local development,
                or as GitHub Secrets for production deployment.
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <a
              href="/login"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Go to Login →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
