import type { ReactNode } from "react";

/**
 * Lightweight product-artifact mockups.
 *
 * These are the visual proof the page previously had none of. Everything is
 * plain markup — no images, no client JS — so they cost nothing in bytes and
 * cannot drift from the brand tokens. Callers wrap decorative clusters in
 * `aria-hidden`, since the copy already carries the same information.
 */

export function WindowFrame({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}): ReactNode {
  return (
    <div
      className={`overflow-hidden rounded-[var(--mk-radius-lg)] border border-mk-line bg-mk-white ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-mk-line bg-mk-paper/80 px-4 py-3">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#DFB3AA]" />
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#E3D0A2]" />
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#B4D6C4]" />
        <span className="ml-2 truncate rounded-full bg-mk-navy-soft px-3 py-1 text-[0.68rem] font-medium text-mk-navy ring-1 ring-mk-navy-line">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function CheckMark({ done }: { done: boolean }): ReactNode {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border ${
        done
          ? "border-mk-brand bg-mk-brand text-white"
          : "border-mk-line-strong bg-mk-white text-transparent"
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
  );
}

export function WorkQueueCard({
  assistantName,
  assistantRole,
  status,
  queueTitle,
  tasks,
  footer,
  windowLabel,
}: {
  assistantName: string;
  assistantRole: string;
  status: string;
  queueTitle: string;
  tasks: readonly string[];
  footer: string;
  windowLabel: string;
}): ReactNode {
  const initials = assistantName.slice(0, 1);

  return (
    <WindowFrame label={windowLabel}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mk-brand font-display text-sm font-bold text-white"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-mk-ink">
              {assistantName}
            </p>
            <p className="truncate text-[0.72rem] text-mk-ink-mute">{assistantRole}</p>
          </div>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-mk-accent-soft px-2.5 py-1 text-[0.68rem] font-semibold text-mk-brand">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-mk-brand-bright" />
            {status}
          </span>
        </div>

        <p className="mt-5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-mk-ink-mute">
          {queueTitle}
        </p>

        <ul className="mt-2 divide-y divide-mk-line">
          {tasks.map((task, index) => (
            <li key={task} className="flex items-start gap-2.5 py-2.5">
              <CheckMark done={index < tasks.length - 1} />
              <span
                className={`text-[0.8rem] leading-snug ${
                  index < tasks.length - 1
                    ? "text-mk-ink-mute"
                    : "font-semibold text-mk-ink"
                }`}
              >
                {task}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-[var(--mk-radius)] bg-mk-paper px-3 py-2.5">
          <span className="text-[0.7rem] text-mk-ink-mute">{footer}</span>
          <span aria-hidden="true" className="text-mk-navy">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 17l6-6 4 4 8-8"
              />
            </svg>
          </span>
        </div>
      </div>
    </WindowFrame>
  );
}

export function InboxZeroCard({
  title,
  value,
  className = "",
}: {
  title: string;
  value: string;
  className?: string;
}): ReactNode {
  return (
    <div
      className={`rounded-[var(--mk-radius)] border border-mk-line bg-mk-white p-4 shadow-[var(--mk-shadow-float)] ${className}`}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="grid h-7 w-7 place-items-center rounded-full bg-mk-navy-soft text-mk-navy"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </span>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-mk-ink-mute">
          {title}
        </p>
      </div>
      <p className="mt-2 font-display text-lg font-extrabold leading-tight text-mk-ink">
        {value}
      </p>
    </div>
  );
}

const CALENDAR_DAYS = 21;

export function BookedCard({
  monthLabel,
  dateLabel,
  detail,
  className = "",
}: {
  monthLabel: string;
  dateLabel: string;
  detail: string;
  className?: string;
}): ReactNode {
  return (
    <div
      className={`rounded-[var(--mk-radius)] border border-mk-line bg-mk-white p-4 shadow-[var(--mk-shadow-float)] ${className}`}
    >
      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-mk-ink-mute">
        {monthLabel}
      </p>
      <div aria-hidden="true" className="mt-2.5 grid grid-cols-7 gap-1.5">
        {Array.from({ length: CALENDAR_DAYS }, (_, day) => (
          <span
            key={day}
            className={`h-1.5 rounded-full ${
              day === 16
                ? "bg-mk-navy"
                : day % 7 === 5 || day % 7 === 6
                  ? "bg-mk-line"
                  : "bg-mk-paper-deep"
            }`}
          />
        ))}
      </div>
      <div className="mt-3 rounded-[var(--mk-radius)] bg-mk-navy px-3 py-2 text-white">
        <p className="text-[0.72rem] font-semibold leading-tight">{dateLabel}</p>
        <p className="mt-0.5 text-[0.64rem] text-white/70">{detail}</p>
      </div>
    </div>
  );
}

export function ChatThread({
  messages,
}: {
  messages: readonly { from: string; text: string }[];
}): ReactNode {
  return (
    <div className="space-y-2.5">
      {messages.map((message, index) => {
        const fromAssistant = message.from === "assistant";
        return (
          <div
            key={`${message.from}-${index}`}
            className={`flex ${fromAssistant ? "justify-start" : "justify-end"}`}
          >
            <p
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.78rem] leading-snug ${
                fromAssistant
                  ? "rounded-tl-sm bg-mk-paper text-mk-ink-soft"
                  : "rounded-tr-sm bg-mk-brand text-white"
              }`}
            >
              {message.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function TimelineRow({
  time,
  task,
  tag,
  isLast = false,
}: {
  time: string;
  task: string;
  tag: string;
  isLast?: boolean;
}): ReactNode {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast ? (
        <span
          aria-hidden="true"
          className="absolute left-[7px] top-4 h-full w-px bg-white/12"
        />
      ) : null}
      <span
        aria-hidden="true"
        className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-mk-accent/60 bg-mk-brand-deep"
      />
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-sm font-bold tabular-nums text-mk-accent">
          {time}
        </span>
        <span className="text-[0.92rem] text-mk-paper/85">{task}</span>
        <span className="ml-auto rounded-full border border-white/12 px-2.5 py-0.5 text-[0.64rem] font-medium uppercase tracking-[0.08em] text-mk-paper/55">
          {tag}
        </span>
      </div>
    </li>
  );
}
