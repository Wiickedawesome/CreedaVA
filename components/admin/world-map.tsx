"use client";

import { useMemo, useState } from "react";
import { geoPath, geoEqualEarth } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection, GeometryObject } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";
// Imported, not fetched. `public/` is not shipped in this deployment — measured
// 2026-11-11, every file in it 404s on both the custom domain and the backend
// URL, so `fetch("/world-atlas-110m.json")` always failed and the map sat on
// "Failed to load map". A JSON import is compiled into the chunk that uses it.
import worldTopology from "@/lib/data/world-atlas-110m.json";

interface WorldMapProps {
  countryData: Array<{ countryCode: string; country: string; count: number }>;
}

// ISO 3166-1 alpha-2 → M49 numeric (matches the TopoJSON country `id` field)
const ALPHA2_TO_M49: Record<string, string> = {
  AD: "020", AE: "784", AF: "004", AG: "028", AI: "660", AL: "008", AM: "051",
  AO: "024", AR: "032", AS: "016", AT: "040", AU: "036", AW: "533", AX: "248",
  AZ: "031", BA: "070", BB: "052", BD: "050", BE: "056", BF: "854", BG: "100",
  BH: "048", BI: "108", BJ: "204", BL: "652", BM: "060", BN: "096", BO: "068",
  BQ: "535", BR: "076", BS: "044", BT: "064", BV: "074", BW: "072", BY: "112",
  BZ: "084", CA: "124", CC: "166", CD: "180", CF: "140", CG: "178", CH: "756",
  CI: "384", CK: "184", CL: "152", CM: "120", CN: "156", CO: "170", CR: "188",
  CU: "192", CV: "132", CW: "531", CX: "162", CY: "196", CZ: "203", DE: "276",
  DJ: "262", DK: "208", DM: "212", DO: "214", DZ: "012", EC: "218", EE: "233",
  EG: "818", EH: "732", ER: "232", ES: "724", ET: "231", FI: "246", FJ: "242",
  FK: "238", FM: "583", FO: "234", FR: "250", GA: "266", GB: "826", GD: "308",
  GE: "268", GF: "254", GG: "831", GH: "288", GI: "292", GL: "304", GM: "270",
  GN: "324", GP: "312", GQ: "226", GR: "300", GS: "239", GT: "320", GU: "316",
  GW: "624", GY: "328", HK: "344", HM: "334", HN: "340", HR: "191", HT: "332",
  HU: "348", ID: "360", IE: "372", IL: "376", IM: "833", IN: "356", IO: "086",
  IQ: "368", IR: "364", IS: "352", IT: "380", JE: "832", JM: "388", JO: "400",
  JP: "392", KE: "404", KG: "417", KH: "116", KI: "296", KM: "174", KN: "659",
  KP: "408", KR: "410", KW: "414", KY: "136", KZ: "398", LA: "418", LB: "422",
  LC: "662", LI: "438", LK: "144", LR: "430", LS: "426", LT: "440", LU: "442",
  LV: "428", LY: "434", MA: "504", MC: "492", MD: "498", ME: "499", MF: "663",
  MG: "450", MH: "584", MK: "807", ML: "466", MM: "104", MN: "496", MO: "446",
  MP: "580", MQ: "474", MR: "478", MS: "500", MT: "470", MU: "480", MV: "462",
  MW: "454", MX: "484", MY: "458", MZ: "508", NA: "516", NC: "540", NE: "562",
  NF: "574", NG: "566", NI: "558", NL: "528", NO: "578", NP: "524", NR: "520",
  NU: "570", NZ: "554", OM: "512", PA: "591", PE: "604", PF: "258", PG: "598",
  PH: "608", PK: "586", PL: "616", PM: "666", PN: "612", PR: "630", PS: "275",
  PT: "620", PW: "585", PY: "600", QA: "634", RE: "638", RO: "642", RS: "688",
  RU: "643", RW: "646", SA: "682", SB: "090", SC: "690", SD: "729", SE: "752",
  SG: "702", SH: "654", SI: "705", SJ: "744", SK: "703", SL: "694", SM: "674",
  SN: "686", SO: "706", SR: "740", SS: "728", ST: "678", SV: "222", SX: "534",
  SY: "760", SZ: "748", TC: "796", TD: "148", TF: "260", TG: "768", TH: "764",
  TJ: "762", TK: "772", TL: "626", TM: "795", TN: "788", TO: "776", TR: "792",
  TT: "780", TV: "798", TW: "158", TZ: "834", UA: "804", UG: "800", UM: "581",
  US: "840", UY: "858", UZ: "860", VA: "336", VC: "670", VE: "862", VG: "092",
  VI: "850", VN: "704", VU: "548", WF: "876", WS: "882", YE: "887", YT: "175",
  ZA: "710", ZM: "894", ZW: "716",
};

interface WorldTopology extends Topology {
  objects: { countries: GeometryCollection };
}

// Heat ramp and "no data" fill are derived from the live tokens rather than
// hardcoded hexes. The old five fixed greens kept their light-mode contrast
// when the admin switched to dark, leaving the busiest countries as dark
// patches on a dark card.
const HEAT_RAMP = [
  "color-mix(in srgb, var(--primary) 22%, transparent)",
  "color-mix(in srgb, var(--primary) 45%, transparent)",
  "color-mix(in srgb, var(--primary) 68%, transparent)",
  "var(--primary)",
] as const;
const NO_DATA_FILL = "color-mix(in srgb, var(--gray-40) 60%, transparent)";

export function WorldMap({ countryData }: WorldMapProps) {
  // The topology is a build-time import, so there is no loading or error state
  // to render — either the chunk is there or the whole page is not.
  const [hover, setHover] = useState<{ name: string; count: number; x: number; y: number } | null>(null);

  const maxCount = useMemo(
    () => Math.max(...countryData.map((c) => c.count), 1),
    [countryData],
  );

  const dataById = useMemo(() => {
    const map = new Map<string, { count: number; name: string }>();
    countryData.forEach((c) => {
      const m49 = ALPHA2_TO_M49[c.countryCode];
      if (m49) {
        const existing = map.get(m49);
        map.set(m49, {
          count: (existing?.count ?? 0) + c.count,
          name: c.country,
        });
      }
    });
    return map;
  }, [countryData]);

  const width = 800;
  const height = 420;

  function fillFor(id: string): string {
    const entry = dataById.get(id);
    if (!entry) return NO_DATA_FILL;
    const ratio = entry.count / maxCount;
    if (ratio >= 0.75) return HEAT_RAMP[3];
    if (ratio >= 0.5) return HEAT_RAMP[2];
    if (ratio >= 0.25) return HEAT_RAMP[1];
    if (ratio > 0) return HEAT_RAMP[0];
    return NO_DATA_FILL;
  }

  const features = useMemo<Feature<Geometry>[]>(() => {
    const topology = worldTopology as unknown as WorldTopology;
    const fc = feature(
      topology,
      topology.objects.countries as GeometryObject,
    ) as unknown as FeatureCollection<Geometry>;
    return fc.features;
  }, []);

  const projection = useMemo(
    () => geoEqualEarth().scale(155).translate([width / 2, height / 2 + 10]),
    [],
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  const totalVisits = useMemo(
    () => countryData.reduce((s, c) => s + c.count, 0),
    [countryData],
  );

  if (countryData.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="h-87.5 flex flex-col items-center justify-center text-gray-50">
          <svg className="w-16 h-16 mb-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <p className="text-sm">Geographic data will appear as visitors access your site</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-gray-90 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Visitor Map
          </h3>
          <p className="text-sm text-gray-50 mt-0.5">
            {countryData.length} countries &bull; {totalVisits.toLocaleString()} total visits
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-50">
          <span>Less</span>
          {[NO_DATA_FILL, ...HEAT_RAMP].map((c) => (
            <span key={c} className="inline-block w-4 h-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg bg-gray-10/40">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block"
          role="img"
          aria-label="World map of visitor countries"
        >
          <rect width={width} height={height} fill="transparent" />

          {/* Subtle graticule */}
          {[-60, -30, 0, 30, 60].map((lat) => {
            const samples: [number, number][] = [];
            for (let lng = -180; lng <= 180; lng += 10) samples.push([lng, lat]);
            const projected = samples
              .map((p) => projection(p))
              .filter((p): p is [number, number] => Array.isArray(p));
            if (projected.length === 0) return null;
            const d =
              "M " +
              projected
                .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
                .join(" L ");
            return <path key={lat} d={d} fill="none" stroke="rgba(0,81,72,0.06)" strokeWidth={0.5} />;
          })}

          {/* Countries */}
          {features.map((f, i) => {
            const id = String(f.id ?? "");
            const d = path(f) || "";
            const entry = dataById.get(id);
            const name = entry?.name ?? ((f.properties as { name?: string } | null)?.name ?? "");
            const isHit = !!entry;
            return (
              <path
                key={(f.id ?? i).toString()}
                d={d}
                fill={fillFor(id)}
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={0.4}
                className={isHit ? "cursor-pointer" : ""}
                onMouseMove={(e) => {
                  if (!isHit) return;
                  const svg = e.currentTarget.ownerSVGElement;
                  if (!svg) return;
                  const rect = svg.getBoundingClientRect();
                  setHover({
                    name,
                    count: entry!.count,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseLeave={() => setHover(null)}
              >
                <title>
                  {name}
                  {entry ? `: ${entry.count.toLocaleString()} visits` : ""}
                </title>
              </path>
            );
          })}

          {/* Belize home marker */}
          {(() => {
            const p = projection([-88.5, 17.19]);
            if (!p) return null;
            const [hx, hy] = p;
            return (
              <g>
                <circle cx={hx} cy={hy} r={6} fill="var(--chart-1)" opacity={0.25} />
                <circle cx={hx} cy={hy} r={3.5} fill="var(--chart-1)" stroke="var(--card)" strokeWidth={1.2} />
              </g>
            );
          })()}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-20 rounded-md bg-gray-90 text-white text-xs px-2 py-1 shadow-lg"
            style={{
              left: hover.x + 12,
              top: hover.y + 12,
              transform: hover.x > width * 0.75 ? "translateX(-110%)" : undefined,
            }}
          >
            <div className="font-semibold">{hover.name}</div>
            <div className="text-gray-30">{hover.count.toLocaleString()} visits</div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-10 rounded-lg">
          <p className="text-xs text-gray-50">Countries</p>
          <p className="text-xl font-bold text-primary mt-1">{countryData.length}</p>
        </div>
        <div className="text-center p-3 bg-gray-10 rounded-lg">
          <p className="text-xs text-gray-50">Top Source</p>
          <p className="text-sm font-semibold text-gray-90 mt-1 truncate" title={countryData[0]?.country}>
            {countryData[0]?.country || "N/A"}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-10 rounded-lg">
          <p className="text-xs text-gray-50">Total Visits</p>
          <p className="text-xl font-bold text-primary mt-1">{totalVisits.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
