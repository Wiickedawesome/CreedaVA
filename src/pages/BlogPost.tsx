import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, ArrowLeft, Eye, Linkedin, Share2 } from 'lucide-react'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface BlogPost {
  id: string
  title: string
  excerpt: string | null
  content: string
  slug: string
  category: string | null
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  is_published: boolean
  published_at: string | null
  created_at: string
  views: number | null
  created_by: string
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      fetchPost()
      // Increment view count
      incrementViews()
    }
  }, [slug])

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .eq('is_published', true)
        .single()

      if (error) throw error
      setPost(data)
    } catch (error) {
      console.error('Error fetching blog post:', error)
      setError('Blog post not found')
    } finally {
      setLoading(false)
    }
  }

  const incrementViews = async () => {
    try {
      // First get current view count
      const { data } = await supabase
        .from('blog_posts')
        .select('views')
        .eq('slug', slug)
        .single()

      if (data) {
        // Increment view count
        await supabase
          .from('blog_posts')
          .update({ views: (data.views || 0) + 1 })
          .eq('slug', slug)
      }
    } catch (error) {
      // Silently fail - view count is not critical
      console.warn('Failed to increment view count:', error)
    }
  }

  const getCategoryColor = (category: string | null) => {
    if (!category) return 'bg-muted text-muted-foreground'
    
    const lowerCategory = category.toLowerCase()
    if (lowerCategory.includes('announcement') || lowerCategory.includes('news')) {
      return 'bg-accent/10 text-accent border-accent/20'
    }
    if (lowerCategory.includes('update') || lowerCategory.includes('feature')) {
      return 'bg-primary/10 text-primary border-primary/20'
    }
    if (lowerCategory.includes('insight') || lowerCategory.includes('tip')) {
      return 'bg-secondary/10 text-secondary border-secondary/20'
    }
    if (lowerCategory.includes('success') || lowerCategory.includes('story')) {
      return 'bg-green-100 text-green-700 border-green-200'
    }
    return 'bg-muted text-muted-foreground'
  }

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(window.location.href)
    const title = encodeURIComponent(post?.title || '')
    const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    window.open(linkedInShareUrl, '_blank', 'width=600,height=400')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <section className="relative pt-32 pb-24 px-4 overflow-hidden">
          <AnimatedBackground />
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/news')}>
              <ArrowLeft size={16} className="mr-2" />
              Back to News
            </Button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="relative pt-32 pb-12 px-4 overflow-hidden">
        <AnimatedBackground />
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Button 
              variant="ghost" 
              onClick={() => navigate('/news')}
              className="mb-6 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to News
            </Button>

            <div className="mb-6">
              {post.category && (
                <Badge className={getCategoryColor(post.category)} variant="outline">
                  {post.category}
                </Badge>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4 mb-8 text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>
                    {post.published_at
                      ? format(new Date(post.published_at), 'MMMM d, yyyy')
                      : format(new Date(post.created_at), 'MMMM d, yyyy')
                    }
                  </span>
                </div>
                {post.views && (
                  <div className="flex items-center gap-2">
                    <Eye size={16} />
                    <span>{post.views} views</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareOnLinkedIn}
                  className="text-[#0A66C2] border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white"
                >
                  <Linkedin size={16} className="mr-2" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.share?.({ 
                    title: post.title, 
                    url: window.location.href 
                  }) || shareOnLinkedIn()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Share2 size={16} className="mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-8 md:p-12">
                <div className="prose prose-lg max-w-none">
                  {post.excerpt && (
                    <div className="text-xl text-muted-foreground mb-8 pb-8 border-b border-border/50 font-medium leading-relaxed">
                      {post.excerpt}
                    </div>
                  )}
                  
                  <div 
                    className="text-foreground leading-relaxed"
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {post.content}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-12 text-center">
              <div className="bg-muted/30 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Stay Updated
                </h3>
                <p className="text-muted-foreground mb-6">
                  Follow us on LinkedIn for more insights and company updates.
                </p>
                <Button
                  asChild
                  className="bg-[#0A66C2] hover:bg-[#004182] text-white"
                >
                  <a
                    href="https://www.linkedin.com/company/creedava/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Linkedin size={20} />
                    Follow CreedaVA
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}