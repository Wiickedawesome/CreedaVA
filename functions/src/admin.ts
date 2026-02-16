/**
 * Shared Firebase Admin + config helpers for Cloud Functions.
 */

import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";

// Initialize Firebase Admin (auto-detects credentials in Cloud Functions)
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();

/**
 * Fetch an integration config value from Firestore "integrations" collection.
 * Config docs: { provider: string, enabled: boolean, config: {...} }
 */
export async function getIntegrationConfig(
  provider: string,
): Promise<{ enabled: boolean; config: Record<string, string> } | null> {
  // Try doc ID first (new format), then query by provider field (legacy random IDs)
  let doc = await db.collection("integrations").doc(provider).get();
  if (!doc.exists) {
    const query = await db.collection("integrations").where("provider", "==", provider).limit(1).get();
    if (query.empty) return null;
    doc = query.docs[0];
  }
  const data = doc.data()!;
  return {
    enabled: data.enabled ?? false,
    config: data.config ?? {},
  };
}

/**
 * Verify the request comes from an authenticated @creedava.com user.
 * For onCall functions, pass request.auth?.token?.email directly.
 * For HTTP functions, pass the raw ID token string.
 */
export function verifyAdminEmail(email: string | undefined): void {
  if (!email?.endsWith("@creedava.com")) {
    throw new HttpsError("permission-denied", "Must be @creedava.com");
  }
}

/**
 * Legacy: Verify via raw ID token (for HTTP endpoints only).
 */
export async function verifyAdmin(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const decoded = await auth.verifyIdToken(idToken);
  if (!decoded.email?.endsWith("@creedava.com")) {
    throw new Error("Unauthorized: must be a @creedava.com user");
  }
  return decoded;
}
