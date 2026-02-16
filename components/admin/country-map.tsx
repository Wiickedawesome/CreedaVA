"use client";

import { useMemo } from "react";

interface CountryMapProps {
  countryData: Array<{ countryCode: string; country: string; count: number }>;
}

export function CountryMap({ countryData }: CountryMapProps) {
  const maxCount = useMemo(
    () => Math.max(...countryData.map((c) => c.count), 1),
    [countryData],
  );

  function intensityColor(count: number) {
    const intensity = (count / maxCount) * 100;
    if (intensity >= 75) return "bg-primary";
    if (intensity >= 50) return "bg-primary-light";
    if (intensity >= 25) return "bg-primary/60";
    return "bg-primary/30";
  }

  if (countryData.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white p-6">
        <div className="h-75 flex flex-col items-center justify-center text-gray-40">
          <svg className="w-16 h-16 mb-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Geographic data will appear as visitors access your site</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-90 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Visitor Heatmap by Country
        </h3>
        <p className="text-sm text-gray-50">Darker colors indicate more visitors</p>
      </div>

      {/* Heatmap bars */}
      <div className="space-y-3">
        {countryData.slice(0, 15).map((c, index) => {
          const pct = (c.count / maxCount) * 100;
          return (
            <div key={c.countryCode} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-40 w-6">#{index + 1}</span>
                  <span className="text-sm text-gray-80">{c.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-90">{c.count}</span>
                  <span className="text-xs text-gray-40">visitors</span>
                </div>
              </div>
              <div className="w-full bg-gray-10 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${intensityColor(c.count)} rounded-full transition-all duration-500 ease-out group-hover:opacity-80`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-gray-40">
          <span>Less Traffic</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-primary/30"></div>
            <div className="w-8 h-3 rounded bg-primary/60"></div>
            <div className="w-8 h-3 rounded bg-primary-light"></div>
            <div className="w-8 h-3 rounded bg-primary"></div>
          </div>
          <span>More Traffic</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-10 rounded-lg">
          <p className="text-xs text-gray-50">Total Countries</p>
          <p className="text-xl font-bold text-primary mt-1">{countryData.length}</p>
        </div>
        <div className="text-center p-3 bg-gray-10 rounded-lg">
          <p className="text-xs text-gray-50">Top Country</p>
          <p className="text-sm font-semibold text-gray-90 mt-1 truncate">
            {countryData[0]?.country || "N/A"}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-10 rounded-lg">
          <p className="text-xs text-gray-50">Total Visits</p>
          <p className="text-xl font-bold text-primary mt-1">
            {countryData.reduce((sum, c) => sum + c.count, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
