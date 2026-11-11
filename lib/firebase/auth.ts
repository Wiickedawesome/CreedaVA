import {
  signInWithPopup,
  signInWithCustomToken as firebaseSignInWithCustomToken,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
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
