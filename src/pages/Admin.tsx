import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
// Use shim hooks as fallback when Spark is not available
import { useKV } from '@/lib/spark-shims/hooks'
import { Database, EnvelopeSimple, Phone, Briefcase, Trash, User } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export function Admin() {
  const [user, setUser] = useState<{ login: string; isOwner: boolean } | null>(null)
  const [submissions, setSubmissions] = useKV<Array<{
    id: string
    name: string
    email: string
    company?: string
    phone?: string
    service?: string
    message: string
    timestamp: number
  }>>('contact-submissions', [])

  useEffect(() => {
    window.spark.user().then(setUser)
  }, [])

  const handleDelete = (id: string) => {
    setSubmissions((current) => (current || []).filter(sub => sub.id !== id))
    toast.success('Submission deleted')
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all submissions? This cannot be undone.')) {
      setSubmissions([])
      toast.success('All submissions cleared')
    }
  }

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(timestamp))
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user.isOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              This page is only accessible to the app owner.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Database className="text-accent" size={32} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
                  <p className="text-muted-foreground">View and manage contact form submissions</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                <User className="mr-1" size={16} />
                {user.login}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Submissions</CardDescription>
                  <CardTitle className="text-3xl text-accent">
                    {submissions?.length || 0}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Latest Submission</CardDescription>
                  <CardTitle className="text-lg">
                    {submissions && submissions.length > 0
                      ? formatDate(submissions[0].timestamp)
                      : 'No submissions yet'}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Actions</CardDescription>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={!submissions || submissions.length === 0}
                  >
                    <Trash className="mr-2" size={16} />
                    Clear All
                  </Button>
                </CardHeader>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-6">
            {submissions && submissions.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Database className="text-muted-foreground mx-auto mb-4" size={48} />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No submissions yet
                  </h3>
                  <p className="text-muted-foreground">
                    Contact form submissions will appear here when users fill out the contact form.
                  </p>
                </CardContent>
              </Card>
            ) : (
              submissions?.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">{submission.name}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {formatDate(submission.timestamp)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <EnvelopeSimple size={16} />
                              <a
                                href={`mailto:${submission.email}`}
                                className="text-accent hover:underline"
                              >
                                {submission.email}
                              </a>
                            </div>
                            {submission.phone && (
                              <div className="flex items-center gap-2">
                                <Phone size={16} />
                                <a
                                  href={`tel:${submission.phone}`}
                                  className="text-accent hover:underline"
                                >
                                  {submission.phone}
                                </a>
                              </div>
                            )}
                            {submission.company && (
                              <div className="flex items-center gap-2">
                                <Briefcase size={16} />
                                <span>{submission.company}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(submission.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash size={20} />
                        </Button>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6 space-y-4">
                      {submission.service && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Interested Services
                          </p>
                          <p className="text-foreground">{submission.service}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Message</p>
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                          {submission.message}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
