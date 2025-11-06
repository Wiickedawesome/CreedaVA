import { motion } from 'framer-motion'

interface AnimatedGradientProps {
  variant?: 'hero' | 'section' | 'subtle'
}

export function AnimatedGradient({ variant = 'section' }: AnimatedGradientProps) {
  const variants = {
    hero: {
      gradient1: 'from-accent/25 via-emerald-500/25 to-teal-500/20',
      gradient2: 'from-emerald-500/25 via-teal-500/20 to-accent/25',
      gradient3: 'from-teal-500/20 via-accent/25 to-emerald-500/25',
    },
    section: {
      gradient1: 'from-accent/15 via-emerald-500/15 to-teal-500/10',
      gradient2: 'from-emerald-500/15 via-teal-500/10 to-accent/15',
      gradient3: 'from-teal-500/10 via-accent/15 to-emerald-500/15',
    },
    subtle: {
      gradient1: 'from-accent/8 via-emerald-500/8 to-teal-500/5',
      gradient2: 'from-emerald-500/8 via-teal-500/5 to-accent/8',
      gradient3: 'from-teal-500/5 via-accent/8 to-emerald-500/8',
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
        className="absolute w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"
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
        className="absolute w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl"
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
