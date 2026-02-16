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
  openGraph: {
    title: "CreedaVA — Virtual Assistant Services",
    description:
      "Professional virtual assistant services for businesses.",
    url: "https://creedava.com",
    siteName: "CreedaVA",
    type: "website",
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
        {/* Preconnect to Firebase services — saves ~200-400ms on first request */}
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://apis.google.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
      </head>
      <body className={`${roboto.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
