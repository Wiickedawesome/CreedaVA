'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";

const navRoutes = [
  { href: "/", key: "home" as const },
  { href: "/services", key: "services" as const },
  { href: "/about", key: "about" as const },
  { href: "/news", key: "news" as const },
  { href: "/contact", key: "contact" as const },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { locale, setLocale, t } = useTranslation();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    const timeoutId = setTimeout(() => setMobileMenuOpen(false), 0);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  // Focus trap for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (e.key !== "Tab") return;

      const menu = mobileMenuRef.current;
      if (!menu) return;

      const focusable = menu.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    // Focus the first link in the menu when it opens
    const firstLink = mobileMenuRef.current?.querySelector<HTMLElement>("a[href]");
    firstLink?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <Container>
          <nav aria-label="Main navigation" className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.webp"
                alt="CreedaVA"
                width={80}
                height={22}
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
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {t.nav[link.key]}
                </Link>
              ))}
            </div>

            {/* Desktop CTA + Language & Theme Switcher */}
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
                href="/admin"
                className="text-sm font-medium text-gray-70 hover:text-primary transition-colors"
              >
                {t.nav.signIn}
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors"
              >
                {t.nav.getStarted}
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 lg:hidden">
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

              <button
                ref={menuButtonRef}
                type="button"
                className="p-2 text-gray-70 hover:text-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-controls="mobile-menu"
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
            </div>
          </nav>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div
              ref={mobileMenuRef}
              id="mobile-menu"
              role="navigation"
              aria-label="Mobile navigation"
              className="lg:hidden border-t border-border py-4"
            >
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
                    aria-current={pathname === link.href ? "page" : undefined}
                    onClick={closeMobileMenu}
                  >
                    {t.nav[link.key]}
                  </Link>
                ))}
                <hr className="border-border my-2" />
                <Link
                  href="/admin"
                  className="px-3 py-2 text-sm font-medium text-gray-70 hover:text-primary"
                  onClick={closeMobileMenu}
                >
                  {t.nav.signIn}
                </Link>
                <Link
                  href="/join"
                  className="mx-3 inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors"
                  onClick={closeMobileMenu}
                >
                  {t.nav.getStarted}
                </Link>
              </div>
            </div>
          )}
        </Container>
      </header>
    </>
  );
}
