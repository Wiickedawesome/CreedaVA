import { Container } from "@/components/ui";
import { faqJsonLd } from "@/lib/utils/structured-data";

interface CitationQuestion {
  question: string;
  answer: string;
}

interface CitationSource {
  label: string;
  url: string;
}

interface AICitationReadinessProps {
  path: string;
  title: string;
  description: string;
  paragraphs: string[];
  questions: CitationQuestion[];
  sources: CitationSource[];
  /**
   * When true, renders the full visible FAQ section on the page.
   * When false (default), only the invisible JSON-LD schema tags are emitted
   * plus a small "See all FAQs" link at the bottom.
   */
  showSection?: boolean;
}

const SITE_URL = "https://creedava.com";

export function AICitationReadiness({
  path,
  title,
  description,
  paragraphs,
  questions,
  sources,
  showSection = false,
}: AICitationReadinessProps) {
  const normalizedPath = path === "/" ? "" : path;
  const pageUrl = `${SITE_URL}${normalizedPath}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    author: {
      "@type": "Organization",
      name: "CreedaVA",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "CreedaVA",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.webp`,
      },
    },
    about: questions.map((item) => item.question),
  };

  return (
    <>
      {/* Invisible JSON-LD schema — always emitted for SEO/AI citation signals */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(questions)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {showSection ? (
        /* Full visible section — only on pages that explicitly opt in */
        <section className="py-16 lg:py-20 border-t border-gray-20 bg-white">
          <Container size="md">
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-100">
                Frequently asked questions and guidance
              </h2>

              {paragraphs.map((paragraph, index) => (
                <p key={index} className="text-gray-60 leading-relaxed">
                  {paragraph}
                </p>
              ))}

              <div className="space-y-4">
                {questions.map((item, index) => (
                  <article key={index} className="rounded-xl border border-gray-20 p-5 bg-gray-10/40">
                    <h3 className="text-lg font-semibold text-gray-100 mb-2">{item.question}</h3>
                    <p className="text-gray-60 leading-relaxed">{item.answer}</p>
                  </article>
                ))}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-3">Authoritative references</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-60">
                  {sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {source.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>
      ) : (
        /* Minimal link — guides users to the dedicated FAQ page */
        <div className="border-t border-gray-20 bg-white py-8">
          <Container size="md">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-gray-60 text-sm">
                Have questions?{" "}
                <a href="/faq" className="text-primary font-medium hover:underline">
                  See all frequently asked questions →
                </a>
              </p>
            </div>
          </Container>
        </div>
      )}
    </>
  );
}

