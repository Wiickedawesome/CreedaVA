// Firebase configuration
// Get values from: Firebase Console → Project Settings → Your apps → Web app

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import type { Analytics } from "firebase/analytics";

// For production on modern hosting (Vercel/App Hosting), force the use of
// the firebaseapp.com domain for auth to avoid rewrite issues & 404s.
// The custom domain logic only works if hosting rewrites are perfectly configured
// to proxy /__/auth/handler, which is often broken.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  // FORCE the native Firebase domain for auth handler to bypass custom domain rewrite issues
  authDomain: "creeda-va.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

/**
 * The client SDK only works in the browser; server code must use the Admin SDK
 * (lib/firebase-admin). On the server these exports are placeholders that throw
 * a descriptive error on first use, instead of handing out `{}` and failing
 * later with a confusing "x.collection is not a function".
 */
function clientOnly<T extends object>(name: string): T {
  return new Proxy({} as T, {
    get() {
      throw new Error(
        `Firebase ${name} is browser-only. Use the Admin SDK (lib/firebase-admin) in server code.`,
      );
    },
  });
}

const isBrowser = typeof window !== "undefined";

// Initialize Firebase (client-side only)
const app: FirebaseApp = isBrowser
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp()
  : clientOnly<FirebaseApp>("app");

const auth: Auth = isBrowser ? getAuth(app) : clientOnly<Auth>("auth");
const db: Firestore = isBrowser ? getFirestore(app) : clientOnly<Firestore>("db");
const storage: FirebaseStorage = isBrowser
  ? getStorage(app)
  : clientOnly<FirebaseStorage>("storage");

// ─── GA4 Analytics ───────────────────────────────────
// Lazy-init: only in browser, only when supported
let _analytics: Analytics | null = null;

async function getGA4(): Promise<Analytics | null> {
  if (!isBrowser) return null;
  if (_analytics) return _analytics;
  const { isSupported, getAnalytics } = await import("firebase/analytics");
  const supported = await isSupported();
  if (!supported) return null;
  _analytics = getAnalytics(app);
  return _analytics;
}

/** Log a GA4 event alongside custom Firestore analytics */
async function logGA4Event(
  eventName: string,
  params?: Record<string, unknown>,
): Promise<void> {
  const analytics = await getGA4();
  if (analytics) {
    const { logEvent } = await import("firebase/analytics");
    logEvent(analytics, eventName, params);
  }
}

export { app, auth, db, storage, getGA4, logGA4Event };
