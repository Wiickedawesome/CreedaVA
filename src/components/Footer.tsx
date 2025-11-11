import { Link } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { EnvelopeSimple, Phone, LinkedinLogo } from '@phosphor-icons/react'

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground py-16 px-4 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className="text-3xl font-bold mb-4">
              <span className="text-primary-foreground">Creeda</span>
              <span style={{ color: 'oklch(0.70 0.15 350)' }}>VA</span>
            </h3>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6">
              Professional remote support for ambitious businesses worldwide. Your success is our mission.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://www.linkedin.com/company/creedava/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-accent/20 hover:bg-accent rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <LinkedinLogo size={20} weight="bold" />
              </a>
            </div>
          </div>

          {/* Services Section */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-accent">Services</h4>
            <ul className="space-y-3 text-sm">
              <li className="text-primary-foreground/70 hover:text-accent transition-colors cursor-pointer">Executive Support</li>
              <li className="text-primary-foreground/70 hover:text-accent transition-colors cursor-pointer">Administrative Tasks</li>
              <li className="text-primary-foreground/70 hover:text-accent transition-colors cursor-pointer">Customer Service</li>
              <li className="text-primary-foreground/70 hover:text-accent transition-colors cursor-pointer">Real Estate Support</li>
              <li className="text-primary-foreground/70 hover:text-accent transition-colors cursor-pointer">Technology Support</li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-accent">Company</h4>
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
                <Link to="/contact" className="text-primary-foreground/70 hover:text-accent transition-colors block">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-accent">Get in Touch</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 group">
                <div className="bg-accent/20 p-2 rounded-lg group-hover:bg-accent transition-colors">
                  <Phone size={16} weight="bold" />
                </div>
                <div>
                  <p className="text-primary-foreground/50 text-xs mb-1">Call Us</p>
                  <a href="tel:+18447022202" className="text-primary-foreground/90 hover:text-accent transition-colors font-medium">
                    +1 844-702-2202
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="bg-accent/20 p-2 rounded-lg group-hover:bg-accent transition-colors">
                  <EnvelopeSimple size={16} weight="bold" />
                </div>
                <div>
                  <p className="text-primary-foreground/50 text-xs mb-1">Email Us</p>
                  <a href="mailto:hello@creedava.com" className="text-primary-foreground/90 hover:text-accent transition-colors font-medium">
                    hello@creedava.com
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-primary-foreground/20 mb-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} CreedaVA. All rights reserved.
          </p>
          <p className="text-xs text-primary-foreground/50">
            Based in Belize 🇧🇿 • Serving Worldwide 🌎
          </p>
        </div>
      </div>
    </footer>
  )
}
