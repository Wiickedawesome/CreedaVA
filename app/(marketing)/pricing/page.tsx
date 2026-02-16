import { getPageSEO } from "@/lib/firebase/seo";
import { PricingContent } from "./pricing-content";

export async function generateMetadata() {
  return getPageSEO("/pricing", {
    title: "Pricing",
    description: "Simple, transparent pricing for CreedaVA virtual assistant services. Choose the plan that fits your business.",
  });
}

export default function PricingPage() {
  return <PricingContent />;
}
