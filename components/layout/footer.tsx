"use client";

import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";

const serviceHrefs = [
  "/services#administrative",
  "/services#customer",
  "/services#social",
  "/services#data",
  "/services#bookkeeping",
  "/services#web",
  "/services#real-estate",
  "/services#insurance",
  "/services#ai-streamlining",
];

const companyHrefs = [
  { href: "/about", key: "about" as const },
  { href: "/news", key: "news" as const },
  { href: "/pricing", key: "pricing" as const },
  { href: "/contact", key: "contact" as const },
];

const supportHrefs = [
  { href: "/faq", key: "faq" as const },
  { href: "/forum", key: "forum" as const },
  { href: "/privacy", key: "privacy" as const },
  { href: "/terms", key: "terms" as const },
];

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-footer-bg text-white" aria-label="Site footer">
      <Container>
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Image
                  src="/logo.webp"
                  alt="CreedaVA"
                  width={280}
                  height={80}
                  className="h-20 w-auto brightness-0 invert"
                />
              </Link>
              <p className="text-gray-50 text-sm leading-relaxed max-w-xs">
                {t.footer.tagline}
              </p>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-40">
                {t.footer.servicesCol}
              </h4>
              <ul className="space-y-3">
                {t.footer.serviceLinks.map((label, i) => (
                  <li key={i}>
                    <Link
                      href={serviceHrefs[i]}
                      className="text-sm text-gray-50 hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-40">
                {t.footer.companyCol}
              </h4>
              <ul className="space-y-3">
                {companyHrefs.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-50 hover:text-white transition-colors"
                    >
                      {t.footer.companyLinks[link.key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-40">
                {t.footer.supportCol}
              </h4>
              <ul className="space-y-3">
                {supportHrefs.map((link) => (
                    <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-gray-50 hover:text-white transition-colors"
                        >
                          {t.footer.supportLinks[link.key]}
                        </Link>
                    </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-80 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-50">
            &copy; {new Date().getFullYear()} {t.footer.copyright}
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://linkedin.com/company/creedava"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-50 hover:text-white transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
