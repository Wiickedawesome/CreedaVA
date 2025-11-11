import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ChatBot } from '@/components/ChatBot'
import { Home } from '@/pages/Home'
import { Services } from '@/pages/Services'
import { About } from '@/pages/About'
import { Pricing } from '@/pages/Pricing'
import Contact from '@/pages/Contact'

function App() {
  const embedded = (typeof window !== 'undefined') && (window as any).__CREEDAVA_EMBEDDED__ === true
  // Use basename for GitHub Pages deployment with /CreedaVA/ path
  const basename = import.meta.env.BASE_URL
  
  return (
    <Router basename={basename}>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
        <ChatBot />
      </div>
    </Router>
  )
}

export default App