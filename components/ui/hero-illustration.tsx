/**
 * HeroIllustration — CreedaVA "C" brand mark
 *
 * A large geometric C letterform built entirely from SVG paths.
 * Uses the brand teal gradient (#007A6D → #003D36) on a soft background.
 * No external assets, no runtime dependencies.
 *
 * Geometry:
 *   ViewBox   380 × 380, centre (190, 190)
 *   Outer arc  r = 135
 *   Inner arc  r = 92  (thickness = 43 px)
 *   Opening    ±38° from the right axis (C spans 284°)
 */
export function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 380 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="CreedaVA brand mark"
    >
      {/*
        Geometry reference:
          centre         = (190, 190)
          outer radius   = 135  → endpoints at cos(±38°)·135 = ±106.4, sin(±38°)·135 = ±83.1
            upper outer  = (296.4, 106.9)   lower outer = (296.4, 273.1)
          inner radius   =  92  → endpoints at cos(±38°)·92  =  ±72.5, sin(±38°)·92  = ±56.6
            upper inner  = (262.5, 133.4)   lower inner = (262.5, 246.6)
          C path: outer arc CCW (large, sweep=0) → line → inner arc CW (large, sweep=1) → close
      */}
      <defs>
        {/* C fill: lighter teal at top, dark teal at bottom */}
        <linearGradient id="lm-c-fill" x1="190" y1="55" x2="190" y2="325" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#26B5A4" />
          <stop offset="50%"  stopColor="#007A6D" />
          <stop offset="100%" stopColor="#003D36" />
        </linearGradient>

        {/* Soft teal background */}
        <radialGradient id="lm-bg" cx="45%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#E8F7F5" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#C2E5E1" stopOpacity="0.45" />
        </radialGradient>

        {/* Glow behind the C */}
        <filter id="lm-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Background ─────────────────────────────────────── */}
      <circle cx="190" cy="190" r="172" fill="url(#lm-bg)" />

      {/* Subtle dashed orbit ring */}
      <circle
        cx="190" cy="190" r="163"
        stroke="#005148" strokeWidth="0.6" strokeOpacity="0.1"
        fill="none" strokeDasharray="4 9"
      />

      {/* ── Glow layer (blurred copy) ───────────────────────── */}
      <path
        d="M296.4,106.9 A135,135 0 1 0 296.4,273.1 L262.5,246.6 A92,92 0 1 1 262.5,133.4 Z"
        fill="#007A6D" fillOpacity="0.28" filter="url(#lm-glow)"
      />

      {/* ── Primary C shape ─────────────────────────────────── */}
      <path
        d="M296.4,106.9 A135,135 0 1 0 296.4,273.1 L262.5,246.6 A92,92 0 1 1 262.5,133.4 Z"
        fill="url(#lm-c-fill)"
      />

      {/* ── Outer-edge shimmer ──────────────────────────────── */}
      <path
        d="M296.4,106.9 A135,135 0 1 0 296.4,273.1"
        stroke="white" strokeWidth="1.5" strokeOpacity="0.18" fill="none"
      />

      {/* ── Terminal accent dots (ends of the C opening) ────── */}
      <circle cx="296.4" cy="106.9" r="5.5" fill="#26B5A4" fillOpacity="0.65" />
      <circle cx="296.4" cy="273.1" r="5.5" fill="#26B5A4" fillOpacity="0.65" />
    </svg>
  );
}
