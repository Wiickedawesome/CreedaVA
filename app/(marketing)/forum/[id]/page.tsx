import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase-admin";
import ForumThreadContent from "./thread-content";

interface Props {
  params: Promise<{ id: string }>;
}

/** Pre-generate paths for all open forum threads */
export async function generateStaticParams() {
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

  try {
    const doc = await adminDb.collection("forum").doc(id).get();
    const data = doc.data();
    const title = data?.title || "Forum Thread";
    const description = data?.content
      ? String(data.content).replace(/<[^>]*>/g, "").slice(0, 160)
      : "Join the discussion on the CreedaVA community forum.";

    return {
      title: `${title} | CreedaVA Forum`,
      description,
      alternates: { canonical: `https://creedava.com/forum/${id}` },
      openGraph: {
        title: `${title} | CreedaVA Forum`,
        description,
        type: "article",
        url: `https://creedava.com/forum/${id}`,
      },
    };
  } catch {
    return {
      title: "Forum Thread | CreedaVA Forum",
      description: "Join the discussion on the CreedaVA community forum.",
      alternates: { canonical: `https://creedava.com/forum/${id}` },
    };
  }
}

export default async function ForumThreadPage({ params }: Props) {
  const { id } = await params;
  return <ForumThreadContent id={id} />;
}
