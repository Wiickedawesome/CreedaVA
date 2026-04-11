import { getPageSEO } from "@/lib/firebase/seo";
import { faqJsonLd } from "@/lib/utils/structured-data";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import en from "@/lib/i18n/en";
import { FaqContent } from "./faq-content";

export const revalidate = 3600;

export async function generateMetadata() {
  return getPageSEO("/faq", {
    title: "FAQ",
    description: "Frequently asked questions about CreedaVA's virtual assistant services, pricing, onboarding, and more.",
  });
}

export default async function FAQPage() {
  const { t } = await getDictionary();
  const questions = en.faq.categories.flatMap((cat) =>
    cat.questions.map((item) => ({ question: item.q, answer: item.a })),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(questions)) }}
      />
      <FaqContent t={t} />
    </>
  );
}
