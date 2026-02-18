export { app, auth, db, storage, getGA4, logGA4Event } from "./config";
export { signInWithGoogle, signOut, onAuthStateChanged, checkRedirectResult } from "./auth";
export type { User } from "./auth";
export { AuthProvider, useAuth } from "./auth-context";
export {
  fetchAll,
  fetchOne,
  create,
  update,
  remove,
  subscribe,
  where,
  orderBy,
  limit,
} from "./firestore";

export { trackEvent, fetchAnalyticsEvents } from "./analytics";
export type { AnalyticsEvent, AnalyticsSummary } from "./analytics";

// ─── New Firebase integrations ───────────────────────
export { initializeAppCheck } from "./app-check";
export { initializePerformance, startTrace, measureAsync } from "./performance";
export {
  activateRemoteConfig,
  getConfigString,
  getConfigNumber,
  getConfigBoolean,
  isFeatureEnabled,
  getSupportedLocales,
} from "./remote-config";
export type { RemoteConfigKey } from "./remote-config";
export { FirebaseInit } from "./firebase-init";

// AI functions are NOT re-exported here to avoid pulling the heavy
// firebase/ai SDK into every admin page bundle.
// Import directly from "@/lib/firebase/ai" only in pages that need AI.

// Cloud Functions are NOT re-exported here — import from
// "@/lib/firebase/cloud-functions" only in pages that call them.

// FCM messaging — import from "@/lib/firebase/messaging" only in pages
// that need push notifications (admin dashboard).

// Trigger Email — import from "@/lib/firebase/trigger-email" only in
// pages/functions that queue emails.
