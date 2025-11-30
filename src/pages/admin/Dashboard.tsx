import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Users, UserPlus, CheckSquare, TrendingUp, Mail, FolderKanban, Plus, Edit, Send, FileText } from 'lucide-react'

interface Stats {
  leads: number
  contacts: number
  tasks: number
  projects: number
  emails: number
  recentActivity: number
}

function QuickActionsCard() {
  const navigate = useNavigate()
  
  const quickActions = [
    {
      title: 'Add new lead',
      description: 'Create a new lead in the system',
      icon: UserPlus,
      action: () => navigate('/admin/leads'),
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Create task',
      description: 'Add a new task to track',
      icon: Plus,
      action: () => navigate('/admin/tasks'),
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Send email',
      description: 'Compose and send an email',
      icon: Send,
      action: () => navigate('/admin/emails'),
      color: 'bg-pink-600 hover:bg-pink-700'
    },
    {
      title: 'Update SEO content',
      description: 'Manage SEO pages and content',
      icon: FileText,
      action: () => navigate('/admin/seo'),
      color: 'bg-emerald-600 hover:bg-emerald-700'
    }
  ]

  return (
    <div className="bg-gray-700 p-6 rounded-lg border border-gray-600">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
        <p className="text-gray-300 text-sm">Common tasks and shortcuts</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            onClick={action.action}
            variant="outline"
            className={`${action.color} border-transparent text-white hover:text-white flex items-center justify-start gap-3 p-4 h-auto transition-colors`}
          >
            <action.icon className="w-5 h-5 shrink-0" />
            <div className="text-left">
              <div className="font-medium">{action.title}</div>
              <div className="text-xs opacity-90">{action.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
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
      // Stats loading is non-critical, continue rendering
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
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-600 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded-lg border border-gray-600"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 min-h-screen">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-gray-300 mt-1">
          Welcome to your CRM and SEO management platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-600 p-4 rounded-lg border border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-100">Total Leads</h3>
            <UserPlus className="h-5 w-5 text-blue-200" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.leads}</div>
          <p className="text-xs text-blue-100 mt-1">
            {stats.leads === 0 ? 'No data yet' : 'Total count'}
          </p>
        </div>
        <div className="bg-green-600 p-4 rounded-lg border border-green-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-100">Total Contacts</h3>
            <Users className="h-5 w-5 text-green-200" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.contacts}</div>
          <p className="text-xs text-green-100 mt-1">
            {stats.contacts === 0 ? 'No data yet' : 'Total count'}
          </p>
        </div>
        <div className="bg-purple-600 p-4 rounded-lg border border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-100">Active Tasks</h3>
            <CheckSquare className="h-5 w-5 text-purple-200" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.tasks}</div>
          <p className="text-xs text-purple-100 mt-1">
            {stats.tasks === 0 ? 'No data yet' : 'Total count'}
          </p>
        </div>
        <div className="bg-emerald-600 p-4 rounded-lg border border-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-emerald-100">Projects</h3>
            <FolderKanban className="h-5 w-5 text-emerald-200" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.projects}</div>
          <p className="text-xs text-emerald-100 mt-1">
            {stats.projects === 0 ? 'No data yet' : 'Total count'}
          </p>
        </div>
        <div className="bg-pink-600 p-4 rounded-lg border border-pink-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-pink-100">Emails Sent</h3>
            <Mail className="h-5 w-5 text-pink-200" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.emails}</div>
          <p className="text-xs text-pink-100 mt-1">
            {stats.emails === 0 ? 'No data yet' : 'Total count'}
          </p>
        </div>
        <div className="bg-teal-600 p-4 rounded-lg border border-teal-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-teal-100">Recent Activity</h3>
            <TrendingUp className="h-5 w-5 text-teal-200" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.recentActivity}</div>
          <p className="text-xs text-teal-100 mt-1">
            {stats.recentActivity === 0 ? 'No data yet' : 'Total count'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActionsCard />

        <div className="bg-gray-700 p-6 rounded-lg border border-gray-600">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <p className="text-gray-300 text-sm">Latest updates and changes</p>
          </div>
          <p className="text-sm text-gray-300">No recent activity</p>
        </div>
      </div>
    </div>
  )
}
