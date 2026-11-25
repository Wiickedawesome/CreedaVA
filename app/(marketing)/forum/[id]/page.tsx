import type { Metadata } from "next";
import { cache } from "react";
import { adminDb, canUseAdminDb } from "@/lib/firebase-admin";
import { pageAlternates } from "@/lib/firebase/seo";
import { loadForumThread } from "@/lib/firebase/forum-server";
import ForumThreadContent from "./thread-content";

/**
 * The page and its metadata need the same thread, and run in one request.
 * Without this, every thread render costs two Firestore reads.
 */
const loadThread = cache(loadForumThread);

interface Props {
  params: Promise<{ id: string }>;
}

/** Pre-generate paths for all open forum threads */
export async function generateStaticParams() {
  if (!canUseAdminDb) return [];

  try {
    const snap = await adminDb
      .collection("forum")
      .where("status", "==", "open")
      .select()
      .get();
    return snap.docs.map((doc) => ({ id: doc.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const thread = await loadThread(id);
  const title = thread?.title || "Forum Thread";
  const description = thread?.content
    ? thread.content.replace(/<[^>]*>/g, "").slice(0, 160)
    : "Join the discussion on the CreedaVA community forum.";

  return {
    title: `${title} — Forum`,
    description,
    alternates: pageAlternates(`/forum/${id}`),
    openGraph: {
      title: `${title} — Forum`,
      description,
      type: "article",
      url: `https://creedava.com/forum/${id}`,
    },
  };
}

export default async function ForumThreadPage({ params }: Props) {
  const { id } = await params;
  return <ForumThreadContent id={id} initialThread={await loadThread(id)} />;
}
