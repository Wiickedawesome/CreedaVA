import { Container } from "@/components/ui";
import type { Dictionary } from "@/lib/i18n";
import { Bloom, CtaLink } from "@/components/marketing/primitives";
import { BookedCard, InboxZeroCard, WorkQueueCard } from "@/components/marketing/mockups";

function ProofMark(): React.ReactNode {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-mk-brand-bright"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export function HomeHero({ t }: { t: Dictionary }): React.ReactNode {
  const { home } = t;

  return (
    <section className="relative overflow-hidden bg-mk-paper">
      {/* Decorative backdrop: warm paper, two soft brand washes, faint grid. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Bloom className="-right-24 -top-40 h-[540px] w-[540px] rounded-full bg-mk-accent/30 blur-[110px]" />
        <Bloom className="-bottom-56 -left-40 h-[480px] w-[480px] rounded-full bg-mk-brand/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,31,28,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(10,31,28,0.045)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-14 pb-12 pt-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:pb-20 lg:pt-20">
          <div>
            <h1 className="font-display text-[clamp(2.35rem,6vw,4.15rem)] font-extrabold leading-[0.99] tracking-[-0.04em] text-mk-ink">
              {home.heroTitle}
              <br />
              <span className="relative inline-block text-mk-brand">
                {home.heroTitleHighlight}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1.5 left-0 h-2.5 w-full text-mk-accent"
                >
                  <path
                    d="M2 8.5C58 3.5 122 2.5 298 6"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-6 max-w-[34rem] text-[1.02rem] leading-[1.7] text-mk-ink-soft sm:text-[1.1rem]">
              {home.heroDesc}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CtaLink href="/contact" analytics="home_hero_contact">
                {home.heroCtaPrimary}
              </CtaLink>
              <CtaLink
                href="/services"
                variant="outline"
                analytics="home_hero_services"
              >
                {home.heroCtaSecondary}
              </CtaLink>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
              {home.heroProof.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-[0.82rem] font-medium text-mk-ink-soft"
                >
                  <ProofMark />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Artifact composition. Decorative — the copy above already says
              everything it shows, so screen readers skip it. */}
          <div aria-hidden="true" className="relative">
            <div className="relative z-10 px-2 sm:px-8 lg:px-0 lg:pl-8">
              <WorkQueueCard
                assistantName={home.heroVisual.assistantName}
                assistantRole={home.heroVisual.assistantRole}
                status={home.heroVisual.status}
                queueTitle={home.heroVisual.queueTitle}
                tasks={home.heroVisual.tasks}
                footer={home.heroVisual.queueFooter}
                windowLabel={home.heroVisual.windowLabel}
              />
            </div>

            {/* Offset stack rather than absolute floats: it stays layered at
                every width without ever covering the queue's readable rows. */}
            <div className="relative z-20 -mt-4 grid grid-cols-2 gap-3 px-3 sm:-mt-5 sm:gap-4 sm:px-7">
              <InboxZeroCard
                title={home.heroVisual.inboxTitle}
                value={home.heroVisual.inboxValue}
                className="mk-drift"
              />
              <BookedCard
                monthLabel={home.heroVisual.calendarMonth}
                dateLabel={home.heroVisual.calendarDate}
                detail={home.heroVisual.calendarDetail}
                className="mk-float"
              />
            </div>
          </div>
        </div>
      </Container>

      {/* Sector strip — grounded in the 12 service categories, not invented logos. */}
      <div className="relative border-t border-mk-line bg-mk-white/60">
        <Container className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-mk-ink-mute">
            {home.heroSectorsLabel}
          </p>
          <p className="text-[0.82rem] font-medium text-mk-ink-soft">
            {home.heroSectors}
          </p>
        </Container>
      </div>
    </section>
  );
}
