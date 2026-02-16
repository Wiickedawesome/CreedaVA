import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { LanguageProvider } from "@/lib/i18n";

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
  sameAs: [],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </LanguageProvider>
  );
}
