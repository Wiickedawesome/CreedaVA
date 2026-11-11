"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithGoogle,
  signOut,
  type User,
} from "./auth";
import { FirebaseInit } from "./firebase-init";

/**
 * Where the visitor stands, from the app's point of view rather than the
 * SDK's.
 *
 * `anonymous` is the only state that means "show the login page". The distinct
 * `checking` state exists because the client SDK can report no user for reasons
 * that have nothing to do with being signed out — see `restoreSession`.
 */
export type AuthStatus = "checking" | "authenticated" | "anonymous";

interface AuthContextType {
  user: User | null;
  /** True until the real status is known. Kept for the existing consumers. */
  loading: boolean;
  status: AuthStatus;
  signIn: () => Promise<User>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Refresh the httpOnly session cookie from a freshly signed-in user.
 *
 * Only ever writes. It must never clear the cookie: the client SDK having no
 * user does not mean the session cookie is wrong — browser storage can be
 * restricted, and then this would delete a perfectly valid session on every
 * page load, which is exactly how a login loop starts. Clearing belongs to
 * `logOut`, where the intent is explicit.
 */
async function syncSessionCookie(user: User) {
  try {
    const token = await user.getIdToken();
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch (error) {
    console.error("Failed to sync session cookie:", error);
  }
}

/** Ask the server who we are, per the session cookie. Returns null if nobody. */
async function fetchRestoreToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/session");
    if (!res.ok) return null;
    const data = (await res.json()) as { customToken?: string };
    return data.customToken ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");
  const restoredRef = useRef(false);
  // Track the previous UID so we only sync the session cookie when the user
  // identity actually changes (sign-in / sign-out), not on every silent
  // hourly token refresh that also triggers onAuthStateChanged.
  const prevUidRef = useRef<string | null | undefined>(undefined);

  /**
   * Rebuild the client session from the httpOnly cookie.
   *
   * The SDK normally restores the user from IndexedDB on load. When that store
   * is empty — third-party storage restrictions are the usual cause — the SDK
   * reports no user even though the visitor holds a valid session. Rather than
   * bounce them to the login page, trade the cookie for a custom token and log
   * the client back in. A 401 here is the genuine "signed out" answer.
   */
  async function restoreSession() {
    const customToken = await fetchRestoreToken();
    if (!customToken) {
      setStatus("anonymous");
      return;
    }

    try {
      await signInWithCustomToken(customToken);
      // onAuthStateChanged fires with the user and sets `authenticated`.
    } catch (error) {
      // The cookie is valid but the client could not be rebuilt. Do not sign
      // the visitor out over it: the server session still authorises access.
      console.error("Failed to restore client session:", error);
      setStatus("anonymous");
    }
  }

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      if (!active) return;
      setUser(firebaseUser);

      if (firebaseUser) {
        setStatus("authenticated");
        if (firebaseUser.uid !== prevUidRef.current) {
          prevUidRef.current = firebaseUser.uid;
          void syncSessionCookie(firebaseUser);
        }
        return;
      }

      // No client user. Restore once; a later null means a real sign-out.
      if (restoredRef.current) {
        setStatus("anonymous");
        return;
      }
      restoredRef.current = true;
      void restoreSession();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function signIn() {
    try {
      return await signInWithGoogle();
    } catch (error) {
      console.error("Sign-in failed:", error);
      throw error;
    }
  }

  async function logOut() {
    try {
      await fetch("/api/session", { method: "DELETE" });
      await signOut();
      // Clear AI in-memory cache so next user doesn't see stale data
      import("./ai-lazy").then(({ lazyClearAICache }) => lazyClearAICache()).catch(() => {});
    } catch (error) {
      console.error("Sign-out failed:", error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading: status === "checking", status, signIn, logOut }}
    >
      <FirebaseInit />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
