import Link from "next/link";
import { CtaLink, Section } from "@/components/marketing/primitives";
import type { Dictionary } from "@/lib/i18n";
import type { ReactNode } from "react";

/**
 * FAQ page.
 *
 * Fifteen questions across five groups, so the page is a reading surface rather
 * than a landing page: one column of text at a comfortable measure, with the
 * group name in a left rail so the eye can find a section without a filter UI.
 * That rail mirrors the Mission / Vision band on `/about` — same grid, same
 * uppercase label weight — so the two pages read as one site.
 *
 * No eyebrow above the `h1`: the title already says "Frequently Asked
 * Questions", and a label repeating it would only push the title down.
 */

/** One question-and-answer pair. */
function Question({ question }: { question: { q: string; a: string } }): ReactNode {
  return (
    <div className="border-t border-mk-line pt-6 first:border-t-0 first:pt-0">
      <h3 className="font-display text-[1.02rem] font-extrabold leading-snug tracking-[-0.01em] text-mk-ink">
        {question.q}
      </h3>
      <p className="mt-2.5 text-[0.95rem] leading-[1.75] text-mk-ink-soft">
        {question.a}
      </p>
    </div>
  );
}

function FaqHero({ t }: { t: Dictionary }): ReactNode {
  const { faq } = t;

  return (
    <Section tone="paper">
      <div className="max-w-3xl">
        <h1 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-mk-ink">
          {faq.heroTitle}
        </h1>

        <p className="mt-6 max-w-[54ch] text-[1.02rem] leading-[1.7] text-mk-ink-soft sm:text-[1.08rem]">
          {faq.heroDesc}{" "}
          <Link
            href="/contact"
            data-analytics-cta="faq_intro_contact"
            className="font-semibold text-mk-brand underline decoration-mk-brand/30 underline-offset-4 transition-colors duration-200 hover:text-mk-brand-bright hover:decoration-mk-brand-bright"
          >
            {faq.heroLink}
          </Link>
          .
        </p>
      </div>
    </Section>
  );
}

function FaqBody({ t }: { t: Dictionary }): ReactNode {
  const { faq } = t;

  return (
    <Section tone="white">
      <div className="space-y-14 sm:space-y-16">
        {faq.categories.map((category) => (
          <section key={category.name} className="grid gap-6 lg:grid-cols-12 lg:gap-12">
            <h2 className="font-display text-[0.78rem] font-bold uppercase tracking-[0.16em] text-mk-ink-mute lg:col-span-3 lg:pt-1">
              {category.name}
            </h2>

            <div className="space-y-6 lg:col-span-9">
              {category.questions.map((question) => (
                <Question key={question.q} question={question} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Section>
  );
}

/**
 * Closing panel, inset on paper rather than full-bleed. The footer directly
 * below is green (`--mk-brand-deep`), so a full-bleed green band would sit two
 * saturated dark blocks edge to edge — the paper padding keeps them apart, and
 * the white rule strip keeps them visibly separate. Same pattern as `/about`.
 */
function FaqCta({ t }: { t: Dictionary }): ReactNode {
  const { faq } = t;

  return (
    <Section tone="paper" padding="none" className="pb-20 pt-4 sm:pt-6 lg:pb-28">
      <div className="rounded-(--mk-radius-lg) bg-mk-brand-deep px-6 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-[clamp(1.75rem,3.2vw,2.65rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-mk-paper">
              {faq.ctaTitle}
            </h2>
            <p className="mt-4 text-[1rem] leading-[1.7] text-mk-paper/70">
              {faq.ctaDesc}
            </p>
          </div>

          <CtaLink href="/contact" variant="light" analytics="faq_bottom_contact">
            {faq.ctaButton}
          </CtaLink>
        </div>
      </div>
    </Section>
  );
}

export function FaqContent({ t }: { t: Dictionary }): ReactNode {
  return (
    <>
      <FaqHero t={t} />
      <FaqBody t={t} />
      <FaqCta t={t} />
    </>
  );
}

