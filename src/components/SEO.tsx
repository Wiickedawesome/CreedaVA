import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSiteMetadata } from '@/hooks/useSiteMetadata'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: string
  canonicalUrl?: string
  noindex?: boolean
  ogLocale?: string
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
  ogImage = 'https://creedava.com/og-image.webp',
  ogType = 'website',
  canonicalUrl,
  noindex = false,
  ogLocale = 'en_US'
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
    updateMetaTag('og:image:width', '1200', true)
    updateMetaTag('og:image:height', '630', true)
    updateMetaTag('og:image:alt', title, true)
    updateMetaTag('og:site_name', 'CreedaVA', true)
    updateMetaTag('og:locale', ogLocale, true)

    // Twitter (use name attribute per Twitter spec)
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:site', '@creedava')
    updateMetaTag('twitter:title', title)
    updateMetaTag('twitter:description', description)
    updateMetaTag('twitter:image', ogImage)
    updateMetaTag('twitter:image:alt', title)
    updateMetaTag('twitter:url', fullUrl)

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.href = fullUrl

    // hreflang tags for multilingual SEO (en + es)
    const baseUrl = fullUrl.split('?')[0] // strip any existing query params
    const hreflangMap: Record<string, string> = {
      'en': `${baseUrl}?lang=en`,
      'es': `${baseUrl}?lang=es`,
      'x-default': baseUrl,
    }

    // Remove stale hreflang links
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove())

    Object.entries(hreflangMap).forEach(([lang, href]) => {
      const link = document.createElement('link')
      link.setAttribute('rel', 'alternate')
      link.setAttribute('hreflang', lang)
      link.setAttribute('href', href)
      document.head.appendChild(link)
    })

    // OG locale alternate (show the other language)
    const alternateLocale = ogLocale === 'es_ES' ? 'en_US' : 'es_ES'
    updateMetaTag('og:locale:alternate', alternateLocale, true)

  }, [title, description, keywords, ogImage, ogType, canonicalUrl, noindex, ogLocale, location.pathname])

  return null
}

// SEO data for each page
export const seoData = {
  home: {
    title: 'CreedaVA - Bilingual Virtual Assistants from Belize | Professional Remote Support',
    description: 'Belize-based bilingual virtual assistants fluent in English & Spanish. Professional remote support for executive tasks, administration, customer service, and more. Trusted since 2023. Call +1 844-702-2202',
    keywords: 'virtual assistant, Belize virtual assistant, bilingual assistant, remote assistant, executive support, administrative services, business support, CreedaVA, English Spanish VA, Central America virtual assistant, dedicated VA, outsourcing Belize',
  },
  about: {
    title: 'About CreedaVA - Bilingual Virtual Assistant Company | Belize-Based Support',
    description: 'Meet CreedaVA — trusted bilingual virtual assistant company founded in 2023. Our mission: help businesses scale with professional English & Spanish remote support from Belize. Learn our story, values, and team.',
    keywords: 'about CreedaVA, virtual assistant company, Belize business support, bilingual VA services, professional virtual assistants, company mission, remote team Belize, virtual assistant values, who is CreedaVA',
  },
  services: {
    title: 'Virtual Assistant Services | Executive, Admin & Customer Support | CreedaVA',
    description: 'Comprehensive virtual assistant services from CreedaVA: executive support, administrative tasks, customer service, e-commerce, content & social media, and insurance support. Bilingual English/Spanish. Scale your business today.',
    keywords: 'virtual assistant services, executive assistant, administrative support, customer service VA, e-commerce assistant, social media management, insurance virtual assistant, bilingual support, remote business services, dedicated virtual assistant',
  },
  pricing: {
    title: 'Pricing Plans | Affordable Virtual Assistant Services | CreedaVA',
    description: 'Transparent pricing for professional virtual assistant services. Starter ($1,699/mo), Professional ($1,899/mo), and custom Enterprise plans. Full-time dedicated bilingual support. No hidden fees. Cancel anytime.',
    keywords: 'virtual assistant pricing, VA cost, affordable virtual assistant, virtual assistant plans, remote support pricing, dedicated VA pricing, bilingual assistant rates, business support costs, monthly VA plans',
  },
  contact: {
    title: 'Contact CreedaVA | Get a Free Consultation | Hire Virtual Assistants',
    description: 'Ready to scale your business? Contact CreedaVA for a free consultation. Call +1 844-702-2202, email hello@creedava.com, or book a call online. Professional bilingual virtual assistants from Belize.',
    keywords: 'contact CreedaVA, virtual assistant consultation, book VA call, hire virtual assistant, get virtual assistant quote, schedule consultation, virtual assistant inquiry, free VA consultation',
  },
  news: {
    title: 'News & Blog | CreedaVA | Virtual Assistant Industry Insights & Updates',
    description: 'Latest news, insights, and tips from CreedaVA. Virtual assistant strategies, business productivity advice, remote work best practices, and company updates. Stay ahead with industry trends.',
    keywords: 'virtual assistant blog, VA news, remote work tips, business productivity, CreedaVA updates, virtual assistant insights, industry news, business support blog, outsourcing tips',
  },
  login: {
    title: 'Admin Login | CreedaVA',
    description: 'Secure login portal for CreedaVA admin dashboard.',
    keywords: 'CreedaVA login, admin portal, secure login',
    noindex: true,
  },
  admin: {
    title: 'Admin Dashboard | CreedaVA',
    description: 'CreedaVA admin dashboard for managing business operations.',
    keywords: 'admin dashboard, CreedaVA admin',
    noindex: true,
  }
} as const

// Map seoData keys to their URL paths for Cosmos lookup
const pagePathMap: Record<string, string> = {
  home: '/',
  about: '/about',
  services: '/services',
  pricing: '/pricing',
  contact: '/contact',
  news: '/news',
  login: '/login',
  admin: '/admin',
}

type SeoPageKey = keyof typeof seoData

/**
 * DynamicSEO - Uses Cosmos DB SEO records (managed from /admin/seo) as overrides,
 * falling back to the hardcoded seoData defaults when no published record exists.
 *
 * Usage:
 *   <DynamicSEO page="home" />
 *   <DynamicSEO page="about" />
 *
 * To override from the admin:
 *   1. Go to /admin/seo → Create SEO Content
 *   2. Set the URL to the page path (e.g. "/about" or "/services")
 *   3. Fill in title, meta description, keywords, OG/Twitter fields, images
 *   4. Set status to "Published"
 *   5. The public page will pick up the overrides on next load
 */
export function DynamicSEO({ page }: { page: SeoPageKey }) {
  const defaults = seoData[page]
  const path = pagePathMap[page] || `/${page}`
  const metadata = useSiteMetadata(path)
  const { t, i18n } = useTranslation()

  // Use i18n translations for title/description/keywords when available
  const i18nTitle = t(`seo.${page}.title`, { defaultValue: '' })
  const i18nDescription = t(`seo.${page}.description`, { defaultValue: '' })
  const i18nKeywords = t(`seo.${page}.keywords`, { defaultValue: '' })

  // Priority: Cosmos DB overrides > i18n translations > hardcoded defaults
  const title = metadata?.title || (i18nTitle || defaults.title)
  const description = metadata?.metaDescription || (i18nDescription || defaults.description)
  const keywords = metadata?.targetKeywords || (i18nKeywords || defaults.keywords)

  // Set og:locale based on current language
  const ogLocale = i18n.language === 'es' ? 'es_ES' : 'en_US'

  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      ogImage={metadata?.openGraphImage || metadata?.twitterImage || 'https://creedava.com/og-image.webp'}
      canonicalUrl={metadata?.canonicalUrl}
      noindex={'noindex' in defaults ? (defaults as any).noindex : false}
      ogLocale={ogLocale}
    />
  )
}
