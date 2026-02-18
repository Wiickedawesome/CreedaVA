// Firebase configuration
// Get values from: Firebase Console → Project Settings → Your apps → Web app

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  isSupported,
  type Analytics,
} from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Initialize Firebase only on the client-side
if (typeof window !== "undefined") {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
}

// ─── GA4 Analytics ───────────────────────────────────
// Lazy-init: only in browser, only when supported
let _analytics: Analytics | null = null;

async function getGA4(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (_analytics) return _analytics;
  const supported = await isSupported();
  if (!supported) return null;
  if (!app) return null;
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
    firebaseLogEvent(analytics, eventName, params);
  }
}

export { app, auth, db, storage, getGA4, logGA4Event };
