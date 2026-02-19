import { getPageSEO } from "@/lib/firebase/seo";
import { FaqContent } from "./faq-content";

export async function generateMetadata() {
  return getPageSEO("/faq", {
    title: "FAQ",
    description: "Frequently asked questions about CreedaVA's virtual assistant services, pricing, onboarding, and more.",
  });
}

export default function FAQPage() {
  return <FaqContent />;
}
