import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight, ExternalLink, Newspaper, Linkedin } from 'lucide-react'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { CreedaLogo } from '@/components/CreedaLogo'
import { db } from '@/lib/database'
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

export default function News() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load blog posts from database
  useEffect(() => {
    fetchBlogPosts()
  }, [])

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await db
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(6)

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      setError('Failed to load blog posts')
    } finally {
      setLoading(false)
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

  const getCategoryLabel = (category: string | null) => {
    return category || 'Article'
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <AnimatedBackground />
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <Badge className="mb-6 bg-accent/10 text-accent border-accent/20" variant="outline">
                Latest Updates
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
                News & <span className="text-accent">Updates</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Stay informed about the latest from CreedaVA - new services, insights, success stories, 
                and company updates.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden lg:block"
            >
              <CreedaLogo variant="service" size={200} animate={true} />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Featured Posts Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              {loading ? 'Loading Articles...' : 'Latest Articles & Updates'}
            </h2>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {posts.length === 0 && !loading ? (
              <div className="col-span-2 text-center py-12">
                <Newspaper size={48} className="text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No blog posts published yet. Check back soon for updates!</p>
              </div>
            ) : (
              posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border-border/50 group">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <Badge className={getCategoryColor(post.category)} variant="outline">
                          {getCategoryLabel(post.category)}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar size={16} />
                          <span>
                            {post.published_at
                              ? format(new Date(post.published_at), 'MMMM d, yyyy')
                              : format(new Date(post.created_at), 'MMMM d, yyyy')
                            }
                          </span>
                        </div>
                      </div>
                      <CardTitle className="text-xl group-hover:text-accent transition-colors">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed mb-6">
                        {post.excerpt || post.content.substring(0, 150) + '...'}
                      </CardDescription>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          variant="outline"
                          className="border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground transition-all"
                          onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        >
                          Read Full Article
                          <ArrowRight size={16} className="ml-2" />
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          className="text-accent hover:text-accent hover:bg-accent/10"
                        >
                          <a
                            href="https://www.linkedin.com/company/creedava/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <Linkedin size={16} />
                            Share on LinkedIn
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Newspaper size={64} className="text-accent mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Stay Connected
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Follow us on LinkedIn for real-time updates, insights, and success stories from the CreedaVA community.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            >
              <a
                href="https://www.linkedin.com/company/creedava/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Linkedin size={24} />
                Follow on LinkedIn
              </a>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
