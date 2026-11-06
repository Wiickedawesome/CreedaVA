import { Container } from "@/components/ui";
import { faqJsonLd, webPageJsonLd } from "@/lib/utils/structured-data";

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
   * When true, renders the full visible FAQ section on the page and emits
   * FAQPage structured data. When false (default), only the WebPage JSON-LD
   * is emitted plus a small "See all FAQs" link — Google requires FAQ markup
   * to be backed by FAQ content that is visible on the page.
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

  const pageJsonLd = webPageJsonLd({
    name: title,
    description,
    url: pageUrl,
  });

  return (
    <>
      {/* JSON-LD schema for AI citation signals */}
      {showSection && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(questions)) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />

      {showSection ? (
        /* Full visible section — only on pages that explicitly opt in */
        <section className="py-16 lg:py-20 border-t border-mk-line bg-mk-white">
          <Container size="md">
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-mk-ink">
                Frequently asked questions and guidance
              </h2>

              {paragraphs.map((paragraph, index) => (
                <p key={index} className="text-mk-ink-mute leading-relaxed">
                  {paragraph}
                </p>
              ))}

              <div className="space-y-4">
                {questions.map((item, index) => (
                  <article key={index} className="rounded-xl border border-mk-line p-5 bg-mk-paper">
                    <h3 className="text-lg font-semibold text-mk-ink mb-2">{item.question}</h3>
                    <p className="text-mk-ink-mute leading-relaxed">{item.answer}</p>
                  </article>
                ))}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-mk-ink mb-3">Authoritative references</h3>
                <ul className="list-disc pl-5 space-y-2 text-mk-ink-mute">
                  {sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mk-brand hover:underline"
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
        <div className="border-t border-mk-line bg-mk-white py-8">
          <Container size="md">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-mk-ink-mute text-sm">
                Have questions?{" "}
                <a href="/faq" className="text-mk-brand font-medium hover:underline">
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

