import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from 'sonner'
import { ThemeProvider } from 'next-themes'
import './sw-register'
import './i18n/config' // Initialize i18n

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { initializeGA } from './lib/analytics'

import "./main.css"
import "./styles/theme.css"
import "./styles/mobile-performance.css"
import "./index.css"

// Initialize Google Analytics if configured
initializeGA()

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <App />
      <Toaster position="top-center" />
    </ThemeProvider>
   </ErrorBoundary>
)
