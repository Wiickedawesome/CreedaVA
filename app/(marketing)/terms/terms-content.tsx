import { Container } from "@/components/ui";
import type { Dictionary } from "@/lib/i18n";

export function TermsContent({ t }: { t: Dictionary }) {

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-linear-to-b from-gray-10 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
              {t.terms.heroTitle}
            </h1>
            <p className="text-lg text-gray-60">{t.terms.lastUpdated}</p>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="prose prose-lg max-w-none space-y-10">
            {t.terms.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-2xl font-bold text-gray-100 mb-4">
                  {section.title}
                </h2>
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="text-gray-60 leading-relaxed mb-4">
                    {p}
                    {"contactEmail" in section && section.contactEmail && j === section.paragraphs.length - 1 && (
                      <>
                        {" "}
                        <a
                          href={`mailto:${section.contactEmail}`}
                          className="text-primary underline underline-offset-2"
                        >
                          {section.contactEmail}
                        </a>
                        .
                      </>
                    )}
                  </p>
                ))}
                {"list" in section && section.list && (
                  <ul className="list-disc pl-6 space-y-2 text-gray-60">
                    {section.list.map((item, k) => (
                      <li key={k}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
