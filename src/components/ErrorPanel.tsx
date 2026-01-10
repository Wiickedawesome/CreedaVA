import React from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ErrorPanel({ message, onRetry, onSignIn }: { message: string, onRetry?: () => void, onSignIn?: () => void }) {
  return (
    <div className="text-center py-8">
      <Alert variant="destructive">
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <div className="mt-4 flex items-center justify-center gap-3">
        {onRetry && <Button variant="outline" onClick={onRetry}>Retry</Button>}
        {onSignIn && <Button onClick={onSignIn}>Sign in</Button>}
      </div>
    </div>
  )
}
