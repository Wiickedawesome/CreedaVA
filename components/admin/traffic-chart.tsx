"use client";

import React, { useMemo } from "react";

export interface TrafficPoint {
  label: string;
  value: number;
}

interface TrafficChartProps {
  data: TrafficPoint[];
  /** What a single value represents — used in tooltips and the summary line. */
  unit?: string;
  color?: string;
  /** Plot height in viewBox units; the SVG scales to its container. */
  height?: number;
}

const CHART_WIDTH = 600;
const LEFT_GUTTER = 44;
const BOTTOM_GUTTER = 24;
const TOP_PAD = 12;
const MAX_X_LABELS = 6;

/** Round the axis maximum up to a readable value instead of the raw peak. */
function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const factor = [1, 2, 2.5, 5, 10].find((candidate) => value <= candidate * magnitude);
  return (factor ?? 10) * magnitude;
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (Number.isInteger(value)) return String(value);
  // A tiny axis (peak of 1) would otherwise label 0 / 0.5 / 1 as 0 / 1 / 1.
  return value < 10 ? value.toFixed(1) : String(Math.round(value));
}

/** Evenly spaced label indices that always include the first and last point. */
function labelIndices(count: number): number[] {
  if (count <= MAX_X_LABELS) return Array.from({ length: count }, (_, i) => i);
  const step = (count - 1) / (MAX_X_LABELS - 1);
  const picked = new Set([0, count - 1]);
  for (let i = 1; i < MAX_X_LABELS - 1; i++) picked.add(Math.round(i * step));
  return [...picked].sort((a, b) => a - b);
}

export function TrafficChart({
  data,
  unit = "visits",
  color = "var(--primary)",
  height = 140,
}: TrafficChartProps) {
  const chart = useMemo(() => {
    if (data.length < 2) return null;

    const peak = data.reduce((best, point) => (point.value > best.value ? point : best), data[0]);
    const total = data.reduce((sum, point) => sum + point.value, 0);
    const axisMax = niceCeiling(Math.max(...data.map((point) => point.value), 1));

    const plotWidth = CHART_WIDTH - LEFT_GUTTER - TOP_PAD;
    const plotHeight = height - BOTTOM_GUTTER - TOP_PAD;
    const baseline = TOP_PAD + plotHeight;

    const points = data.map((point, index) => ({
      ...point,
      x: LEFT_GUTTER + (index / (data.length - 1)) * plotWidth,
      y: baseline - (point.value / axisMax) * plotHeight,
    }));

    return {
      points,
      total,
      peak,
      average: total / data.length,
      axisMax,
      baseline,
      plotWidth,
      ticks: [0, 0.5, 1].map((fraction) => ({
        value: axisMax * fraction,
        y: baseline - fraction * plotHeight,
      })),
      xLabelIndices: labelIndices(data.length),
      line: points.map((point) => `${point.x},${point.y}`).join(" "),
      area: [
        `${points[0].x},${baseline}`,
        ...points.map((point) => `${point.x},${point.y}`),
        `${points[points.length - 1].x},${baseline}`,
      ].join(" "),
    };
  }, [data, height]);

  if (!chart) {
    return (
      <p className="py-8 text-center text-sm text-gray-50">
        Not enough data to chart yet — needs at least two days.
      </p>
    );
  }

  const { points, total, peak, average, ticks, xLabelIndices, line, area, baseline, axisMax } = chart;

  return (
    <div>
      <dl className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <div className="flex items-baseline gap-1.5">
          <dt className="text-gray-50">Total</dt>
          <dd className="font-semibold text-gray-90">{total.toLocaleString()}</dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-gray-50">Daily avg</dt>
          <dd className="font-semibold text-gray-90">{compact(average)}</dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-gray-50">Peak</dt>
          <dd className="font-semibold text-gray-90">
            {peak.value.toLocaleString()} <span className="font-normal text-gray-50">on {peak.label}</span>
          </dd>
        </div>
      </dl>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${unit} over ${data.length} days, peaking at ${peak.value} on ${peak.label}`}
      >
        <defs>
          <linearGradient id="trafficChartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid with value labels — without these the height means nothing. */}
        {ticks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={LEFT_GUTTER}
              x2={CHART_WIDTH}
              y1={tick.y}
              y2={tick.y}
              stroke="var(--gray-20)"
              strokeWidth="1"
              strokeDasharray={tick.value === 0 ? undefined : "3 4"}
            />
            <text
              x={LEFT_GUTTER - 8}
              y={tick.y + 3}
              textAnchor="end"
              style={{ fontSize: 9, fill: "var(--gray-50)" }}
            >
              {compact(tick.value)}
            </text>
          </g>
        ))}

        <polygon points={area} fill="url(#trafficChartGradient)" />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Peak marker: the one value worth reading at a glance. */}
        <circle
          cx={points[data.indexOf(peak)].x}
          cy={points[data.indexOf(peak)].y}
          r="3.5"
          fill={color}
          stroke="var(--card)"
          strokeWidth="1.5"
        />

        {xLabelIndices.map((index) => (
          <text
            key={index}
            x={points[index].x}
            y={height - 6}
            textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}
            style={{ fontSize: 9, fill: "var(--gray-50)" }}
          >
            {points[index].label}
          </text>
        ))}

        {/* Per-point hit targets: native tooltips, so no hover state to maintain. */}
        {points.map((point) => (
          <g key={`${point.label}-${point.x}`}>
            <circle cx={point.x} cy={point.y} r="8" fill="transparent">
              <title>{`${point.label}: ${point.value.toLocaleString()} ${unit} (${Math.round((point.value / axisMax) * 100)}% of axis)`}</title>
            </circle>
            <circle cx={point.x} cy={point.y} r="2" fill={color} opacity="0.55" />
          </g>
        ))}

        <line
          x1={LEFT_GUTTER}
          x2={CHART_WIDTH}
          y1={baseline}
          y2={baseline}
          stroke="var(--gray-30)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
