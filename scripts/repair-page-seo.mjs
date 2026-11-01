/**
 * Repair the `page-seo` collection after the on-page audit bug.
 *
 * The audit crawler used to read <script> contents as body text, so generated
 * meta descriptions could contain inline JSON-LD. This script:
 *   - deletes the retired /pricing entry
 *   - removes descriptions / OG descriptions that contain JSON-LD
 *   - strips a duplicated "CreedaVA" brand from titles, falling back to the
 *     code default when the stored title carries no extra information
 *
 * The site already ignores corrupted values at read time, so running this is
 * about cleaning the stored data, not about fixing rendering.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     node scripts/repair-page-seo.mjs          # dry run
 *   ... --apply                                  # write changes
 */

import { applicationDefault, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const APPLY = process.argv.includes("--apply");
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "creeda-va";
const RETIRED_PATH = "/pricing";
const TEXT_FIELDS = ["description", "ogDescription"];
const TITLE_FIELDS = ["title", "ogTitle"];
const BRAND_PREFIX = /^CreedaVA\s*[|—–-]\s*/;
const BRAND_SUFFIX = /\s*[|—–-]\s*CreedaVA\s*$/;
const REMOVE = Symbol("remove");

function containsJsonLd(value) {
  return typeof value === "string" && value.includes('"@context"');
}

/**
 * Strip a duplicated brand from a stored title.
 * Returns the cleaned title, REMOVE when the title adds nothing over the code
 * default (empty, or just the page name), or null when it should stay as-is.
 */
function normalizeTitle(value) {
  if (typeof value !== "string" || value.trim() === "") return null;

  const stripped = value.replace(BRAND_PREFIX, "").replace(BRAND_SUFFIX, "").trim();
  if (!stripped.includes(" ")) return REMOVE;

  return stripped === value ? null : stripped;
}

async function main() {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();
  const snapshot = await db.collection("page-seo").get();

  let deleted = 0;
  let repaired = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (data.path === RETIRED_PATH) {
      console.log(`delete  ${doc.id} (${data.path})`);
      if (APPLY) await doc.ref.delete();
      deleted += 1;
      continue;
    }

    const update = {};
    for (const field of TEXT_FIELDS) {
      if (containsJsonLd(data[field])) update[field] = FieldValue.delete();
    }

    for (const field of TITLE_FIELDS) {
      const next = normalizeTitle(data[field]);
      if (next === REMOVE) update[field] = FieldValue.delete();
      else if (next) update[field] = next;
    }

    if (Object.keys(update).length === 0) continue;

    console.log(`update  ${doc.id} (${data.path}) -> ${Object.keys(update).join(", ")}`);
    // Deleted fields fall back to the code defaults in getPageSEO.
    if (APPLY) await doc.ref.update(update);
    repaired += 1;
  }

  console.log(
    `\n${APPLY ? "Applied" : "Dry run"}: ${deleted} to delete, ${repaired} to repair, ${snapshot.size} scanned.`,
  );
  if (!APPLY) console.log("Re-run with --apply to write changes.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
