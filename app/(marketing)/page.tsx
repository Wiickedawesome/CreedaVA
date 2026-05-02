import { unstable_cache } from "next/cache";
import { adminDb, canUseAdminDb } from "@/lib/firebase-admin";
import { getPageSEO } from "@/lib/firebase/seo";
import { websiteJsonLd } from "@/lib/utils/structured-data";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { HomeContent } from "./home-content";

// Revalidate homepage every 5 minutes — content rarely changes
export const revalidate = 300;

export async function generateMetadata() {
  return getPageSEO("/", {
    title: "CreedaVA — Bilingual Virtual Assistants for Your Business",
    description: "Hire dedicated bilingual virtual assistants from Belize. Save 20+ hours per week on admin, customer service, and more.",
  });
}

const DEFAULT_STATS = ["500+", "98%", "EN/ES", "50+"];

const getHomepageStats = unstable_cache(
  async (): Promise<string[]> => {
    if (!canUseAdminDb) return DEFAULT_STATS;

    try {
      const doc = await adminDb.collection("settings").doc("homepage-stats").get();
      if (doc.exists) {
        const data = doc.data();
        if (Array.isArray(data?.values) && data.values.length === 4) {
          return data.values as string[];
        }
      }
    } catch {
      // Fall through to defaults
    }
    return DEFAULT_STATS;
  },
  ["homepage-stats"],
  { revalidate: 300 },
);

export default async function HomePage() {
  const [statValues, { t }] = await Promise.all([getHomepageStats(), getDictionary()]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <HomeContent statValues={statValues} t={t} />
    </>
  );
}
