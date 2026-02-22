import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  hd: "creedava.com",
  prompt: "select_account",
});

/**
 * Sign in with a Google popup.
 * authDomain must be creeda-va.firebaseapp.com so the popup loads
 * the /__/auth/handler served by Firebase Hosting. The result is
 * delivered back via postMessage — no cross-origin cookie issues.
 */
export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
  return firebaseOnAuthStateChanged(auth, callback);
}

export type { User };
