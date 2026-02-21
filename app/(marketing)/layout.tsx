import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Script from "next/script";
import { Suspense } from "react";

import { ForceTheme } from "@/components/layout/force-theme";
import { GtagPageViews } from "@/components/layout/gtag-pageviews";
import { LanguageProvider } from "@/lib/i18n";
import { FirebaseInit } from "@/lib/firebase";

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-5DC2T0DSDW";

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
    "https://facebook.com/creedava",
    "https://instagram.com/creedava",
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
      <FirebaseInit />
      <Script id="marketing-force-theme" strategy="beforeInteractive">
        {"document.documentElement.dataset.theme = 'light';"}
      </Script>
      <ForceTheme theme="light" />

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
      <Navbar />
      <main id="main-content" className="min-h-screen">{children}</main>
      <Footer />
    </LanguageProvider>
  );
}
