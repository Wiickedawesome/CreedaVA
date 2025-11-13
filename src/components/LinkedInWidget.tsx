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