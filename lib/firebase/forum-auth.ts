import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./config";
import { create, fetchAll, update } from "./firestore";
import { where } from "firebase/firestore";
import type { ForumProfile } from "@/lib/types/content";

/**
 * Forum-only auth — email/password.
 * Separate from admin Google auth (which requires @creedava.com domain).
 */

export interface ForumSignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  country?: string;
  phone?: string;
}

export async function forumSignUp(
  data: ForumSignUpData,
): Promise<User> {
  const displayName = `${data.firstName} ${data.lastName}`;
  const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
  await updateProfile(result.user, { displayName });

  // Create forum profile doc (also serves as lead capture)
  await create<Omit<ForumProfile, "id" | "createdAt" | "updatedAt">>(
    "forumProfiles",
    {
      uid: result.user.uid,
      displayName,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company || "",
      country: data.country || "",
      phone: data.phone || "",
      bio: "",
      postCount: 0,
    },
  );

  return result.user;
}

export async function forumSignIn(
  email: string,
  password: string,
): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function forumSignOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onForumAuthStateChanged(
  callback: (user: User | null) => void,
) {
  return firebaseOnAuthStateChanged(auth, callback);
}

export async function getForumProfile(
  uid: string,
): Promise<(ForumProfile & { id: string }) | null> {
  const results = await fetchAll<ForumProfile>(
    "forumProfiles",
    where("uid", "==", uid),
  );
  return results[0] || null;
}

export async function updateForumProfile(
  docId: string,
  data: Partial<Pick<ForumProfile, "displayName" | "bio" | "avatar">>,
): Promise<void> {
  await update("forumProfiles", docId, data);
}

export type { User };
