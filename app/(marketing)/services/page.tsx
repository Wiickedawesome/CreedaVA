import { getPageSEO } from "@/lib/firebase/seo";
import { ServicesContent } from "./services-content";

export async function generateMetadata() {
  return getPageSEO("/services", {
    title: "Services",
    description: "Explore CreedaVA's professional virtual assistant services including administrative support, customer service, social media management, and more.",
  });
}

export default function ServicesPage() {
  return <ServicesContent />;
}
