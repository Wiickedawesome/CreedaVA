/**
 * Centralized JSON-LD structured data generators.
 *
 * Each function returns a plain JSON-LD object.  Render in a page via:
 *
 *   <script type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
 *   />
 */

const SITE = "https://creedava.com";
const ORG_NAME = "CreedaVA";
/** Served from public/logo.webp — /images/logo.webp does not exist. */
const LOGO = `${SITE}/logo.webp`;
const PHONE = "+1-844-702-2202";

// ─── Shared fragments ────────────────────────────────

const ORGANIZATION = {
  "@type": "Organization",
  name: ORG_NAME,
  url: SITE,
  logo: LOGO,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: PHONE,
    contactType: "customer service",
    availableLanguage: ["English", "Spanish"],
  },
};

// ─── WebSite + SearchAction (homepage) ───────────────

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORG_NAME,
    url: SITE,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE}/forum?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    publisher: ORGANIZATION,
  };
}

// ─── BreadcrumbList ──────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.href.startsWith("http") ? item.href : `${SITE}${item.href}`,
    })),
  };
}

// ─── Service (services page) ─────────────────────────

export function serviceJsonLd(opts: {
  name: string;
  description: string;
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    url: opts.url ?? `${SITE}/services`,
    provider: ORGANIZATION,
    areaServed: { "@type": "Country", name: "United States" },
    availableLanguage: ["English", "Spanish"],
  };
}

// ─── FAQPage ─────────────────────────────────────────

export function faqJsonLd(
  questions: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

// ─── BlogPosting ─────────────────────────────────────

export function blogPostingJsonLd(opts: {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt?: string;
  updatedAt?: string;
  featuredImage?: string;
  tags?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title,
    description: opts.excerpt,
    url: `${SITE}/news/${opts.slug}`,
    image: opts.featuredImage || LOGO,
    datePublished: opts.publishedAt,
    dateModified: opts.updatedAt ?? opts.publishedAt,
    author: ORGANIZATION,
    publisher: ORGANIZATION,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE}/news/${opts.slug}`,
    },
    keywords: opts.tags?.join(", "),
  };
}

// ─── WebPage (landing pages, generic pages) ──────────

export function webPageJsonLd(opts: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.name,
    description: opts.description,
    url: opts.url.startsWith("http") ? opts.url : `${SITE}${opts.url}`,
    publisher: ORGANIZATION,
  };
}

// ─── DiscussionForumPosting (forum threads) ──────────

export function forumPostingJsonLd(opts: {
  id: string;
  title: string;
  author: string;
  datePublished: string;
  text: string;
  replyCount: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: opts.title,
    url: `${SITE}/forum/${opts.id}`,
    author: { "@type": "Person", name: opts.author },
    datePublished: opts.datePublished,
    text: opts.text.slice(0, 200),
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/CommentAction",
      userInteractionCount: opts.replyCount,
    },
  };
}

// ─── ContactPage ─────────────────────────────────────

export function contactPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact CreedaVA",
    description:
      "Get in touch with CreedaVA for bilingual virtual assistant services",
    url: `${SITE}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: ORG_NAME,
      url: SITE,
      telephone: PHONE,
      email: "info@creedava.com",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: PHONE,
        contactType: "customer service",
        availableLanguage: ["English", "Spanish"],
      },
    },
  };
}
