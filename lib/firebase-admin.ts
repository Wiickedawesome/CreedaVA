/**
 * Firebase Admin SDK — server-side only.
 *
 * Used exclusively in Next.js API routes and Server Actions (never imported
 * by client components). On Firebase App Hosting, Application Default
 * Credentials are available automatically — no explicit serviceAccount needed.
 * Local production builds can check canUseAdminDb before prerender-time reads.
 *
 * Import ONLY from server files:
 *   import { adminAuth } from "@/lib/firebase-admin";
 */

import admin from "firebase-admin";

const hasExplicitAdminCredentials = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.K_SERVICE ||
  process.env.FIREBASE_CONFIG,
);

export const canUseAdminDb = !(
  process.env.NEXT_PHASE === "phase-production-build" &&
  !hasExplicitAdminCredentials
);

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // For local development, use environment variables if available
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  const credential = serviceAccount
    ? admin.credential.cert(serviceAccount)
    : admin.credential.applicationDefault();

  return admin.initializeApp({
    credential,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const app = getAdminApp();

/** Firebase Admin Auth — use to verify ID tokens server-side */
export const adminAuth = admin.auth(app);

/** Firebase Admin Firestore — use in API routes that need elevated access */
export const adminDb = admin.firestore(app);
