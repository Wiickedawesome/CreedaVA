import type { ReactNode } from "react";
import { Bloom, CtaLink, Section } from "@/components/marketing/primitives";
import { PRICING_PATH } from "@/lib/constants/services";
import { ServicesExplorer } from "@/components/marketing/services-explorer";
import type { Dictionary } from "@/lib/i18n";

/**
 * Services page.
 *
 * Server Component — no client boundary at all. Everything on the page is either
 * static markup or a link.
 *
 * **There is no hero.** A reader who clicked "Services" already knows they are
 * looking at services, so an "Our Services" heading above the content only pushed
 * the useful part down the page. The industries band opens instead, and carries
 * the `h1`. Its eyebrow reads "Our services" so the page still names itself.
 *
 * Two bands, two rhythms, industries first:
 *
 *   1. **Industries we serve** — the same twelve services read by sector, as
 *      white cards on the accent tint. This is the entry point because a reader
 *      arrives knowing their sector, not our service names. Each service name
 *      links down to that service's row.
 *   2. **Every service, in full** — all twelve rendered as detail rows: numeral,
 *      glyph, name, one-line headline, what it covers, why it works with an
 *      assistant, an illustration, and a start link. No card grid.
 *
 * **The card grid is gone.** It said each service twice — once as a card, again
 * in the detail band — and the card version carried less. Removing it also
 * removed the filter chips and the selection state: with all twelve always on the
 * page there is nothing to filter and nothing to open.
 *
 * The anchors are load-bearing: the footer links to `/services#<anchor>` for all
 * twelve and pairs `SERVICE_ANCHORS[i]` with `t.footer.serviceLinks[i]` by index,
 * so the row order must stay aligned with that array. `ServicesExplorer` renders
 * from `SERVICE_ANCHORS` directly for that reason.
 *
 * Packages are **not** here. They moved to `/pricing`, because this page answers
 * "what do you do" and pricing answers "how do I buy". Each row links across so
 * the two pages stay connected.
 *
 * No navy band. `--mk-navy-deep` is Contact's one full navy surface; Home, About
 * and this page close on `--mk-brand-deep`, which is also the footer. Blue is
 * present here only as the shared eyebrow rule (`Eyebrow` in primitives).
 */

type ServicesCopy = Dictionary["services"];

function ClosingCta({ copy }: { copy: ServicesCopy }): ReactNode {
  return (
    <Section tone="paper" padding="none" className="pb-20 pt-4 sm:pt-6 lg:pb-28">
      {/* Home's closing slab, reused verbatim so the two pages land the same note. */}
      <div className="relative overflow-hidden rounded-4xl bg-mk-brand-deep px-6 py-12 sm:px-10 sm:py-14 lg:px-16 lg:py-20">
        <Bloom className="-right-24 -top-24 h-90 w-90 rounded-full bg-mk-accent/18 blur-[90px]" />
        <Bloom className="-bottom-32 -left-20 h-80 w-80 rounded-full bg-mk-brand-bright/25 blur-[100px]" />

        <div className="relative max-w-2xl">
          <h2 className="font-display text-[clamp(1.9rem,4vw,3.1rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-mk-paper">
            {copy.ctaTitle}
          </h2>

          <p className="mt-5 max-w-[46ch] text-[1.02rem] leading-[1.7] text-mk-paper/70">
            {copy.ctaDesc}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <CtaLink
              href="/contact"
              variant="light"
              analytics="services_bottom_contact"
            >
              {copy.ctaButton}
            </CtaLink>
            {/* Bridge to pricing. The two pages are separate now, so the
                catalogue has to say what it costs to buy from it. */}
            <CtaLink
              href={PRICING_PATH}
              variant="outlineDark"
              analytics="services_bottom_pricing"
            >
              {copy.ctaSecondary}
            </CtaLink>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function ServicesContent({ t }: { t: Dictionary }): ReactNode {
  const copy = t.services;

  return (
    <>
      {/* No hero: `ServicesExplorer` opens the industries band (which carries the
          h1) and then the catalogue. */}
      <ServicesExplorer copy={copy} />
      <ClosingCta copy={copy} />
    </>
  );
}
