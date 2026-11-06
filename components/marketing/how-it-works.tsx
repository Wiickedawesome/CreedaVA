import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import { Section, SectionHeading } from "@/components/marketing/primitives";

const STEP_ICONS = [
  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
] as const;

/**
 * The three-step onboarding strip: card per step, icon chip, ghost numeral.
 *
 * Lives on `/contact` only — that is the page where "what happens after I hit
 * send" is the reader's live question. It was previously the home page's
 * process section; home now hands the visitor off at the picker instead.
 *
 * The copy still comes from `t.home` (`processEyebrow`, `howItWorks`,
 * `howItWorksDesc`, `steps`). Those keys are the section's own strings, not
 * home-specific narrative, so they were left where they are rather than
 * duplicated into `t.contact`.
 *
 * No CTA: this renders at the foot of `/contact`, so a "Get Started Today"
 * button pointing back at `/contact` would be a loop. The page's own form
 * above and the rail's "/join" link are the actions.
 *
 * Tone is `white` because the cards are `bg-mk-paper/50` — they need a white
 * ground to read as tiles.
 */
export function HowItWorks({ t }: { t: Dictionary }): ReactNode {
  return (
    <Section tone="white">
      <SectionHeading
        align="center"
        eyebrow={t.home.processEyebrow}
        title={t.home.howItWorks}
        lede={t.home.howItWorksDesc}
      />

      <ol className="relative mt-12 grid gap-4 md:grid-cols-3">
        {t.home.steps.map((step, index) => (
          <li
            key={step.title}
            className="relative flex h-full flex-col rounded-(--mk-radius-lg) border border-mk-line bg-mk-paper/50 p-6 transition-colors duration-200 hover:border-mk-brand/25 hover:bg-mk-white"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-[0.8rem] bg-mk-accent-soft text-mk-brand">
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.6}
                    d={STEP_ICONS[index] ?? STEP_ICONS[0]}
                  />
                </svg>
              </span>
              <span
                aria-hidden="true"
                className="font-display text-[2.2rem] font-extrabold leading-none tracking-tight text-mk-ink-mute"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <h3 className="mt-5 font-display text-[1.02rem] font-bold text-mk-ink">
              {step.title}
            </h3>
            <p className="mt-2 text-[0.88rem] leading-relaxed text-mk-ink-soft">
              {step.desc}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
