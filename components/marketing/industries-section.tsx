import type { ReactNode } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { INDUSTRIES, SERVICE_ANCHORS } from "@/lib/constants/services";
import { ServiceGlyph } from "@/lib/constants/service-glyphs";
import { Section, SectionHeading } from "@/components/marketing/primitives";

/**
 * The opening band of /services: which sector buys which work.
 *
 * This is the first thing a reader sees, because they arrive knowing their
 * sector, not our service names. The twelve services are the detail behind it.
 *
 * Deliberately built on the opposite surface to the grid below — white cards on
 * the accent tint, glyph tile inverted to a dark ground — so the page has two
 * distinct rhythms instead of one long field of cards.
 *
 * It carries the page's `h1` (`level={1}`): the old "Our Services" hero was
 * removed, and a page needs exactly one main heading.
 *
 * Each service name links to that service's anchor in the band below. Every
 * service is always rendered, so a jump can never land on something that is not
 * on the page.
 */

type ServicesCopy = Dictionary["services"];

function IndustryCard({
  industry,
  copy,
}: {
  industry: (typeof INDUSTRIES)[number];
  copy: ServicesCopy;
}): ReactNode {
  const index = INDUSTRIES.indexOf(industry);
  const meta = copy.industries[index];
  if (!meta) return null;

  const [primary] = industry.anchors;

  return (
    <article className="group flex h-full flex-col rounded-(--mk-radius-lg) border border-mk-brand/12 bg-mk-white p-6 transition duration-200 hover:-translate-y-0.5 hover:border-mk-brand/30 hover:shadow-(--mk-shadow-card)">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[0.8rem] bg-mk-brand text-mk-accent transition-colors duration-200 group-hover:bg-mk-brand-deep">
        <ServiceGlyph anchor={primary} className="h-5 w-5" />
      </span>

      <h2 className="mt-4 font-display text-[1.05rem] font-extrabold leading-snug tracking-[-0.015em] text-mk-ink">
        {meta.title}
      </h2>

      <p className="mt-2.5 text-[0.88rem] leading-[1.6] text-mk-ink-soft">{meta.desc}</p>

      {/* `mt-auto` anchors the list to the bottom edge of the card, so when a short
          card is stretched to match a taller one the slack collects above the rule
          instead of below the last link. The divider then lines up across the row. */}
      <ul className="mt-auto space-y-0.5 border-t border-mk-brand/12 pt-4">
        {industry.anchors.map((anchor) => {
          const serviceIndex = SERVICE_ANCHORS.indexOf(anchor);
          const category = copy.categories[serviceIndex];
          if (!category) return null;

          return (
            <li key={anchor}>
              <Link
                href={`#${anchor}`}
                className="group/link flex items-center justify-between gap-3 rounded-md py-1.5 text-[0.83rem] font-semibold text-mk-brand transition-colors duration-150 hover:text-mk-brand-bright"
              >
                <span>{category.title}</span>
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover/link:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M5 12h14M13 6l6 6-6 6"
                  />
                </svg>
              </Link>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

export function IndustriesSection({ copy }: { copy: ServicesCopy }): ReactNode {
  return (
    <Section tone="tint">
      <SectionHeading
        level={1}
        eyebrow={copy.industriesEyebrow}
        title={
          <>
            {copy.industriesTitle}{" "}
            <span className="text-mk-brand">{copy.industriesTitleHighlight}</span>
          </>
        }
        lede={copy.industriesDesc}
      />

      {/* Equal heights per row, not content height. Cards used to end where their
          content ended, which left visibly smaller cards beside a five-service one
          and read as broken rather than compact. The grid stretches each row to its
          tallest card instead; the sector order in `INDUSTRIES` is what keeps the
          resulting slack small. */}
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((industry) => (
          <li key={industry.id} className="flex">
            <IndustryCard industry={industry} copy={copy} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
