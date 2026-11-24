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
 *            app/icon.svg     (the same tile, for engines that prefer SVG)
 *
 * The mark is drawn cream on a solid brand tile rather than green on
 * transparency. A transparent icon is composited onto the browser's own
 * background — white, black, or dark grey depending on theme — and a hairline
 * green C disappears at 16 px; measured, the transparent version read as an
 * empty box in a tab. The tile also matches `app/apple-icon.tsx`, which has
 * always been brand green with a cream C, so the tab, the home screen and the
 * mark now agree.
 *
 * Uses the `sharp` already present for `next/image` — no new dependency. The
 * mark's gradient is flattened to one ink colour, because a gradient turns to
 * mud at 16 px.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "public", "creedava-mark.svg");
const ICO_OUT = path.join(ROOT, "app", "favicon.ico");
const SVG_OUT = path.join(ROOT, "app", "icon.svg");

const SIZES = [16, 32, 48];
/** Tile ground — `--mk-brand`. */
const GROUND = "#005148";
/** Mark ink — `--mk-paper`. */
const INK = "#F7F7F2";
/** Mark size as a fraction of the tile, so the C keeps a margin on every side. */
const MARK_RATIO = 0.68;

const svg = await readFile(SOURCE, "utf8");
// `public/creedava-mark.svg` paints `fill="url(#markGrad)"` with a blue→teal
// ramp. Swapping the reference for one hex is the whole flatten.
const flatSvg = Buffer.from(svg.replace(/url\(#markGrad\)/g, INK));

/** Two decimals is more than enough for a 48 px tile, and keeps the SVG readable. */
function round(value) {
  return Math.round(value * 100) / 100;
}

/**
 * The same tile as an SVG, so a browser that supports SVG icons shows the
 * identical thing rather than falling back to the transparent source mark.
 *
 * The sources share a viewBox, so the square is the mark's taller side and the
 * artwork is scaled about its own centre.
 */
function buildTileSvg() {
  const [, x, y, width, height] = svg
    .match(/viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/)
    .map(Number);
  const side = Math.max(width, height);
  const left = round(x - (side - width) / 2);
  const top = round(y - (side - height) / 2);
  const centreX = round(x + width / 2);
  const centreY = round(y + height / 2);

  // Everything from the artwork group down — the <defs> gradient is dropped
  // because the fill is flattened above.
  const artwork = svg
    .slice(svg.indexOf("<g "), svg.lastIndexOf("</g>") + 4)
    .replace(/fill="url\(#markGrad\)"/, `fill="${INK}"`)
    .replace(
      "<g ",
      `<g transform="translate(${centreX} ${centreY}) scale(${MARK_RATIO}) ` +
        `translate(${-centreX} ${-centreY})" `,
    );

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${side} ${side}"
     width="${side}" height="${side}" role="img" aria-labelledby="title desc">
  <title id="title">CreedaVA</title>
  <desc id="desc">The CreedaVA C mark, cream on the brand green tile.</desc>
  <rect x="${left}" y="${top}" width="${side}" height="${side}" fill="${GROUND}"/>
  ${artwork}
</svg>
`;
}

/** One square icon at `size` px: brand ground, cream mark, no transparency. */
async function renderIcon(size) {
  const inner = Math.round(size * MARK_RATIO);

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
      background: GROUND,
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

await writeFile(ICO_OUT, buildIco(entries));
await writeFile(SVG_OUT, buildTileSvg());

const totalKb = entries.reduce((sum, e) => sum + e.data.length, 0) / 1024;
console.log(`favicon.ico written — ${SIZES.join("/")} px, ${totalKb.toFixed(1)} kB`);
console.log("icon.svg written — same tile, vector");
