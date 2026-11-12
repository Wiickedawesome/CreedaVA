import { Suspense } from "react";
import KeywordsSection from "./_components/keywords-section";

/**
 * Keywords — top-level admin page (Analytics group).
 *
 * Not an SEO-Hub tab: this surface is the agent's *input*. `keyword-gaps` and
 * `serp-analysis` both read the `keywords` collection before they can run, so
 * the list the operator curates here decides what the agent measures.
 */
export default function KeywordsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-gray-50">
          Loading keywords…
        </div>
      }
    >
      <KeywordsSection />
    </Suspense>
  );
}
