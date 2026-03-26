import { getPageSEO } from "@/lib/firebase/seo";
import { TermsContent } from "./terms-content";

export const revalidate = 3600;

export async function generateMetadata() {
  return getPageSEO("/terms", {
    title: "Terms of Service",
    description: "CreedaVA's terms of service — the agreement governing your use of our virtual assistant services.",
  });
}

export default function TermsPage() {
  return <TermsContent />;
}
