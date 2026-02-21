/**
 * HeroIllustration — "Global Connection"
 *
 * Orthographic globe (Atlantic-centred, lon₀ = −60°, lat₀ = 0°).
 * Node positions computed from real geo-coordinates:
 *   Belize     (−87.5°, 17.2°)  → svg (122, 144)  ← origin / teal glow
 *   New York   (−74.0°, 40.7°)  → svg (162,  89)
 *   London     (− 0.1°, 51.5°)  → svg (274,  69)
 *   Buenos Ar. (−58.4°,−34.6°)  → svg (194, 278)
 *   Madrid     (− 3.7°, 40.4°)  → svg (288,  90)
 *
 * All values are pure SVG — no external assets, no runtime dependencies.
 */
export function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 380 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Global network map showing CreedaVA's reach from Belize to clients worldwide"
    >
      <defs>
        {/* Clip to globe circle */}
        <clipPath id="hero-globe-clip">
          <circle cx="190" cy="190" r="155" />
        </clipPath>

        {/* Soft radial fill — teal-tinted white */}
        <radialGradient id="hero-globe-bg" cx="36%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#EDFAF8" />
          <stop offset="100%" stopColor="#C5E8E3" />
        </radialGradient>

        {/* Belize pulsing halo gradient */}
        <radialGradient id="hero-belize-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#005148" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#005148" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Globe body ─────────────────────────────────────── */}
      <circle cx="190" cy="190" r="155" fill="url(#hero-globe-bg)" />

      {/* ── Grid lines (clipped inside globe) ──────────────── */}
      <g
        clipPath="url(#hero-globe-clip)"
        stroke="#007A6D"
        strokeOpacity="0.18"
        strokeWidth="1"
        fill="none"
      >
        {/* Latitude parallels (ellipses; ry ≈ r·0.075 for 3-D feel) */}
        <ellipse cx="190" cy="190" rx="155" ry="12" />  {/* Equator   */}
        <ellipse cx="190" cy="113" rx="134" ry="10" />  {/* 30 °N     */}
        <ellipse cx="190" cy="267" rx="134" ry="10" />  {/* 30 °S     */}
        <ellipse cx="190" cy="56"  rx="78"  ry="6"  />  {/* 60 °N     */}
        <ellipse cx="190" cy="324" rx="78"  ry="6"  />  {/* 60 °S     */}

        {/* Longitude meridians — half-ellipse arcs through (190,35)→(190,345)
            sweep-flag 1 = right half, 0 = left half                         */}
        <line x1="190" y1="35" x2="190" y2="345" />                  {/* lon −60° (centre)   */}
        <path d="M190,35 A78,155 0 0 1 190,345" />                    {/* lon −30° right      */}
        <path d="M190,35 A134,155 0 0 1 190,345" />                   {/* lon   0° right      */}
        <path d="M190,35 A78,155 0 0 0 190,345" />                    {/* lon −90° left       */}
        <path d="M190,35 A134,155 0 0 0 190,345" />                   {/* lon−120° left       */}
      </g>

      {/* ── Globe border ───────────────────────────────────── */}
      <circle
        cx="190" cy="190" r="155"
        stroke="#007A6D" strokeWidth="1.5" strokeOpacity="0.3"
        fill="none"
      />

      {/* ── Connection arcs (great-circle approximations) ──── */}
      <g stroke="#005148" strokeWidth="1.5" strokeOpacity="0.5" fill="none" strokeDasharray="5 3">
        {/* Belize → New York      */}
        <path d="M122,144 Q132,102 162,89" />
        {/* Belize → London        */}
        <path d="M122,144 Q200,88 274,69" />
        {/* Belize → Buenos Aires  */}
        <path d="M122,144 Q152,214 194,278" />
        {/* Belize → Madrid        */}
        <path d="M122,144 Q208,100 288,90" />
      </g>

      {/* ── Secondary city nodes ───────────────────────────── */}
      {/* New York */}
      <circle cx="162" cy="89" r="5.5" fill="#002D72" fillOpacity="0.72" />
      <circle cx="162" cy="89" r="2.8" fill="#F9FBFF" />
      {/* London */}
      <circle cx="274" cy="69"  r="5.5" fill="#002D72" fillOpacity="0.72" />
      <circle cx="274" cy="69"  r="2.8" fill="#F9FBFF" />
      {/* Buenos Aires */}
      <circle cx="194" cy="278" r="5.5" fill="#002D72" fillOpacity="0.72" />
      <circle cx="194" cy="278" r="2.8" fill="#F9FBFF" />
      {/* Madrid */}
      <circle cx="288" cy="90"  r="5.5" fill="#002D72" fillOpacity="0.72" />
      <circle cx="288" cy="90"  r="2.8" fill="#F9FBFF" />

      {/* ── Belize — origin node with animated pulse halo ──── */}
      {/* Outer animated ring */}
      <circle cx="122" cy="144" r="14" fill="url(#hero-belize-halo)">
        <animate
          attributeName="r"
          values="14;26;14"
          dur="3s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="fillOpacity"
          attributeType="XML"
          values="1;0;1"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
      {/* Static inner glow */}
      <circle cx="122" cy="144" r="12" fill="#005148" fillOpacity="0.15" />
      {/* Dot */}
      <circle cx="122" cy="144" r="8"   fill="#005148" />
      <circle cx="122" cy="144" r="5"   fill="#007A6D" />
      <circle cx="122" cy="144" r="2.5" fill="white"   />

      {/* ── Outer decorative orbit rings ───────────────────── */}
      <circle
        cx="190" cy="190" r="170"
        stroke="#007A6D" strokeWidth="0.75" strokeOpacity="0.12"
        fill="none" strokeDasharray="3 6"
      />
      <circle
        cx="190" cy="190" r="182"
        stroke="#007A6D" strokeWidth="0.5" strokeOpacity="0.07"
        fill="none" strokeDasharray="1 8"
      />
    </svg>
  );
}
