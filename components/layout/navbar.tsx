'use client';

import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const navRoutes = [
  { href: "/", key: "home" as const },
  { href: "/services", key: "services" as const },
  { href: "/pricing", key: "pricing" as const },
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
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-mk-brand focus:text-white focus:rounded-full focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 bg-mk-paper/90 backdrop-blur-md border-b border-mk-line">
        <Container>
          <nav aria-label="Main navigation" className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/creedava-mark.svg"
                alt=""
                width={32}
                height={36}
                className="h-9 w-auto"
                priority
                unoptimized
              />
              <span className="font-display text-lg font-extrabold tracking-[-0.02em] text-mk-ink">
                <span className="text-mk-brand">Creeda</span>
                <span className="text-mk-navy">VA</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navRoutes.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-mk-brand ${
                    pathname === link.href
                      ? "text-mk-brand"
                      : "text-mk-ink-soft"
                  }`}
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {t.nav[link.key]}
                </Link>
              ))}
            </div>

            {/* Desktop CTA + Language & Theme Switcher */}
            <div className="hidden lg:flex items-center gap-4">
              <LanguageToggle locale={locale} onToggle={() => setLocale(locale === "en" ? "es" : "en")} />
              <Link
                href="/admin"
                className="text-sm font-medium text-mk-ink-soft hover:text-mk-brand transition-colors"
              >
                {t.nav.signIn}
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center px-5 py-2.5 bg-mk-brand text-white text-sm font-semibold rounded-full shadow-[var(--mk-shadow-brand)] hover:bg-mk-brand-bright transition-colors"
              >
                {t.nav.getStarted}
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 lg:hidden">
              <LanguageToggle locale={locale} onToggle={() => setLocale(locale === "en" ? "es" : "en")} />

              <button
                ref={menuButtonRef}
                type="button"
                className="p-2 text-mk-ink-soft hover:text-mk-ink"
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
              className="lg:hidden border-t border-mk-line py-4"
            >
              <div className="flex flex-col gap-1">
                {navRoutes.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2.5 text-sm font-medium rounded-(--mk-radius) transition-colors ${
                      pathname === link.href
                        ? "text-mk-brand bg-mk-brand/5"
                        : "text-mk-ink-soft hover:text-mk-brand hover:bg-mk-paper-deep"
                    }`}
                    aria-current={pathname === link.href ? "page" : undefined}
                    onClick={closeMobileMenu}
                  >
                    {t.nav[link.key]}
                  </Link>
                ))}
                <hr className="border-mk-line my-2" />
                <Link
                  href="/admin"
                  className="px-3 py-2.5 text-sm font-medium text-mk-ink-soft hover:text-mk-brand rounded-(--mk-radius) transition-colors"
                  onClick={closeMobileMenu}
                >
                  {t.nav.signIn}
                </Link>
                <Link
                  href="/join"
                  className="mt-2 inline-flex items-center justify-center px-5 py-3 bg-mk-brand text-white text-sm font-semibold rounded-full shadow-[var(--mk-shadow-brand)] hover:bg-mk-brand-bright transition-colors"
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

/** Language pill, shared by the desktop bar and the mobile action row. */
function LanguageToggle({
  locale,
  onToggle,
}: {
  locale: Locale;
  onToggle: () => void;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-mk-ink-soft hover:text-mk-brand border border-mk-line-strong rounded-full transition-colors"
      aria-label={locale === "en" ? "Cambiar a español" : "Switch to English"}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-4.247m0 0A8.966 8.966 0 013 12c0-1.097.196-2.149.556-3.124" />
      </svg>
      {locale === "en" ? "ES" : "EN"}
    </button>
  );
}
