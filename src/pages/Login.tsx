import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreedaLogo } from '@/components/CreedaLogo'

const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'

export function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    setLoading(true)

    if (isDevMode) {
      // Dev mode: simple email/password
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email')
        setLoading(false)
        return
      }
      // Store mock user in localStorage
      localStorage.setItem('dev_user', JSON.stringify({ 
        email, 
        name: email.split('@')[0],
        id: 'dev-' + Date.now()
      }))
      navigate('/admin')
    } else {
      // Production: use Entra ID
      const { error } = await signIn()
      if (error) {
        setError(error.message || 'Sign-in failed')
        setLoading(false)
      } else {
        navigate('/admin')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <CreedaLogo size={80} animate={false} />
          </div>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            {isDevMode ? 'Sign in to access your CRM dashboard' : (
              <>
                Sign in to access your CRM dashboard
                <br />
                <span className="text-xs text-muted-foreground mt-1">@creedava.com emails only</span>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isDevMode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@creedava.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Any password (dev mode)"
                  disabled={loading}
                />
              </div>
              <Alert>
                <AlertDescription className="text-xs">
                  🔧 <strong>Dev Mode:</strong> Any email works. Password is ignored.
                </AlertDescription>
              </Alert>
            </form>
          ) : (
            <div className="text-sm text-muted-foreground text-center">
              Use your Entra ID (Microsoft) account to access the admin dashboard.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            onClick={isDevMode ? () => handleSubmit() : handleSubmit} 
            className="w-full" 
            disabled={loading}
            type={isDevMode ? 'submit' : 'button'}
          >
            {loading ? 'Signing in...' : (isDevMode ? 'Sign In' : 'Sign in with Microsoft')}
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
