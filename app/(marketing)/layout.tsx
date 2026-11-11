import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BackToTop } from "@/components/layout/back-to-top";
import { ForceTheme } from "@/components/layout/force-theme";
import Script from "next/script";
import { Suspense } from "react";

import { GtagPageViews } from "@/components/layout/gtag-pageviews";
import { GlobalAnalytics } from "@/components/layout/global-analytics";
import { FirebaseInit } from "@/lib/firebase/firebase-init";
import { LanguageProvider } from "@/lib/i18n";

// Use the Firebase measurement ID (set in apphosting.yaml) as the single source of truth.
// NEXT_PUBLIC_GA_MEASUREMENT_ID is accepted as an override for non-Firebase deploys.
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
  "";

// Canonical URLs and bilingual hreflang alternates are page-specific and are
// emitted by each page's `generateMetadata` (see `pageAlternates` in lib/firebase/seo.ts).

/** JSON-LD Organization structured data for Google rich results */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  // Full business name in `name`; the brand mark and the short name in
  // `alternateName`, so search engines learn that all three refer to one company.
  name: "Creeda Virtual Assistants",
  alternateName: ["CreedaVA", "Creeda"],
  url: "https://creedava.com",
  // A file-based metadata route under `app/`, so it serves in production. The
  // visible logo is inline (components/brand/brand-logo.tsx); JSON-LD still
  // needs an absolute URL a crawler can fetch.
  logo: "https://creedava.com/icon.svg",
  description:
    "Professional virtual assistant services for businesses. Save time, reduce costs, and scale your operations.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "BZ",
  },
  sameAs: [
    "https://linkedin.com/company/creedava",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    url: "https://creedava.com/contact",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      {/* App Check must initialize before any Firestore writes (analytics tracking). */}
      <FirebaseInit />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
      <Suspense fallback={null}>
        <GtagPageViews gaId={GA_MEASUREMENT_ID} />
      </Suspense>
      <Suspense fallback={null}>
        <GlobalAnalytics />
      </Suspense>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <div>
        {/* Admin toggles <html data-theme>; clear it so public pages never inherit dark. */}
        <ForceTheme theme="light" />
        <Navbar />
        <main id="main-content" className="min-h-screen">{children}</main>
        <Footer />
        <BackToTop />
      </div>
    </LanguageProvider>
  );
}
