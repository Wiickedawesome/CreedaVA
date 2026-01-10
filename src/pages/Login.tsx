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
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  const signInWithGooglePopup = () => {
    if (!googleClientId) return
    const params = new URLSearchParams({
      client_id: googleClientId,
      response_type: 'id_token',
      scope: 'openid email profile',
      redirect_uri: `${window.location.origin}/google-callback.html`,
      nonce: String(Date.now()),
      prompt: 'select_account'
    })
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    const popup = window.open(url, 'googleSignIn', 'width=500,height=600')
    if (!popup) {
      setError('Unable to open popup. Please allow popups for this site.')
      return
    }
    function handler(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      const id_token = event.data?.id_token
      if (id_token) {
        try {
          // decode JWT to extract email/name quickly
          const parts = id_token.split('.')
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
          const email = payload.email || ''
          const name = payload.name || payload.email?.split('@')[0] || 'Google User'
          localStorage.setItem('google_id_token', id_token)
          // store a user object like dev mode so the app can use it
          localStorage.setItem('dev_user', JSON.stringify({ email, name, id: 'google-' + (payload.sub || Date.now()) }))
          window.removeEventListener('message', handler)
          if (popup && !popup.closed) popup.close()
          // navigate to admin
          window.location.href = '/admin'
        } catch (err) {
          console.error('Failed to parse Google token', err)
          setError('Invalid Google sign-in response')
        }
      }
    }
    window.addEventListener('message', handler)
  }

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
                {googleClientId && (
                  <div className="text-xs text-muted-foreground mt-1">Or sign in with Google if configured</div>
                )}
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
            onClick={handleSubmit} 
            className="w-full" 
            disabled={loading || (isDevMode && (!email || !email.includes('@')))}
            type="button"
          >
            {loading ? 'Signing in...' : (isDevMode ? 'Sign In' : 'Sign in with Microsoft')}
          </Button>

          {googleClientId && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signInWithGooglePopup()}
            >
              Sign in with Google
            </Button>
          )}

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
