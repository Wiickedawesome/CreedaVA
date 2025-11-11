import { Link } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              <span className="text-primary-foreground">Creeda</span>
              <span className="text-accent">VA</span>
            </h3>
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
                <Link to="/services" className="hover:text-accent transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-accent transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-accent transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-accent transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <a href="tel:+18447022202" className="hover:text-accent transition-colors">
                  +1 844-702-2202
                </a>
              </li>
              <li>
                <a href="mailto:hello@creedava.com" className="hover:text-accent transition-colors">
                  hello@creedava.com
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/company/creedava/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                  LinkedIn
                </a>
              </li>
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
