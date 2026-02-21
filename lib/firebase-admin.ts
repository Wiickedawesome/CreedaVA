/**
 * Firebase Admin SDK — server-side only.
 *
 * Used exclusively in Next.js API routes and Server Actions (never imported
 * by client components). On Firebase App Hosting, Application Default
 * Credentials are available automatically — no explicit serviceAccount needed.
 *
 * Import ONLY from server files:
 *   import { adminAuth } from "@/lib/firebase-admin";
 */

import admin from "firebase-admin";

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }
  return admin.initializeApp();
}

const app = getAdminApp();

/** Firebase Admin Auth — use to verify ID tokens server-side */
export const adminAuth = admin.auth(app);

/** Firebase Admin Firestore — use in API routes that need elevated access */
export const adminDb = admin.firestore(app);
