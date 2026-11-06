import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import { Bloom, Section, SectionHeading } from "@/components/marketing/primitives";

const STAT_KEYS = [
  "flatFee",
  "supportPlans",
  "availability",
  "onboardingDays",
] as const;

export function HomeCounterBand({
  t,
  statValues,
}: {
  t: Dictionary;
  statValues: readonly string[];
}): ReactNode {
  return (
    <Section tone="navy" className="overflow-hidden">
      <Bloom className="-right-32 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-mk-navy-bright/25 blur-[110px]" />

      <div className="relative grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
        <SectionHeading
          onDark
          eyebrow={t.home.statsEyebrow}
          title={t.home.statsTitle}
          lede={t.home.statsLede}
        />

        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-10">
          {STAT_KEYS.map((key, index) => (
            <li key={key} className="border-t border-white/12 pt-4">
              <p className="font-display text-[clamp(1.9rem,4vw,2.6rem)] font-extrabold leading-none tracking-[-0.03em] text-mk-accent tabular-nums">
                {statValues[index]}
              </p>
              <p className="mt-2 text-[0.78rem] leading-snug text-mk-paper/60">
                {t.home.stats[key]}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export function HomeComparison({ t }: { t: Dictionary }): ReactNode {
  return (
    <Section tone="paper">
      <SectionHeading
        align="center"
        eyebrow={t.home.compareEyebrow}
        title={t.home.compareTitle}
        lede={t.home.compareLede}
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {t.home.compareColumns.map((column, index) => {
          const isRecommended = index === t.home.compareColumns.length - 1;

          return (
            <div
              key={column.label}
              className={`relative flex h-full flex-col rounded-[var(--mk-radius-lg)] p-6 sm:p-7 ${
                isRecommended
                  ? "bg-mk-brand-deep text-mk-paper shadow-[var(--mk-shadow-float)]"
                  : "border border-mk-line bg-mk-white"
              }`}
            >
              {isRecommended ? (
                <span className="absolute -top-3 left-6 rounded-full bg-mk-accent px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-mk-brand-deep">
                  {t.home.compareBadge}
                </span>
              ) : null}

              <h3
                className={`font-display text-[1.05rem] font-bold ${
                  isRecommended ? "text-mk-paper" : "text-mk-ink"
                }`}
              >
                {column.label}
              </h3>

              <ul className="mt-5 flex-1 space-y-3">
                {column.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                        isRecommended
                          ? "bg-mk-accent text-mk-brand-deep"
                          : "bg-mk-paper-deep text-mk-ink-mute"
                      }`}
                    >
                      <svg
                        className="h-2.5 w-2.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d={isRecommended ? "M5 13l4 4L19 7" : "M6 6l12 12M18 6L6 18"}
                        />
                      </svg>
                    </span>
                    <span
                      className={`text-[0.86rem] leading-snug ${
                        isRecommended ? "text-mk-paper/80" : "text-mk-ink-soft"
                      }`}
                    >
                      {point}
                    </span>
                  </li>
                ))}
              </ul>

              <p
                className={`mt-6 border-t pt-4 text-[0.8rem] leading-snug ${
                  isRecommended
                    ? "border-white/12 text-mk-accent"
                    : "border-mk-line text-mk-ink-mute"
                }`}
              >
                <span className="font-semibold">{t.home.compareResultLabel}</span>{" "}
                {column.result}
              </p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
