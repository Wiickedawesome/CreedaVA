import {
  signInWithRedirect,
  getRedirectResult,
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
  // Always use redirect-based sign-in. Popup-based sign-in fails on production
  // domains because modern browsers (Firefox dynamic state partitioning, Chrome
  // third-party cookie restrictions) block the Firebase Auth iframe hosted on
  // creeda-va.firebaseapp.com from accessing its cookies, producing
  // auth/internal-error. Redirect-based sign-in navigates the full page to
  // Google and back, so it never touches third-party cookies.
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Check for redirect result on page load.
 * Call this once in the auth state listener setup.
 * Throws on Firebase auth errors so callers can surface them to the user.
 */
export async function checkRedirectResult(): Promise<User | null> {
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
  return firebaseOnAuthStateChanged(auth, callback);
}

export type { User };
