import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: any
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Auto-reload for chunk loading errors
    const isChunkError = error?.message?.includes('Failed to fetch dynamically imported module') ||
                        error?.message?.includes('Importing a module script failed') ||
                        error?.message?.includes('Failed to fetch')
    
    if (isChunkError) {
      console.warn('Chunk loading error detected, reloading page...')
      // Small delay to show error briefly, then reload
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
    
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    // Force reload to clear any cached bad chunks
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
          <div className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              {this.state.error?.message?.includes('Failed to fetch') || 
               this.state.error?.message?.includes('dynamically imported') 
                ? 'Loading Page...' 
                : 'Something went wrong'}
            </h2>
            <p className="text-gray-400 mb-6">
              {this.state.error?.message?.includes('Failed to fetch') || 
               this.state.error?.message?.includes('dynamically imported')
                ? 'Refreshing the page to load latest updates...'
                : this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button 
              onClick={this.handleReset}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </Button>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
                  Error details (dev only)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40 bg-gray-900 p-2 rounded">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
