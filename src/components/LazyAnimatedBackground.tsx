import { AnimatedBackground } from '@/components/AnimatedBackground'
import { useInView } from '@/hooks/useInView'
import { memo, useState, useEffect } from 'react'

export const LazyAnimatedBackground = memo(() => {
  const [hasLoaded, setHasLoaded] = useState(false)
  const { ref, inView } = useInView<HTMLDivElement>({
    rootMargin: '200px 0px',
    threshold: 0,
    triggerOnce: false, // Keep checking
  })

  // Once loaded, keep it loaded
  useEffect(() => {
    if (inView && !hasLoaded) {
      setHasLoaded(true)
    }
  }, [inView, hasLoaded])

  return (
    <div ref={ref} className="absolute inset-0 -z-10 overflow-hidden">
      {hasLoaded ? <AnimatedBackground /> : null}
    </div>
  )
})

LazyAnimatedBackground.displayName = 'LazyAnimatedBackground'
