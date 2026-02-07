import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  // When encountering an error in the development mode, rethrow it and don't display the boundary.
  // The parent UI will take care of showing a more helpful dialog.
  if (import.meta.env.DEV) throw error;

  const isChunkLoadError = error?.message?.includes('Failed to fetch') ||
                          error?.message?.includes('dynamically imported module') ||
                          error?.message?.includes('Importing a module script failed');

  const handleReload = () => {
    // Clear all caches and reload
    if ('caches' in window) {
      caches.keys().then(keys => {
        Promise.all(keys.map(key => caches.delete(key)))
          .then(() => {
            window.location.href = window.location.origin + window.location.pathname + '?_reload=' + Date.now();
          });
      });
    } else {
      window.location.href = window.location.origin + window.location.pathname + '?_reload=' + Date.now();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {isChunkLoadError ? 'Failed to Load Page Component' : 'The app encountered a runtime error'}
          </AlertTitle>
          <AlertDescription>
            {isChunkLoadError 
              ? 'The page failed to load. This usually happens after a site update. Click the button below to reload with fresh files.'
              : 'Something unexpected happened while running the application. The error details are shown below so you can share them with the team.'}
          </AlertDescription>
        </Alert>
        
        <div className="bg-card border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Error Details:</h3>
          <pre className="text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto max-h-32">
            {error.message}
          </pre>
          {error.stack && (
            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">View Stack Trace</summary>
              <pre className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border overflow-auto max-h-48 mt-2">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        
        <div className="space-y-2">
          {isChunkLoadError ? (
            <Button 
              onClick={handleReload} 
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page with Fresh Files
            </Button>
          ) : (
            <>
              <Button 
                onClick={resetErrorBoundary} 
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button 
                onClick={handleReload} 
                className="w-full"
                variant="secondary"
              >
                Reload Page
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
