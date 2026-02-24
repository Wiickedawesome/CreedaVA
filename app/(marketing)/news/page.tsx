import { getPageSEO } from "@/lib/firebase/seo";
import { NewsContent } from "./news-content";

export async function generateMetadata() {
  return getPageSEO("/news", {
    title: "News & Insights",
    description: "Stay up to date with the latest news, tips, and insights from CreedaVA.",
  });
}

export default function NewsPage() {
  return <NewsContent />;
}
