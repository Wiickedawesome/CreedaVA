'use client';

import { useTranslation } from "@/lib/i18n";

export function ContactHeader() {
  const { t } = useTranslation();
  return (
    <div className="bg-gray-100 py-12">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold text-gray-800">{t.contact.title}</h1>
        <p className="text-lg text-gray-600 mt-2">{t.contact.subtitle}</p>
      </div>
    </div>
  );
}
