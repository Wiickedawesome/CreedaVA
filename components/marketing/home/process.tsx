import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import { Bloom, Section, SectionHeading } from "@/components/marketing/primitives";
import { TimelineRow } from "@/components/marketing/mockups";

function AccentCheck(): ReactNode {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mk-accent/15 text-mk-accent"
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M5 13l4 4L19 7"
        />
      </svg>
    </span>
  );
}

export function HomeDayInLife({ t }: { t: Dictionary }): ReactNode {
  return (
    <Section tone="navy" className="overflow-hidden">
      <Bloom className="-left-40 top-0 h-[420px] w-[420px] rounded-full bg-mk-navy-bright/25 blur-[110px]" />

      <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <SectionHeading
            onDark
            eyebrow={t.home.dayEyebrow}
            title={t.home.dayTitle}
            lede={t.home.dayLede}
          />

          <ul className="mt-8 space-y-3.5">
            {t.home.dayPoints.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <AccentCheck />
                <span className="text-[0.92rem] leading-relaxed text-mk-paper/75">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--mk-radius-lg)] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mk-paper/60">
              {t.home.dayTimelineLabel}
            </p>
            <span className="rounded-full border border-white/12 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-mk-accent">
              {t.home.dayTimelineBadge}
            </span>
          </div>

          <ul>
            {t.home.dayTimeline.map((entry, index) => (
              <TimelineRow
                key={entry.time}
                time={entry.time}
                task={entry.task}
                tag={entry.tag}
                isLast={index === t.home.dayTimeline.length - 1}
              />
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
