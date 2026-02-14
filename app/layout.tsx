import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

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
      <body className={`${roboto.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
