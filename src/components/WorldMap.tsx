import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Globe } from 'lucide-react';

interface WorldMapProps {
  countryData: Array<{ countryCode: string; country: string; count: number }>;
}

// Simplified Mercator projection for converting lat/lng to SVG coordinates
function project(lat: number, lng: number): [number, number] {
  const x = (lng + 180) * (800 / 360);
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = 400 / 2 - (800 * mercN) / (2 * Math.PI);
  return [x, Math.max(10, Math.min(390, y))];
}

// Country centroids (lat, lng)
const COUNTRY_COORDS: Record<string, [number, number]> = {
  US: [39.83, -98.58], GB: [55.38, -3.44], CA: [56.13, -106.35],
  AU: [-25.27, 133.78], DE: [51.17, 10.45], FR: [46.23, 2.21],
  ES: [40.46, -3.75], IT: [41.87, 12.57], BR: [-14.24, -51.93],
  MX: [23.63, -102.55], IN: [20.59, 78.96], CN: [35.86, 104.20],
  JP: [36.20, 138.25], KR: [35.91, 127.77], NL: [52.13, 5.29],
  SE: [60.13, 18.64], NO: [60.47, 8.47], DK: [56.26, 9.50],
  FI: [61.92, 25.75], PL: [51.92, 19.15], BE: [50.50, 4.47],
  CH: [46.82, 8.23], AT: [47.52, 14.55], IE: [53.14, -7.69],
  PT: [39.40, -8.22], GR: [39.07, 21.82], CZ: [49.82, 15.47],
  RO: [45.94, 24.97], HU: [47.16, 19.50], RU: [61.52, 105.32],
  TR: [38.96, 35.24], ZA: [-30.56, 22.94], NG: [9.08, 8.68],
  EG: [26.82, 30.80], KE: [-0.02, 37.91], SG: [1.35, 103.82],
  MY: [4.21, 101.98], TH: [15.87, 100.99], ID: [-0.79, 113.92],
  PH: [12.88, 121.77], VN: [14.06, 108.28], NZ: [-40.90, 174.89],
  AR: [-38.42, -63.62], CL: [-35.68, -71.54], CO: [4.57, -74.30],
  PE: [-9.19, -75.02], VE: [6.42, -66.59], IL: [31.05, 34.85],
  AE: [23.42, 53.85], SA: [23.89, 45.08], PK: [30.38, 69.35],
  BD: [23.69, 90.36], UA: [48.38, 31.17], BZ: [17.19, -88.50],
};

// Simplified continent outlines as SVG paths (lightweight alternative to full GeoJSON)
const CONTINENT_PATHS = [
  // North America (simplified)
  'M 60,80 L 80,70 100,60 130,55 155,60 170,75 185,90 195,105 200,120 198,135 190,150 175,155 160,160 145,168 130,175 115,185 100,175 90,165 85,150 75,140 65,130 55,115 50,100 55,90 Z',
  // South America (simplified)
  'M 135,195 L 150,190 165,195 175,210 180,230 178,250 172,270 165,285 155,295 140,300 130,290 125,275 122,260 120,240 118,225 120,210 128,200 Z',
  // Europe (simplified)
  'M 350,65 L 365,58 380,55 395,60 410,65 415,75 410,85 405,95 395,100 385,105 375,100 365,95 355,90 350,80 Z',
  // Africa (simplified)
  'M 350,120 L 365,115 380,118 395,125 405,140 410,160 412,180 408,200 400,220 390,240 378,255 365,260 350,255 340,240 335,220 330,200 332,180 335,160 340,140 Z',
  // Asia (simplified)
  'M 415,55 L 440,48 470,45 500,42 530,45 560,50 585,55 610,60 630,70 645,85 650,100 645,115 635,130 620,140 600,145 580,148 560,145 540,140 520,138 500,140 485,145 470,140 455,130 445,120 435,110 425,95 420,80 415,65 Z',
  // Oceania (simplified)
  'M 580,200 L 610,195 640,200 660,210 670,225 665,240 650,250 630,255 610,250 595,240 585,225 580,210 Z',
  // Indonesia/SE Asia islands (simplified)
  'M 545,165 L 560,162 575,165 590,170 600,175 605,182 595,185 580,183 565,180 550,175 Z',
];

function dotColor(count: number, maxCount: number): string {
  const ratio = count / maxCount;
  if (ratio >= 0.6) return '#ef4444';   // red - high
  if (ratio >= 0.3) return '#f59e0b';   // amber - medium
  return '#3b82f6';                      // blue - low
}

function dotRadius(count: number, maxCount: number): number {
  const ratio = count / maxCount;
  return 3 + ratio * 7; // 3–10px
}

export function WorldMap({ countryData }: WorldMapProps) {
  const maxCount = useMemo(() => Math.max(...countryData.map(c => c.count), 1), [countryData]);

  const dots = useMemo(() => {
    return countryData
      .map(cd => {
        const coords = COUNTRY_COORDS[cd.countryCode];
        if (!coords) return null;
        const [x, y] = project(coords[0], coords[1]);
        return { ...cd, x, y };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
  }, [countryData]);

  // Belize marker
  const [bzX, bzY] = project(17.19, -88.50);

  if (countryData.length === 0) {
    return (
      <Card className="p-6 bg-gray-800 border-gray-700">
        <div className="h-[350px] flex flex-col items-center justify-center text-gray-500">
          <Globe className="w-16 h-16 mb-4 opacity-40" />
          <p className="text-sm">Geographic data will appear as visitors access your site</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-800 border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Globe className="h-5 w-5 text-purple-400" />
          Visitor Map
        </h3>
        <p className="text-gray-400 text-sm">{dots.length} countries &bull; {countryData.reduce((s, c) => s + c.count, 0).toLocaleString()} total visits</p>
      </div>

      <div className="w-full overflow-hidden rounded-lg bg-gray-900/50 p-2">
        <svg
          viewBox="0 0 800 400"
          className="w-full h-auto"
          style={{ maxHeight: '420px' }}
        >
          {/* Background */}
          <rect width="800" height="400" fill="transparent" />

          {/* Grid lines for context */}
          {[100, 200, 300].map(y => (
            <line key={`h${y}`} x1="0" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.04)" />
          ))}
          {[200, 400, 600].map(x => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="400" stroke="rgba(255,255,255,0.04)" />
          ))}

          {/* Continent outlines */}
          {CONTINENT_PATHS.map((d, i) => (
            <path key={i} d={d} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
          ))}

          {/* Connection arcs from visitors to Belize */}
          {dots.slice(0, 10).map(dot => (
            <line
              key={`arc-${dot.countryCode}`}
              x1={dot.x}
              y1={dot.y}
              x2={bzX}
              y2={bzY}
              stroke="rgba(59,130,246,0.15)"
              strokeWidth="0.8"
              strokeDasharray="4 3"
            />
          ))}

          {/* Visitor dots */}
          {dots.map(dot => {
            const r = dotRadius(dot.count, maxCount);
            const color = dotColor(dot.count, maxCount);
            return (
              <g key={dot.countryCode}>
                {/* Glow */}
                <circle cx={dot.x} cy={dot.y} r={r + 2} fill={color} opacity="0.15" />
                {/* Dot */}
                <circle cx={dot.x} cy={dot.y} r={r} fill={color} opacity="0.8" />
                {/* Tooltip via SVG title */}
                <title>{dot.country}: {dot.count.toLocaleString()} visits</title>
              </g>
            );
          })}

          {/* Belize home marker */}
          <circle cx={bzX} cy={bzY} r="5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
          <text x={bzX + 8} y={bzY + 4} fill="#10b981" fontSize="10" fontWeight="600">BZ</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></div>
          <span>Home (Belize)</span>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
          <p className="text-xs text-gray-500">Countries</p>
          <p className="text-xl font-bold text-blue-400 mt-1">{countryData.length}</p>
        </div>
        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
          <p className="text-xs text-gray-500">Top Source</p>
          <p className="text-sm font-semibold text-white mt-1 truncate">{countryData[0]?.country || 'N/A'}</p>
        </div>
        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
          <p className="text-xs text-gray-500">Total Visits</p>
          <p className="text-xl font-bold text-green-400 mt-1">
            {countryData.reduce((sum, c) => sum + c.count, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
}
