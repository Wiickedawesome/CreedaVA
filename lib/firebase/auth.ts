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

export async function signInWithGoogle(): Promise<void> {
  // For localhost, use redirect-based sign-in to avoid third-party cookie issues
  // with the Firebase Auth iframe. For production domains, popup would work.
  const isLocalhost = typeof window !== "undefined" && 
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (isLocalhost) {
    // Use redirect for localhost to avoid iframe/cookie blocking issues
    await signInWithRedirect(auth, googleProvider);
    return;
  }

  try {
    // Production: use popup-based sign in
    await signInWithPopup(auth, googleProvider);
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;

    // If the popup was blocked or closed, fall back to redirect
    if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user") {
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    console.error("[Auth] Popup sign-in failed:", error);
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
