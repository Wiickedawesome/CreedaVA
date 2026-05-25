import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Script from "next/script";
import { Suspense } from "react";

import { GtagPageViews } from "@/components/layout/gtag-pageviews";
import { FirebaseInit } from "@/lib/firebase/firebase-init";
import { LanguageProvider } from "@/lib/i18n";

// Use the Firebase measurement ID (set in apphosting.yaml) as the single source of truth.
// NEXT_PUBLIC_GA_MEASUREMENT_ID is accepted as an override for non-Firebase deploys.
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
  "";

const SITE = "https://creedava.com";

/** Bilingual hreflang alternates — every marketing page serves EN & ES */
export const metadata: Metadata = {
  alternates: {
    languages: {
      "en-US": SITE,
      "es-US": `${SITE}?lang=es`,
      "x-default": SITE,
    },
  },
};

/** JSON-LD Organization structured data for Google rich results */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CreedaVA",
  url: "https://creedava.com",
  logo: "https://creedava.com/logo.webp",
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <div data-theme="light">
        <Navbar />
        <main id="main-content" className="min-h-screen">{children}</main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
