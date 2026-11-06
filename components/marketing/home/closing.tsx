import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import { Bloom, CtaLink, Eyebrow, Section, SectionHeading } from "@/components/marketing/primitives";

const FAQ_CATEGORY_COUNT = 3;
const FAQ_PER_CATEGORY = 2;

/** Shared with the page's FAQPage JSON-LD so the markup and schema cannot drift. */
export function getHomeFaqQuestions(
  t: Dictionary,
): { question: string; answer: string }[] {
  return t.faq.categories
    .slice(0, FAQ_CATEGORY_COUNT)
    .flatMap((category) => category.questions.slice(0, FAQ_PER_CATEGORY))
    .map((item) => ({ question: item.q, answer: item.a }));
}

export function HomeFaq({ t }: { t: Dictionary }): ReactNode {
  const questions = getHomeFaqQuestions(t);

  return (
    <Section tone="paper">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <SectionHeading
          eyebrow={t.home.faqEyebrow}
          title={t.home.faqTitle}
          lede={t.home.faqLede}
        />

        <div className="border-y border-mk-line">
          {questions.map((item) => (
            <details key={item.question} className="group border-b border-mk-line py-4 last:border-b-0">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[0.95rem] font-semibold text-mk-ink [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-mk-line-strong text-mk-brand transition-transform duration-200 group-open:rotate-45"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.2}
                      d="M12 5v14M5 12h14"
                    />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 max-w-[52ch] text-[0.89rem] leading-relaxed text-mk-ink-soft">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function HomeClosingCta({ t }: { t: Dictionary }): ReactNode {
  return (
    <Section tone="paper" padding="none" className="pb-20 pt-4 sm:pt-6 lg:pb-28">
      <div className="relative overflow-hidden rounded-[2rem] bg-mk-brand-deep px-6 py-12 sm:px-10 sm:py-14 lg:px-16 lg:py-20">
        <Bloom className="-right-24 -top-24 h-[360px] w-[360px] rounded-full bg-mk-accent/18 blur-[90px]" />
        <Bloom className="-bottom-32 -left-20 h-[320px] w-[320px] rounded-full bg-mk-brand-bright/25 blur-[100px]" />

        <div className="relative max-w-3xl">
          <Eyebrow onDark>{t.home.finalEyebrow}</Eyebrow>

          <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,3.1rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-mk-paper">
            {t.home.finalTitle}
          </h2>

          <p className="mt-5 max-w-[46ch] text-[1.02rem] leading-[1.7] text-mk-paper/70">
            {t.home.finalLede}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <CtaLink href="/join" variant="light" analytics="home_final_join">
              {t.home.finalPrimary}
            </CtaLink>
            <CtaLink
              href="/pricing"
              variant="outlineDark"
              analytics="home_final_packages"
            >
              {t.home.finalSecondary}
            </CtaLink>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2.5">
            {t.home.finalTrust.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-[0.78rem] text-mk-paper/60"
              >
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-mk-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.6}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
