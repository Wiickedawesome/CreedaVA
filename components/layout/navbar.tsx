"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";

const navRoutes = [
  { href: "/", key: "home" as const },
  { href: "/services", key: "services" as const },
  { href: "/about", key: "about" as const },
  { href: "/pricing", key: "pricing" as const },
  { href: "/news", key: "news" as const },
  { href: "/contact", key: "contact" as const },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { locale, setLocale, t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <Container>
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.webp"
              alt="CreedaVA"
              width={180}
              height={52}
              className="h-14 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navRoutes.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href
                    ? "text-primary"
                    : "text-gray-70"
                }`}
              >
                {t.nav[link.key]}
              </Link>
            ))}
          </div>

          {/* Desktop CTA + Language Switcher */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "es" : "en")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-70 hover:text-primary border border-border rounded-md transition-colors"
              aria-label={locale === "en" ? "Cambiar a español" : "Switch to English"}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-4.247m0 0A8.966 8.966 0 013 12c0-1.097.196-2.149.556-3.124" />
              </svg>
              {locale === "en" ? "ES" : "EN"}
            </button>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-70 hover:text-primary transition-colors"
            >
              {t.nav.signIn}
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors"
            >
              {t.nav.getStarted}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden p-2 text-gray-70 hover:text-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border py-4">
            <div className="flex flex-col gap-3">
              {navRoutes.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === link.href
                      ? "text-primary bg-primary/5"
                      : "text-gray-70 hover:text-primary hover:bg-gray-20"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t.nav[link.key]}
                </Link>
              ))}
              <hr className="border-border my-2" />
              {/* Mobile Language Toggle */}
              <button
                type="button"
                onClick={() => {
                  setLocale(locale === "en" ? "es" : "en");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-70 hover:text-primary"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-4.247m0 0A8.966 8.966 0 013 12c0-1.097.196-2.149.556-3.124" />
                </svg>
                {locale === "en" ? "Español" : "English"}
              </button>
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-medium text-gray-70 hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.signIn}
              </Link>
              <Link
                href="/contact"
                className="mx-3 inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.getStarted}
              </Link>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}
