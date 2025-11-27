import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  CheckSquare, 
  FolderKanban, 
  Mail, 
  Search, 
  FileText,
  TrendingUp,
  Settings,
  LogOut,
  Linkedin,
  LayoutTemplate,
  Route,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Leads', href: '/admin/leads', icon: UserPlus },
  { name: 'Contacts', href: '/admin/contacts', icon: Users },
  { name: 'Tasks', href: '/admin/tasks', icon: CheckSquare },
  { name: 'Projects', href: '/admin/projects', icon: FolderKanban },
  { name: 'Emails', href: '/admin/emails', icon: Mail },
  { name: 'SEO Content', href: '/admin/seo', icon: FileText },
  { name: 'Keywords', href: '/admin/keywords', icon: Search },
  { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

const marketingNav = [
  { name: 'Social Media', href: '/admin/social', icon: Linkedin },
  { name: 'Blog', href: '/admin/blog', icon: FileText },
  { name: 'Ad Campaigns', href: '/admin/ad-campaigns', icon: TrendingUp },
  { name: 'Landing Pages', href: '/admin/landing-pages', icon: LayoutTemplate },
  { name: 'Customer Journey', href: '/admin/customer-journey', icon: Route },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
]

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U'

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-100 border-r border-slate-300 flex flex-col">
        <div className="p-4 border-b border-slate-300">
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-white">CreedaVA</div>
          </Link>
          <p className="text-xs text-white mt-1 font-medium">CRM & SEO Platform</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/admin' && location.pathname.startsWith(item.href))
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-200 text-slate-900'
                    : 'text-white hover:bg-slate-200 hover:text-slate-900'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
          
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="px-3 mb-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Marketing</p>
            {marketingNav.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/admin' && location.pathname.startsWith(item.href))
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/40 dark:bg-emerald-500'
                      : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left text-sm">
                  <p className="font-medium truncate">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
