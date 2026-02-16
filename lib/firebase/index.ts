export { app, auth, db, storage, getGA4, logGA4Event } from "./config";
export { signInWithGoogle, signOut, onAuthStateChanged } from "./auth";
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

// AI functions are NOT re-exported here to avoid pulling the heavy
// firebase/ai SDK into every admin page bundle.
// Import directly from "@/lib/firebase/ai" only in pages that need AI.

// Cloud Functions are NOT re-exported here — import from
// "@/lib/firebase/cloud-functions" only in pages that call them.
