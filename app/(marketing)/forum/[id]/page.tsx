import type { Metadata } from "next";
import { cache } from "react";
import { adminDb, canUseAdminDb } from "@/lib/firebase-admin";
import { pageAlternates } from "@/lib/firebase/seo";
import type { ForumThread } from "@/lib/types/content";
import ForumThreadContent, { type ThreadRow } from "./thread-content";

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

/**
 * Read the thread here, not only in the client component.
 *
 * The client fetched it after hydration, so the served HTML contained a loading
 * skeleton — no `<h1>` and no body text. Measured 2026-11-25: the crawler scored
 * the page 86 with `h1-missing` (high) and zero words. Rendering it on the
 * server puts the real title and content in the document; the client still
 * loads replies itself.
 *
 * Wrapped in `cache()` because the metadata function and the page render both
 * need it, and they run in the same request.
 */
const loadThread = cache(async (id: string): Promise<ThreadRow | null> => {
  if (!canUseAdminDb) return null;

  try {
    const doc = await adminDb.collection("forum").doc(id).get();
    const data = doc.data();
    if (!data) return null;

    return {
      ...(data as Omit<ForumThread, "createdAt" | "updatedAt">),
      id: doc.id,
      // Timestamps cannot cross the RSC boundary; `toDate()` reads ISO strings.
      createdAt: data.createdAt?.toDate?.().toISOString(),
      updatedAt: data.updatedAt?.toDate?.().toISOString(),
    };
  } catch {
    return null;
  }
});
