import type { Metadata } from "next";
import { adminDb, canUseAdminDb } from "@/lib/firebase-admin";
import { pageAlternates } from "@/lib/firebase/seo";
import LpContent from "./lp-content";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Pre-generate paths for all published landing pages */
export async function generateStaticParams() {
  if (!canUseAdminDb) return [];

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

  if (canUseAdminDb) {
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
          title,
          description,
          alternates: pageAlternates(`/lp/${slug}`),
          openGraph: {
            title,
            description,
            url: `https://creedava.com/lp/${slug}`,
            type: "website",
          },
        };
      }
    } catch {
      // Fall through to slug-derived fallback
    }
  }

  // Fallback — derive from slug
  const title = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title,
    alternates: pageAlternates(`/lp/${slug}`),
    openGraph: {
      title,
      url: `https://creedava.com/lp/${slug}`,
      type: "website",
    },
  };
}

export default async function LandingPageRoute({ params }: Props) {
  const { slug } = await params;
  return <LpContent slug={slug} />;
}
