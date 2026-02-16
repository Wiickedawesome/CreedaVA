/**
 * Shared Firebase Admin + config helpers for Cloud Functions.
 */

import * as admin from "firebase-admin";

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
  const doc = await db.collection("integrations").doc(provider).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    enabled: data.enabled ?? false,
    config: data.config ?? {},
  };
}

/**
 * Verify the request comes from an authenticated @creedava.com user.
 */
export async function verifyAdmin(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const decoded = await auth.verifyIdToken(idToken);
  if (!decoded.email?.endsWith("@creedava.com")) {
    throw new Error("Unauthorized: must be a @creedava.com user");
  }
  return decoded;
}
