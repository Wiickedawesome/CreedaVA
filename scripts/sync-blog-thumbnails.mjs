#!/usr/bin/env node
/**
 * Keeps the blog thumbnail allow-list in one place.
 *
 * `lib/constants/blog-images.ts` is the source of truth — the admin app imports
 * it directly. `functions/` is a separate TypeScript project (`rootDir: "src"`)
 * so its copy in `functions/src/seo/thumbnails.ts` cannot import from `lib/`.
 * That copy is therefore **generated** from the source file by this script.
 *
 * Usage:
 *   node scripts/sync-blog-thumbnails.mjs           # regenerate the functions copy
 *   node scripts/sync-blog-thumbnails.mjs --check   # fail if the copy has drifted
 *
 * Exit codes: 0 ok, 1 drift (with --check) or unparseable source, 2 script problem.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SOURCE_FILE = join(ROOT, "lib/constants/blog-images.ts");
const TARGET_FILE = join(ROOT, "functions/src/seo/thumbnails.ts");
const CHECK_ONLY = process.argv.includes("--check");

// ─── Parse the source list ───────────────────────────────────────────────────

/**
 * Pull `THUMBNAIL_PHOTOS` out of the source file.
 *
 * The file is TypeScript, but the array is a literal of plain strings, so a
 * narrow bracket scan is enough — and it fails loudly rather than guessing.
 */
function parsePhotos(source) {
  const declaration = source.indexOf("THUMBNAIL_PHOTOS");
  if (declaration === -1) {
    throw new Error("THUMBNAIL_PHOTOS not found in lib/constants/blog-images.ts");
  }

  const open = source.indexOf("[", source.indexOf("=", declaration));
  const close = source.indexOf("\n];", open);
  if (open === -1 || close === -1) {
    throw new Error("could not locate the THUMBNAIL_PHOTOS array bounds");
  }

  const objects = source.slice(open, close).match(/\{[\s\S]*?\}/g) ?? [];
  if (objects.length === 0) {
    throw new Error("THUMBNAIL_PHOTOS parsed to zero entries");
  }

  const photos = objects.map((object, index) => {
    const id = object.match(/id:\s*"([^"]+)"/)?.[1];
    const label = object.match(/label:\s*"([^"]+)"/)?.[1];
    const keywordBlock = object.match(/keywords:\s*\[([\s\S]*?)\]/)?.[1];

    if (!id || !label || keywordBlock === undefined) {
      throw new Error(`entry ${index + 1} is missing an id, label, or keywords`);
    }

    const keywords = keywordBlock
      .split(",")
      .map((keyword) => keyword.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);

    if (keywords.length === 0) {
      throw new Error(`"${id}" has no keywords — it could never be scored`);
    }

    // A repeated keyword double-counts in pickFeaturedImage's scoring, which
    // silently skews which photo wins. Catch it at the source.
    const duplicate = keywords.find((k, i) => keywords.indexOf(k) !== i);
    if (duplicate) {
      throw new Error(`"${id}" lists "${duplicate}" more than once`);
    }

    return { id, label, keywords };
  });

  const ids = photos.map((photo) => photo.id);
  const repeatedId = ids.find((id, i) => ids.indexOf(id) !== i);
  if (repeatedId) {
    throw new Error(`photo id "${repeatedId}" appears more than once`);
  }

  return photos;
}

// ─── Render the generated module ─────────────────────────────────────────────

function renderModule(photos) {
  const entries = photos
    .map(
      (photo) =>
        `  { id: ${JSON.stringify(photo.id)}, label: ${JSON.stringify(photo.label)}, keywords: [${photo.keywords
          .map((keyword) => JSON.stringify(keyword))
          .join(", ")}] },`,
    )
    .join("\n");

  const sourceName = relative(ROOT, SOURCE_FILE).replace(/\\/g, "/");

  return `/**
 * Curated Unsplash thumbnails for SEO-agent-written blog drafts.
 *
 * ⚠️ GENERATED FILE — do not edit by hand.
 * Source of truth: \`${sourceName}\`
 * Regenerate with \`npm run sync:thumbnails\`; verify with
 * \`npm run sync:thumbnails:check\` (wired into \`check:preflight\`).
 *
 * This exists because \`functions/\` is a separate TypeScript project
 * (\`rootDir: "src"\`) and cannot import from the Next app's \`lib/\`.
 */

export interface ThumbnailPhoto {
  id: string;
  label: string;
  keywords: string[];
}

const THUMBNAIL_PHOTOS: ThumbnailPhoto[] = [
${entries}
];

const DEFAULT_PHOTO = THUMBNAIL_PHOTOS[0]!;
const UNSPLASH_BASE = "https://images.unsplash.com";

/** 16:9 to match the thumbnail containers on /news and /news/[slug]. */
export function thumbnailUrl(photoId: string): string {
  return \`\${UNSPLASH_BASE}/\${photoId}?w=1200&h=675&fit=crop&auto=format&q=80\`;
}

const APPROVED_URLS = new Set(THUMBNAIL_PHOTOS.map((p) => thumbnailUrl(p.id)));

/** Guard against the model inventing an arbitrary image URL. */
export function isApprovedThumbnail(url: unknown): boolean {
  return typeof url === "string" && APPROVED_URLS.has(url);
}

/** Deterministically pick the best-matching thumbnail for the given text. */
export function pickFeaturedImage(text: string): string {
  const haystack = text.toLowerCase();

  let best = DEFAULT_PHOTO;
  let bestScore = 0;

  for (const photo of THUMBNAIL_PHOTOS) {
    const score = photo.keywords.reduce(
      (total, keyword) => (haystack.includes(keyword) ? total + 1 : total),
      0,
    );
    if (score > bestScore) {
      best = photo;
      bestScore = score;
    }
  }

  return thumbnailUrl(best.id);
}

/** Human-readable allow-list injected into the writer prompt. */
export function thumbnailPromptList(): string {
  return THUMBNAIL_PHOTOS.map((p) => \`- \${thumbnailUrl(p.id)}  (\${p.label})\`).join("\\n");
}
`;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

function main() {
  const photos = parsePhotos(readFileSync(SOURCE_FILE, "utf8"));
  const rendered = renderModule(photos);
  const targetName = relative(ROOT, TARGET_FILE).replace(/\\/g, "/");

  if (CHECK_ONLY) {
    let current = "";
    try {
      current = readFileSync(TARGET_FILE, "utf8");
    } catch {
      console.error(`✖ ${targetName} is missing. Run: npm run sync:thumbnails`);
      process.exitCode = 1;
      return;
    }
    if (current !== rendered) {
      console.error(
        `✖ ${targetName} has drifted from lib/constants/blog-images.ts.\n` +
          `  Run: npm run sync:thumbnails`,
      );
      process.exitCode = 1;
      return;
    }
    console.log(`✔ thumbnail allow-list in sync (${photos.length} photos)`);
    return;
  }

  writeFileSync(TARGET_FILE, rendered, "utf8");
  console.log(`✔ wrote ${targetName} from ${photos.length} photos`);
}

try {
  main();
} catch (error) {
  console.error(`✖ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
