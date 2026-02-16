import { getPageSEO } from "@/lib/firebase/seo";

export async function generateMetadata() {
  return getPageSEO("/contact", {
    title: "Contact",
    description:
      "Get in touch with CreedaVA. We'd love to hear about your business needs.",
  });
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
