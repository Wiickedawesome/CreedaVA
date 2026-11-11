import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCustomToken as firebaseSignInWithCustomToken,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
  type UserCredential,
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

// IMPORTANT: Do NOT set "hd: creedava.com" here unless you have G Suite (Google Workspace)
// and want to restrict sign-ins to ONLY that organization's accounts within the Google prompt itself.
// Many standard gmail accounts will fail if this parameter is present and incorrect.
// Instead, we can restrict domains in the signInWithGoogle function logic or Firestore rules.
// googleProvider.setCustomParameters({
//   prompt: "select_account",
// });

/**
 * Sign in with a Google popup.
 * authDomain must be creeda-va.firebaseapp.com so the popup loads
 * the /__/auth/handler served by Firebase Hosting. The result is
 * delivered back via postMessage — no cross-origin cookie issues.
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign in by navigating to the auth handler and back.
 *
 * The popup flow runs the Google GIS iframe, which needs third-party storage
 * on the auth domain. Embedded browsers and strict storage settings refuse
 * that and the popup fails with `auth/internal-error`, so the full-page
 * redirect is the fallback: it is a top-level navigation, so no third-party
 * storage is involved.
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Complete a sign-in that came back from `signInWithGoogleRedirect`.
 *
 * Returns null when this page load is not a redirect return, which is the
 * usual case. Must be awaited before deciding a visitor is signed out.
 */
export function readRedirectResult(): Promise<UserCredential | null> {
  return getRedirectResult(auth);
}

/**
 * Restore a client session from a token minted by /api/session.
 *
 * Used when the SDK comes back with no user after a reload — the httpOnly
 * session cookie still proves who the visitor is, so we do not need to ask
 * Google again.
 */
export async function signInWithCustomToken(token: string): Promise<User> {
  const result = await firebaseSignInWithCustomToken(auth, token);
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
  return firebaseOnAuthStateChanged(auth, callback);
}

export type { User };
