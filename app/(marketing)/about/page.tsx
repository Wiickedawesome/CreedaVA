import { getPageSEO } from "@/lib/firebase/seo";
import { AboutContent } from "./about-content";

export const revalidate = 3600;

export async function generateMetadata() {
  return getPageSEO("/about", {
    title: "About",
    description: "Learn about CreedaVA — a Belize-based virtual assistant agency bridging opportunity and talent for global businesses.",
  });
}

export default function AboutPage() {
  return <AboutContent />;
}
