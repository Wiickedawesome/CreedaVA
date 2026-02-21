import { adminDb } from "@/lib/firebase-admin";
import { HomeContent } from "./home-content";

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
  return <HomeContent statValues={statValues} />;
}
