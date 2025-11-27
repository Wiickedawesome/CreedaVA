import { useState, useEffect, memo, useCallback, useMemo } from 'react'
import { ExternalLink, Heart, MessageCircle, Repeat2, Calendar, Linkedin } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreedaLogo } from '@/components/CreedaLogo'

interface LinkedInPost {
  id: string
  text: string
  publishedAt: string
  authorName: string
  authorTitle?: string
  authorImageUrl?: string
  engagement: {
    likes: number
    comments: number
    shares: number
  }
  postUrl: string
  mediaUrls?: string[]
}

interface LinkedInFeedProps {
  className?: string
  maxPosts?: number
}

export const LinkedInFeed = memo(({ className = '', maxPosts = 5 }: LinkedInFeedProps) => {
  const [posts, setPosts] = useState<LinkedInPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const fetchLinkedInPosts = async () => {
      setLoading(true)
      try {
        // Check if LinkedIn is connected
        const storedConfig = localStorage.getItem('linkedin-config')
        const connected = storedConfig && JSON.parse(storedConfig).accessToken
        setIsConnected(!!connected)
        
        if (connected) {
          // TODO: Replace with actual LinkedIn API call when connected
          // const response = await fetch('/api/linkedin/posts', {
          //   headers: { Authorization: `Bearer ${JSON.parse(storedConfig).accessToken}` }
          // })
          // const data = await response.json()
          
          // Show full mock data when connected
          await new Promise(resolve => setTimeout(resolve, 300))
          setPosts(mockPosts.slice(0, maxPosts))
        } else {
          // Show limited mock data when not connected
          setPosts(mockPosts.slice(0, Math.min(2, maxPosts)))
        }
        setError(null)
      } catch (err) {
        setError('Failed to load LinkedIn posts')
        // Remove console.error in production builds
        if (import.meta.env.DEV) {
          console.error('LinkedIn API Error:', err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchLinkedInPosts()
  }, [maxPosts, mockPosts])

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }, [])

  const formatEngagement = useCallback((num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }, [])

  // Memoize mock posts to prevent unnecessary re-renders
  const mockPosts = useMemo(() => [
    {
      id: '1',
      text: 'Excited to announce CreedaVA\'s new bilingual virtual assistant services! 🚀 Our team of professional VAs from Belize brings both English and Spanish expertise to help businesses scale globally. #VirtualAssistant #BilingualSupport #BusinessGrowth',
      publishedAt: '2024-11-25T10:30:00Z',
      authorName: 'CreedaVA',
      authorTitle: 'Bilingual Virtual Assistant Services',
      engagement: {
        likes: 24,
        comments: 5,
        shares: 8
      },
      postUrl: 'https://www.linkedin.com/posts/creedava-activity-1234567890'
    },
    {
      id: '2', 
      text: 'Did you know? Businesses that use bilingual support see 40% better customer satisfaction rates. Our Spanish-speaking VAs help you connect with Latin American markets effectively. 📈 #CustomerService #LatinAmerica #BusinessTips',
      publishedAt: '2024-11-22T14:15:00Z',
      authorName: 'CreedaVA',
      authorTitle: 'Bilingual Virtual Assistant Services',
      engagement: {
        likes: 18,
        comments: 3,
        shares: 12
      },
      postUrl: 'https://www.linkedin.com/posts/creedava-activity-1234567891'
    },
    {
      id: '3',
      text: 'Remote work is here to stay! 💻 Our virtual assistants help businesses maintain productivity while reducing overhead costs. From administrative tasks to customer support - we\'ve got you covered. #RemoteWork #Productivity #VirtualTeam',
      publishedAt: '2024-11-20T09:00:00Z',
      authorName: 'CreedaVA',
      authorTitle: 'Bilingual Virtual Assistant Services',
      engagement: {
        likes: 31,
        comments: 7,
        shares: 15
      },
      postUrl: 'https://www.linkedin.com/posts/creedava-activity-1234567892'
    }
  ], [])

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }, [])

  const formatEngagement = useCallback((num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }, [])

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-blue-600 rounded"></div>
          <h3 className="text-xl font-semibold text-gray-900">Latest LinkedIn Updates</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-1">
                  <div className="w-32 h-4 bg-gray-200 rounded"></div>
                  <div className="w-24 h-3 bg-gray-100 rounded"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="w-full h-4 bg-gray-200 rounded"></div>
                <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-2">⚠️ {error}</div>
          <p className="text-sm text-gray-600">Please check your LinkedIn API connection</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Linkedin className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Latest LinkedIn Updates</h3>
        </div>
        <Badge variant="outline" className={`text-xs ${
          isConnected 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {isConnected ? 'Connected to LinkedIn' : 'Demo Posts'}
        </Badge>
      </div>
      
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden">
                    <CreedaLogo className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{post.authorName}</h4>
                    {post.authorTitle && (
                      <p className="text-sm text-gray-600">{post.authorTitle}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.publishedAt)}
                    </div>
                  </div>
                </div>
                <a 
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                  title="View on LinkedIn"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-gray-800 leading-relaxed mb-4 whitespace-pre-line">
                {post.text}
              </p>
              
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="mb-4">
                  <img 
                    src={post.mediaUrls[0]} 
                    alt="Post image"
                    className="rounded-lg max-w-full h-auto"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-gray-600">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">{formatEngagement(post.engagement.likes)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{formatEngagement(post.engagement.comments)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Repeat2 className="w-4 h-4" />
                  <span className="text-sm">{formatEngagement(post.engagement.shares)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center pt-4 border-t border-gray-100">
        <a 
          href="https://www.linkedin.com/company/creedava"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <Linkedin className="w-4 h-4" />
          Follow us on LinkedIn
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
})

LinkedInFeed.displayName = 'LinkedInFeed'