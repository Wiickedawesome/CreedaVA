import type { ReactNode } from "react";
import { Bloom, CtaLink, Eyebrow, Section, SectionHeading } from "@/components/marketing/primitives";
import { WindowFrame } from "@/components/marketing/mockups";
import type { Dictionary } from "@/lib/i18n";

/**
 * Pricing page.
 *
 * Server Component: every section is static, so the route ships no client JS.
 *
 * The three packages used to live in a `#packages` section at the bottom of
 * /services. Splitting them out fixes a structural problem rather than a visual
 * one: /services is a catalogue of *what we do*, and pricing is a decision page
 * about *how to buy*. Combining them made the catalogue read as a sales page and
 * buried the plans under twelve service entries.
 *
 * Vocabulary is Home's, not a new one — soft `--mk-radius-lg` cards, pill CTAs,
 * a `--mk-brand-deep` closing slab. The added sections are structural ideas only:
 * a "built into every plan" row under the cards, an "every plan includes"
 * checklist paired with a product mockup, and a plain-language terms block.
 * The terms block is the page's one navy surface; see `Terms`.
 *
 * Two deliberate constraints:
 *   1. **No prices.** Packages are quoted per client; the admin AI guardrails
 *      forbid publishing rates or "starting at $X". The cards carry hours only.
 *   2. **No "no contract" claim.** The FAQ states an initial one-year commitment,
 *      so the terms block says so plainly instead of implying month-to-month.
 */

type PricingCopy = Dictionary["pricing"];
type PackageItem = Dictionary["services"]["packages"]["items"][number];

const TICK = (
  <span
    aria-hidden="true"
    className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mk-accent-soft text-mk-brand"
  >
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  </span>
);

function PricingHero({ copy }: { copy: PricingCopy }): ReactNode {
  return (
    <Section tone="paper">
      <div className="max-w-3xl">
        <Eyebrow>{copy.eyebrow}</Eyebrow>

        <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-mk-ink">
          {copy.heroTitle}{" "}
          <span className="text-mk-brand">{copy.heroTitleHighlight}</span>
        </h1>

        <p className="mt-6 max-w-[54ch] text-[1.02rem] leading-[1.7] text-mk-ink-soft sm:text-[1.08rem]">
          {copy.heroDesc}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <CtaLink href="/join" variant="primary" analytics="pricing_hero_join">
            {copy.heroCtaPrimary}
          </CtaLink>
          <CtaLink href="#plans" variant="outline" analytics="pricing_hero_plans">
            {copy.heroCtaSecondary}
          </CtaLink>
        </div>
      </div>
    </Section>
  );
}

function PlanCard({ pkg, cta }: { pkg: PackageItem; cta: string }): ReactNode {
  // Keyed off the badge rather than a hardcoded index, so the highlight follows
  // the data instead of the array position.
  const featured = "badge" in pkg;

  return (
    <article
      id={`package-${pkg.id}`}
      className={`relative flex scroll-mt-24 flex-col overflow-hidden rounded-(--mk-radius-lg) p-6 sm:p-7 ${
        featured
          ? "bg-mk-brand-deep text-mk-paper"
          : "border border-mk-line bg-mk-white transition duration-200 hover:-translate-y-0.5 hover:border-mk-brand/25 hover:shadow-(--mk-shadow-card)"
      }`}
    >
      {featured && (
        <Bloom className="-right-16 -top-16 h-56 w-56 rounded-full bg-mk-accent/20 blur-[70px]" />
      )}

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`font-display text-[1.25rem] font-extrabold tracking-[-0.02em] ${
              featured ? "text-mk-paper" : "text-mk-ink"
            }`}
          >
            {pkg.name}
          </h3>
          {featured && (
            <span className="inline-flex shrink-0 items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.72rem] font-medium text-mk-paper/80">
              {pkg.badge}
            </span>
          )}
        </div>

        <p
          className={`mt-1.5 text-[0.85rem] font-semibold tabular-nums ${
            featured ? "text-mk-accent" : "text-mk-brand"
          }`}
        >
          {pkg.hours}
        </p>
        <p
          className={`mt-3 text-[0.9rem] leading-[1.65] ${
            featured ? "text-mk-paper/70" : "text-mk-ink-soft"
          }`}
        >
          {pkg.desc}
        </p>

        {/*
         * `flex-1` pushes the CTA to the bottom of every column so the three
         * buttons share a baseline whatever the feature count (7 / 8 / 8).
         */}
        <ul
          className={`mt-6 flex-1 space-y-2.5 border-t pt-6 ${
            featured ? "border-white/12" : "border-mk-line"
          }`}
        >
          {pkg.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                  featured ? "bg-mk-accent/20 text-mk-accent" : "bg-mk-accent-soft text-mk-brand"
                }`}
              >
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
              <span
                className={`text-[0.86rem] leading-snug ${
                  featured ? "text-mk-paper/85" : "text-mk-ink-soft"
                }`}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <CtaLink
        href="/contact"
        variant={featured ? "light" : "primary"}
        analytics={`package_${pkg.id}_quote`}
        className="relative mt-7 w-full"
      >
        {cta}
      </CtaLink>
    </article>
  );
}

function Plans({
  copy,
  packages,
}: {
  copy: PricingCopy;
  packages: Dictionary["services"]["packages"];
}): ReactNode {
  return (
    <Section id="plans" tone="white">
      <SectionHeading
        eyebrow={copy.plansEyebrow}
        title={packages.title}
        lede={packages.description}
      />

      <div className="mt-12 grid grid-cols-1 items-stretch gap-5 md:grid-cols-3 lg:gap-6">
        {packages.items.map((pkg) => (
          <PlanCard key={pkg.id} pkg={pkg} cta={packages.ctaButton} />
        ))}
      </div>

      <p className="mt-5 text-[0.82rem] text-mk-ink-mute">{copy.plansNote}</p>

      {/* Two columns inside one band: the sentence on the left, the tools in a
          scannable grid on the right. The previous version ran all ten tools along
          a single line, which left most of the band empty and gave the sentence
          and the list the same visual weight. Splitting them uses the width and
          lets the eye take the claim first, then the evidence.

          ⚠️ Every vendor named here is a claim that we support it. Confirm the
          list before launch — see the note in docs/dev/MARKETING_REDESIGN.md. */}
      <div className="mt-12 rounded-(--mk-radius-lg) bg-mk-accent-soft px-6 py-7 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr] lg:items-center lg:gap-12">
          <h3 className="max-w-[26ch] font-display text-[1.05rem] font-extrabold leading-[1.35] tracking-[-0.015em] text-mk-ink">
            {copy.extrasTitle}
          </h3>

          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {copy.extras.map((tool) => (
              <li
                key={tool}
                className="flex items-center gap-2 text-[0.86rem] leading-none text-mk-ink-soft"
              >
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 text-mk-brand"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                {tool}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/**
 * Hours panel.
 *
 * This replaced a mockup that simply repeated the checklist beside it — it
 * looked like product art but carried no information the reader did not already
 * have. PatLive can show a receptionist dashboard because it sells minutes; we
 * sell hours, so the question a buyer actually has is "what does 160 hours buy
 * me?" This answers that.
 *
 * The bar is computed from `hoursBreakdown`, so the segments always fill the bar
 * and the numbers always match the widths — they cannot drift apart. The split
 * is illustrative and labelled as such; the real mix is agreed per client.
 */
const SEGMENT_TONE = [
  "bg-mk-brand",
  "bg-mk-brand-bright",
  "bg-mk-accent",
  // The fourth slice is brand blue rather than the old `--mk-line-strong` grey:
  // grey read as an unfilled remainder, not as a category. `--mk-navy-bright` is
  // used over `--mk-navy` because the legend dot is 8px — a deep navy that small
  // reads as near-black, and the point is that the reader sees blue.
  "bg-mk-navy-bright",
] as const;

function HoursPanel({ copy }: { copy: PricingCopy }): ReactNode {
  const total = copy.hoursBreakdown.reduce((sum, item) => sum + item.hours, 0);

  return (
    <WindowFrame label={copy.includedMockupLabel}>
      <div className="p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mk-ink-mute">
            {copy.hoursTitle}
          </p>
          <p className="text-[0.72rem] font-medium text-mk-brand">{copy.hoursPlanLabel}</p>
        </div>

        {/* One stacked bar rather than a chart: the point is the proportion, and a
            single row reads at a glance where four bars would not. */}
        <div
          className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-mk-line"
          role="img"
          aria-label={`${copy.hoursTotalLabel}: ${total}${copy.hoursUnit}`}
        >
          {copy.hoursBreakdown.map((item, i) => (
            <span
              key={item.label}
              className={SEGMENT_TONE[i % SEGMENT_TONE.length]}
              style={{ width: `${(item.hours / total) * 100}%` }}
            />
          ))}
        </div>

        <dl className="mt-5 space-y-2.5">
          {copy.hoursBreakdown.map((item, i) => (
            <div key={item.label} className="flex items-baseline gap-2.5">
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${SEGMENT_TONE[i % SEGMENT_TONE.length]}`}
              />
              <dt className="text-[0.84rem] text-mk-ink-soft">{item.label}</dt>
              <dd className="ml-auto text-[0.84rem] font-semibold tabular-nums text-mk-ink">
                {item.hours}
                {copy.hoursUnit}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 border-t border-mk-line pt-4 text-[0.76rem] leading-[1.55] text-mk-ink-mute">
          {copy.hoursFootnote}
        </p>
      </div>
    </WindowFrame>
  );
}

function Included({ copy }: { copy: PricingCopy }): ReactNode {
  return (
    <Section tone="paper">
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
        <div>
          <SectionHeading
            eyebrow={copy.includedEyebrow}
            title={copy.includedTitle}
            lede={copy.includedDesc}
          />

          <ul className="mt-8 space-y-3">
            {copy.includedItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                {TICK}
                <span className="text-[0.92rem] leading-relaxed text-mk-ink-soft">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Not `aria-hidden`: this carries information the checklist does not, so
            assistive tech should read it. */}
        <HoursPanel copy={copy} />
      </div>
    </Section>
  );
}

/**
 * Objections, not fine print.
 *
 * This section used to be called "The fine print" and led with "No setup fees" —
 * which was wrong: setup is quoted where a workflow needs it. The body now answers
 * the six things a buyer compares us against instead.
 *
 * Navy, not green — the same surface and bloom recipe as About's Purpose band, so
 * brand blue gets real area on this page instead of living only on /about and the
 * /contact rail. Paper sections bracket it on both sides, so it never sits edge to
 * edge with the green closing slab below.
 *
 * Layout: one rule per item rather than a `gap-px` grid. The old grid needed
 * `odd:pl-0` to keep the first column flush with the heading, which only works
 * for exactly two columns; a top rule per cell aligns at any column count.
 */
function Terms({ copy }: { copy: PricingCopy }): ReactNode {
  return (
    <Section tone="navy" className="overflow-hidden">
      <Bloom className="-right-32 -top-32 h-[420px] w-[420px] rounded-full bg-mk-navy-bright/25 blur-[110px]" />
      <Bloom className="-bottom-40 -left-28 h-[380px] w-[380px] rounded-full bg-mk-navy-bright/15 blur-[110px]" />

      <div className="relative">
        <SectionHeading
          onDark
          eyebrow={copy.termsEyebrow}
          title={copy.termsTitle}
          lede={copy.termsDesc}
        />

        <dl className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {copy.termsItems.map((term) => (
            <div key={term.title} className="border-t border-white/15 pt-6">
              <dt className="font-display text-[1.02rem] font-extrabold tracking-[-0.01em] text-mk-paper">
                {term.title}
              </dt>
              <dd className="mt-2.5 max-w-[38ch] text-[0.88rem] leading-[1.65] text-mk-paper/70">
                {term.desc}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

function PricingClosing({ copy }: { copy: PricingCopy }): ReactNode {
  return (
    // The navy Terms band sits directly above, so the green slab needs a real
    // cream collar (`pt-*`) rather than the 16px hairline the other closing
    // sections get — without it the two dark surfaces read as one broken block.
    <Section
      tone="paper"
      padding="none"
      className="pb-20 pt-16 sm:pt-20 lg:pb-28 lg:pt-24"
    >
      {/*
       * Geometry mirrors About's ClosingCta panel exactly — same radius token,
       * same padding ramp, same type scale, and the CTA parked beside the copy
       * on lg. The earlier stacked version ran 368px tall against About's 214px,
       * which read as a hero rather than a closing nudge.
       */}
      <div className="relative overflow-hidden rounded-(--mk-radius-lg) bg-mk-brand-deep px-6 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <Bloom className="-right-24 -top-24 h-90 w-90 rounded-full bg-mk-accent/18 blur-[90px]" />
        <Bloom className="-bottom-32 -left-20 h-80 w-80 rounded-full bg-mk-brand-bright/25 blur-[100px]" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-[clamp(1.75rem,3.2vw,2.65rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-mk-paper">
              {copy.closingTitle}
            </h2>
            <p className="mt-4 text-[1rem] leading-[1.7] text-mk-paper/70">
              {copy.closingDesc}
            </p>
          </div>

          <CtaLink href="/join" variant="light" analytics="pricing_closing_join">
            {copy.closingCta}
          </CtaLink>
        </div>
      </div>
    </Section>
  );
}


export function PricingContent({ t }: { t: Dictionary }): ReactNode {
  return (
    <>
      <PricingHero copy={t.pricing} />
      <Plans copy={t.pricing} packages={t.services.packages} />
      <Included copy={t.pricing} />
      <Terms copy={t.pricing} />
      <PricingClosing copy={t.pricing} />
    </>
  );
}
