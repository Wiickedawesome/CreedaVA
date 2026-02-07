import { useEffect, useState } from 'react'

/**
 * Hook to detect if user prefers reduced motion
 * Helps optimize animations for accessibility and performance
 */
export const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * Hook to detect if device is low-end or has limited resources
 * Uses navigator.deviceMemory and navigator.hardwareConcurrency
 */
export const useIsLowEndDevice = () => {
  const [isLowEnd, setIsLowEnd] = useState(false)

  useEffect(() => {
    const nav = navigator as any
    const deviceMemory = nav.deviceMemory // GB of RAM
    const hardwareConcurrency = nav.hardwareConcurrency || 2 // CPU cores
    
    // Consider device low-end if it has <= 4GB RAM or <= 4 CPU cores
    const lowEndDevice = (deviceMemory && deviceMemory <= 4) || hardwareConcurrency <= 4
    setIsLowEnd(lowEndDevice)
  }, [])

  return isLowEnd
}

/**
 * Get optimized motion config based on device capabilities
 */
export const useOptimizedMotion = () => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const isLowEnd = useIsLowEndDevice()

  return {
    // Disable animations if reduced motion preferred
    shouldAnimate: !prefersReducedMotion,
    // Use simpler animations on low-end devices
    useSimpleAnimations: isLowEnd || prefersReducedMotion,
    // Reduce animation duration on low-end devices
    durationMultiplier: isLowEnd ? 0.7 : 1,
  }
}

/**
 * Optimized animation variants for mobile
 */
export const mobileOptimizedVariants = {
  // Simple fade (GPU-optimized)
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },
  
  // Simple slide up (GPU-optimized with transform)
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1] // Custom easing
      }
    }
  },
  
  // Scale (GPU-optimized)
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  },
  
  // Stagger children (for lists)
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }
}

/**
 * Get motion config with performance optimizations
 */
export const getMotionConfig = (prefersReduced = false) => ({
  // Use will-change for better performance
  style: { willChange: 'transform, opacity' },
  
  // Reduce motion if preferred
  animate: prefersReduced ? false : undefined,
  
  // Use GPU-accelerated properties
  transition: {
    type: 'tween', // Faster than spring on mobile
    ease: 'easeOut',
    duration: prefersReduced ? 0 : 0.3
  }
})

/**
 * Mobile-optimized transition presets
 */
export const mobileTransitions = {
  quick: { duration: 0.2, ease: 'easeOut' },
  normal: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  slow: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  spring: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8
  }
}
