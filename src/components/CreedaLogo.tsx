import { memo } from "react"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

type CreedaLogoProps = {
  className?: string
  animate?: boolean
  size?: number
}

const palette = {
  body: "#05060E",
  wing: "#101C34",
  belly: "#F7F3DC",
  cheek: "#FFF6D6",
  beakGreen: "#64D370",
  beakBlue: "#47A7E0",
  beakOrange: "#FD8E33",
  beakRed: "#F43F5E",
  eyeRing: "#74C6FF",
  eye: "#0B1120",
  headsetBand: "#172554",
  headsetCushion: "#1D4ED8",
  headsetAccent: "#FDBA74",
  mic: "#22D3EE"
} as const

export const CreedaLogo = memo(({ className, animate = true, size = 128 }: CreedaLogoProps) => {
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = animate && !prefersReducedMotion

  return (
    <motion.svg
      role="img"
      aria-label="Creeda the toucan wearing a virtual assistant headset"
      viewBox="0 0 200 200"
      className={cn("block", className)}
      width={size}
      height={size}
      initial={{ rotate: 0 }}
      animate=
        {shouldAnimate
          ? {
              rotate: [0, 1.8, -1.8, 0],
              y: [0, -4, 0],
              transition: {
                rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 3.6, repeat: Infinity, ease: "easeInOut" }
              }
            }
          : undefined}
    >
      <defs>
        <linearGradient id="creeda-wing-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1C2945" />
          <stop offset="100%" stopColor="#05060E" />
        </linearGradient>
        <linearGradient id="creeda-beak-logo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={palette.beakGreen} />
          <stop offset="45%" stopColor={palette.beakBlue} />
          <stop offset="75%" stopColor={palette.beakOrange} />
          <stop offset="100%" stopColor={palette.beakRed} />
        </linearGradient>
        <linearGradient id="creeda-beak-lower" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#62C969" />
          <stop offset="55%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#FB6C46" />
        </linearGradient>
      </defs>
      <motion.g
        transform="translate(24 24)"
        initial={{ rotate: 0 }}
        animate=
          {shouldAnimate
            ? {
                rotate: [-1.8, 2.5, -1.8],
                transition: { duration: 5.2, repeat: Infinity, ease: "easeInOut" }
              }
            : undefined}
      >
        <path d="M102 62c34-38 116-44 128 4 8 34-50 42-112 32-40-6-48-34-16-36z" fill="url(#creeda-beak-logo)" />
        <path d="M104 96c38-18 106-10 102 34-2 32-58 36-104 18-34-12-32-38 2-52z" fill="url(#creeda-beak-lower)" />
        <path d="M40 74c28-46 102-52 140-12 30 32 34 90 2 126-34 38-110 46-150 12-40-32-34-96 8-126z" fill={palette.body} />
        <path d="M32 136c-10-34 16-84 62-106 48-24 110-4 120 42 8 38-20 88-62 110-44 22-110 6-120-46z" fill={palette.wing} opacity={0.9} />
        <path d="M40 130c4-48 52-72 92-50 36 20 38 70 4 94-28 20-84 18-100-8-6-8-4-22 4-36z" fill={palette.belly} />
        <path d="M58 120c4-30 36-46 68-32 24 12 26 40 4 56-22 16-58 14-70-2-6-6-6-16-2-22z" fill={palette.cheek} opacity={0.9} />
        <path d="M90 132c20 12 50 30 44 46-6 14-34 16-48 12-18-4-52-22-62-32 30 6 54-16 66-26z" fill="url(#creeda-wing-logo)" />
        <motion.circle
          cx="156"
          cy="88"
          r="18"
          fill={palette.eyeRing}
          animate=
            {shouldAnimate
              ? {
                  scale: [1, 0.94, 1],
                  transition: { duration: 4.6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }
                }
              : undefined}
        />
        <motion.circle
          cx="158"
          cy="86"
          r="7"
          fill={palette.cheek}
          animate=
            {shouldAnimate
              ? {
                  scale: [1, 0.95, 1],
                  transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1 }
                }
              : undefined}
        />
        <motion.circle
          cx="160"
          cy="84"
          r="6"
          fill={palette.eye}
          animate=
            {shouldAnimate
              ? {
                  y: [0, -0.8, 0],
                  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }
              : undefined}
        />
        <path d="M46 48c32-28 108-20 130 30" stroke={palette.headsetBand} strokeWidth="14" strokeLinecap="round" fill="none" />
        <path d="M70 60c16-10 32-10 38 2" stroke={palette.headsetBand} strokeWidth="16" strokeLinecap="round" />
        <rect x="42" y="68" width="34" height="46" rx="18" fill={palette.headsetCushion} stroke={palette.headsetAccent} strokeWidth="4" />
        <motion.circle
          cx="60"
          cy="118"
          r="12"
          fill={palette.mic}
          animate=
            {shouldAnimate
              ? {
                  opacity: [0.35, 1, 0.35],
                  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }
              : undefined}
        />
        <motion.path
          d="M44 96c-12 32 8 50 28 56"
          stroke={palette.headsetBand}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          animate=
            {shouldAnimate
              ? {
                  pathLength: [0.7, 1, 0.7],
                  transition: { duration: 3.4, repeat: Infinity, ease: "easeInOut" }
                }
              : undefined}
        />
      </motion.g>
    </motion.svg>
  )
})

CreedaLogo.displayName = "CreedaLogo"

export default CreedaLogo