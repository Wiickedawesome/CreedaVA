/**
 * /api/brand/marketing — render one marketing graphic as a PNG.
 *
 * The studio previews and downloads the same URL, so what you see is what you
 * get: no client-side canvas, no second render path to drift.
 *
 * Every value comes from the query string, so this is an admin-authenticated
 * endpoint rather than a public one — otherwise anyone could render a
 * CreedaVA-branded image with words we never chose and post it as ours.
 * It is also `no-store`: an authenticated image must never be cached by a CDN.
 *
 * Node runtime, not edge: the brand mark is read from disk.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUidFromSession } from "@/lib/firebase/admin-session";
import { marketingImage } from "@/lib/brand/marketing-image";
import {
  FORMATS,
  LIMITS,
  isFormat,
  isTemplateId,
  type MarketingCopy,
} from "@/lib/brand/marketing-templates";

export const runtime = "nodejs";

/** Authenticated content — never share a cache entry with another request. */
const CACHE_CONTROL = "private, no-store";

/** One line per item, trimmed, blanks dropped, capped. */
function parseItems(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, LIMITS.items)
    .map((line) => line.slice(0, LIMITS.item));
}

function text(raw: string | null, max: number): string {
  return (raw ?? "").trim().slice(0, max);
}

export async function GET(req: NextRequest): Promise<Response> {
  const uid = await getAdminUidFromSession();
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const template = params.get("template") ?? "";
  const format = params.get("format") ?? "";

  if (!isTemplateId(template) || !isFormat(format)) {
    return NextResponse.json(
      {
        error: `Unknown template or format. Templates: ${Object.keys(FORMATS).length} sizes available.`,
      },
      { status: 400 },
    );
  }

  const copy: MarketingCopy = {
    eyebrow: text(params.get("eyebrow"), LIMITS.eyebrow),
    headline: text(params.get("headline"), LIMITS.headline),
    supporting: text(params.get("supporting"), LIMITS.supporting),
    items: parseItems(params.get("items")),
    cta: text(params.get("cta"), LIMITS.cta),
    footnote: text(params.get("footnote"), LIMITS.footnote),
  };

  // An empty card is a bug in the caller, not a design. Say so rather than
  // returning a blank PNG that looks like a rendering failure.
  if (!copy.headline && copy.items.length === 0) {
    return NextResponse.json(
      { error: "Provide a headline, or at least one list item" },
      { status: 400 },
    );
  }

  try {
    const image = marketingImage(template, format, copy);
    image.headers.set("Cache-Control", CACHE_CONTROL);
    return image;
  } catch (err) {
    console.error("[/api/brand/marketing] render failed:", err);
    return NextResponse.json({ error: "Could not render that image" }, { status: 500 });
  }
}
