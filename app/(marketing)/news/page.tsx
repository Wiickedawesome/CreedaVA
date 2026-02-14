import type { Metadata } from "next";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "News & Blog",
  description:
    "Stay up to date with the latest news, tips, and insights from CreedaVA.",
};

// Placeholder posts — will be pulled from Firestore once connected
const posts = [
  {
    slug: "why-virtual-assistants-are-essential-2026",
    title: "Why Virtual Assistants Are Essential for Businesses in 2026",
    excerpt:
      "Discover why more businesses than ever are turning to virtual assistants to streamline operations and reduce costs.",
    date: "February 10, 2026",
    category: "Industry Trends",
    readTime: "5 min read",
  },
  {
    slug: "top-tasks-to-delegate",
    title: "Top 10 Tasks You Should Delegate to a Virtual Assistant",
    excerpt:
      "Stop doing everything yourself. Here are the tasks that are perfect for delegation and will free up hours of your time.",
    date: "February 5, 2026",
    category: "Tips & Tricks",
    readTime: "7 min read",
  },
  {
    slug: "scaling-with-remote-team",
    title: "How to Scale Your Business with a Remote Support Team",
    excerpt:
      "Learn strategies for effectively building and managing a remote virtual assistant team as your business grows.",
    date: "January 28, 2026",
    category: "Growth",
    readTime: "6 min read",
  },
  {
    slug: "social-media-management-guide",
    title: "The Complete Guide to Outsourcing Social Media Management",
    excerpt:
      "Everything you need to know about delegating your social media presence to a professional VA.",
    date: "January 20, 2026",
    category: "Social Media",
    readTime: "8 min read",
  },
  {
    slug: "cost-savings-virtual-assistants",
    title: "How Much Can You Really Save with a Virtual Assistant?",
    excerpt:
      "A detailed breakdown of the cost savings businesses experience when switching from traditional employees to VAs.",
    date: "January 15, 2026",
    category: "Business",
    readTime: "4 min read",
  },
  {
    slug: "onboarding-your-first-va",
    title: "Onboarding Your First Virtual Assistant: A Step-by-Step Guide",
    excerpt:
      "Make the most of your VA relationship from day one with this comprehensive onboarding checklist.",
    date: "January 8, 2026",
    category: "Getting Started",
    readTime: "6 min read",
  },
];

export default function NewsPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-10 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
              News & Insights
            </h1>
            <p className="text-lg text-gray-60 leading-relaxed">
              Tips, trends, and insights to help you get the most out of
              virtual assistant services.
            </p>
          </div>
        </Container>
      </section>

      {/* Posts Grid */}
      <section className="py-20 lg:py-28">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Placeholder image */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 h-48 flex items-center justify-center">
                  <span className="text-4xl text-primary/20 font-bold">
                    {post.category.charAt(0)}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-50">{post.readTime}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-100 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-60 leading-relaxed line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>
                  <p className="text-xs text-gray-50">{post.date}</p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
