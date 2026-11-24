import { socialCard } from "@/lib/brand/social-card";
import { socialCardFor } from "@/lib/brand/social-cards";

/**
 * Social card endpoint — `/share` for the default, `/share/<page>` for a page.
 *
 * Why a route handler instead of the `opengraph-image` file convention:
 * Next appends a build hash to the file-convention URL
 * (`/services/opengraph-image-jzy3lm`, measured), so `lib/firebase/seo.ts`
 * cannot reference it. Worse, an explicit `openGraph.images` in a page's
 * metadata WINS over the file convention — measured on `/services`, which kept
 * emitting the root card even with its own `opengraph-image.tsx` present.
 * Serving from a stable URL lets `getPageSEO()` choose the card per page.
 *
 * Node runtime, not edge: the mark is read from disk.
 */
export const runtime = "nodejs";

/** Served once per card version; the markup only changes on deploy. */
const CACHE_CONTROL = "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const { path } = await params;
  const route = path?.length ? `/${path.join("/")}` : "/";

  const card = socialCard(socialCardFor(route));
  card.headers.set("Cache-Control", CACHE_CONTROL);
  return card;
}
