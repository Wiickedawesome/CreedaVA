import { getPageSEO } from "@/lib/firebase/seo";
import { ForumContent } from "./forum-content";

export async function generateMetadata() {
  return getPageSEO("/forum", {
    title: "Community Forum",
    description: "Join the CreedaVA community forum. Ask questions, share insights, and connect with other business owners.",
  });
}

export default function ForumPage() {
  return <ForumContent />;
}
