import type { Dictionary } from "@/lib/i18n";
import { HomeHero } from "@/components/marketing/home/hero";
import { HomeCounterBand, HomeComparison } from "@/components/marketing/home/proof";
import { HomeDayInLife } from "@/components/marketing/home/process";
import { HomeHuman } from "@/components/marketing/home/human";
import { HomeHandoffPicker } from "@/components/marketing/home/handoff-picker";
import { HomeFaq, HomeClosingCta } from "@/components/marketing/home/closing";

// Every figure here must be checkable on the site itself. The previous values
// ("500+" tasks, "98%" satisfaction, "50+" clients) were not substantiated by
// anything — the CRM held 0 active clients — which was an advertising-claims
// exposure. These four are verifiable: the comparison section states one flat
// monthly fee, there are 3 packages, the site is bilingual, and the onboarding
// copy says 5–7 days. Deliberately NOT the service count: CreedaVA also builds
// custom scopes, so a fixed number would cap the offering.
export const DEFAULT_STAT_VALUES = ["1", "3", "EN/ES", "5–7"];

/**
 * Home page composition.
 *
 * Order is deliberate: show what the work looks like (hero artifacts), quantify
 * it (counter band), establish that a human does it ("real people"), then answer
 * "why this instead of the alternatives" (comparison) and "what does a day look
 * like" before the interactive hand-off picker. Objections close in the FAQ.
 *
 * The 3-step process is NOT here — it moved to `/contact`, where "what happens
 * after I send this" is the live question. Home's job is to get someone to the
 * form, not to describe the intake a second time.
 *
 * Tones run paper / navy / white / paper / navy / white / paper / paper. The last
 * two are paper on purpose — that is the closing card sitting on a cream ground,
 * not two flat bands. Everything above alternates; keep it that way, because a
 * section whose children are white cards needs a cream ground and vice versa:
 *
 *   - `HomeComparison` is paper because its cards are `bg-mk-white`.
 *   - `HomeHuman` is white because the comparison below it is paper. Its chat
 *     window is also `bg-mk-white`, so it is separated by its hairline frame and
 *     the accent glow rather than by its fill — do not "fix" that by flipping
 *     this section back to paper, that recreates the cream-on-cream seam.
 *   - `HomeHandoffPicker` is white because its pills are `bg-mk-paper`.
 *
 * The 6-card service grid is gone on purpose: it was a 1300px wall that nobody
 * scrolled. The catalogue lives on /services, which the navbar and footer link.
 */
export function HomeContent({
  statValues = DEFAULT_STAT_VALUES,
  t,
}: {
  statValues?: readonly string[] | string[];
  t: Dictionary;
}) {
  return (
    <>
      <HomeHero t={t} />
      <HomeCounterBand t={t} statValues={statValues} />
      <HomeHuman t={t} />
      <HomeComparison t={t} />
      <HomeDayInLife t={t} />
      <HomeHandoffPicker t={t} />
      <HomeFaq t={t} />
      <HomeClosingCta t={t} />
    </>
  );
}
