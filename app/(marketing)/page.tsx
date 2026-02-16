import { getPageSEO } from "@/lib/firebase/seo";
import { HomeContent } from "./home-content";

export async function generateMetadata() {
  return getPageSEO("/", {
    title: "CreedaVA — Virtual Assistant Services",
    description: "Professional virtual assistant services for businesses. Save time, reduce costs, and scale your operations with CreedaVA.",
  });
}

export default function HomePage() {
  return <HomeContent />;
}
