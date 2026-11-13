/**
 * Finding document ids.
 *
 * Kept in its own module with **no imports** on purpose: the app-side parity
 * test imports this file across the `functions/` boundary, and the App Hosting
 * build only installs root dependencies. Anything imported here would have to
 * resolve without `functions/node_modules`, so nothing here may reach
 * `../admin` or `firebase-functions`.
 */

export type FindingScope = "page" | "keyword" | "domain";

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "root"
  );
}

/**
 * Stable id so a rerun upserts the same doc instead of appending a copy.
 *
 * Truncated to stay inside Firestore's 1500-byte document id limit even for a
 * 400-character keyword.
 */
export function findingId(scope: FindingScope, target: string, code: string): string {
  return `${scope}__${slug(target)}__${slug(code)}`.slice(0, 380);
}
