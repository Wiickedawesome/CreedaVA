import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react'

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  placeholder?: string
  threshold?: number
  rootMargin?: string
}

export const LazyImage = ({ 
  src, 
  alt, 
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
  threshold = 0.01,
  rootMargin = '50px',
  className,
  ...props 
}: LazyImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder)
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!imageRef) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src)
            observer.disconnect()
          }
        })
      },
      { threshold, rootMargin }
    )

    observer.observe(imageRef)

    return () => {
      observer.disconnect()
    }
  }, [imageRef, src, threshold, rootMargin])

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={`${className || ''} ${isLoaded ? 'loaded' : 'loading'}`}
      onLoad={() => setIsLoaded(true)}
      loading="lazy"
      decoding="async"
      {...props}
    />
  )
}

// Hook for responsive image loading based on device pixel ratio and viewport
export const useResponsiveImage = (
  imagePath: string,
  sizes: { mobile?: string; tablet?: string; desktop?: string } = {}
) => {
  const [currentSrc, setCurrentSrc] = useState(imagePath)

  useEffect(() => {
    const updateImage = () => {
      const width = window.innerWidth
      const dpr = window.devicePixelRatio || 1

      let selectedSize = imagePath

      if (width < 768 && sizes.mobile) {
        selectedSize = sizes.mobile
      } else if (width < 1024 && sizes.tablet) {
        selectedSize = sizes.tablet
      } else if (sizes.desktop) {
        selectedSize = sizes.desktop
      }

      // Append DPR suffix if needed (@2x, @3x)
      if (dpr >= 3) {
        selectedSize = selectedSize.replace(/(\.\w+)$/, '@3x$1')
      } else if (dpr >= 2) {
        selectedSize = selectedSize.replace(/(\.\w+)$/, '@2x$1')
      }

      setCurrentSrc(selectedSize)
    }

    updateImage()
    window.addEventListener('resize', updateImage)

    return () => window.removeEventListener('resize', updateImage)
  }, [imagePath, sizes])

  return currentSrc
}
