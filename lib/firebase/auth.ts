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

/**
 * Sign in with Google using redirect flow only.
 *
 * Popup auth is intentionally avoided because modern browser privacy policies
 * can block popup/iframe handshakes and produce intermittent internal errors
 * on production domains.
 */
export async function signInWithGoogle(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Check for redirect result on page load.
 * Call this once in the auth state listener setup.
 */
export async function checkRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (error) {
    console.error("[Auth] Redirect result error:", error);
    return null;
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
  return firebaseOnAuthStateChanged(auth, callback);
}

export type { User };
