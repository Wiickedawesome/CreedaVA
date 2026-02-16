"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  forumSignUp,
  forumSignIn,
  forumSignOut,
  onForumAuthStateChanged,
  getForumProfile,
  updateForumProfile,
  type User,
  type ForumSignUpData,
} from "@/lib/firebase/forum-auth";
import type { ForumProfile } from "@/lib/types/content";

interface ForumAuthContextType {
  user: User | null;
  profile: (ForumProfile & { id: string }) | null;
  loading: boolean;
  signUp: (data: ForumSignUpData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  updateProfile: (data: Partial<Pick<ForumProfile, "displayName" | "bio" | "avatar">>) => Promise<void>;
}

const ForumAuthContext = createContext<ForumAuthContextType | null>(null);

export function ForumAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<(ForumProfile & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onForumAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const p = await getForumProfile(firebaseUser.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signUp(data: ForumSignUpData) {
    await forumSignUp(data);
  }

  async function signIn(email: string, password: string) {
    await forumSignIn(email, password);
  }

  async function logOut() {
    await forumSignOut();
    setProfile(null);
  }

  async function handleUpdateProfile(
    data: Partial<Pick<ForumProfile, "displayName" | "bio" | "avatar">>,
  ) {
    if (!profile) return;
    await updateForumProfile(profile.id, data);
    setProfile((prev) => (prev ? { ...prev, ...data } : prev));
  }

  return (
    <ForumAuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        logOut,
        updateProfile: handleUpdateProfile,
      }}
    >
      {children}
    </ForumAuthContext.Provider>
  );
}

export function useForumAuth() {
  const context = useContext(ForumAuthContext);
  if (!context) {
    throw new Error("useForumAuth must be used within a ForumAuthProvider");
  }
  return context;
}
