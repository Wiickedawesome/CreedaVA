import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Users, UserPlus, CheckSquare, TrendingUp, Mail, FolderKanban } from 'lucide-react'

interface Stats {
  leads: number
  contacts: number
  tasks: number
  projects: number
  emails: number
  recentActivity: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    leads: 0,
    contacts: 0,
    tasks: 0,
    projects: 0,
    emails: 0,
    recentActivity: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [leadsCount, contactsCount, tasksCount, projectsCount, emailsCount] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('emails').select('*', { count: 'exact', head: true }),
      ])

      setStats({
        leads: leadsCount.count || 0,
        contacts: contactsCount.count || 0,
        tasks: tasksCount.count || 0,
        projects: projectsCount.count || 0,
        emails: emailsCount.count || 0,
        recentActivity: 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { title: 'Total Leads', value: stats.leads, icon: UserPlus, color: 'text-blue-600' },
    { title: 'Total Contacts', value: stats.contacts, icon: Users, color: 'text-green-600' },
    { title: 'Active Tasks', value: stats.tasks, icon: CheckSquare, color: 'text-purple-600' },
    { title: 'Projects', value: stats.projects, icon: FolderKanban, color: 'text-emerald-600' },
    { title: 'Emails Sent', value: stats.emails, icon: Mail, color: 'text-pink-600' },
    { title: 'Recent Activity', value: stats.recentActivity, icon: TrendingUp, color: 'text-teal-600' },
  ]

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-700 mt-2 font-medium">
          Welcome to your CRM and SEO management platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.value === 0 ? 'No data yet' : 'Total count'}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">• Add new lead</p>
            <p className="text-sm text-muted-foreground">• Create task</p>
            <p className="text-sm text-muted-foreground">• Send email</p>
            <p className="text-sm text-muted-foreground">• Update SEO content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
