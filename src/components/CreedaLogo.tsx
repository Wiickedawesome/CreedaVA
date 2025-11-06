import { memo } from "react"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

// Import your actual logo images
import logoMain from "@/assets/images/creedava-logo.png"
import logoAgent1 from "@/assets/images/creedava-agent-1.png" 
import logoAgent2 from "@/assets/images/creedava-agent-2.png"
import logoAgent3 from "@/assets/images/creedava-agent-3.png"

type CreedaLogoProps = {
  className?: string
  animate?: boolean
  size?: number
  variant?: 'main' | 'agent' | 'service' | 'compact'
}

const logoVariants = {
  main: logoMain,
  agent: logoAgent1,
  service: logoAgent2,
  compact: logoAgent3
}

export const CreedaLogo = memo(({ 
  className, 
  animate = true, 
  size = 128, 
  variant = 'main' 
}: CreedaLogoProps) => {
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = animate && !prefersReducedMotion

  // Use the variant logo or fallback to main logo
  const logoSrc = logoVariants[variant] || logoMain

  return (
    <motion.img
      src={logoSrc}
      alt="CreedaVA Logo"
      className={cn("block object-contain", className)}
      width={size}
      height={size}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={shouldAnimate ? { 
        opacity: 1, 
        scale: 1,
        y: [0, -2, 0],
        transition: {
          opacity: { duration: 0.3 },
          scale: { duration: 0.3 },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
      } : { opacity: 1, scale: 1 }}
    />
  )
})

CreedaLogo.displayName = "CreedaLogo"

export default CreedaLogo