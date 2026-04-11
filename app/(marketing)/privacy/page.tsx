import { getPageSEO } from "@/lib/firebase/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PrivacyContent } from "./privacy-content";

export const revalidate = 3600;

export async function generateMetadata() {
  return getPageSEO("/privacy", {
    title: "Privacy Policy",
    description: "CreedaVA's privacy policy — how we collect, use, and protect your personal information.",
  });
}

export default async function PrivacyPage() {
  const { t } = await getDictionary();
  return <PrivacyContent t={t} />;
}
