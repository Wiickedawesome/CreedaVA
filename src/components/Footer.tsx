import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { EnvelopeSimple, Phone, LinkedinLogo } from '@phosphor-icons/react'

export const Footer = memo(() => {
  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 px-4 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className="text-3xl font-bold mb-4">
              <span className="text-primary-foreground">Creeda</span>
              <span className="text-accent">VA</span>
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Professional remote support for ambitious businesses worldwide. Your success is our mission.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://www.linkedin.com/company/creedava/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-emerald-600/20 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <LinkedinLogo size={20} weight="bold" />
              </a>
            </div>
          </div>

          {/* Services Section */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Services</h4>
            <ul className="space-y-3 text-sm">
              <li className="text-gray-300 hover:text-emerald-400 transition-colors cursor-pointer">Executive Support</li>
              <li className="text-gray-300 hover:text-emerald-400 transition-colors cursor-pointer">Administrative Tasks</li>
              <li className="text-gray-300 hover:text-emerald-400 transition-colors cursor-pointer">Customer Service</li>
              <li className="text-gray-300 hover:text-emerald-400 transition-colors cursor-pointer">Real Estate Support</li>
              <li className="text-gray-300 hover:text-emerald-400 transition-colors cursor-pointer">Technology Support</li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Company</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/services" className="text-primary-foreground/70 hover:text-accent transition-colors block">
                  Our Services
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-primary-foreground/70 hover:text-accent transition-colors block">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-primary-foreground/70 hover:text-accent transition-colors block">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-primary-foreground/70 hover:text-accent transition-colors block">
                  News & Updates
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/70 hover:text-accent transition-colors block">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Get in Touch</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 group">
                <div className="bg-emerald-600/20 p-2 rounded-lg group-hover:bg-emerald-600 transition-colors">
                  <Phone size={16} weight="bold" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Call Us</p>
                  <a href="tel:+18447022202" className="text-gray-200 hover:text-emerald-400 transition-colors font-medium">
                    +1 844-702-2202
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="bg-emerald-600/20 p-2 rounded-lg group-hover:bg-emerald-600 transition-colors">
                  <EnvelopeSimple size={16} weight="bold" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Email Us</p>
                  <a href="mailto:hello@creedava.com" className="text-gray-200 hover:text-emerald-400 transition-colors font-medium">
                    hello@creedava.com
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-gray-700 mb-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} CreedaVA. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Based in Belize 🇧🇿 • Serving Worldwide 🌎
          </p>
        </div>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'
