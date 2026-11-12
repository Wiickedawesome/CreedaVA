"use client";

import { OnPageAuditsList } from "../onpage-audits";

/**
 * Findings — what the crawler measured on the live site.
 *
 * This is the output of the `onpage` skill: real HTTP fetches of every sitemap
 * URL, scored from the returned HTML. It feeds `page-seo` (what Page Metadata
 * shows) and the weekly synthesizer (which turns high-severity issues into
 * action items), so it is the source of truth for "what is wrong on this page".
 *
 * A second source used to sit here — a "One-off AI reviews" table reading the
 * `seo` collection. Nothing writes that collection any more (no function, no
 * app code), and the two documents left were a stale `/join` review plus one
 * whose `url` was a prompt string. A table of data no process produces is not a
 * finding, so it is gone; the digest still passes `seo` as model context.
 */
export function FindingsSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-50">
        Measured on the live site by the weekly crawl — the same numbers Page Metadata
        uses to decide whether a stored title or description is safe to serve.
      </p>
      <OnPageAuditsList />
    </div>
  );
}
