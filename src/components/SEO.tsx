import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: string
  canonicalUrl?: string
  noindex?: boolean
}

/**
 * SEO Component - Updates document meta tags for each page
 * 
 * Usage:
 * <SEO 
 *   title="About Us | CreedaVA"
 *   description="Learn about our mission..."
 *   keywords="virtual assistant, remote support"
 * />
 */
export function SEO({
  title = 'CreedaVA - Bilingual Virtual Assistants from Belize | Professional Remote Support',
  description = 'Belize-based bilingual virtual assistants fluent in English & Spanish. Professional remote support for executive tasks, administration, customer service, and more. Founded 2023. Call +1 844-702-2202',
  keywords = 'virtual assistant, Belize virtual assistant, bilingual assistant, remote assistant, executive support, administrative services, business support, CreedaVA, English Spanish VA, Central America virtual assistant',
  ogImage = 'https://creedava.com/og-image.jpg',
  ogType = 'website',
  canonicalUrl,
  noindex = false
}: SEOProps) {
  const location = useLocation()
  
  useEffect(() => {
    // Update document title
    document.title = title

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name'
      let element = document.querySelector(`meta[${attribute}="${name}"]`)
      
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, name)
        document.head.appendChild(element)
      }
      
      element.setAttribute('content', content)
    }

    // Basic meta tags
    updateMetaTag('description', description)
    updateMetaTag('keywords', keywords)
    
    // Robots
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow')
    } else {
      updateMetaTag('robots', 'index, follow')
    }

    // Open Graph
    const fullUrl = canonicalUrl || `https://creedava.com${location.pathname}`
    updateMetaTag('og:title', title, true)
    updateMetaTag('og:description', description, true)
    updateMetaTag('og:url', fullUrl, true)
    updateMetaTag('og:type', ogType, true)
    updateMetaTag('og:image', ogImage, true)

    // Twitter
    updateMetaTag('twitter:card', 'summary_large_image', true)
    updateMetaTag('twitter:title', title, true)
    updateMetaTag('twitter:description', description, true)
    updateMetaTag('twitter:image', ogImage, true)
    updateMetaTag('twitter:url', fullUrl, true)

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.href = fullUrl

  }, [title, description, keywords, ogImage, ogType, canonicalUrl, noindex, location.pathname])

  return null
}

// SEO data for each page
export const seoData = {
  home: {
    title: 'CreedaVA - Bilingual Virtual Assistants from Belize | Professional Remote Support',
    description: 'Belize-based bilingual virtual assistants fluent in English & Spanish. Professional remote support for executive tasks, administration, customer service, and more. Founded 2023. Call +1 844-702-2202',
    keywords: 'virtual assistant, Belize virtual assistant, bilingual assistant, remote assistant, executive support, administrative services, business support, CreedaVA, English Spanish VA, Central America virtual assistant',
  },
  about: {
    title: 'About CreedaVA - Your Trusted Virtual Assistant Partner | Belize-Based Support',
    description: 'Learn about CreedaVA, founded in 2023 to provide exceptional bilingual virtual assistant services. Discover our mission, values, and commitment to helping businesses scale with professional remote support from Belize.',
    keywords: 'about CreedaVA, virtual assistant company, Belize business support, remote team, bilingual VA services, professional virtual assistants, company mission, virtual assistant values',
  },
  services: {
    title: 'Virtual Assistant Services | Executive, Admin & Customer Support | CreedaVA',
    description: 'Comprehensive virtual assistant services: Executive support, administrative tasks, customer service, e-commerce, content & social media, insurance support. Bilingual English/Spanish support available. Scale your business today.',
    keywords: 'virtual assistant services, executive assistant, administrative support, customer service VA, e-commerce assistant, social media management, insurance virtual assistant, bilingual support, remote business services',
  },
  pricing: {
    title: 'Pricing Plans | Affordable Virtual Assistant Services | CreedaVA',
    description: 'Transparent pricing for professional virtual assistant services. Starter ($1,699/mo), Professional ($1,899/mo), and custom Enterprise plans. Full-time dedicated support with bilingual options. No hidden fees.',
    keywords: 'virtual assistant pricing, VA cost, affordable virtual assistant, virtual assistant plans, remote support pricing, dedicated VA pricing, bilingual assistant rates, business support costs',
  },
  contact: {
    title: 'Contact CreedaVA | Get Started with Professional Virtual Assistants',
    description: 'Ready to scale your business? Contact CreedaVA for a free consultation. Call +1 844-702-2202, email hello@creedava.com, or book a call. Professional bilingual virtual assistants from Belize.',
    keywords: 'contact CreedaVA, virtual assistant consultation, book VA call, hire virtual assistant, get virtual assistant quote, schedule consultation, virtual assistant inquiry',
  },
  news: {
    title: 'News & Updates | CreedaVA Blog | Virtual Assistant Industry Insights',
    description: 'Latest news, updates, and insights from CreedaVA. Virtual assistant tips, business productivity advice, remote work strategies, and company announcements. Stay informed with industry trends.',
    keywords: 'virtual assistant blog, VA news, remote work tips, business productivity, CreedaVA updates, virtual assistant insights, industry news, business support blog',
  },
  login: {
    title: 'Admin Login | CreedaVA',
    description: 'Secure login portal for CreedaVA admin dashboard. Access your account to manage leads, contacts, projects, and analytics.',
    keywords: 'CreedaVA login, admin portal, secure login',
    noindex: true,
  },
  signup: {
    title: 'Sign Up | CreedaVA Admin',
    description: 'Create your CreedaVA admin account.',
    keywords: 'CreedaVA signup, create account, admin registration',
    noindex: true,
  },
  admin: {
    title: 'Admin Dashboard | CreedaVA',
    description: 'CreedaVA admin dashboard for managing business operations.',
    keywords: 'admin dashboard, CreedaVA admin',
    noindex: true,
  }
} as const
