import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

// Marketing display face. Admin keeps Roboto-only styling, so this is exposed
// as a separate token (`--font-display`) rather than replacing `--font-sans`.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#005148",
};

export const metadata: Metadata = {
  title: {
    default: "CreedaVA — Virtual Assistant Services",
    template: "%s | CreedaVA",
  },
  description:
    "Professional virtual assistant services for businesses. Save time, reduce costs, and scale your operations with CreedaVA.",
  keywords: ["virtual assistant", "business services", "remote assistant", "bilingual virtual assistant", "CreedaVA"],
  metadataBase: new URL("https://creedava.com"),
  // Canonical + hreflang are page-specific; each page's generateMetadata sets them.
  openGraph: {
    title: "CreedaVA — Virtual Assistant Services",
    description:
      "Professional virtual assistant services for businesses. Save time, reduce costs, and scale your operations with CreedaVA.",
    url: "https://creedava.com",
    siteName: "CreedaVA",
    type: "website",
    locale: "en_US",
    images: [{ url: "https://creedava.com/opengraph-image", width: 1200, height: 630, alt: "CreedaVA — Virtual Assistant Services" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CreedaVA — Virtual Assistant Services",
    description:
      "Professional virtual assistant services for businesses. Save time, reduce costs, and scale your operations.",
    images: ["https://creedava.com/opengraph-image"],
  },
  // Favicon and Apple icon are file-based conventions (app/icon.svg,
  // app/apple-icon.tsx), so they are generated from the current brand mark
  // instead of being hand-listed here. The previous `icons.apple` pointed at
  // `/logo.webp` — the pre-redesign logo, in a format iOS ignores.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Anti-flash: apply saved admin theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=window.location.pathname;if(!p.startsWith('/admin')){document.documentElement.removeAttribute('data-theme');return;}var t=localStorage.getItem('creedava-admin-theme')||'auto';if(t==='auto'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${roboto.variable} ${jakarta.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
