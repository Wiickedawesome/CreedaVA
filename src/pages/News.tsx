import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, LinkedinLogo, ArrowRight, Newspaper } from '@phosphor-icons/react'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { CreedaLogo } from '@/components/CreedaLogo'

interface NewsPost {
  id: string
  title: string
  excerpt: string
  date: string
  linkedinUrl?: string
  category: 'announcement' | 'update' | 'insight' | 'success-story'
  image?: string
}

export function News() {
  // Sample news posts - in production, these would come from an API or CMS
  const newsPosts: NewsPost[] = [
    {
      id: '1',
      title: 'CreedaVA Expands Technology Support Services',
      excerpt: 'We\'re excited to announce our new Technology Support services, including Tier 1/2 tech support, website development, and IT project management.',
      date: 'November 10, 2025',
      category: 'announcement',
      linkedinUrl: 'https://www.linkedin.com/company/creedava/',
    },
    {
      id: '2',
      title: 'Real Estate Support: Your Partner in Property Success',
      excerpt: 'Introducing specialized Real Estate Support services to help realtors manage leads, transactions, and client relationships more efficiently.',
      date: 'November 8, 2025',
      category: 'announcement',
      linkedinUrl: 'https://www.linkedin.com/company/creedava/',
    },
    {
      id: '3',
      title: 'Why Belizean Virtual Assistants Are Your Best Choice',
      excerpt: 'Discover the unique advantages of working with Belize-based VAs: bilingual excellence, cultural adaptability, and perfect timezone alignment.',
      date: 'November 5, 2025',
      category: 'insight',
      linkedinUrl: 'https://www.linkedin.com/company/creedava/',
    },
    {
      id: '4',
      title: 'Client Success Story: 50% Time Savings Achieved',
      excerpt: 'Learn how one of our clients saved over 50% of their time by partnering with CreedaVA for executive and administrative support.',
      date: 'November 1, 2025',
      category: 'success-story',
      linkedinUrl: 'https://www.linkedin.com/company/creedava/',
    },
  ]

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'announcement':
        return 'bg-accent/10 text-accent border-accent/20'
      case 'update':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'insight':
        return 'bg-secondary/10 text-secondary border-secondary/20'
      case 'success-story':
        return 'bg-accent/10 text-accent border-accent/20'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'announcement':
        return 'Announcement'
      case 'update':
        return 'Update'
      case 'insight':
        return 'Insight'
      case 'success-story':
        return 'Success Story'
      default:
        return category
    }
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
          <div className="grid md:grid-cols-2 gap-8">
            {newsPosts.map((post, index) => (
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
                        <span>{post.date}</span>
                      </div>
                    </div>
                    <CardTitle className="text-xl group-hover:text-accent transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed mb-6">
                      {post.excerpt}
                    </CardDescription>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {post.linkedinUrl && (
                        <Button
                          asChild
                          variant="outline"
                          className="border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground transition-all"
                        >
                          <a
                            href={post.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <LinkedinLogo size={20} weight="fill" />
                            View on LinkedIn
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="text-accent hover:text-accent hover:bg-accent/10"
                      >
                        Read More
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
            <Newspaper size={64} className="text-accent mx-auto mb-6" weight="duotone" />
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
                <LinkedinLogo size={24} weight="fill" />
                Follow on LinkedIn
              </a>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
