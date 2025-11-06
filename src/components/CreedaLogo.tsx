import { memo } from "react"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

// Import your 4 new logo images (update paths when images are added)
import logoMain from "@/assets/images/creedava-logo-main.png"
import logoAgent from "@/assets/images/creedava-agent-profile.png" 
import logoService from "@/assets/images/creedava-service-desk.png"
import logoCompact from "@/assets/images/creedava-logo-compact.png"

type CreedaLogoProps = {
  className?: string
  animate?: boolean
  size?: number
  variant?: 'main' | 'agent' | 'service' | 'compact'
}

const logoVariants = {
  main: logoMain,
  agent: logoAgent,
  service: logoService,
  compact: logoCompact
}

export const CreedaLogo = memo(({ 
  className, 
  animate = true, 
  size = 128, 
  variant = 'main' 
}: CreedaLogoProps) => {
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = animate && !prefersReducedMotion

  // Fallback to existing logo if new ones aren't available yet
  const logoSrc = logoVariants[variant] || "/src/assets/images/creeda-logo.png"

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