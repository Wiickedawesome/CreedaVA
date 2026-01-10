import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, CheckSquare, TrendingUp, Mail, FolderKanban, Plus, Edit, Send, FileText } from 'lucide-react'
import { API_BASE, authorizedFetch } from '@/lib/api-client'

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
      color: 'text-blue-400'
    },
    {
      title: 'Create task',
      description: 'Add a new task to track',
      icon: Plus,
      action: () => navigate('/admin/tasks'),
      color: 'text-purple-400'
    },
    {
      title: 'Send email',
      description: 'Compose and send an email',
      icon: Send,
      action: () => navigate('/admin/emails'),
      color: 'text-pink-400'
    },
    {
      title: 'Update SEO content',
      description: 'Manage SEO pages and content',
      icon: FileText,
      action: () => navigate('/admin/seo'),
      color: 'text-emerald-400'
    }
  ]

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
        <CardDescription className="text-gray-300">Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              variant="outline"
              className="flex items-center justify-start gap-3 p-4 h-auto bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
            >
              <action.icon className={`w-5 h-5 shrink-0 ${action.color}`} />
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-gray-400">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
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
      setLoading(true);
      
      // Fetch contacts and analytics from our working API
      const [contactsRes, analyticsRes] = await Promise.all([
        authorizedFetch(`${API_BASE}/getContacts`).then(r => r.json()).catch(() => ({ data: [] })),
        authorizedFetch(`${API_BASE}/getAnalytics?days=30`).then(r => r.json()).catch(() => ({ data: [], summary: {} }))
      ]);

      const contactsCount = contactsRes.data?.length || 0;
      const analyticsCount = analyticsRes.data?.length || 0;
      const uniquePages = analyticsRes.summary?.uniquePages || 0;

      setStats({
        leads: contactsCount, // Use contacts as leads for now
        contacts: contactsCount,
        tasks: 0, // Not implemented yet
        projects: 0, // Not implemented yet
        emails: 0, // Not implemented yet
        recentActivity: analyticsCount,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Stats loading is non-critical, continue rendering with zeros
    } finally {
      setLoading(false);
    }
  };

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
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Welcome to your CRM and SEO management platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Total Leads</h3>
            <UserPlus className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.leads}</div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.leads === 0 ? 'No data yet' : 'Total count'}
          </p>
        </Card>
        
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Total Contacts</h3>
            <Users className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.contacts}</div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.contacts === 0 ? 'No data yet' : 'Total count'}
          </p>
        </Card>
        
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Active Tasks</h3>
            <CheckSquare className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.tasks}</div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.tasks === 0 ? 'No data yet' : 'Total count'}
          </p>
        </Card>
        
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Projects</h3>
            <FolderKanban className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.projects}</div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.projects === 0 ? 'No data yet' : 'Total count'}
          </p>
        </Card>
        
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Emails Sent</h3>
            <Mail className="h-5 w-5 text-pink-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.emails}</div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.emails === 0 ? 'No data yet' : 'Total count'}
          </p>
        </Card>
        
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Recent Activity</h3>
            <TrendingUp className="h-5 w-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.recentActivity}</div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.recentActivity === 0 ? 'No data yet' : 'Total count'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActionsCard />

        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <p className="text-gray-400 text-sm">Latest updates and changes</p>
          </div>
          <p className="text-sm text-gray-500">No recent activity</p>
        </Card>
      </div>
    </div>
  )
}
