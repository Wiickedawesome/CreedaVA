import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import { Section, SectionHeading } from "@/components/marketing/primitives";
import { ChatThread, WindowFrame } from "@/components/marketing/mockups";

export function HomeHuman({ t }: { t: Dictionary }): ReactNode {
  return (
    /*
     * White, not paper: the comparison section directly below is paper because
     * its cards are `bg-mk-white` and need a cream ground. Two papers in a row
     * read as one long band, so this one carries the white beat instead. The
     * chat window stays legible on white via its hairline frame, the cream
     * title bar and the accent glow behind it.
     */
    <Section tone="white">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <div>
          <SectionHeading
            eyebrow={t.home.humanEyebrow}
            title={t.home.humanTitle}
            lede={t.home.humanLede}
          />

          <ul className="mt-8 space-y-4">
            {t.home.humanPoints.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1 h-2 w-2 shrink-0 rounded-full bg-mk-brand-bright"
                />
                <span className="text-[0.92rem] leading-relaxed text-mk-ink-soft">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div aria-hidden="true" className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-mk-accent/15 blur-2xl sm:-inset-6" />

          <WindowFrame label={t.home.humanChatLabel}>
            <div className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-mk-line pb-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-mk-brand font-display text-[0.8rem] font-bold text-white">
                  {t.home.heroVisual.assistantName.slice(0, 1)}
                </span>
                <div>
                  <p className="font-display text-[0.82rem] font-bold text-mk-ink">
                    {t.home.heroVisual.assistantName}
                  </p>
                  <p className="flex items-center gap-1.5 text-[0.68rem] text-mk-ink-mute">
                    <span className="h-1.5 w-1.5 rounded-full bg-mk-brand-bright" />
                    {t.home.humanChatStatus}
                  </p>
                </div>
              </div>

              <ChatThread messages={t.home.humanChat} />

              <div className="mt-5 flex items-center gap-2 rounded-[var(--mk-radius)] bg-mk-accent-soft px-3 py-2.5">
                <svg
                  className="h-4 w-4 text-mk-brand"
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
                <span className="text-[0.72rem] font-semibold text-mk-brand">
                  {t.home.humanChatFooter}
                </span>
              </div>
            </div>
          </WindowFrame>
        </div>
      </div>
    </Section>
  );
}
