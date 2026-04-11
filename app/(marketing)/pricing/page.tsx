import { getPageSEO } from "@/lib/firebase/seo";
import { webPageJsonLd } from "@/lib/utils/structured-data";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PricingContent } from "./pricing-content";

export const revalidate = 3600;

export async function generateMetadata() {
  return getPageSEO("/pricing", {
    title: "Pricing — Virtual Assistant Plans",
    description: "Transparent pricing for CreedaVA virtual assistant plans. Dedicated bilingual VAs starting from $999/month with no long-term contracts.",
  });
}

export default async function PricingPage() {
  const { t } = await getDictionary();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd({
            name: "Virtual Assistant Pricing Plans",
            description: "Transparent pricing for dedicated bilingual virtual assistants starting from $999/month with no long-term contracts.",
            url: "/pricing",
          })),
        }}
      />
      <PricingContent t={t} />
    </>
  );
}
