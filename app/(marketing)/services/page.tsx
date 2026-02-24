import { getPageSEO } from "@/lib/firebase/seo";
import { serviceJsonLd } from "@/lib/utils/structured-data";
import { ServicesContent } from "./services-content";

export async function generateMetadata() {
  return getPageSEO("/services", {
    title: "Virtual Assistant Services",
    description: "Explore CreedaVA's full range of bilingual virtual assistant services — admin support, customer service, bookkeeping, social media, and more.",
  });
}

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd({
            name: "Bilingual Virtual Assistant Services",
            description: "Full range of bilingual virtual assistant services — admin support, customer service, bookkeeping, social media management, and more.",
          })),
        }}
      />
      <ServicesContent />
    </>
  );
}
