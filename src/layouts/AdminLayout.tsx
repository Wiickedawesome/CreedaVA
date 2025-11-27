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
  BarChart3,
  Link as LinkIcon
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
  { name: 'LinkedIn Integration', href: '/admin/linkedin-integration', icon: LinkIcon },
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 flex flex-col">
        <div className="p-6">
          <div className="text-xl font-semibold text-white">CreedaVA</div>
          <p className="text-sm text-gray-400 mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 px-4 pb-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/admin' && location.pathname.startsWith(item.href))
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
          
          <div className="mt-8">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Marketing</div>
            <div className="mt-2 space-y-1">
              {marketingNav.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/admin' && location.pathname.startsWith(item.href))
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2 h-auto hover:bg-gray-800">
                <div className="flex items-center w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-700 text-white text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                    <p className="text-xs text-gray-400">Admin</p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
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
      <main className="flex-1 overflow-y-auto bg-gray-900 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
