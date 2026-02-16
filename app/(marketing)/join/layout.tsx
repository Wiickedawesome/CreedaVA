import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Consultation | CreedaVA",
  description:
    "Schedule a free 30-minute consultation with CreedaVA. Choose a date and time that works for you.",
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
