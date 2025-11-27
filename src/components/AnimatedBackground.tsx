import { motion } from 'framer-motion'
import { memo } from 'react'

export const AnimatedBackground = memo(() => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Simplified animated gradient layers with reduced performance impact */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-accent/15 via-emerald-500/15 to-teal-500/10"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute inset-0 bg-gradient-to-tl from-accent/20 via-emerald-500/10 to-teal-500/10"
        animate={{
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
      />

      {/* Reduced number of moving blur orbs with optimized animations */}
      <motion.div
        className="absolute w-[400px] h-[400px] bg-accent/20 rounded-full filter blur-3xl will-change-transform"
        animate={{
          x: ['-10%', '110%', '-10%'],
          y: ['-10%', '60%', '-10%'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ 
          top: '10%', 
          left: '0%',
          transform: 'translateZ(0)', // Force hardware acceleration
        }}
      />
      
      <motion.div
        className="absolute w-[350px] h-[350px] bg-emerald-500/15 rounded-full filter blur-3xl will-change-transform"
        animate={{
          x: ['110%', '-10%', '110%'],
          y: ['60%', '-10%', '60%'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ 
          bottom: '10%', 
          right: '0%',
          transform: 'translateZ(0)', // Force hardware acceleration
        }}
      />
    </div>
  )
})

AnimatedBackground.displayName = 'AnimatedBackground'
