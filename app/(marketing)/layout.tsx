import Link from "next/link";
import Image from "next/image";
import { Analytics } from "@/components/features/analytics";
import { LanguageProvider } from "@/lib/i18n/context";

import "@/styles/globals.css";

export default function MarketingLayout({
  params: { lang },
  children,
}: {
  params: { lang: string };
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider lang={lang}>
      <main>
        <header className="py-4 lg:py-6">
          <div className="container flex items-center justify-between">
            <Link href="/">
              <Image
                src="/logo.webp"
                alt="Creed A.V.A."
                width={120}
                height="auto"
              />
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium text-gray-60">
              <Link href="/about" className="hover:text-primary transition-colors">
                About
              </Link>
              <Link href="/contact" className="hover:text-primary transition-colors">
                Contact
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="py-12 lg:py-16 bg-footer-bg text-white">
          <div className="container grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div>
              <Link href="/">
                <Image
                  src="/logo-white.webp"
                  alt="Creed A.V.A."
                  width={140}
                  height={28}
                />
              </Link>
              <p className="text-sm text-white/70 mt-4">
                Unlock the power of AI with Creed A.V.A. and take your business to the next level.
              </p>
            </div>
            <div className="lg:col-span-2 flex justify-end">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <h4 className="font-semibold text-lg mb-3">Company</h4>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                    <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                    <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-3">Product</h4>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                    <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                    <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-3">Resources</h4>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                    <li><Link href="/support" className="hover:text-white transition-cols">Support</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-3">Legal</h4>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                    <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="container mt-10 border-t border-white/10 pt-6 text-center text-sm text-white/60">
            &copy; {new Date().getFullYear()} Creed A.V.A. All rights reserved.
          </div>
        </footer>
      </main>
      <Analytics />
    </LanguageProvider>
  );
}
