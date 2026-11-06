import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/ui";
import { Bloom } from "@/components/marketing/primitives";
import { HowItWorks } from "@/components/marketing/how-it-works";
import type { Dictionary } from "@/lib/i18n";
import { ContactForm } from "./contact-form";

/**
 * Contact page.
 *
 * Server Component: only the form itself is interactive, so everything else
 * renders as static HTML with no client JS.
 *
 * Visual language — "intake sheet". Contact is a transaction page, not a
 * marketing one, so its hero and rail use neither the homepage's card grid nor
 * About's editorial rules and atlas plate. Its own vocabulary is:
 *
 *   - underline fields with no box or fill, like a printed form
 *   - a letterhead-style detail block (label above value, no rules)
 *   - one navy inset panel, which is the only full navy surface on the site
 *
 * The closing section is the one exception, and deliberately so: it is the
 * shared `HowItWorks` marketing section, moved here from the home page. Its
 * cards are the only card treatment on /contact, which is what makes the
 * closing beat feel different from the intake-sheet body above it.
 */

type ContactCopy = Dictionary["contact"];

const ARROW = (
  <svg
    aria-hidden="true"
    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 12h14M13 6l6 6-6 6"
    />
  </svg>
);

/** Small uppercase field label, shared by the hero meta strip and the rail. */
function FieldLabel({ children }: { children: ReactNode }): ReactNode {
  return (
    <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mk-ink-mute">
      {children}
    </span>
  );
}

function ContactHero({ copy }: { copy: ContactCopy }): ReactNode {
  return (
    /*
     * The cream surface needs its own bottom padding: the next band is white, so
     * without it the info strip sits flush against the colour change and the
     * rule reads as the section boundary.
     */
    <section className="bg-mk-paper pb-6 sm:pb-8 lg:pb-10">
      <Container>
        <div className="max-w-4xl pb-14 pt-16 sm:pt-20 lg:pb-16 lg:pt-24">
          <h1 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-mk-ink">
            {copy.heroTitle}
          </h1>

          <p className="mt-7 max-w-[46ch] text-[1.05rem] leading-[1.7] text-mk-ink-soft sm:text-[1.15rem]">
            {copy.heroDesc}
          </p>
        </div>

        {/* Two facts a visitor wants before writing: when we answer, and when we are here. */}
        <dl className="grid border-t border-mk-line sm:grid-cols-2">
          <div className="pt-8 sm:pr-8">
            <dt>
              <FieldLabel>{copy.responseLabel}</FieldLabel>
            </dt>
            <dd className="mt-2 text-[0.95rem] leading-[1.6] text-mk-ink">
              {copy.responseValue}
            </dd>
          </div>
          <div className="mt-8 border-t border-mk-line pt-8 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-8">
            <dt>
              <FieldLabel>{copy.hoursLabel}</FieldLabel>
            </dt>
            <dd className="mt-2 text-[0.95rem] leading-[1.6] text-mk-ink">
              {copy.hoursValue}
            </dd>
          </div>
        </dl>
      </Container>
    </section>
  );
}

function DetailsRail({ copy }: { copy: ContactCopy }): ReactNode {
  return (
    <div className="lg:pl-10">
      <h2 className="font-display text-[1.35rem] font-extrabold leading-tight tracking-[-0.025em] text-mk-ink">
        {copy.contactInfoTitle}
      </h2>

      <p className="mt-3 max-w-[40ch] text-[0.92rem] leading-[1.7] text-mk-ink-soft">
        {copy.contactInfoDesc}
      </p>

      {/*
       * Direct channels only. Business hours and response time live in the hero
       * strip above — repeating them here would answer the same question twice.
       *
       * Stacked, not two columns: at `lg` the rail is ~349px wide, so a two-up
       * grid leaves ~158px per cell and `contact@creedava.com` wraps mid-word,
       * orphaning the final "m" onto its own line. One column gives each value
       * the full width and both entries align on the same left edge.
       */}
      <dl className="mt-9 grid grid-cols-1 gap-y-6">
        <div>
          <dt>
            <FieldLabel>{copy.emailLabel}</FieldLabel>
          </dt>
          <dd className="mt-2">
            <a
              href={`mailto:${copy.emailValue}`}
              className="text-[0.95rem] font-medium break-words text-mk-brand underline-offset-4 hover:text-mk-brand-bright hover:underline"
            >
              {copy.emailValue}
            </a>
          </dd>
        </div>

        <div>
          <dt>
            <FieldLabel>{copy.phoneLabel}</FieldLabel>
          </dt>
          <dd className="mt-2">
            <a
              href={`tel:${copy.phoneValue}`}
              className="text-[0.95rem] font-medium text-mk-brand underline-offset-4 hover:text-mk-brand-bright hover:underline"
            >
              {copy.phoneValue}
            </a>
          </dd>
        </div>
      </dl>

      {/*
       * Navy inset, not a full-bleed band. This is the one place the brand blue
       * appears on /contact: small enough to read as an accent, and separated
       * from the navy footer by the white section that follows.
       */}
      <div className="relative mt-10 overflow-hidden rounded-(--mk-radius-lg) bg-mk-navy-deep px-6 py-7">
        {/* Same blue bloom lighting as the other navy surfaces. */}
        <Bloom className="-right-16 -top-16 h-56 w-56 rounded-full bg-mk-navy-bright/30 blur-[80px]" />
        <Bloom className="-bottom-20 -left-14 h-52 w-52 rounded-full bg-mk-navy-bright/18 blur-[90px]" />
        <div className="relative">
          <h3 className="font-display text-[1.15rem] font-extrabold leading-tight tracking-[-0.02em] text-mk-paper">
            {copy.bookTitle}
          </h3>
          <p className="mt-2.5 text-[0.9rem] leading-[1.65] text-mk-paper-mute">
            {copy.bookDesc}
          </p>
          <Link
            href="/join"
            data-analytics-cta="contact_book_join"
            className="group mt-5 inline-flex items-center gap-2 text-[0.9rem] font-semibold text-mk-accent hover:text-white"
          >
            {copy.bookLink}
            {ARROW}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Intake({ copy }: { copy: ContactCopy }): ReactNode {
  return (
    <section className="bg-mk-white py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="mx-auto grid max-w-5xl gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ContactForm copy={copy} />
          </div>
          <aside className="lg:col-span-5">
            <DetailsRail copy={copy} />
          </aside>
        </div>
      </Container>
    </section>
  );
}

export function ContactContent({ t }: { t: Dictionary }): ReactNode {
  return (
    <>
      <ContactHero copy={t.contact} />
      <Intake copy={t.contact} />
      <HowItWorks t={t} />
    </>
  );
}
