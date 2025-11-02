import { Link } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">CreedaVA</h3>
            <p className="text-primary-foreground/80 text-sm">
              Creeda Virtual Assistants - Professional remote support for ambitious businesses worldwide.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>Executive Support</li>
              <li>Administrative Tasks</li>
              <li>Customer Service</li>
              <li>E-commerce Support</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <a href="mailto:hello@creedava.com" className="hover:text-white transition-colors">
                  hello@creedava.com
                </a>
              </li>
              <li>Available 24/7</li>
            </ul>
          </div>
        </div>
        <Separator className="bg-primary-foreground/20 mb-8" />
        <div className="text-center text-sm text-primary-foreground/80">
          © {new Date().getFullYear()} CreedaVA - Creeda Virtual Assistants. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
