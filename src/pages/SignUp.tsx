import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreedaLogo } from '@/components/CreedaLogo'

export function SignUp() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    const { error } = await signUp()
    if (error) {
      setError(error.message || 'Sign-up failed')
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <CreedaLogo size={80} animate={false} />
          </div>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Sign up to access CreedaVA CRM
            <br />
            <span className="text-xs text-muted-foreground mt-1">Only @creedava.com emails allowed</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="text-sm text-muted-foreground text-center">
            Use your Entra ID (Microsoft) account to request access. If you do not have access, contact an admin to be invited.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button onClick={handleSubmit} className="w-full" disabled={loading}>
            {loading ? 'Checking access...' : 'Continue with Microsoft'}
          </Button>
          <div className="text-sm text-center">
            <Link to="/" className="text-muted-foreground hover:text-primary">
              ← Back to website
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
