import { useEffect, useRef } from 'react'

interface LinkedInFeedProps {
  companyId?: string
  className?: string
}

export function LinkedInFeed({ companyId = 'creedava', className = '' }: LinkedInFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load LinkedIn Platform SDK
    const script = document.createElement('script')
    script.src = 'https://platform.linkedin.com/in.js'
    script.async = true
    script.defer = true
    script.type = 'text/javascript'
    script.innerHTML = `lang: en_US`
    
    document.body.appendChild(script)

    return () => {
      // Cleanup: remove script when component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className={className}>
      {/* LinkedIn Company Profile Plugin */}
      <script type="IN/CompanyProfile" data-id={companyId} data-format="inline" data-related="false"></script>
    </div>
  )
}
