import { motion } from 'framer-motion'

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Animated gradient layers with pulsing effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-accent/20 via-emerald-500/20 to-teal-500/15"
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute inset-0 bg-gradient-to-tl from-accent/25 via-emerald-500/15 to-teal-500/15"
        animate={{
          opacity: [0.7, 0.4, 0.7],
          scale: [1.05, 1, 1.05],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2.67,
        }}
      />
      
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 via-accent/20 to-teal-500/15"
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 5.34,
        }}
      />

      {/* Moving blur orbs for dynamic effect */}
      <motion.div
        className="absolute w-[500px] h-[500px] bg-accent/30 rounded-full filter blur-3xl"
        animate={{
          x: ['-20%', '120%', '-20%'],
          y: ['-20%', '80%', '-20%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ top: '10%', left: '0%' }}
      />
      
      <motion.div
        className="absolute w-[600px] h-[600px] bg-emerald-500/25 rounded-full filter blur-3xl"
        animate={{
          x: ['120%', '-20%', '120%'],
          y: ['80%', '-20%', '80%'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ bottom: '10%', right: '0%' }}
      />
      
      <motion.div
        className="absolute w-[400px] h-[400px] bg-emerald-500/20 rounded-full filter blur-3xl"
        animate={{
          x: ['50%', '-10%', '110%', '50%'],
          y: ['-10%', '50%', '110%', '-10%'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ top: '40%', left: '40%' }}
      />
    </div>
  )
}
