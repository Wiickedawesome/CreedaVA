import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

interface GlobeVisualizationProps {
  countryData: Array<{ countryCode: string; country: string; count: number }>;
  events?: Array<{
    latitude?: string;
    longitude?: string;
    country?: string;
    city?: string;
    timestamp?: string;
  }>;
}

// Country centroids (lat, lng) for placing markers
const COUNTRY_COORDS: Record<string, [number, number]> = {
  US: [39.8283, -98.5795],
  GB: [55.3781, -3.436],
  CA: [56.1304, -106.3468],
  AU: [-25.2744, 133.7751],
  DE: [51.1657, 10.4515],
  FR: [46.2276, 2.2137],
  ES: [40.4637, -3.7492],
  IT: [41.8719, 12.5674],
  BR: [-14.235, -51.9253],
  MX: [23.6345, -102.5528],
  IN: [20.5937, 78.9629],
  CN: [35.8617, 104.1954],
  JP: [36.2048, 138.2529],
  KR: [35.9078, 127.7669],
  NL: [52.1326, 5.2913],
  SE: [60.1282, 18.6435],
  NO: [60.472, 8.4689],
  DK: [56.2639, 9.5018],
  FI: [61.9241, 25.7482],
  PL: [51.9194, 19.1451],
  BE: [50.5039, 4.4699],
  CH: [46.8182, 8.2275],
  AT: [47.5162, 14.5501],
  IE: [53.1424, -7.6921],
  PT: [39.3999, -8.2245],
  GR: [39.0742, 21.8243],
  CZ: [49.8175, 15.473],
  RO: [45.9432, 24.9668],
  HU: [47.1625, 19.5033],
  RU: [61.524, 105.3188],
  TR: [38.9637, 35.2433],
  ZA: [-30.5595, 22.9375],
  NG: [9.082, 8.6753],
  EG: [26.8206, 30.8025],
  KE: [-0.0236, 37.9062],
  SG: [1.3521, 103.8198],
  MY: [4.2105, 101.9758],
  TH: [15.87, 100.9925],
  ID: [-0.7893, 113.9213],
  PH: [12.8797, 121.774],
  VN: [14.0583, 108.2772],
  NZ: [-40.9006, 174.886],
  AR: [-38.4161, -63.6167],
  CL: [-35.6751, -71.543],
  CO: [4.5709, -74.2973],
  PE: [-9.19, -75.0152],
  VE: [6.4238, -66.5897],
  IL: [31.0461, 34.8516],
  AE: [23.4241, 53.8478],
  SA: [23.8859, 45.0792],
  PK: [30.3753, 69.3451],
  BD: [23.685, 90.3563],
  UA: [48.3794, 31.1656],
  BZ: [17.1899, -88.4976],
};

export function GlobeVisualization({ countryData, events = [] }: GlobeVisualizationProps) {
  const globeRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  // Build point data from events with lat/lng or from country centroids
  const pointsData = useMemo(() => {
    const points: Array<{ lat: number; lng: number; size: number; color: string; label: string }> = [];

    // First: add individual events that have lat/lng
    const eventPoints = events
      .filter(e => e.latitude && e.longitude && e.latitude !== '0' && e.longitude !== '0')
      .map(e => ({
        lat: parseFloat(e.latitude!),
        lng: parseFloat(e.longitude!),
        size: 0.3,
        color: '#3b82f6',
        label: e.city ? `${e.city}` : 'Visitor',
      }));

    if (eventPoints.length > 0) {
      // Cluster nearby points: use a simple grid-based approach
      const clusters: Record<string, { lat: number; lng: number; count: number; label: string }> = {};
      eventPoints.forEach(p => {
        const key = `${Math.round(p.lat)}_${Math.round(p.lng)}`;
        if (!clusters[key]) {
          clusters[key] = { lat: p.lat, lng: p.lng, count: 0, label: p.label };
        }
        clusters[key].count++;
      });

      Object.values(clusters).forEach(c => {
        points.push({
          lat: c.lat,
          lng: c.lng,
          size: Math.min(1.5, 0.3 + c.count * 0.1),
          color: c.count > 10 ? '#ef4444' : c.count > 5 ? '#f59e0b' : '#3b82f6',
          label: `${c.label} (${c.count} visits)`,
        });
      });
    }

    // Fallback: use country centroids
    if (points.length === 0) {
      countryData.forEach(cd => {
        const coords = COUNTRY_COORDS[cd.countryCode];
        if (coords) {
          const maxCount = Math.max(...countryData.map(c => c.count), 1);
          points.push({
            lat: coords[0],
            lng: coords[1],
            size: Math.min(2, 0.4 + (cd.count / maxCount) * 1.6),
            color: cd.count / maxCount > 0.6 ? '#ef4444' : cd.count / maxCount > 0.3 ? '#f59e0b' : '#3b82f6',
            label: `${cd.country}: ${cd.count} visits`,
          });
        }
      });
    }

    return points;
  }, [countryData, events]);

  // Arcs from visitors to site location (Belize)
  const arcsData = useMemo(() => {
    const topCountries = countryData.slice(0, 8);
    return topCountries
      .map(cd => {
        const coords = COUNTRY_COORDS[cd.countryCode];
        if (!coords || cd.countryCode === 'BZ') return null;
        return {
          startLat: coords[0],
          startLng: coords[1],
          endLat: 17.1899,  // Belize
          endLng: -88.4976,
          color: ['rgba(59, 130, 246, 0.6)', 'rgba(16, 185, 129, 0.3)'],
          stroke: Math.min(2, 0.5 + (cd.count / Math.max(...countryData.map(c => c.count), 1)) * 1.5),
          label: `${cd.country} → Belize`,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [countryData]);

  const handleGlobeReady = useCallback(() => {
    setIsReady(true);
    if (globeRef.current) {
      // Auto-rotate
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = true;
      }
      // Point at Belize initially
      globeRef.current.pointOfView({ lat: 17.19, lng: -88.5, altitude: 2.5 }, 1000);
    }
  }, []);

  const resetView = () => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 17.19, lng: -88.5, altitude: 2.5 }, 1000);
    }
  };

  if (countryData.length === 0 && events.length === 0) {
    return (
      <Card className="p-6 bg-gray-800 border-gray-700">
        <div className="h-[400px] flex flex-col items-center justify-center text-gray-500">
          <svg className="w-24 h-24 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Geographic data will appear as visitors access your site</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-800 border-gray-700 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            🌍 Interactive Visitor Globe
          </h3>
          <p className="text-gray-400 text-sm">
            Drag to rotate &bull; Scroll to zoom &bull; {pointsData.length} locations tracked
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs"
          >
            <RotateCw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <div className="w-full h-[500px] rounded-lg overflow-hidden bg-gray-900/50 relative">
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          pointsData={pointsData}
          pointAltitude="size"
          pointColor="color"
          pointRadius={0.4}
          pointLabel="label"
          arcsData={arcsData}
          arcColor="color"
          arcStroke="stroke"
          arcDashLength={0.5}
          arcDashGap={0.3}
          arcDashAnimateTime={2000}
          arcLabel="label"
          atmosphereColor="#3b82f6"
          atmosphereAltitude={0.2}
          width={undefined}
          height={500}
          onGlobeReady={handleGlobeReady}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Low traffic</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Medium traffic</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>High traffic</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-linear-to-r from-blue-500 to-green-500 rounded"></div>
          <span>Visitor → Belize arcs</span>
        </div>
      </div>

      {/* Summary Stats */}
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
            {countryData.reduce((sum, c) => sum + c.count, 0)}
          </p>
        </div>
      </div>
    </Card>
  );
}
