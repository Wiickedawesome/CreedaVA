"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signInWithGoogle, signOut, checkRedirectResult, type User } from "./auth";
import { FirebaseInit } from "./firebase-init";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Sync the server-side session cookie with the current Firebase auth state */
async function syncSessionCookie(user: User | null) {
  try {
    if (user) {
      const token = await user.getIdToken();
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } else {
      await fetch("/api/session", { method: "DELETE" });
    }
  } catch (error) {
    console.error("Failed to sync session cookie:", error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Track the previous UID so we only sync the session cookie when the user
  // identity actually changes (sign-in / sign-out), not on every silent
  // hourly token refresh that also triggers onAuthStateChanged.
  const prevUidRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Check for redirect sign-in result (when popup was blocked)
    checkRedirectResult().then((redirectUser) => {
      if (redirectUser) {
        syncSessionCookie(redirectUser);
      }
    });

    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      const uid = firebaseUser?.uid ?? null;
      if (uid !== prevUidRef.current) {
        prevUidRef.current = uid;
        syncSessionCookie(firebaseUser);
      }
    });
    return unsubscribe;
  }, []);

  async function signIn() {
    try {
      const firebaseUser = await signInWithGoogle();
      await syncSessionCookie(firebaseUser);
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
    <AuthContext.Provider value={{ user, loading, signIn, logOut }}>
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
