import { EMAIL_LOGO_PNG_BASE64 } from "@/lib/brand/email-logo";

/**
 * The brand mark as a PNG, so transactional email has a logo it can render.
 *
 * Reached at `/logo.png` — the URL the survey email template uses. Served from
 * a route rather than `public/` because App Hosting only ships the public files
 * its build traces; a plain asset in `public/` returns 404 in production.
 * See `lib/brand/email-logo.ts`.
 *
 * Static by design: no request input, so Next prerenders it at build time.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(Buffer.from(EMAIL_LOGO_PNG_BASE64, "base64"), {
    headers: {
      "Content-Type": "image/png",
      // The URL is not content-hashed, so keep the window modest — replacing
      // the logo should not take a month to reach inboxes.
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
