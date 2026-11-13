/**
 * Client-side writes for the `findings` collection.
 *
 * Shared by the findings list and the inline annotations on Gaps and Rankings,
 * so "Ignore" means exactly one thing wherever it appears.
 */

import { createWithId, getCollection, limit, update, where } from "@/lib/firebase/firestore";
import type { Finding, FindingStatus } from "@/lib/types/findings";

/** Set a finding's status, clearing the resolution fields when reopening it. */
export async function setFindingStatus(
  id: string,
  status: FindingStatus,
  resolvedBy = "admin",
): Promise<void> {
  const resolved = status !== "open";
  await update("findings", id, {
    status,
    resolvedAt: resolved ? new Date().toISOString() : null,
    resolvedBy: resolved ? resolvedBy : null,
  });
}

/**
 * Write a finding's suggested value into `page-seo`, then close it.
 *
 * Recorded as `resolved` rather than deleted: the next crawl either confirms it
 * by not re-detecting the code, or reopens it if the value still fails.
 */
export async function applySuggestion(finding: Finding): Promise<void> {
  const suggestion = finding.suggested;
  if (!suggestion) return;

  const { getDocs, query } = await import("firebase/firestore");
  const matches = await getDocs(
    query(getCollection("page-seo"), where("path", "==", finding.target), limit(1)),
  );

  // Reuse the path's row when one exists, so the metadata editor and this fix
  // cannot end up maintaining two documents for the same page.
  const existingId = matches.empty ? null : matches.docs[0].id;
  await createWithId(
    "page-seo",
    existingId ?? `page-seo_${finding.target.replace(/[^a-z0-9]/gi, "_")}`,
    existingId
      ? { [suggestion.field]: suggestion.value }
      : { path: finding.target, [suggestion.field]: suggestion.value },
  );

  await setFindingStatus(finding.id, "resolved", "fix-applied");
}
