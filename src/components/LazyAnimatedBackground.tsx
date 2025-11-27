import { AnimatedBackground } from '@/components/AnimatedBackground'
import { useInView } from '@/hooks/useInView'
import { memo } from 'react'

export const LazyAnimatedBackground = memo(() => {
  const { ref, inView } = useInView<HTMLDivElement>({
    rootMargin: '100px 0px', // Reduced from 200px for better performance
    threshold: 0.05, // Reduced threshold
  })

  return (
    <div ref={ref} className="absolute inset-0 -z-10 overflow-hidden">
      {inView ? <AnimatedBackground /> : null}
    </div>
  )
})

LazyAnimatedBackground.displayName = 'LazyAnimatedBackground'
