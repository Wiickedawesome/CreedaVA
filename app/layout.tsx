import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
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
  keywords: ["virtual assistant", "business services", "remote assistant", "CreedaVA"],
  metadataBase: new URL("https://creedava.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CreedaVA — Virtual Assistant Services",
    description:
      "Professional virtual assistant services for businesses.",
    url: "https://creedava.com",
    siteName: "CreedaVA",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CreedaVA — Virtual Assistant Services",
    description:
      "Professional virtual assistant services for businesses. Save time, reduce costs, and scale your operations.",
    site: "@creedava",
  },
  icons: {
    icon: "/logo.webp",
    apple: "/logo.webp",
  },
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
            __html: `(function(){try{if(!window.location.pathname.startsWith('/admin'))return;var t=localStorage.getItem('creedava-admin-theme')||'auto';if(t==='auto'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${roboto.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
