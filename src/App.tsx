import { Suspense, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
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
import { useInView } from '@/hooks/useInView'
import { trackPageView } from '@/lib/tracking'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { lazyWithRetry, lazyWithRetryAndTransform } from '@/utils/lazyWithRetry'

// Lazy load route components with retry logic for better resilience
const Services = lazyWithRetryAndTransform(
  () => import('@/pages/Services'),
  (m) => m.Services
)
const About = lazyWithRetryAndTransform(
  () => import('@/pages/About'),
  (m) => m.About
)
const Pricing = lazyWithRetryAndTransform(
  () => import('@/pages/Pricing'),
  (m) => m.Pricing
)
const News = lazyWithRetry(() => import('@/pages/News'))
const BlogPost = lazyWithRetry(() => import('@/pages/BlogPost'))
const Contact = lazyWithRetry(() => import('@/pages/Contact'))

// Lazy load admin pages with retry
const Leads = lazyWithRetryAndTransform(() => import('@/pages/admin/Leads'), m => m.Leads)
const Contacts = lazyWithRetryAndTransform(() => import('@/pages/admin/Contacts'), m => m.Contacts)
const Tasks = lazyWithRetryAndTransform(() => import('@/pages/admin/Tasks'), m => m.Tasks)
const Projects = lazyWithRetryAndTransform(() => import('@/pages/admin/Projects'), m => m.Projects)
const Emails = lazyWithRetryAndTransform(() => import('@/pages/admin/Emails'), m => m.Emails)
const SEO = lazyWithRetryAndTransform(() => import('@/pages/admin/SEO'), m => m.SEO)
const Keywords = lazyWithRetryAndTransform(() => import('@/pages/admin/Keywords'), m => m.Keywords)
const Analytics = lazyWithRetryAndTransform(() => import('@/pages/admin/Analytics'), m => m.Analytics)
const Settings = lazyWithRetryAndTransform(() => import('@/pages/admin/Settings'), m => m.Settings)

// Marketing pages with retry
const Social = lazyWithRetryAndTransform(() => import('@/pages/admin/Social'), m => m.Social)
const Blog = lazyWithRetryAndTransform(() => import('@/pages/admin/Blog'), m => m.Blog)
const AdCampaigns = lazyWithRetryAndTransform(() => import('@/pages/admin/AdCampaigns'), m => m.AdCampaigns)
const LandingPages = lazyWithRetryAndTransform(() => import('@/pages/admin/LandingPages'), m => m.LandingPages)
const CustomerJourney = lazyWithRetryAndTransform(() => import('@/pages/admin/CustomerJourney'), m => m.CustomerJourney)
const Reports = lazyWithRetryAndTransform(() => import('@/pages/admin/Reports'), m => m.Reports)

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
)

function App() {
  // Use basename for GitHub Pages deployment with /CreedaVA/ path
  const basename = import.meta.env.BASE_URL
  
  return (
    <ErrorBoundary>
      <Router basename={basename}>
        <AuthProvider>
          <PerformanceMonitor />
          <PageViewTracker />
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
              <main className="grow">
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
              <DeferredChatBot />
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
    </ErrorBoundary>
  )
}

export default App

// Component to track page views
function PageViewTracker() {
  const location = useLocation()
  
  useEffect(() => {
    trackPageView(location.pathname)
  }, [location])
  
  return null
}

function DeferredChatBot() {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: '200px' })
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (inView) {
      setShouldRender(true)
    }
  }, [inView])

  return (
    <div ref={ref}>
      {shouldRender ? (
        <ChatBot />
      ) : (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Assistant loads when needed…
        </div>
      )}
    </div>
  )
}