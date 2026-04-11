import { getPageSEO } from "@/lib/firebase/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { TermsContent } from "./terms-content";

export const revalidate = 3600;

export async function generateMetadata() {
  return getPageSEO("/terms", {
    title: "Terms of Service",
    description: "CreedaVA's terms of service — the agreement governing your use of our virtual assistant services.",
  });
}

export default async function TermsPage() {
  const { t } = await getDictionary();
  return <TermsContent t={t} />;
}
