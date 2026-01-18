import { useMemo } from 'react';
import { Card } from '@/components/ui/card';

interface CountryMapProps {
  countryData: Array<{ countryCode: string; country: string; count: number }>;
}

// Simple world map using bars (alternative to complex SVG map)
export function CountryMap({ countryData }: CountryMapProps) {
  const maxCount = useMemo(() => {
    return Math.max(...countryData.map(c => c.count), 1);
  }, [countryData]);

  const getIntensityColor = (count: number) => {
    const intensity = (count / maxCount) * 100;
    if (intensity >= 75) return 'bg-blue-600';
    if (intensity >= 50) return 'bg-blue-500';
    if (intensity >= 25) return 'bg-blue-400';
    return 'bg-blue-300';
  };

  if (countryData.length === 0) {
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
    <Card className="p-6 bg-gray-800 border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Visitor Heatmap by Country
        </h3>
        <p className="text-gray-400 text-sm">Darker colors indicate more visitors</p>
      </div>

      {/* Visual heatmap bars */}
      <div className="space-y-3">
        {countryData.slice(0, 15).map((country, index) => {
          const percentage = (country.count / maxCount) * 100;
          return (
            <div key={country.countryCode} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 w-6">#{index + 1}</span>
                  <span className="text-sm text-gray-300">{country.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{country.count}</span>
                  <span className="text-xs text-gray-500">visitors</span>
                </div>
              </div>
              <div className="w-full bg-gray-700/30 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${getIntensityColor(country.count)} transition-all duration-500 ease-out group-hover:opacity-80 rounded-full`}
                  style={{ width: `${percentage}%` }}
                >
                  <div className="w-full h-full bg-linear-to-r from-transparent to-white/20"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Less Traffic</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-blue-300"></div>
            <div className="w-8 h-3 rounded bg-blue-400"></div>
            <div className="w-8 h-3 rounded bg-blue-500"></div>
            <div className="w-8 h-3 rounded bg-blue-600"></div>
          </div>
          <span>More Traffic</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
          <p className="text-xs text-gray-500">Total Countries</p>
          <p className="text-xl font-bold text-blue-400 mt-1">{countryData.length}</p>
        </div>
        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
          <p className="text-xs text-gray-500">Top Country</p>
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
