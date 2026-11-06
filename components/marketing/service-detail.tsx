import type { ReactNode } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { SERVICE_ANCHORS } from "@/lib/constants/services";
import { SERVICE_MOCKUPS } from "@/lib/constants/service-detail";
import { ServiceGlyph, type ServiceAnchor } from "@/lib/constants/service-glyphs";
import { CtaLink } from "@/components/marketing/primitives";
import { ServiceMockupArt } from "./service-mockups";

/**
 * One service, in full: what it covers, why it works, and an illustration.
 *
 * The page renders this twelve times in a single band rather than hiding eleven
 * of them behind a card grid. The grid said each service twice — once as a card
 * and again here — and the card version was the thinner of the two, so it went.
 *
 * Layout is two columns on desktop: argument on the left (what it covers, why it
 * works), illustration on the right. The illustration is deliberately narrower
 * than the copy column — it is evidence of *what kind of work* this is, not the
 * main event.
 *
 * The `id` is the anchor the footer and the industries band link to, so it lives
 * on the row itself. `scroll-mt-24` clears the sticky header on those jumps.
 */

type ServicesCopy = Dictionary["services"];

function Tick(): ReactNode {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-mk-brand/10 text-mk-brand"
    >
      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

export function ServiceDetail({
  anchor,
  copy,
}: {
  anchor: ServiceAnchor;
  copy: ServicesCopy;
}): ReactNode {
  const position = SERVICE_ANCHORS.indexOf(anchor);
  const category = copy.categories[position];
  const detail = copy.detail[anchor];
  if (!category || !detail) return null;

  return (
    <article
      id={anchor}
      className="scroll-mt-24 border-t border-mk-line py-12 first:border-t-0 first:pt-0 sm:py-14 lg:py-16"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-14">
        <div>
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[1rem] bg-mk-brand text-mk-accent">
              <ServiceGlyph anchor={anchor} className="h-7 w-7" />
            </span>
            <div>
              <h3 className="font-display text-[clamp(1.5rem,3vw,2.1rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-mk-ink">
                {category.title}
              </h3>
              <p className="mt-2 text-[0.95rem] leading-[1.6] text-mk-ink-soft">
                {detail.headline}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <h4 className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mk-brand">
                {copy.detailIncludes}
              </h4>
              <ul className="mt-3.5 space-y-2.5">
                {category.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Tick />
                    <span className="text-[0.85rem] leading-snug text-mk-ink-soft">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mk-brand">
                {copy.detailWhy}
              </h4>
              <ul className="mt-3.5 space-y-3.5">
                {detail.why.map((reason, i) => (
                  <li key={reason} className="flex items-start gap-2.5">
                    <span className="mt-0.5 font-display text-[0.72rem] font-extrabold tabular-nums text-mk-ink-mute">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[0.85rem] leading-[1.55] text-mk-ink-soft">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-mk-line pt-6">
            <CtaLink href="/contact" variant="primary" analytics={`services_${anchor}`}>
              {copy.detailStart}
            </CtaLink>
            <Link
              href="/pricing"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-mk-line-strong px-5 text-[0.9rem] font-semibold text-mk-ink-soft transition-colors duration-150 hover:border-mk-brand hover:text-mk-brand"
            >
              {copy.detailPricingLink}
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0"
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
          </div>
        </div>

        {/* No `sticky` here on purpose: pinning the illustration made it drift out
            of step with the text beside it while scrolling. It now stays anchored to
            the top of its own row. */}
        <div>
          <ServiceMockupArt mockup={SERVICE_MOCKUPS[anchor]} copy={copy.mockup} />
          <p className="mt-3 text-center text-[0.72rem] leading-relaxed text-mk-ink-mute">
            {copy.detailMockupNote}
          </p>
        </div>
      </div>
    </article>
  );
}
