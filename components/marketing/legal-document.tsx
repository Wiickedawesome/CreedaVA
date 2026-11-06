import { Section } from "@/components/marketing/primitives";
import type { ReactNode } from "react";

/**
 * Shared shell for the legal pages (`/privacy`, `/terms`).
 *
 * Both documents have the same shape — a title, a "last updated" line, and a
 * list of numbered sections made of paragraphs, an optional bullet list and an
 * optional contact address. They were two copies of the same markup on the old
 * `gray-*` tokens; this is the single implementation they both render through.
 *
 * Layout is a plain readable column, not the two-column rail the FAQ uses:
 * legal prose is read top to bottom, and a rail would leave the text too narrow
 * at every width where the rail has room.
 */

export type LegalSection = {
  title: string;
  paragraphs: readonly string[];
  list?: readonly string[];
  contactEmail?: string;
};

/** One numbered section: heading, prose, optional list, optional contact link. */
function LegalBlock({ section }: { section: LegalSection }): ReactNode {
  const lastIndex = section.paragraphs.length - 1;

  return (
    <section className="border-t border-mk-line pt-10 first:border-t-0 first:pt-0">
      <h2 className="font-display text-[1.15rem] font-extrabold leading-snug tracking-[-0.015em] text-mk-ink sm:text-[1.28rem]">
        {section.title}
      </h2>

      <div className="mt-4 space-y-4">
        {section.paragraphs.map((paragraph, index) => (
          <p
            key={`${section.title}-${index}`}
            className="text-[0.96rem] leading-[1.8] text-mk-ink-soft"
          >
            {paragraph}
            {section.contactEmail && index === lastIndex ? (
              <>
                {" "}
                <a
                  href={`mailto:${section.contactEmail}`}
                  className="font-semibold text-mk-brand underline decoration-mk-brand/30 underline-offset-4 transition-colors duration-200 hover:text-mk-brand-bright hover:decoration-mk-brand-bright"
                >
                  {section.contactEmail}
                </a>
                .
              </>
            ) : null}
          </p>
        ))}
      </div>

      {section.list ? (
        <ul className="mt-5 space-y-2.5">
          {section.list.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-[0.94rem] leading-[1.7] text-mk-ink-soft"
            >
              <span
                aria-hidden="true"
                className="mt-[0.62rem] h-1 w-3 shrink-0 rounded-full bg-mk-brand/35"
              />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function LegalDocument({
  title,
  lastUpdated,
  sections,
}: {
  title: string;
  lastUpdated: string;
  sections: readonly LegalSection[];
}): ReactNode {
  return (
    <>
      <Section tone="paper">
        <div className="max-w-3xl">
          <h1 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-mk-ink">
            {title}
          </h1>

          <p className="mt-6 text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-mk-ink-mute">
            {lastUpdated}
          </p>
        </div>
      </Section>

      <Section tone="white">
        <div className="max-w-[68ch] space-y-10">
          {sections.map((section) => (
            <LegalBlock key={section.title} section={section} />
          ))}
        </div>
      </Section>
    </>
  );
}
