import type { Metadata } from "next";
import LpContent from "./lp-content";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${title} | CreedaVA`,
    openGraph: {
      title: `${title} | CreedaVA`,
      url: `https://creedava.com/lp/${slug}`,
      type: "website",
    },
  };
}

export default async function LandingPageRoute({ params }: Props) {
  const { slug } = await params;
  return <LpContent slug={slug} />;
}
