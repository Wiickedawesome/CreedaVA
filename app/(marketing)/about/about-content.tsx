import type { ReactNode } from "react";
import { Container } from "@/components/ui";
import { Bloom, CtaLink, Eyebrow } from "@/components/marketing/primitives";
import { WorldMap } from "@/components/ui/world-map";
import type { Dictionary } from "@/lib/i18n";

/**
 * About page.
 *
 * Server Component: the page is static copy, so it renders to HTML with no
 * client JS. The world map is imported directly rather than through
 * `next/dynamic` with `ssr: false` — that option is not permitted in Server
 * Components and only ever cost a client-side download.
 *
 * The map carries the page's central claim (Belize is the only
 * English-speaking country in Central America), so it sits inside "Why Belize"
 * rather than floating beside the headline as decoration.
 */

/**
 * About uses its own vocabulary for the body of the page — rules and numerals
 * instead of cards and icon chips, squared buttons instead of pills. Section
 * markers are the exception: they use the shared `Eyebrow` so every page opens
 * a band the same way.
 */



/** Zero-padded index used as the visual anchor of each editorial entry. */
function Index({ value, onDark = false }: { value: number; onDark?: boolean }): ReactNode {
  return (
    <span
      aria-hidden="true"
      className={`font-display text-[0.72rem] font-bold tabular-nums tracking-[0.08em] ${
        onDark ? "text-mk-accent" : "text-mk-brand"
      }`}
    >
      {String(value + 1).padStart(2, "0")}
    </span>
  );
}

function AboutHero({ t }: { t: Dictionary }): ReactNode {
  const { about } = t;

  return (
    <section className="bg-mk-paper">
      <Container>
        <div className="max-w-4xl pb-12 pt-16 sm:pt-20 lg:pb-16 lg:pt-24">
          <Eyebrow>{about.eyebrow}</Eyebrow>

          <h1 className="mt-6 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-mk-ink">
            {about.heroTitle}
            <br />
            <span className="text-mk-brand">{about.heroTitleHighlight}</span>
          </h1>

          <p className="mt-7 max-w-[48ch] text-[1.05rem] leading-[1.7] text-mk-ink-soft sm:text-[1.15rem]">
            {about.heroDesc}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3">
            <CtaLink href="/contact" analytics="about_hero_contact">
              {about.heroCtaPrimary}
            </CtaLink>
            <CtaLink
              href="/services"
              variant="quiet"
              analytics="about_hero_services"
            >
              {about.heroCtaSecondary}
            </CtaLink>
          </div>

          {/* Facts as a ruled data strip, not checkmark chips. */}
          <ul className="mt-12 grid grid-cols-1 border-y border-mk-line sm:grid-cols-3">
            {about.heroFacts.map((fact, index) => (
              <li
                key={fact}
                className={`py-4 text-[0.82rem] font-medium text-mk-ink ${
                  index === 0
                    ? "sm:pr-6"
                    : "border-t border-mk-line sm:border-l sm:border-t-0 sm:px-6"
                }`}
              >
                <span className="mr-2 font-display text-[0.72rem] font-bold tabular-nums text-mk-ink-mute">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* Atlas plate — the map is the page's opening image, not a side widget. */}
      <div className="border-y border-mk-line bg-mk-white">
        <Container>
          <div className="py-8 sm:py-10 lg:py-12">
            <div className="mx-auto max-w-5xl">
              <WorldMap className="h-auto w-full" />
            </div>

            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-t border-mk-line pt-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-mk-ink">
                {about.mapCaptionLabel}
              </p>
              <p className="text-[0.72rem] text-mk-ink-mute">
                {about.mapCaptionMeta}
              </p>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

function WhyBelize({ t }: { t: Dictionary }): ReactNode {
  const { about } = t;

  return (
    <section className="bg-mk-white py-16 sm:py-20 lg:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Eyebrow>{about.whyEyebrow}</Eyebrow>

            <h2 className="mt-5 font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-mk-ink">
              {about.whyTitle}
            </h2>

            <p className="mt-6 text-[1rem] leading-[1.75] text-mk-ink-soft">
              {about.whyP1}
            </p>
            <p className="mt-4 text-[1rem] leading-[1.75] text-mk-ink-soft">
              {about.whyP2}
            </p>
          </div>

          <ol className="border-t border-mk-line lg:col-span-7">
            {about.whyFacts.map((fact, index) => (
              <li
                key={fact.title}
                className="grid grid-cols-[2rem_1fr] gap-x-5 border-b border-mk-line py-6"
              >
                <Index value={index} />
                <div>
                  <p className="font-display text-[1.05rem] font-bold text-mk-ink">
                    {fact.title}
                  </p>
                  <p className="mt-1.5 text-[0.92rem] leading-[1.7] text-mk-ink-soft">
                    {fact.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

function HowWeWork({ t }: { t: Dictionary }): ReactNode {
  const { about } = t;

  return (
    <section className="bg-mk-paper py-16 sm:py-20 lg:py-28">
      <Container>
        <div className="max-w-3xl">
          <Eyebrow>{about.approachEyebrow}</Eyebrow>

          <h2 className="mt-5 font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-mk-ink">
            {about.approachTitle}
          </h2>

          <p className="mt-6 text-[1rem] leading-[1.75] text-mk-ink-soft">
            {about.approachDesc}
          </p>
        </div>

        <ul className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {about.standards.map((standard, index) => (
            <li key={standard.title} className="border-t-2 border-mk-ink pt-5">
              <Index value={index} />
              <p className="mt-2 font-display text-[1.02rem] font-bold text-mk-ink">
                {standard.title}
              </p>
              <p className="mt-2 text-[0.9rem] leading-[1.7] text-mk-ink-soft">
                {standard.desc}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function Values({ t }: { t: Dictionary }): ReactNode {
  const { about } = t;

  return (
    <section className="bg-mk-white py-16 sm:py-20 lg:py-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-mk-line pb-8">
          <div className="max-w-xl">
            <Eyebrow>{about.valuesEyebrow}</Eyebrow>

            <h2 className="mt-5 font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-mk-ink">
              {about.valuesTitle}
            </h2>
          </div>

          <p className="max-w-sm text-[0.95rem] leading-[1.7] text-mk-ink-soft">
            {about.valuesDesc}
          </p>
        </div>

        <ul className="mt-px grid gap-px bg-mk-line sm:grid-cols-2">
          {about.values.map((value) => (
            <li key={value.title} className="bg-mk-white py-8 sm:px-8">
              <p className="font-display text-[1.3rem] font-extrabold leading-tight tracking-[-0.02em] text-mk-ink">
                {value.title}
              </p>
              <p className="mt-2.5 max-w-sm text-[0.92rem] leading-[1.7] text-mk-ink-soft">
                {value.desc}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/**
 * Mission and vision share one navy band, replacing the legacy slate that used
 * to sit here. The footer is green (`--mk-brand-deep`), so this band is now the
 * page's only navy — the place where brand blue gets real area.
 *
 * Colour-weight rule: navy and brand green are both fully saturated and both
 * dark, so any two dark bands placed edge to edge read as a clash regardless of
 * hue. A light section must always follow this band — never the green CTA.
 */
function Purpose({ t }: { t: Dictionary }): ReactNode {
  const { about } = t;

  return (
    <section className="relative overflow-hidden bg-mk-navy-deep py-20 text-mk-paper sm:py-24 lg:py-32">
      {/* Same bloom lighting as the green bands, tinted blue. Without it this
          band is a flat navy slab while every green section glows. */}
      <Bloom className="-right-32 -top-32 h-[420px] w-[420px] rounded-full bg-mk-navy-bright/25 blur-[110px]" />
      <Bloom className="-bottom-40 -left-28 h-[380px] w-[380px] rounded-full bg-mk-navy-bright/15 blur-[110px]" />
      <Container className="relative">
        <Eyebrow onDark>{about.purposeEyebrow}</Eyebrow>

        <div className="mt-12 space-y-14">
          <div className="grid gap-5 lg:grid-cols-12 lg:gap-12">
            <h2 className="font-display text-[0.78rem] font-bold uppercase tracking-[0.16em] text-mk-paper/70 lg:col-span-3 lg:pt-2">
              {about.missionTitle}
            </h2>
            <p className="font-display text-[clamp(1.25rem,2.3vw,1.8rem)] font-semibold leading-[1.45] tracking-[-0.01em] text-mk-paper lg:col-span-9">
              {about.missionDesc}
            </p>
          </div>

          <div aria-hidden="true" className="h-px bg-white/12" />

          <div className="grid gap-5 lg:grid-cols-12 lg:gap-12">
            <h2 className="font-display text-[0.78rem] font-bold uppercase tracking-[0.16em] text-mk-paper/70 lg:col-span-3 lg:pt-2">
              {about.visionTitle}
            </h2>
            <p className="font-display text-[clamp(1.25rem,2.3vw,1.8rem)] font-semibold leading-[1.45] tracking-[-0.01em] text-mk-paper lg:col-span-9">
              {about.visionDesc}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function ClosingCta({ t }: { t: Dictionary }): ReactNode {
  const { about } = t;

  return (
    <section className="bg-mk-paper pb-20 pt-4 sm:pb-24 lg:pb-28">
      <Container>
      {/*
       * Inset panel, not a full-bleed band: the footer directly below is navy,
       * and a full-bleed green section would put two saturated dark blocks
       * against each other. The paper padding keeps them apart.
       */}
      <div className="relative overflow-hidden rounded-(--mk-radius-lg) bg-mk-brand-deep px-6 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-[clamp(1.75rem,3.2vw,2.65rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-mk-paper">
              {about.ctaTitle}
            </h2>
            <p className="mt-4 text-[1rem] leading-[1.7] text-mk-paper/70">
              {about.ctaDesc}
            </p>
          </div>

          <CtaLink
            href="/contact"
            variant="light"
            analytics="about_bottom_contact"
          >
            {about.ctaButton}
          </CtaLink>
        </div>
      </div>
      </Container>
    </section>
  );
}

export function AboutContent({ t }: { t: Dictionary }): ReactNode {
  return (
    <>
      <AboutHero t={t} />
      <WhyBelize t={t} />
      <HowWeWork t={t} />
      {/* The navy band is followed by a light section on purpose — see Purpose. */}
      <Purpose t={t} />
      <Values t={t} />
      <ClosingCta t={t} />
    </>
  );
}
