import { useState, useEffect, memo, useCallback, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { List } from '@phosphor-icons/react'

export const Navbar = memo(() => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = useMemo(() => [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'About', path: '/about' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'News', path: '/news' },
    { label: 'Contact', path: '/contact' },
  ], [])

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname])
  
  const handleMenuClose = useCallback(() => setIsMenuOpen(false), [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold leading-tight">
              <span className="text-primary">Creeda</span>
              <span className="text-accent">VA</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-accent'
                    : 'text-foreground hover:text-accent'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/contact">Get Started</Link>
            </Button>
          </nav>

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <List size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col gap-6 mt-8 px-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={handleMenuClose}
                    className={`text-center text-lg font-medium transition-colors py-2 ${
                      isActive(link.path)
                        ? 'text-accent'
                        : 'text-foreground hover:text-accent'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground mt-4">
                  <Link to="/contact" onClick={handleMenuClose}>
                    Get Started
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
})

Navbar.displayName = 'Navbar'
