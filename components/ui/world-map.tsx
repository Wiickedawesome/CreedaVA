/**
 * World map plate for the marketing pages.
 * Server Component — pure SVG, no state or effects.
 *
 * Land geometry is generated from Natural Earth 110m (see
 * `scripts/build-world-map-paths.mjs`) so the plate matches real coastlines.
 * Belize is overlaid at 50m detail and repeated in a magnified inset, because
 * the country is only ~3 x 7 units on this projection and no outline is
 * legible at that size.
 *
 * Defaults follow the brand palette: land is navy (the data layer), Belize is
 * brand green (the human layer).
 */

import { LAND_PATHS } from "./world-map-land";

interface WorldMapProps {
  className?: string;
  highlightColor?: string;
  landColor?: string;
}

/**
 * Belize mainland, from the Natural Earth 10m country boundary, converted with
 * the plate's own equirectangular projection:
 *
 *   x = (lon + 180) * (1000 / 360)
 *   y = (90 - lat)  * (1000 / 360)
 *
 * Belize spans lon 89.24°W–88.09°W / lat 18.49°N–15.89°N, which lands on
 * x 252.1–255.3 / y 198.6–205.9.
 */
const BELIZE_PATH =
  "M252.24,204.46 L252.36,202.68 L252.33,200.27 L252.35,200.16 L252.41,200.08 L252.64,200 L252.7,200.02 L252.83,200.14 L252.92,200.14 L252.96,200.22 L253.11,200.31 L253.14,200.3 L253.18,200.2 L253.32,200.1 L253.4,199.93 L253.51,199.86 L253.54,199.81 L253.56,199.69 L253.64,199.55 L253.62,199.51 L253.78,199.41 L253.84,199.35 L253.87,199.21 L254.01,199.02 L254.09,198.74 L254.2,198.65 L254.28,198.68 L254.41,198.64 L254.47,198.68 L254.52,198.66 L254.71,198.66 L254.76,198.71 L254.7,198.78 L254.49,198.93 L254.47,198.97 L254.5,199.01 L254.54,199.02 L254.67,198.96 L254.55,199.14 L254.56,199.16 L254.79,199 L254.9,199.01 L255.01,199.05 L255.07,199.05 L255.16,198.99 L255.29,198.96 L255.3,198.97 L255.28,199.03 L255.16,199.1 L255.15,199.14 L255.19,199.14 L255.24,199.09 L255.29,199.07 L255.32,199.42 L255.29,199.71 L255.14,200.08 L255.09,200.11 L254.98,200.33 L254.99,200.4 L254.96,200.63 L254.89,200.86 L254.77,201.04 L254.76,201.1 L254.77,201.17 L254.9,201.25 L254.95,201.31 L255.06,201.33 L255.09,201.36 L255.06,201.41 L254.91,201.4 L254.88,201.42 L254.76,201.83 L254.72,202.28 L254.78,202.52 L254.86,202.56 L254.92,202.65 L254.96,202.87 L254.95,202.9 L254.88,202.92 L254.81,202.99 L254.77,203.08 L254.86,203.3 L254.81,203.3 L254.77,203.32 L254.72,203.41 L254.73,203.55 L254.7,203.74 L254.64,203.83 L254.59,203.98 L254.58,204.03 L254.6,204.1 L254.57,204.15 L254.55,204.15 L254.54,204.11 L254.63,203.79 L254.69,203.72 L254.62,203.75 L254.54,203.93 L254.48,204 L254.54,204.02 L254.51,204.04 L254.46,204.02 L254.48,204.06 L254.52,204.06 L254.47,204.12 L254.48,204.19 L254.43,204.23 L254.37,204.34 L254.32,204.36 L254.31,204.46 L254.25,204.48 L254.2,204.58 L254.09,204.7 L254.06,204.8 L253.97,204.82 L253.95,204.88 L253.95,204.76 L253.93,204.76 L253.91,204.82 L253.87,204.83 L253.83,204.81 L253.81,204.76 L253.76,204.76 L253.74,204.84 L253.63,204.86 L253.5,204.92 L253.48,205.13 L253.42,205.19 L253.36,205.21 L253.31,205.3 L253.2,205.37 L253.18,205.48 L253.06,205.53 L252.98,205.6 L252.97,205.67 L253.03,205.79 L253.02,205.85 L252.91,205.89 L252.67,205.83 L252.28,205.83 L252.14,205.89 L252.12,205.85 L252.24,204.46 Z";

/**
 * The cayes and atolls that Natural Earth 10m actually carries for Belize:
 * Ambergris Caye, Caye Caulker, Turneffe Atoll, Lighthouse Reef and a few
 * smaller cayes. Same source and projection as the mainland.
 *
 * Glover's Reef is deliberately absent: it is not in the Belize country
 * polygon, `ne_10m_minor_islands` or `ne_10m_land`, so there is no outline to
 * draw. Adding it needs a real source (OpenStreetMap reef polygons), not a
 * hand-drawn ring.
 *
 * These are sub-pixel on the plate — Turneffe is ~6 x 10 px in the inset, so it
 * reads as a mark rather than an atoll ring. Magnifying further would push the
 * mainland out of the panel.
 */
const BELIZE_ISLAND_PATHS = [
  "M256.03,201.26 L256.11,201.27 L256.14,201.3 L256.16,201.36 L256.15,201.4 L256.09,201.51 L256.02,201.6 L255.98,201.63 L255.93,201.58 L255.9,201.63 L255.83,201.69 L255.81,201.76 L255.8,201.88 L255.76,201.96 L255.76,202 L255.72,201.97 L255.73,201.95 L255.75,201.87 L255.77,201.77 L255.78,201.64 L255.81,201.59 L255.89,201.53 L255.95,201.47 L255.98,201.47 L256.02,201.49 L256.05,201.49 L256.08,201.47 L256.1,201.41 L256.11,201.35 L256.08,201.32 L256.03,201.36 L256,201.36 L256.03,201.26 Z",
  "M255.8,199.93 L255.81,199.93 L255.79,200.05 L255.74,200.16 L255.65,200.24 L255.53,200.27 L255.53,200.25 L255.57,200.25 L255.67,200.18 L255.71,200.13 L255.72,200.06 L255.68,200.06 L255.69,199.98 L255.74,199.8 L255.77,199.77 L255.78,199.72 L255.82,199.57 L255.85,199.55 L255.89,199.57 L255.95,199.53 L255.98,199.57 L255.98,199.63 L255.94,199.66 L255.92,199.69 L255.86,199.84 L255.83,199.89 L255.8,199.87 L255.78,199.92 L255.74,199.95 L255.74,199.97 L255.76,200.01 L255.79,199.97 L255.8,199.93 Z",
  "M255.29,201.34 L255.34,201.38 L255.37,201.42 L255.34,201.5 L255.32,201.49 L255.31,201.4 L255.29,201.4 L255.26,201.39 L255.23,201.35 L255.23,201.34 L255.25,201.32 L255.29,201.34 Z",
  "M256,201.7 L256.04,201.67 L256.07,201.72 L256.12,201.85 L256.11,201.87 L256.1,201.9 L256.1,201.97 L256.08,201.97 L256.08,201.93 L256.06,201.94 L256.04,201.97 L256.04,201.8 L256.04,201.73 L256,201.7 Z",
  "M255.89,199.42 L255.9,199.43 L255.9,199.45 L255.89,199.48 L255.87,199.51 L255.85,199.5 L255.86,199.45 L255.87,199.43 L255.88,199.44 L255.88,199.42 L255.89,199.42 Z",
  "M255.72,199.67 L255.73,199.68 L255.73,199.71 L255.72,199.74 L255.69,199.76 L255.68,199.75 L255.68,199.73 L255.68,199.72 L255.71,199.7 L255.72,199.67 Z",
  "M255.11,200.88 L255.17,200.86 L255.33,200.75 L255.36,200.74 L255.33,200.83 L255.27,200.88 L255.18,200.91 L255.09,200.92 L255.09,200.9 L255.11,200.88 Z",
  "M255.64,199.75 L255.66,199.74 L255.67,199.75 L255.66,199.78 L255.64,199.8 L255.61,199.8 L255.6,199.78 L255.62,199.76 L255.64,199.75 Z",
  "M255.34,201 L255.38,201.03 L255.41,201.09 L255.43,201.24 L255.41,201.24 L255.4,201.21 L255.38,201.15 L255.34,201 Z",
];

const BELIZE_CX = 253.72;
const BELIZE_CY = 202.26;

/** Magnified detail box, sitting in open ocean south-west of South America. */
const INSET = { x: 26, y: 258, width: 92, height: 132, scale: 13, labelHeight: 18 };
const INSET_CX = INSET.x + INSET.width / 2;
const INSET_CY = INSET.y + (INSET.height - INSET.labelHeight) / 2;

/** Centre of the country *including* the cayes, so the islands stay in frame. */
const INSET_FOCUS_X = 254.14;
const INSET_FOCUS_Y = 202.27;

const INSET_TRANSFORM =
  `translate(${INSET_CX - INSET_FOCUS_X * INSET.scale} ${INSET_CY - INSET_FOCUS_Y * INSET.scale}) ` +
  `scale(${INSET.scale})`;

export function WorldMap({
  className = "",
  highlightColor = "#005148",
  landColor = "#002D72",
}: WorldMapProps) {
  return (
    <svg
      viewBox="0 10 1000 400"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="World map showing the location of Belize in Central America, with a magnified outline of the country"
    >
      <defs>
        <style>
          {`
            @keyframes pulse-ring {
              0% { r: 4; opacity: 0.5; }
              100% { r: 13; opacity: 0; }
            }
            .belize-pulse {
              animation: pulse-ring 2.4s ease-out infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .belize-pulse { animation: none; opacity: 0.4; }
            }
          `}
        </style>
      </defs>

      {/* Land masses – group opacity keeps overlapping coastlines from darkening */}
      <g
        fill={landColor}
        stroke={landColor}
        strokeWidth={0.4}
        strokeLinejoin="round"
        opacity={0.28}
      >
        {LAND_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* Belize in place – a locator mark, not a readable outline */}
      <path
        d={BELIZE_PATH}
        fill={highlightColor}
        fillOpacity={0.9}
        stroke={highlightColor}
        strokeWidth={0.5}
      />
      {BELIZE_ISLAND_PATHS.map((d, i) => (
        <path
          key={i}
          d={d}
          fill={highlightColor}
          fillOpacity={0.9}
          stroke={highlightColor}
          strokeWidth={0.3}
        />
      ))}
      <circle
        cx={BELIZE_CX}
        cy={BELIZE_CY}
        r={4}
        fill="none"
        stroke={highlightColor}
        strokeWidth={1}
        className="belize-pulse"
      />

      {/* Leader from the detail box to the real location */}
      <line
        x1={INSET.x + INSET.width}
        y1={INSET.y}
        x2={BELIZE_CX - 1.5}
        y2={BELIZE_CY + 2}
        stroke={highlightColor}
        strokeWidth={0.6}
        strokeDasharray="3 3"
        opacity={0.4}
      />

      {/* Magnified detail box */}
      <g>
        <rect
          x={INSET.x}
          y={INSET.y}
          width={INSET.width}
          height={INSET.height}
          rx={5}
          fill="#F7F7F2"
          stroke={highlightColor}
          strokeWidth={0.7}
          strokeOpacity={0.35}
        />
        <path
          d={BELIZE_PATH}
          transform={INSET_TRANSFORM}
          fill={highlightColor}
          fillOpacity={0.92}
          stroke={highlightColor}
          strokeWidth={0.5 / INSET.scale}
          strokeLinejoin="round"
        />
        {BELIZE_ISLAND_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            transform={INSET_TRANSFORM}
            fill={highlightColor}
            fillOpacity={0.92}
            stroke={highlightColor}
            strokeWidth={0.5 / INSET.scale}
            strokeLinejoin="round"
          />
        ))}
        <text
          x={INSET_CX}
          y={INSET.y + INSET.height - 9}
          textAnchor="middle"
          fill={highlightColor}
          fontSize={9}
          fontWeight={700}
          fontFamily="system-ui, sans-serif"
          letterSpacing={1.4}
        >
          BELIZE
        </text>
      </g>
    </svg>
  );
}
