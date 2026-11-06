/**
 * Regenerate `app/favicon.ico` from the current brand mark.
 *
 * Why this exists: the committed icon was a multi-colour pinwheel from the
 * pre-redesign identity — blue, orange, pink — while the site is now green and
 * cream. Browsers trust `/favicon.ico` over the `icon.svg` link in enough
 * contexts (bookmarks, some extension surfaces, older engines) that leaving it
 * stale kept surfacing the old logo.
 *
 * Run with:  node scripts/build-favicon.mjs
 * Output:    app/favicon.ico  (16 / 32 / 48 px, PNG-compressed entries)
 *
 * Uses the `sharp` already present for `next/image` — no new dependency. The
 * mark's gradient is flattened to solid --mk-brand, because a gradient turns to
 * mud at 16 px.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "public", "creedava-mark.svg");
const OUT = path.join(ROOT, "app", "favicon.ico");

const SIZES = [16, 32, 48];
/** Padding as a fraction of the icon, so the mark does not touch the edge. */
const PADDING_RATIO = 0.08;

const svg = await readFile(SOURCE, "utf8");
// `public/creedava-mark.svg` paints `fill="url(#markGrad)"` with a blue→teal
// ramp. Swapping the reference for one hex is the whole flatten.
const flatSvg = Buffer.from(svg.replace(/url\(#markGrad\)/g, "#005148"));

/** One square icon at `size` px, transparent beyond the mark. */
async function renderIcon(size) {
  const inner = Math.round(size * (1 - PADDING_RATIO * 2));

  const glyph = await sharp(flatSvg, { density: 600 })
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const offset = Math.round((size - inner) / 2);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: glyph, left: offset, top: offset }])
    .png()
    .toBuffer();
}

/** Assemble PNG entries into an ICO container — accepted by every current browser. */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const directory = entries.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size % 256, 0); // width  (0 means 256)
    entry.writeUInt8(size % 256, 1); // height
    entry.writeUInt8(0, 2); // palette colours
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...directory, ...entries.map((e) => e.data)]);
}

const entries = [];
for (const size of SIZES) {
  entries.push({ size, data: await renderIcon(size) });
}

await writeFile(OUT, buildIco(entries));

const totalKb = entries.reduce((sum, e) => sum + e.data.length, 0) / 1024;
console.log(`favicon.ico written — ${SIZES.join("/")} px, ${totalKb.toFixed(1)} kB`);
