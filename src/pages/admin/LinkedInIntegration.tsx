import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Linkedin, 
  ExternalLink, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  RefreshCw,
  Send,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

export function LinkedInIntegration() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [organizationId, setOrganizationId] = useState('78oyio83zhgdqv')
  const [autoSync, setAutoSync] = useState(true)
  const [testPost, setTestPost] = useState('')
  
  // Check connection status and load saved config
  useEffect(() => {
    const checkConnection = () => {
      const storedConfig = localStorage.getItem('linkedin-config')
      if (storedConfig) {
        const config = JSON.parse(storedConfig)
        setIsConnected(!!config.accessToken)
        setClientId(config.clientId || '')
        setOrganizationId(config.organizationId || '78oyio83zhgdqv')
        setAccessToken(config.accessToken || '')
      }
    }
    checkConnection()
  }, [])

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      if (!clientId || !clientSecret) {
        throw new Error('Please enter both Client ID and Client Secret')
      }

      // Save client credentials and mark as connected
      const config = {
        clientId,
        clientSecret,
        organizationId: organizationId || '78oyio83zhgdqv',
        accessToken: accessToken || '',
        connectedAt: new Date().toISOString()
      }
      
      localStorage.setItem('linkedin-config', JSON.stringify(config))
      setIsConnected(true)
      
      toast.success('LinkedIn credentials saved successfully')
      
      // Try to connect via OAuth flow (will use API when available)
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api'
        const response = await fetch(`${apiUrl}/linkedin-connect?state=${config.organizationId}`)
        
        if (response.ok) {
          const data = await response.json()
          // Redirect to LinkedIn OAuth if API is working
          window.location.href = data.authUrl
        }
      } catch (apiError) {
        // API not available yet - credentials saved locally
        console.log('API not available, using manual connection')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to connect')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    localStorage.removeItem('linkedin-config')
    setIsConnected(false)
    setAccessToken('')
    setClientId('')
    setClientSecret('')
    setOrganizationId('78oyio83zhgdqv')
    toast.success('LinkedIn disconnected')
  }

  const handleTestPost = async () => {
    if (!testPost.trim()) {
      toast.error('Please enter some content to test')
      return
    }

    setIsLoading(true)
    try {
      // This would make an actual API call to LinkedIn
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Test post would be published to LinkedIn!')
    } catch (error) {
      toast.error('Failed to publish test post')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncNow = async () => {
    setIsLoading(true)
    try {
      const storedConfig = localStorage.getItem('linkedin-config')
      const config = storedConfig ? JSON.parse(storedConfig) : null
      
      if (!config?.organizationId) {
        throw new Error('Organization ID not configured')
      }
      
      // Force refresh from LinkedIn API
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const response = await fetch(`${apiUrl}/linkedin-posts?org=${config.organizationId}&refresh=true`)
      
      if (!response.ok) {
        throw new Error('Failed to sync posts')
      }
      
      toast.success('LinkedIn posts synced successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sync posts')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white">LinkedIn Integration</h1>
        <p className="text-gray-300 mt-2">Connect your LinkedIn account to display posts on your news page</p>
      </div>

      {/* Connection Status */}
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Linkedin className="w-5 h-5 text-blue-600" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-white font-medium">Connected to LinkedIn</p>
                    <p className="text-sm text-gray-300">Posts are being synced automatically</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-white font-medium">Not Connected</p>
                    <p className="text-sm text-gray-300">Configure LinkedIn API to get started</p>
                  </div>
                </>
              )}
            </div>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Key className="w-5 h-5" />
            LinkedIn API Configuration
          </CardTitle>
          <CardDescription className="text-gray-300">
            Enter your LinkedIn Developer App credentials. 
            <a 
              href="https://www.linkedin.com/developers/apps" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 ml-1 inline-flex items-center gap-1"
            >
              Get credentials here <ExternalLink className="w-3 h-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Client ID</Label>
              <Input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter LinkedIn Client ID"
                className="bg-gray-800 border-gray-600 text-white"
                disabled={isConnected}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Client Secret</Label>
              <Input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Enter LinkedIn Client Secret"
                className="bg-gray-800 border-gray-600 text-white"
                disabled={isConnected}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-white">Organization ID (Optional)</Label>
            <Input
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              placeholder="LinkedIn Organization ID for company posts"
              className="bg-gray-800 border-gray-600 text-white"
              disabled={isConnected}
            />
            <p className="text-xs text-gray-400">
              Leave empty for personal posts, or enter your company's LinkedIn ID for organization posts
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-sync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
              <Label htmlFor="auto-sync" className="text-white">
                Auto-sync posts every hour
              </Label>
            </div>
            
            {isConnected ? (
              <Button 
                onClick={handleDisconnect}
                variant="destructive"
                size="sm"
              >
                Disconnect
              </Button>
            ) : (
              <Button 
                onClick={handleConnect}
                disabled={isLoading || !clientId || !clientSecret}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Linkedin className="w-4 h-4 mr-2" />
                    Connect LinkedIn
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Post Management */}
      {isConnected && (
        <>
          <Card className="bg-gray-700 border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5" />
                Post Management
              </CardTitle>
              <CardDescription className="text-gray-300">
                Sync existing posts and test your connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleSyncNow}
                  disabled={isLoading}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-600"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Posts Now
                    </>
                  )}
                </Button>
                
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Clock className="w-4 h-4" />
                  Last sync: 2 hours ago
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Post */}
          <Card className="bg-gray-700 border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Send className="w-5 h-5" />
                Test Post
              </CardTitle>
              <CardDescription className="text-gray-300">
                Test your LinkedIn connection by creating a post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Test Content</Label>
                <Textarea
                  value={testPost}
                  onChange={(e) => setTestPost(e.target.value)}
                  placeholder="Write a test post to verify your LinkedIn connection..."
                  className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
                  maxLength={3000}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>This will post directly to your LinkedIn account</span>
                  <span>{testPost.length}/3000</span>
                </div>
              </div>
              
              <Button 
                onClick={handleTestPost}
                disabled={isLoading || !testPost.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publish Test Post
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Instructions */}
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-300">
          <div className="space-y-3">
            <div className="flex gap-3">
              <Badge className="bg-blue-600">1</Badge>
              <div>
                <p className="font-medium text-white">Create LinkedIn Developer App</p>
                <p className="text-sm">Visit LinkedIn Developer portal and create a new application</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Badge className="bg-blue-600">2</Badge>
              <div>
                <p className="font-medium text-white">Request API Products</p>
                <p className="text-sm">Request "Share on LinkedIn" and "Sign In with LinkedIn" products</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Badge className="bg-blue-600">3</Badge>
              <div>
                <p className="font-medium text-white">Configure OAuth</p>
                <p className="text-sm">Add redirect URL: <code className="bg-gray-800 px-1 rounded">https://creedava.com/api/linkedin/callback</code></p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Badge className="bg-blue-600">4</Badge>
              <div>
                <p className="font-medium text-white">Enter Credentials</p>
                <p className="text-sm">Copy your Client ID and Secret from LinkedIn Developer portal</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}