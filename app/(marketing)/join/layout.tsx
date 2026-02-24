import { getPageSEO } from "@/lib/firebase/seo";

export async function generateMetadata() {
  return getPageSEO("/join", {
    title: "Book a Consultation",
    description: "Schedule a free 30-minute consultation with CreedaVA. Choose a date and time that works for you.",
  });
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
