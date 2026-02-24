import { getPageSEO } from "@/lib/firebase/seo";
import { PrivacyContent } from "./privacy-content";

export async function generateMetadata() {
  return getPageSEO("/privacy", {
    title: "Privacy Policy",
    description: "CreedaVA's privacy policy — how we collect, use, and protect your personal information.",
  });
}

export default function PrivacyPage() {
  return <PrivacyContent />;
}
