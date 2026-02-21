import {
  signInWithPopup,
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
 * Sign in with Google — uses redirect flow as primary to avoid third-party
 * cookie/iframe blocking in modern browsers (Firefox, Chrome with
 * Privacy Sandbox). Popup is kept as fallback for environments that
 * handle redirects poorly (e.g. embedded WebViews).
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;

    // Fallback for environments where popups are blocked or unsupported.
    if (
      code === "auth/popup-blocked" ||
      code === "auth/web-storage-unsupported" ||
      code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, googleProvider);
      // Browser navigates away; keep current call pending until unload.
      return new Promise(() => {});
    }

    throw error;
  }
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
