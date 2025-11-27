import { memo, Suspense, lazy } from 'react'

// Lazy load icon components for better performance
const iconComponents = {
  // Lucide React icons
  Heart: lazy(() => import('lucide-react').then(m => ({ default: m.Heart }))),
  MessageCircle: lazy(() => import('lucide-react').then(m => ({ default: m.MessageCircle }))),
  Repeat2: lazy(() => import('lucide-react').then(m => ({ default: m.Repeat2 }))),
  Calendar: lazy(() => import('lucide-react').then(m => ({ default: m.Calendar }))),
  Linkedin: lazy(() => import('lucide-react').then(m => ({ default: m.Linkedin }))),
  ExternalLink: lazy(() => import('lucide-react').then(m => ({ default: m.ExternalLink }))),
  // Add more as needed
}

interface OptimizedIconProps {
  name: keyof typeof iconComponents
  className?: string
  size?: number
  [key: string]: any
}

const IconFallback = ({ size = 16, className }: { size?: number; className?: string }) => (
  <div 
    className={`inline-block bg-gray-200 rounded ${className}`} 
    style={{ width: size, height: size }} 
  />
)

export const OptimizedIcon = memo(({ name, size = 16, className, ...props }: OptimizedIconProps) => {
  const IconComponent = iconComponents[name]
  
  if (!IconComponent) {
    return <IconFallback size={size} className={className} />
  }
  
  return (
    <Suspense fallback={<IconFallback size={size} className={className} />}>
      <IconComponent 
        size={size} 
        className={className}
        {...props}
      />
    </Suspense>
  )
})

OptimizedIcon.displayName = 'OptimizedIcon'