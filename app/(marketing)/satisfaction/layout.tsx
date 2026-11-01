import type { Metadata } from "next";

/** Tokenised customer surveys — never index or follow. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SatisfactionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
