#!/usr/bin/env node
/**
 * Design-system audit — "is the redesign actually everywhere?"
 *
 * The site runs two token sets on purpose:
 *
 *   marketing  `--mk-*`            app/(marketing), components/marketing,
 *                                  components/layout, components/seo,
 *                                  components/survey, app/login
 *   admin      `--primary`/`gray-*` app/(admin), components/admin
 *
 * A redesign is "universal" only when (a) nothing on a surface reaches for the
 * other set, (b) no surface reaches for a raw Tailwind palette value that the
 * theme cannot flip, and (c) the assets/metadata a visitor or scraper sees are
 * the current brand. Those are the invariants this script checks.
 *
 * Usage:
 *   node scripts/audit-design-system.mjs              # static checks only
 *   node scripts/audit-design-system.mjs --live       # + HTTP checks (dev/prod)
 *   node scripts/audit-design-system.mjs --live --strict   # warnings fail too
 *
 * Exit codes: 0 clean, 1 errors found, 2 script/config problem.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const WANT_LIVE = process.argv.includes("--live") || process.argv.includes("--visual");
const WANT_VISUAL = process.argv.includes("--visual");
const STRICT = process.argv.includes("--strict");
const BASE_URL = (process.env.AUDIT_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const SKIP_DIRS = new Set([
  "node_modules", ".next", ".git", "coverage", "playwright-report", "test-results", "docs", "public",
]);

// ─── Discovery ───────────────────────────────────────────────────────────────
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if ([".ts", ".tsx", ".css", ".mjs"].includes(extname(full))) out.push(full);
  }
  return out;
}

const FILES = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "components")), ...walk(join(ROOT, "lib")), ...walk(join(ROOT, "hooks"))]
  .map((f) => relative(ROOT, f).split("\\").join("/"))
  .filter((f) => !f.startsWith("functions/"));

const SURFACES = {
  marketing: (f) =>
    f.startsWith("app/(marketing)/") ||
    f.startsWith("app/login/") ||
    f.startsWith("components/marketing/") ||
    f.startsWith("components/layout/") ||
    f.startsWith("components/seo/") ||
    f.startsWith("components/survey/") ||
    f === "app/not-found.tsx" ||
    f === "app/layout.tsx",
  admin: (f) => f.startsWith("app/(admin)/") || f.startsWith("components/admin/"),
  shared: (f) => f.startsWith("components/ui/") || f.startsWith("lib/") || f.startsWith("hooks/"),
};

const surfaceOf = (f) => Object.keys(SURFACES).find((k) => SURFACES[k](f)) ?? "other";
const read = (f) => readFileSync(join(ROOT, f), "utf8");

// ─── Allowlist ───────────────────────────────────────────────────────────────
// Per-rule exemptions. Every entry needs a reason. "It was already like that" is
// not a reason. A blanket per-file exemption is a trap: `emails/page.tsx` holds
// e-mail HTML (legitimate free-form hexes) AND app chrome (which must use
// tokens), so only R1 is exempted there.
const ALL = "*";
const ALLOW = {
  // The 2026 prompt module names the old values in its BANNED list on purpose.
  "lib/utils/ai-design-2026.ts": [ALL, "BANNED list documents the legacy palette"],
  // Doc comments explain what the normaliser strips.
  "lib/utils/legacy-content.ts": [ALL, "documents the legacy hexes it removes"],
  "lib/utils/ai-system-prompt.ts": [ALL, "BANNED list + doc comments"],
  "app/opengraph-image.tsx": ["R1", "doc comment records the old gradient"],
  "app/globals.css": ["R1", "token definitions live here"],
  // Google's own SERP colours on a deliberately pinned-white preview panel.
  "app/(admin)/admin/seo/_components/sections/pages-section.tsx": [ALL, "Google SERP colours, pinned white surface"],
  // Platform chips keep their real brand hue, each with an explicit dark variant.
  "app/(admin)/admin/marketing/campaigns/page.tsx": ["R5", "platform brand chips carry dark: variants"],
  // Projected/webhook e-mail HTML, rendered by mail clients, not by app CSS.
  "app/(admin)/admin/customers/page.tsx": ["R1", "e-mail template HTML (mail clients)"],
  "app/(admin)/admin/emails/page.tsx": ["R1", "e-mail template HTML (mail clients)"],
  "app/api/booking/route.ts": ["R1", "e-mail template HTML (mail clients)"],
  "lib/firebase/trigger-email.ts": ["R1", "e-mail template HTML (mail clients)"],
  // Static SVG illustration, not a themed surface.
  "components/admin/ai-prompt.tsx": ["R1", "standalone preview document in a new tab"],
};

const exempt = (file, rule) => {
  const entry = ALLOW[file];
  return Array.isArray(entry) && (entry[0] === ALL || entry[0] === rule);
};

// Tokens this project remaps for dark mode. Anything outside this range is
// Tailwind's own palette and stays put when the theme flips.
const THEMED_GREYS = new Set(["10", "20", "30", "40", "50", "60", "70", "80", "90", "100"]);

// ─── Checks ──────────────────────────────────────────────────────────────────
const results = [];
function record(rule, level, file, line, message) {
  results.push({ rule, level, file, line, message });
}

function scan(rule, test, level, message) {
  for (const file of FILES) {
    if (exempt(file, rule)) continue;
    const lines = read(file).split("\n");
    lines.forEach((text, i) => {
      const hit = test(text, file);
      if (hit) record(rule, level, file, i + 1, typeof hit === "string" ? hit : message);
    });
  }
}

// R1 — legacy palette. These are pre-redesign values; the current equivalents
// are in globals.css. Use --mk-* or the admin tokens, never the old literal.
// #DDE1E6 / #F2F4F8 / #697077 are ALSO live admin token values, so the exact
// token-definition shape (`--gray-30: #DDE1E6`) is exempt and only usage is not.
const LEGACY = /#(FF6B35|E8A838|007A6E|00685C|1A1A2E|F9FBFF|DDE1E6|697077|F2F4F8)\b/i;
const TOKEN_DEFINITION = /^\s*--[a-z0-9-]+\s*:/i;
scan("R1 legacy-palette", (t) => (TOKEN_DEFINITION.test(t) ? false : LEGACY.exec(t)), "error", "pre-redesign colour literal");

// R2 — cross-surface token leakage. A marketing file reaching for --primary or
// gray-* (or the reverse) means the two designs are not actually separated.
scan(
  "R2 marketing-uses-admin-tokens",
  (t, f) => surfaceOf(f) === "marketing" && !/^\s*(\*|\/\/)/.test(t) && /\b(bg|text|border|ring|divide|from|to|via|placeholder|fill|stroke)-(primary|gray-(10|20|30|40|50|60|70|80|90|100))\b/.test(t),
  "error",
  "marketing surface uses an admin-only token",
);
scan(
  "R3 admin-uses-marketing-tokens",
  (t, f) => surfaceOf(f) === "admin" && /\b(bg|text|border|ring|divide|from|to|via)-(mk-[a-z-]+)\b/.test(t),
  "error",
  "admin surface uses a marketing-only token",
);

// R4 — raw Tailwind palette. gray-200..900 and the semantic hues are NOT remapped
// by :root[data-theme="dark"], so they freeze at their light value.
scan(
  "R4 raw-palette-grey",
  (t, f) => {
    if (surfaceOf(f) !== "admin" && f !== "components/ui/button.tsx" && !f.startsWith("components/ui/")) return false;
    const m = /\b(bg|text|border|ring|divide|from|to|via|placeholder)-(gray|slate|zinc|neutral|stone)-(\d{2,3})\b/.exec(t);
    return m && !THEMED_GREYS.has(m[3]) ? `unthemed grey ${m[0]}` : false;
  },
  "error",
  "raw grey outside the themed range",
);
scan(
  "R5 raw-palette-hue",
  (t, f) => {
    if (surfaceOf(f) !== "admin") return false;
    const m = /\b(bg|text|border|ring|divide|from|to|via)-(red|green|amber|yellow|orange|emerald|teal|sky|indigo|purple|violet|rose|pink|blue)-(\d{2,3})\b/.exec(t);
    if (!m) return false;
    // Allowed when the same class list carries an explicit dark: variant.
    return /dark:/.test(t) ? false : `unthemed hue ${m[0]}`;
  },
  "error",
  "raw hue without a dark variant",
);

// R6 — `prose` requires @tailwindcss/typography, which is not a dependency, so
// `prose` emits ZERO css. Rich HTML must use .mk-article (marketing) instead.
if (!read("package.json").includes("@tailwindcss/typography")) {
  scan("R6 prose-without-plugin", (t) => /\bprose(-[a-z]+)?\b/.test(t) && /className=/.test(t), "error", "`prose` emits no CSS (plugin absent)");
}

// R7 — dark-mode wiring. `dark:` is inert unless the variant is remapped onto
// data-theme, and the marketing shell must actively strip the attribute.
const globals = read("app/globals.css");
if (!/@custom-variant\s+dark\s*\(/.test(globals)) record("R7 dark-variant", "error", "app/globals.css", 0, "`dark:` still keys off prefers-color-scheme");
if (!/components\/layout\/force-theme/.test(read("app/(marketing)/layout.tsx"))) record("R8 marketing-force-theme", "error", "app/(marketing)/layout.tsx", 0, "marketing shell does not pin the theme");
if (!/AdminThemeProvider/.test(read("app/(admin)/layout.tsx"))) record("R9 admin-theme-provider", "error", "app/(admin)/layout.tsx", 0, "admin shell has no theme provider");

// R10 — assets. Metadata must point at the current brand files. Comment lines
// are skipped: the layout and manifest document the OLD path in prose to stop
// someone reintroducing it, and that mention is not a reference.
const METADATA_FILES = ["app/layout.tsx", "app/manifest.ts", "app/(marketing)/layout.tsx", "lib/utils/structured-data.ts", "lib/firebase/seo.ts"];
const codeLines = (file) =>
  read(file)
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line));
for (const file of METADATA_FILES) {
  if (!FILES.includes(file)) continue;
  const lines = codeLines(file);
  if (lines.some((line) => /logo\.webp|creedava-logo-B/.test(line))) {
    record("R10 stale-logo", "error", file, 0, "metadata references a pre-redesign raster logo");
  }
  if (file === "lib/firebase/seo.ts" && !lines.some((line) => /opengraph-image/.test(line))) {
    record("R11 og-image", "warning", file, 0, "no reference to the generated share card");
  }
}

// R12 — orphan components. A file nothing imports is either dead (delete it) or
// a design surface that silently stopped rendering (worse).
const componentFiles = FILES.filter((f) => f.startsWith("components/") && /\.tsx$/.test(f) && !/\/index\.tsx?$/.test(f));
for (const file of componentFiles) {
  const base = file.replace(/\.tsx$/, "").split("/").pop();
  const parents = FILES.filter((f) => f !== file && (f.startsWith("app/") || f.startsWith("components/")));
  const imported = parents.some((f) => {
    const body = read(f);
    return new RegExp(`from\\s+["'][^"']*\\/${base}["']`).test(body) || new RegExp(`dynamic\\(\\(\\)\\s*=>\\s*import\\(["'][^"']*${base}["']`).test(body);
  });
  if (!imported) record("R12 orphan-component", "warning", file, 0, "not imported anywhere");
}

// ─── Live leg ────────────────────────────────────────────────────────────────
const ROUTES = [
  "/", "/about", "/services", "/pricing", "/contact", "/faq", "/join",
  "/news", "/news?page=2", "/forum", "/privacy", "/terms", "/satisfaction/demo", "/login",
];

async function live() {
  const get = async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, { headers: { "cache-control": "no-cache" } });
    return { res, body: res.headers.get("content-type")?.includes("text/html") ? await res.text() : "" };
  };

  for (const path of ROUTES) {
    try {
      const { res, body } = await get(path);
      if (res.status !== 200) {
        record("R13 route-status", "error", path, res.status, `expected 200, got ${res.status}`);
        continue;
      }
      // A page route that is not HTML means the checks below would silently
      // pass on an empty string — the exact "green but blind" failure mode.
      if (!body) {
        record("R13 route-status", "error", path, res.status, `expected text/html, got ${res.headers.get("content-type") ?? "none"}`);
        continue;
      }
      if (!/<meta[^>]+property="og:image"/.test(body)) record("R14 og-image-tag", "error", path, 0, "no og:image in <head>");
      if (/logo\.webp/.test(body)) record("R15 stale-logo-live", "error", path, 0, "serves a pre-redesign logo");
      if (/data-theme="dark"/.test(body.slice(0, body.indexOf("</head>")))) record("R16 theme-leak", "error", path, 0, "marketing page ships data-theme=dark");
    } catch (error) {
      record("R13 route-status", "error", path, 0, `request failed: ${error.message}`);
    }
  }

  for (const asset of ["/opengraph-image", "/twitter-image", "/apple-icon", "/icon.svg", "/manifest.webmanifest", "/favicon.ico"]) {
    try {
      const res = await fetch(`${BASE_URL}${asset}`);
      if (!res.ok) record("R17 asset-status", "error", asset, res.status, "asset missing");
      const type = res.headers.get("content-type") ?? "";
      if (asset === "/opengraph-image" && !type.includes("image/png")) record("R18 asset-type", "error", asset, 0, `expected image/png, got ${type}`);
    } catch (error) {
      record("R17 asset-status", "error", asset, 0, `request failed: ${error.message}`);
    }
  }
}

// ─── Visual leg ──────────────────────────────────────────────────────────────
// Static rules cannot see a rendered page. This measures the two things the
// redesign is most likely to break: horizontal overflow and text contrast after
// the tokens resolve. Runs in the real browser so it reads computed colours.
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "375", width: 375, height: 812 },
];

async function visual() {
  const { chromium } = await import("@playwright/test");

  // The repo's pinned Playwright and the cached browser can drift apart, and a
  // download is not something an audit should trigger on its own. Reuse any
  // chromium already on disk; if there is none, SKIP loudly rather than let a
  // missing browser read as a pass.
  const { readdirSync: ls, existsSync } = await import("node:fs");
  const cache = join(process.env.HOME ?? "", ".cache", "ms-playwright");
  let executablePath;
  if (existsSync(cache)) {
    const candidates = ls(cache)
      .filter((d) => /^chromium-\d+$/.test(d))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
    for (const dir of candidates) {
      for (const sub of ["chrome-linux64/chrome", "chrome-linux/chrome"]) {
        const candidate = join(cache, dir, sub);
        if (existsSync(candidate)) {
          executablePath = candidate;
          break;
        }
      }
      if (executablePath) break;
    }
  }

  if (!executablePath) {
    console.warn("SKIPPED visual leg — no local chromium found. Run `npx playwright install chromium`.");
    record("R21 visual-run", "warning", "visual", 0, "skipped: no local chromium");
    return false;
  }

  const browser = await chromium.launch({ executablePath });
  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const page = await context.newPage();
      for (const path of ROUTES) {
        try {
          await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
          await page.waitForTimeout(350);
          const outcome = await page.evaluate(() => {
            // getComputedStyle can return `oklab(...)` / `lab(...)` / `color(...)`
            // for anything Tailwind emitted as color-mix (every `/opacity`
            // modifier). A naive digit regex reads those as RGB and produces
            // nonsense — it reported a near-black navbar on a white page. The
            // canvas resolves whatever the browser hands us into real RGBA.
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            const parse = (value) => {
              if (!value || value === "transparent" || value === "none") return null;
              ctx.clearRect(0, 0, 1, 1);
              ctx.fillStyle = "#000";
              ctx.fillStyle = value;
              ctx.fillRect(0, 0, 1, 1);
              const data = ctx.getImageData(0, 0, 1, 1).data;
              return [data[0], data[1], data[2], data[3] / 255];
            };
            const luminance = ([r, g, b]) => {
              const f = (v) => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
              };
              return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
            };
            const ratio = (a, b) => {
              const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
              return (l1 + 0.05) / (l2 + 0.05);
            };
            // Walk up for the nearest opaque background; blend translucent layers.
            const backdrop = (el) => {
              const layers = [];
              for (let node = el; node; node = node.parentElement) {
                const bg = parse(getComputedStyle(node).backgroundColor);
                if (!bg) continue;
                const alpha = bg[3] ?? 1;
                if (alpha === 0) continue;
                layers.push([bg[0], bg[1], bg[2], alpha]);
                if (alpha >= 1) break;
              }
              let base = [255, 255, 255];
              if (layers.length && layers[layers.length - 1][3] >= 1) base = layers.pop().slice(0, 3);
              for (let i = layers.length - 1; i >= 0; i--) {
                const [r, g, b, a] = layers[i];
                base = [
                  Math.round(r * a + base[0] * (1 - a)),
                  Math.round(g * a + base[1] * (1 - a)),
                  Math.round(b * a + base[2] * (1 - a)),
                ];
              }
              return base;
            };

            // Leaf text nodes only: an ancestor's computed colour says nothing
            // about what the visible text actually renders as.
            const leaves = [...document.querySelectorAll("body *")].filter((el) => {
              if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return false;
              const ownsText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
              if (!ownsText) return false;
              const style = getComputedStyle(el);
              return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0.1;
            });

            const failures = [];
            for (const el of leaves) {
              const style = getComputedStyle(el);
              const fg = parse(style.color);
              if (!fg) continue;
              const size = parseFloat(style.fontSize);
              const weight = Number(style.fontWeight) || 400;
              const floor = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
              const bg = backdrop(el);
              // Text with its own alpha composites over the same backdrop.
              const effective =
                fg[3] != null && fg[3] < 1
                  ? [
                      Math.round(fg[0] * fg[3] + bg[0] * (1 - fg[3])),
                      Math.round(fg[1] * fg[3] + bg[1] * (1 - fg[3])),
                      Math.round(fg[2] * fg[3] + bg[2] * (1 - fg[3])),
                    ]
                  : fg.slice(0, 3);
              const value = ratio(effective, bg);
              if (value < floor - 0.01) {
                failures.push({ text: (el.textContent || "").trim().slice(0, 44), value: Math.round(value * 100) / 100, floor });
              }
            }

            return {
              overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
              failures: failures.slice(0, 4),
              failureCount: failures.length,
            };
          });
          if (outcome.overflow > 1) {
            record("R19 overflow", "error", `${path} @${viewport.name}`, outcome.overflow, `${outcome.overflow}px horizontal overflow`);
          }
          for (const failure of outcome.failures) {
            record("R20 contrast", "error", `${path} @${viewport.name}`, 0, `${failure.value}:1 (min ${failure.floor}) — "${failure.text}"`);
          }
        } catch (error) {
          record("R21 visual-run", "error", `${path} @${viewport.name}`, 0, error.message);
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return true;
}

// ─── Self-test ───────────────────────────────────────────────────────────────
// A green audit is worthless if a rule silently never matches — which is exactly
// how two bugs hid here (a hex matched inside a comment, and a per-file
// allowlist that was silencing the wrong rule). Every predicate gets a bad
// sample it must flag and a good sample it must pass.
const selfTest = () => {
  const cases = [
    ["R1 legacy-palette", (t) => (TOKEN_DEFINITION.test(t) ? false : LEGACY.exec(t)), "color:#FF6B35", "color:#005148"],
    ["R1 token-definition exempt", (t) => (TOKEN_DEFINITION.test(t) ? false : LEGACY.exec(t)), "color: #DDE1E6", "  --gray-30: #DDE1E6;"],
    ["R2 marketing-uses-admin", (t) => /\b(bg|text)-(primary|gray-50)\b/.test(t), 'className="text-gray-50"', 'className="text-mk-ink"'],
    ["R3 admin-uses-marketing", (t) => /\b(bg|text|border)-(mk-[a-z-]+)\b/.test(t), 'className="bg-mk-paper"', 'className="bg-card"'],
    ["R4 raw-palette-grey", (t) => { const m = /\b(bg|text)-(gray)-(\d{2,3})\b/.exec(t); return Boolean(m) && !THEMED_GREYS.has(m[3]); }, 'className="text-gray-700"', 'className="text-gray-80"'],
    ["R5 raw-palette-hue", (t) => { const m = /\b(bg|text)-(emerald)-(\d{2,3})\b/.exec(t); return Boolean(m) && !/dark:/.test(t); }, "bg-emerald-500/10", "bg-emerald-500/10 dark:bg-emerald-500/15"],
    ["R6 prose-without-plugin", (t) => /\bprose(-[a-z]+)?\b/.test(t) && /className=/.test(t), 'className="prose prose-sm"', 'className="mk-article"'],
    ["R10 stale-logo", (t) => /logo\.webp/.test(t), 'icons: { apple: "/logo.webp" }', 'logo: "/creedava-logo.svg"'],
  ];
  const failures = cases.filter(([, test, bad, good]) => !test(bad) || test(good));
  if (failures.length) {
    console.error(`Self-test FAILED — predicate got it wrong: ${failures.map(([n]) => n).join(", ")}`);
    process.exit(2);
  }
  console.log(`Self-test: ${cases.length} rule predicates flag the bad sample and pass the good one.`);
};

// ─── Report ──────────────────────────────────────────────────────────────────
const main = async () => {
  selfTest();

  if (WANT_LIVE) {
    try {
      await fetch(`${BASE_URL}/robots.txt`);
    } catch {
      console.error(`Cannot reach ${BASE_URL}. Start the app first (npm run dev).`);
      process.exit(2);
    }
    await live();
  }

  if (WANT_VISUAL) await visual();

  const errors = results.filter((r) => r.level === "error");
  const warnings = results.filter((r) => r.level === "warning");
  const byRule = new Map();
  for (const r of results) byRule.set(r.rule, [...(byRule.get(r.rule) ?? []), r]);

  console.log(`\nDesign-system audit — ${FILES.length} files${WANT_LIVE ? ` + ${ROUTES.length} routes @ ${BASE_URL}` : ""}\n`);
  console.log("rule                                   errors  warnings");
  console.log("─".repeat(60));
  for (const [rule, items] of [...byRule].sort()) {
    const e = items.filter((i) => i.level === "error").length;
    const w = items.length - e;
    console.log(`${rule.padEnd(38)} ${String(e).padStart(6)} ${String(w).padStart(9)}`);
  }
  console.log("─".repeat(60));
  console.log(`${"TOTAL".padEnd(38)} ${String(errors.length).padStart(6)} ${String(warnings.length).padStart(9)}`);

  const show = (label, items) => {
    if (!items.length) return;
    console.log(`\n${label}`);
    const grouped = new Map();
    for (const i of items) grouped.set(i.file, [...(grouped.get(i.file) ?? []), i]);
    for (const [file, list] of [...grouped].sort()) {
      console.log(`  ${file}`);
      const seen = new Set();
      for (const i of list) {
        const key = `${i.message}${i.line}`;
        if (seen.has(key)) continue;
        seen.add(key);
        console.log(`    ${i.line ? `L${i.line}: ` : ""}${i.message}`);
      }
    }
  };

  show("ERRORS", errors);
  show("WARNINGS", warnings);
  if (!results.length) console.log("\nClean — no violations.\n");

  const failed = errors.length > 0 || (STRICT && warnings.length > 0);
  console.log(failed ? "\nFAIL\n" : "\nPASS\n");
  process.exit(failed ? 1 : 0);
};

main();
