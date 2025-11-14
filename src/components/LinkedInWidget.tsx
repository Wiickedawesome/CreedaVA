import { useEffect, useRef } from 'react'

interface LinkedInWidgetProps {
  embedId: string
  className?: string
}

export function LinkedInWidget({ embedId, className = '' }: LinkedInWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if the script is already loaded
    const existingScript = document.querySelector('script[src="https://widgets.sociablekit.com/linkedin-page-posts/widget.js"]')
    
    if (!existingScript) {
      // Create and append the script
      const script = document.createElement('script')
      script.src = 'https://widgets.sociablekit.com/linkedin-page-posts/widget.js'
      script.defer = true
      document.head.appendChild(script)

      // Clean up function to remove script when component unmounts
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      }
    }

    // Add CSS to hide the three dots menu
    const style = document.createElement('style')
    style.textContent = `
      .sk-ww-linkedin-page-post .sk-widget-header-menu,
      .sk-ww-linkedin-page-post .sk-widget-menu-button,
      .sk-ww-linkedin-page-post [class*="menu"],
      .sk-ww-linkedin-page-post [class*="kebab"],
      .sk-ww-linkedin-page-post button[aria-label*="menu" i] {
        display: none !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
    }
  }, [])

  return (
    <div className={`w-full ${className}`} ref={widgetRef}>
      <div 
        className="sk-ww-linkedin-page-post" 
        data-embed-id={embedId}
      />
    </div>
  )
}