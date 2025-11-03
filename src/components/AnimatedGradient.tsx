import { motion } from 'framer-motion'

interface AnimatedGradientProps {
  variant?: 'hero' | 'section' | 'subtle'
}

export function AnimatedGradient({ variant = 'section' }: AnimatedGradientProps) {
  const variants = {
    hero: {
      gradient1: 'from-primary/20 via-accent/30 to-orange-500/20',
      gradient2: 'from-accent/30 via-orange-500/20 to-primary/20',
      gradient3: 'from-orange-500/20 via-primary/20 to-accent/30',
    },
    section: {
      gradient1: 'from-primary/10 via-accent/15 to-orange-500/10',
      gradient2: 'from-accent/15 via-orange-500/10 to-primary/10',
      gradient3: 'from-orange-500/10 via-primary/10 to-accent/15',
    },
    subtle: {
      gradient1: 'from-primary/5 via-accent/8 to-orange-500/5',
      gradient2: 'from-accent/8 via-orange-500/5 to-primary/5',
      gradient3: 'from-orange-500/5 via-primary/5 to-accent/8',
    },
  }

  const currentVariant = variants[variant]

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {/* Animated gradient layers */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${currentVariant.gradient1}`}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className={`absolute inset-0 bg-gradient-to-tl ${currentVariant.gradient2}`}
        animate={{
          opacity: [0.6, 0.3, 0.6],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2.67,
        }}
      />
      
      <motion.div
        className={`absolute inset-0 bg-gradient-to-tr ${currentVariant.gradient3}`}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 5.34,
        }}
      />

      {/* Animated blur orbs */}
      <motion.div
        className="absolute w-96 h-96 bg-accent/20 rounded-full blur-3xl"
        animate={{
          x: ['-25%', '125%', '-25%'],
          y: ['-25%', '75%', '-25%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ top: '20%', left: '10%' }}
      />
      
      <motion.div
        className="absolute w-80 h-80 bg-primary/20 rounded-full blur-3xl"
        animate={{
          x: ['125%', '-25%', '125%'],
          y: ['75%', '-25%', '75%'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ bottom: '20%', right: '10%' }}
      />
      
      <motion.div
        className="absolute w-72 h-72 bg-orange-500/15 rounded-full blur-3xl"
        animate={{
          x: ['-10%', '110%', '-10%'],
          y: ['50%', '-10%', '50%'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ top: '50%', left: '50%' }}
      />
    </div>
  )
}
