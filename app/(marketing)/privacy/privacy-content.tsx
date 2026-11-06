import { LegalDocument } from "@/components/marketing/legal-document";
import type { Dictionary } from "@/lib/i18n";
import type { ReactNode } from "react";

export function PrivacyContent({ t }: { t: Dictionary }): ReactNode {
  return (
    <LegalDocument
      title={t.privacy.heroTitle}
      lastUpdated={t.privacy.lastUpdated}
      sections={t.privacy.sections}
    />
  );
}
