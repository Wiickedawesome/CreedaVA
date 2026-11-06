import { LegalDocument } from "@/components/marketing/legal-document";
import type { Dictionary } from "@/lib/i18n";
import type { ReactNode } from "react";

export function TermsContent({ t }: { t: Dictionary }): ReactNode {
  return (
    <LegalDocument
      title={t.terms.heroTitle}
      lastUpdated={t.terms.lastUpdated}
      sections={t.terms.sections}
    />
  );
}
