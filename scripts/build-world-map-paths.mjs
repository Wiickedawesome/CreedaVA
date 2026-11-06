#!/usr/bin/env node
/**
 * Regenerates `components/ui/world-map-land.ts` from the Natural Earth 110m
 * TopoJSON already bundled at `public/world-atlas-110m.json` — the same file
 * the admin map reads at runtime.
 *
 * The marketing map is a Server Component with no data fetching, so its
 * geometry has to be static. Deriving it here keeps that static copy exact and
 * reproducible instead of hand-traced.
 *
 * Usage: node scripts/build-world-map-paths.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "public", "world-atlas-110m.json");
const TARGET = join(ROOT, "components", "ui", "world-map-land.ts");

/** Equirectangular projection matching the plate's `viewBox="0 10 1000 400"`. */
const UNITS_PER_DEGREE = 1000 / 360;
const VIEW_Y_MIN = 10;
const VIEW_Y_MAX = 410;

/** Everything south of this is Antarctica, which the plate crops out anyway. */
const ANTARCTICA_LAT = -57;

/** Douglas–Peucker tolerance in plate units. 1 unit ≈ 1px at render width. */
const SIMPLIFY_TOLERANCE = 0.5;

/** Rings smaller than this many square units are sub-pixel noise. */
const MIN_RING_AREA = 0.02;

function project([lon, lat]) {
  return [
    (lon + 180) * UNITS_PER_DEGREE,
    (90 - lat) * UNITS_PER_DEGREE,
  ];
}

/** True when a ring jumps the antimeridian, which must be split, not joined. */
function crossesAntimeridian(ring) {
  for (let i = 1; i < ring.length; i++) {
    if (Math.abs(ring[i][0] - ring[i - 1][0]) > 180) return true;
  }
  return false;
}

/** Removes ±360° jumps so a crossing ring becomes one continuous shape. */
function unwrapLongitudes(ring) {
  const out = [];
  let previous = null;
  for (const [lon, lat] of ring) {
    let unwrapped = lon;
    if (previous !== null) {
      while (unwrapped - previous > 180) unwrapped -= 360;
      while (unwrapped - previous < -180) unwrapped += 360;
    }
    out.push([unwrapped, lat]);
    previous = unwrapped;
  }
  return out;
}

function ringArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length - 1; i++) {
    sum += points[i][0] * points[i + 1][1] - points[i + 1][0] * points[i][1];
  }
  return Math.abs(sum) / 2;
}

/** Douglas–Peucker, iterative so deep coastlines cannot blow the stack. */
function simplify(points, tolerance) {
  if (points.length < 3) return points;

  const keep = new Array(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;

  const stack = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [start, end] = stack.pop();
    if (end <= start + 1) continue;

    const [ax, ay] = points[start];
    const [bx, by] = points[end];
    const dx = bx - ax;
    const dy = by - ay;
    const length = Math.hypot(dx, dy);

    let farthest = -1;
    let farthestIndex = -1;
    for (let i = start + 1; i < end; i++) {
      const [px, py] = points[i];
      const distance = length
        ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / length
        : Math.hypot(px - ax, py - ay);
      if (distance > farthest) {
        farthest = distance;
        farthestIndex = i;
      }
    }

    if (farthest > tolerance) {
      keep[farthestIndex] = true;
      stack.push([start, farthestIndex], [farthestIndex, end]);
    }
  }

  return points.filter((_, index) => keep[index]);
}

/**
 * A crossing ring needs a second copy shifted a full 360° so the sliver on the
 * far edge of the plate still draws. Non-crossing rings never get a copy.
 */
function longitudesToDraw(ring) {
  if (!crossesAntimeridian(ring)) return [ring];

  const unwrapped = unwrapLongitudes(ring);
  const lons = unwrapped.map(([lon]) => lon);
  const copies = [unwrapped];
  if (Math.max(...lons) > 180) copies.push(unwrapped.map(([lon, lat]) => [lon - 360, lat]));
  if (Math.min(...lons) < -180) copies.push(unwrapped.map(([lon, lat]) => [lon + 360, lat]));
  return copies;
}

function toPathData(ring) {
  const projected = ring.map(project);
  const xs = projected.map(([x]) => x);
  const ys = projected.map(([, y]) => y);

  const offPlate =
    Math.max(...xs) < 0 ||
    Math.min(...xs) > 1000 ||
    Math.max(...ys) < VIEW_Y_MIN ||
    Math.min(...ys) > VIEW_Y_MAX;
  if (offPlate) return null;

  const simplified = simplify(projected, SIMPLIFY_TOLERANCE);
  if (simplified.length < 3 || ringArea(simplified) < MIN_RING_AREA) return null;

  const segments = simplified.map(([x, y]) => `${Math.round(x)},${Math.round(y)}`);
  return `M${segments.join(" L")}Z`;
}

function polygonRings(geometry) {
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
}

function main() {
  const topology = JSON.parse(readFileSync(SOURCE, "utf8"));
  const land = feature(topology, topology.objects.land);
  const polygons = land.type === "FeatureCollection" ? land.features : [land];

  const paths = [];
  for (const { geometry } of polygons) {
    for (const ring of polygonRings(geometry)) {
      if (Math.max(...ring.map(([, lat]) => lat)) < ANTARCTICA_LAT) continue;

      for (const copy of longitudesToDraw(ring)) {
        const path = toPathData(copy);
        if (path) paths.push(path);
      }
    }
  }

  const source = readFileSync(SOURCE, "utf8");
  const body = paths.map((path) => `  "${path}",`).join("\n");

  writeFileSync(
    TARGET,
    `// GENERATED FILE — do not edit by hand.
// Regenerate with: node scripts/build-world-map-paths.mjs
//
// Natural Earth 110m land polygons from public/world-atlas-110m.json,
// projected equirectangularly to the marketing plate's viewBox:
//   x = (lon + 180) * (1000 / 360)
//   y = (90 - lat)  * (1000 / 360)
// Antarctica dropped (${ANTARCTICA_LAT}°S and below), antimeridian split,
// simplified to ${SIMPLIFY_TOLERANCE} unit tolerance (~${SIMPLIFY_TOLERANCE}px at render width).
// Source bytes: ${source.length}

export const LAND_PATHS: string[] = [
${body}
];
`,
    "utf8",
  );

  const bytes = paths.reduce((total, path) => total + path.length, 0);
  console.log(`Wrote ${paths.length} paths (${bytes} chars) to ${TARGET}`);
}

main();
