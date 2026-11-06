"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import { CtaLink, Section, SectionHeading } from "@/components/marketing/primitives";

/**
 * Lets a visitor pick the tasks they would hand off. The tally is honest: it
 * says how many recurring tasks were chosen, then routes to the consultation —
 * it does not imply a plan or a price.
 */
export function HomeHandoffPicker({ t }: { t: Dictionary }): ReactNode {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (task: string) => {
    setSelected((current) =>
      current.includes(task)
        ? current.filter((item) => item !== task)
        : [...current, task],
    );
  };

  return (
    <Section tone="white">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
        <SectionHeading
          eyebrow={t.home.handoffEyebrow}
          title={t.home.handoffTitle}
          lede={t.home.handoffLede}
        />

        <div>
          <ul className="flex flex-wrap gap-2">
            {t.home.handoffTasks.map((task) => {
              const isSelected = selected.includes(task);

              return (
                <li key={task}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggle(task)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[0.82rem] font-medium transition-colors duration-150 ${
                      isSelected
                        ? "border-mk-brand bg-mk-brand text-white"
                        : "border-mk-line bg-mk-paper text-mk-ink-soft hover:border-mk-brand/40 hover:text-mk-brand"
                    }`}
                  >
                    {isSelected ? (
                      <svg
                        aria-hidden="true"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : null}
                    {task}
                  </button>
                </li>
              );
            })}
          </ul>

          <div
            aria-live="polite"
            className={`mt-6 rounded-[var(--mk-radius-lg)] border p-5 transition-colors duration-200 ${
              selected.length > 0
                ? "border-mk-brand/25 bg-mk-accent-soft"
                : "border-dashed border-mk-line-strong bg-mk-paper/60"
            }`}
          >
            {selected.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-[0.9rem] text-mk-ink">
                  <span className="font-display text-[1.6rem] font-extrabold leading-none text-mk-brand">
                    {selected.length}
                  </span>{" "}
                  {selected.length === 1
                    ? t.home.handoffSelectedSuffixOne
                    : t.home.handoffSelectedSuffix}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                    className="text-[0.78rem] font-medium text-mk-ink-mute underline-offset-4 hover:text-mk-ink hover:underline"
                  >
                    {t.home.handoffClear}
                  </button>
                  <CtaLink
                    href="/join"
                    analytics="home_handoff_join"
                    className="px-5 py-2.5 text-[0.85rem]"
                  >
                    {t.home.handoffCta}
                  </CtaLink>
                </div>
              </div>
            ) : (
              <p className="text-[0.88rem] text-mk-ink-mute">{t.home.handoffEmpty}</p>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
