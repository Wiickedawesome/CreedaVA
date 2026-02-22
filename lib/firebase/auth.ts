import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

// Restrict to your Google Workspace domain
googleProvider.setCustomParameters({
  hd: "creedava.com",
  prompt: "select_account",
});

export async function signInWithGoogle(): Promise<void> {
  // Use popup-based sign-in. authDomain is set to the custom domain (creedava.com)
  // so the popup runs in a first-party context — no third-party cookie restrictions
  // and no dependency on the /__/auth/ reverse-proxy that Firebase Hosting
  // provides but App Hosting does not configure automatically.
  await signInWithPopup(auth, googleProvider);
}

/**
 * No-op kept for interface compatibility.
 * Redirect sign-in is no longer used — this always returns null.
 */
export async function checkRedirectResult(): Promise<User | null> {
  return null;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
  return firebaseOnAuthStateChanged(auth, callback);
}

export type { User };
