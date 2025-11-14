import { AnimatedBackground } from '@/components/AnimatedBackground'
import { useInView } from '@/hooks/useInView'

export function LazyAnimatedBackground() {
  const { ref, inView } = useInView<HTMLDivElement>({
    rootMargin: '200px 0px',
    threshold: 0.1,
  })

  return (
    <div ref={ref} className="absolute inset-0 -z-10 overflow-hidden">
      {inView ? <AnimatedBackground /> : null}
    </div>
  )
}
