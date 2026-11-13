import { Suspense } from "react";
import MetadataSection from "./_components/metadata-section";

/**
 * Page Metadata — top-level admin page.
 *
 * Separate from the SEO hub because it controls the live <title> and meta
 * description of every marketing page. The agent's page-scoped findings are
 * listed beside it: an on-page issue is a fact about a path, so it belongs on
 * the screen that owns that path.
 *
 * Suspense is here rather than in the section because the section reads `?tab=`
 * to keep a finding deep-linkable.
 */
export default function PageMetadataPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-gray-50">
          Loading page metadata…
        </div>
      }
    >
      <MetadataSection />
    </Suspense>
  );
}
