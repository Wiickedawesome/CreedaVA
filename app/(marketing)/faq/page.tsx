'use client';

import { useTranslation } from "@/lib/i18n";

export default function FAQPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold">{t.faq.title}</h1>
      <p className="mt-4">{t.faq.description}</p>
    </div>
  );
}
