import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase-admin";
import LpContent from "./lp-content";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Pre-generate paths for all published landing pages */
export async function generateStaticParams() {
  try {
    const snap = await adminDb
      .collection("landing-pages")
      .where("status", "==", "published")
      .select("slug")
      .get();
    return snap.docs.map((doc) => ({ slug: doc.data().slug as string }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    // Try to fetch real LP data for rich metadata
    const snap = await adminDb
      .collection("landing-pages")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (!snap.empty) {
      const lp = snap.docs[0].data();
      const title = lp.title || slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      const description = lp.metaDescription || lp.excerpt || "";
      return {
        title: `${title} | CreedaVA`,
        description,
        alternates: { canonical: `https://creedava.com/lp/${slug}` },
        openGraph: {
          title: `${title} | CreedaVA`,
          description,
          url: `https://creedava.com/lp/${slug}`,
          type: "website",
        },
      };
    }
  } catch {
    // Fall through to slug-derived fallback
  }

  // Fallback — derive from slug
  const title = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${title} | CreedaVA`,
    openGraph: {
      title: `${title} | CreedaVA`,
      url: `https://creedava.com/lp/${slug}`,
      type: "website",
    },
  };
}

export default async function LandingPageRoute({ params }: Props) {
  const { slug } = await params;
  return <LpContent slug={slug} />;
}
