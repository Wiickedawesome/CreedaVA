import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from 'sonner'
import { ThemeProvider } from 'next-themes'
import './sw-register'

// Use fallback shim since Spark runtime may not be available


import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <App />
      <Toaster position="top-center" />
    </ThemeProvider>
   </ErrorBoundary>
)
