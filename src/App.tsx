import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ChatBot } from '@/components/ChatBot'
import { Home } from '@/pages/Home'

// Lazy load route components for better performance
const Services = lazy(() => import('@/pages/Services').then(module => ({ default: module.Services })))
const About = lazy(() => import('@/pages/About').then(module => ({ default: module.About })))
const Pricing = lazy(() => import('@/pages/Pricing').then(module => ({ default: module.Pricing })))
const News = lazy(() => import('@/pages/News').then(module => ({ default: module.News })))
const Contact = lazy(() => import('@/pages/Contact'))

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
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <ChatBot />
      </div>
    </Router>
  )
}

export default App