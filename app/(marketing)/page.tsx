import { adminDb } from "@/lib/firebase-admin";
import { getPageSEO } from "@/lib/firebase/seo";
import { websiteJsonLd } from "@/lib/utils/structured-data";
import { HomeContent } from "./home-content";

export async function generateMetadata() {
  return getPageSEO("/", {
    title: "CreedaVA — Bilingual Virtual Assistants for Your Business",
    description: "Hire dedicated bilingual virtual assistants from Belize. Save 20+ hours per week on admin, customer service, and more.",
  });
}

const DEFAULT_STATS = ["500+", "98%", "24/7", "50+"];

async function getHomepageStats(): Promise<string[]> {
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
}

export default async function HomePage() {
  const statValues = await getHomepageStats();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <HomeContent statValues={statValues} />
    </>
  );
}
