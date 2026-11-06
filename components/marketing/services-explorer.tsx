import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import { SERVICE_ANCHORS } from "@/lib/constants/services";
import { Section, SectionHeading } from "@/components/marketing/primitives";
import { IndustriesSection } from "./industries-section";
import { ServiceDetail } from "./service-detail";

/**
 * The whole of /services, in two bands.
 *
 *   1. **Industries we serve** — the twelve services read by sector, so a reader
 *      arrives and finds their own business before reading twelve headings.
 *   2. **Every service, in full** — all twelve rendered with what they cover, why
 *      they work, and an illustration.
 *
 * **There is no card grid.** It used to sit under the industries band and repeat
 * each service in a thinner form than this band already says it, which meant
 * twelve services stated twice and the weaker version read first. Dropping it
 * also removed the selection state: everything is visible, so there is nothing
 * to open.
 *
 * All twelve are always rendered, which is what keeps the footer's
 * `/services#<anchor>` links resolving and keeps every service's copy in the
 * HTML for search.
 */
export function ServicesExplorer({ copy }: { copy: Dictionary["services"] }): ReactNode {
  return (
    <>
      {/* Industries first: the band owns its own bottom padding, and the hero's
          `lg:pb-28` is the gap above it, so neither needs a `pt`. */}
      <IndustriesSection copy={copy} />

      <Section tone="paper">
        <SectionHeading title={copy.directoryTitle} lede={copy.directoryDesc} />

        <div className="mt-12">
          {SERVICE_ANCHORS.map((anchor) => (
            <ServiceDetail key={anchor} anchor={anchor} copy={copy} />
          ))}
        </div>
      </Section>
    </>
  );
}
