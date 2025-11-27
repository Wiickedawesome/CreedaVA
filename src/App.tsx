import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ChatBot } from '@/components/ChatBot'
import { Home } from '@/pages/Home'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Login } from '@/pages/Login'
import { SignUp } from '@/pages/SignUp'
import { EnvCheck } from '@/pages/EnvCheck'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AdminDashboard } from '@/pages/admin/Dashboard'

// Lazy load route components for better performance
const Services = lazy(() => import('@/pages/Services').then(module => ({ default: module.Services })))
const About = lazy(() => import('@/pages/About').then(module => ({ default: module.About })))
const Pricing = lazy(() => import('@/pages/Pricing').then(module => ({ default: module.Pricing })))
const News = lazy(() => import('@/pages/News'))
const BlogPost = lazy(() => import('@/pages/BlogPost'))
const Contact = lazy(() => import('@/pages/Contact'))

// Lazy load admin pages
const Leads = lazy(() => import('@/pages/admin/Leads').then(m => ({ default: m.Leads })))
const Contacts = lazy(() => import('@/pages/admin/Contacts').then(m => ({ default: m.Contacts })))
const Tasks = lazy(() => import('@/pages/admin/Tasks').then(m => ({ default: m.Tasks })))
const Projects = lazy(() => import('@/pages/admin/Projects').then(m => ({ default: m.Projects })))
const Emails = lazy(() => import('@/pages/admin/Emails').then(m => ({ default: m.Emails })))
const SEO = lazy(() => import('@/pages/admin/SEO').then(m => ({ default: m.SEO })))
const Keywords = lazy(() => import('@/pages/admin/Keywords').then(m => ({ default: m.Keywords })))
const Analytics = lazy(() => import('@/pages/admin/Analytics').then(m => ({ default: m.Analytics })))
const Settings = lazy(() => import('@/pages/admin/Settings').then(m => ({ default: m.Settings })))

// Marketing pages
const Social = lazy(() => import('@/pages/admin/Social').then(m => ({ default: m.Social })))
const LinkedInIntegration = lazy(() => import('@/pages/admin/LinkedInIntegration').then(m => ({ default: m.LinkedInIntegration })))
const Blog = lazy(() => import('@/pages/admin/Blog').then(m => ({ default: m.Blog })))
const AdCampaigns = lazy(() => import('@/pages/admin/AdCampaigns').then(m => ({ default: m.AdCampaigns })))
const LandingPages = lazy(() => import('@/pages/admin/LandingPages').then(m => ({ default: m.LandingPages })))
const CustomerJourney = lazy(() => import('@/pages/admin/CustomerJourney').then(m => ({ default: m.CustomerJourney })))
const Reports = lazy(() => import('@/pages/admin/Reports').then(m => ({ default: m.Reports })))

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
)

function App() {
  const embedded = (typeof window !== 'undefined') && (window as any).__CREEDAVA_EMBEDDED__ === true
  // Use basename for GitHub Pages deployment with /CreedaVA/ path
  const basename = import.meta.env.BASE_URL
  
  return (
    <Router basename={basename}>
      <AuthProvider>
        <PerformanceMonitor />
        <Routes>
          {/* Diagnostic route */}
          <Route path="/env-check" element={<EnvCheck />} />
          
          {/* Public auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected admin routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="leads" element={
                <Suspense fallback={<PageLoader />}>
                  <Leads />
                </Suspense>
              } />
              <Route path="contacts" element={
                <Suspense fallback={<PageLoader />}>
                  <Contacts />
                </Suspense>
              } />
              <Route path="tasks" element={
                <Suspense fallback={<PageLoader />}>
                  <Tasks />
                </Suspense>
              } />
              <Route path="projects" element={
                <Suspense fallback={<PageLoader />}>
                  <Projects />
                </Suspense>
              } />
              <Route path="emails" element={
                <Suspense fallback={<PageLoader />}>
                  <Emails />
                </Suspense>
              } />
              <Route path="seo" element={
                <Suspense fallback={<PageLoader />}>
                  <SEO />
                </Suspense>
              } />
              <Route path="keywords" element={
                <Suspense fallback={<PageLoader />}>
                  <Keywords />
                </Suspense>
              } />
              <Route path="analytics" element={
                <Suspense fallback={<PageLoader />}>
                  <Analytics />
                </Suspense>
              } />
              <Route path="settings" element={
                <Suspense fallback={<PageLoader />}>
                  <Settings />
                </Suspense>
              } />
              
              {/* Marketing routes */}
              <Route path="social" element={
                <Suspense fallback={<PageLoader />}>
                  <Social />
                </Suspense>
              } />
              <Route path="linkedin-integration" element={
                <Suspense fallback={<PageLoader />}>
                  <LinkedInIntegration />
                </Suspense>
              } />
              <Route path="blog" element={
                <Suspense fallback={<PageLoader />}>
                  <Blog />
                </Suspense>
              } />
              <Route path="ad-campaigns" element={
                <Suspense fallback={<PageLoader />}>
                  <AdCampaigns />
                </Suspense>
              } />
              <Route path="landing-pages" element={
                <Suspense fallback={<PageLoader />}>
                  <LandingPages />
                </Suspense>
              } />
              <Route path="customer-journey" element={
                <Suspense fallback={<PageLoader />}>
                  <CustomerJourney />
                </Suspense>
              } />
              <Route path="reports" element={
                <Suspense fallback={<PageLoader />}>
                  <Reports />
                </Suspense>
              } />
            </Route>
          </Route>

          {/* Public website routes */}
          <Route path="*" element={
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/contact" element={<Contact />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <ChatBot />
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App