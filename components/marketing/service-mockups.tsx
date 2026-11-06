import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { ServiceMockup } from "@/lib/constants/service-detail";

/**
 * Illustrations of the work each service covers — one per service.
 *
 * **These carry real words, not grey bars.** An earlier version drew every line
 * of text as a placeholder rectangle, which read as an unfinished wireframe: a
 * "Documents" panel with four blank rows does not tell a reader that this is
 * e-filing. A subject line, a caption, a client name does. The words are generic
 * and illustrative — invented senders, an invented listing, an invented invoice —
 * never a real customer and never a claim about CreedaVA.
 *
 * Numbers appear only where the depicted interface would have them (invoice ids,
 * amounts, pipeline counts, clock times). They belong to the invented example,
 * not to our results, and the caption under each frame says it is an illustration.
 *
 * Still CSS only, still no dependency, and still `aria-hidden`: these are
 * pictures of the work, not screenshots.
 *
 * All text comes from `t.services.mockup` because the illustrations are visible —
 * an English subject line inside a Spanish page would be a defect.
 */

type MockupCopy = Dictionary["services"]["mockup"];

function Frame({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="overflow-hidden rounded-(--mk-radius-lg) border border-mk-line bg-mk-white shadow-(--mk-shadow-card)">
      <div className="flex items-center gap-3 border-b border-mk-line bg-mk-paper px-4 py-2.5">
        <span className="flex shrink-0 gap-1.5">
          <span className="h-2 w-2 rounded-full bg-mk-line-strong" />
          <span className="h-2 w-2 rounded-full bg-mk-line" />
          <span className="h-2 w-2 rounded-full bg-mk-line" />
        </span>
        <span className="truncate text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-mk-ink-mute">
          {label}
        </span>
      </div>
      <div className="flex min-h-64 flex-col gap-3 p-4 sm:p-5">{children}</div>
    </div>
  );
}

function Caption({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="mt-auto flex items-center gap-2 border-t border-mk-line pt-3 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-mk-brand">
      <span className="h-px w-5 shrink-0 bg-mk-brand" />
      <span className="leading-snug">{children}</span>
    </div>
  );
}

const CHIP_TONES = {
  brand: "bg-mk-accent-soft text-mk-brand",
  dark: "bg-mk-brand-deep text-mk-accent",
  mute: "bg-mk-paper-deep text-mk-ink-soft",
} as const;

function Chip({
  tone = "brand",
  children,
}: {
  tone?: keyof typeof CHIP_TONES;
  children: ReactNode;
}): ReactNode {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.06em] ${CHIP_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

function Avatar({
  initial,
  tone = "mute",
}: {
  initial: string;
  tone?: "brand" | "mute";
}): ReactNode {
  const look =
    tone === "brand" ? "bg-mk-brand text-mk-accent" : "bg-mk-paper-deep text-mk-ink-soft";
  return (
    <span
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.55rem] font-bold ${look}`}
    >
      {initial}
    </span>
  );
}

function Tick({ done = true }: { done?: boolean }): ReactNode {
  const look = done
    ? "border-mk-brand bg-mk-brand text-white"
    : "border-mk-line-strong bg-mk-white";
  return (
    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-[0.25rem] border ${look}`}>
      {done ? (
        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : null}
    </span>
  );
}

/** Administrative — an inbox worked down to nothing unread. */
function InboxMockup({ copy }: { copy: MockupCopy }): ReactNode {
  const { inbox } = copy;

  return (
    <Frame label={inbox.label}>
      <div className="flex items-center gap-2 rounded-full bg-mk-paper px-3 py-1.5">
        <svg
          className="h-3 w-3 shrink-0 text-mk-ink-mute"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
          />
        </svg>
        <span className="text-[0.62rem] text-mk-ink-mute">{inbox.search}</span>
        <span className="ml-auto grid h-4 w-4 place-items-center rounded-full bg-mk-brand text-[0.5rem] font-bold text-mk-accent">
          0
        </span>
      </div>

      <div className="divide-y divide-mk-line/70">
        {inbox.from.map((sender, i) => (
          <div key={sender} className="flex items-center gap-2.5 py-2">
            <Avatar initial={sender.slice(0, 1)} tone={i === 0 ? "brand" : "mute"} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.64rem] font-semibold leading-tight text-mk-ink">
                {sender}
              </span>
              <span className="mt-0.5 block truncate text-[0.6rem] leading-tight text-mk-ink-soft">
                {inbox.subject[i]}
              </span>
            </span>
            {i < 2 ? <Chip>{inbox.replied}</Chip> : null}
          </div>
        ))}
      </div>

      <Caption>{inbox.caption}</Caption>
    </Frame>
  );
}

/** Executive — a week, with the meetings already placed. */
function CalendarMockup({ copy }: { copy: MockupCopy }): ReactNode {
  const { calendar } = copy;
  const tones = ["bg-mk-brand", "bg-mk-brand-bright", "bg-mk-accent", "bg-mk-brand-deep"];

  return (
    <Frame label={calendar.label}>
      <div className="flex justify-between gap-1">
        {calendar.days.map((day, i) => (
          <span
            key={i}
            className={`flex-1 rounded-sm py-1 text-center text-[0.55rem] font-semibold uppercase tracking-[0.08em] ${
              i === 2 ? "bg-mk-brand text-white" : "bg-mk-paper text-mk-ink-mute"
            }`}
          >
            {day}
          </span>
        ))}
      </div>

      <div className="space-y-1.5">
        {calendar.events.map((event, i) => (
          <div key={event.title} className="flex items-stretch gap-2.5">
            <span className="w-11 shrink-0 pt-1 text-right text-[0.55rem] font-medium tabular-nums leading-tight text-mk-ink-mute">
              {event.time}
            </span>
            <span
              className={`w-1 shrink-0 rounded-full ${tones[i % tones.length]}`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 rounded-[0.3rem] bg-mk-paper px-2 py-1.5 text-[0.62rem] font-medium leading-tight text-mk-ink">
              {event.title}
            </span>
          </div>
        ))}
      </div>

      <Caption>{calendar.caption}</Caption>
    </Frame>
  );
}

/** HR — a live posting, then a shortlist that is ready to interview. */
function HiringMockup({ copy }: { copy: MockupCopy }): ReactNode {
  const { hiring } = copy;

  return (
    <Frame label={hiring.label}>
      <div className="overflow-hidden rounded-md border border-mk-line bg-mk-white">
        <div className="flex items-center justify-between gap-2 bg-mk-brand-deep px-3 py-2">
          <span className="truncate text-[0.66rem] font-semibold leading-tight text-mk-paper">
            {hiring.role}
          </span>
          <Chip tone="dark">{hiring.live}</Chip>
        </div>
        <div className="px-3 py-2 text-[0.58rem] text-mk-ink-mute">{hiring.meta}</div>
      </div>

      <div className="space-y-2">
        {hiring.stages.map((stage, i) => (
          <div key={stage} className="flex items-center gap-2.5">
            <span className="w-16 shrink-0 text-[0.58rem] font-medium leading-tight text-mk-ink-soft">
              {stage}
            </span>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-mk-paper-deep">
              <span
                className="block h-full rounded-full bg-mk-brand"
                style={{ width: ["78%", "42%", "18%"][i] }}
              />
            </span>
            <span className="w-4 shrink-0 text-right text-[0.58rem] font-semibold tabular-nums text-mk-ink">
              {hiring.counts[i]}
            </span>
          </div>
        ))}
      </div>

      <Caption>{hiring.caption}</Caption>
    </Frame>
  );
}

/** Legal — a document set checked, numbered and filed. */
function ChecklistMockup({ copy }: { copy: MockupCopy }): ReactNode {
  const { documents } = copy;

  return (
    <Frame label={documents.label}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-mk-ink-mute">
          {documents.matter}
        </span>
        <span className="-rotate-3 rounded border-2 border-mk-brand/45 px-2 py-0.5 text-[0.56rem] font-extrabold uppercase tracking-[0.12em] text-mk-brand/80">
          {documents.stamp}
        </span>
      </div>

      <div className="space-y-1.5">
        {documents.files.map((file, i) => (
          <div
            key={file}
            className="flex items-center gap-2.5 rounded-md border border-mk-line/70 bg-mk-white px-2.5 py-1.5"
          >
            <Tick done={i < 3} />
            <span className="relative grid h-6 w-5 shrink-0 place-items-start overflow-hidden rounded-[0.2rem] border border-mk-line bg-mk-paper p-1">
              <span className="h-px w-2.5 rounded-full bg-mk-line-strong" />
              <span className="mt-1 h-px w-2 rounded-full bg-mk-line" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[0.6rem] leading-tight text-mk-ink-soft">
              {file}
            </span>
          </div>
        ))}
      </div>

      <Caption>{documents.caption}</Caption>
    </Frame>
  );
}

/** Customer service — a frustrated message and the reply that closes it. */
function ConversationMockup({ copy }: { copy: MockupCopy }): ReactNode {
  const { conversation } = copy;

  return (
    <Frame label={conversation.label}>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Avatar initial={conversation.customer.slice(0, 1)} />
          <div className="min-w-0 rounded-lg rounded-tl-sm bg-mk-paper px-2.5 py-2">
            <span className="mb-0.5 block text-[0.52rem] font-semibold uppercase tracking-[0.08em] text-mk-ink-mute">
              {conversation.customer}
            </span>
            <span className="block text-[0.62rem] leading-snug text-mk-ink">
              {conversation.message[0]}
            </span>
          </div>
        </div>

        <div className="flex items-start justify-end gap-2">
          <div className="min-w-0 rounded-lg rounded-tr-sm bg-mk-brand-deep px-2.5 py-2">
            <span className="mb-0.5 block text-[0.52rem] font-semibold uppercase tracking-[0.08em] text-mk-accent/80">
              {conversation.agent}
            </span>
            <span className="block text-[0.62rem] leading-snug text-mk-paper">
              {conversation.message[1]}
            </span>
          </div>
          <Avatar initial={conversation.agent.slice(0, 1)} tone="brand" />
        </div>

        <div className="flex items-center gap-2 pl-8">
          <span className="flex gap-1">
            <span className="h-1 w-1 rounded-full bg-mk-line-strong" />
            <span className="h-1 w-1 rounded-full bg-mk-line" />
            <span className="h-1 w-1 rounded-full bg-mk-line" />
          </span>
          <span className="text-[0.55rem] italic text-mk-ink-mute">{conversation.typing}</span>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-mk-line pt-3">
        <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-mk-brand text-white">
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-mk-brand">
          {conversation.resolved}
        </span>
      </div>
    </Frame>
  );
}

/** Social — posts written, scheduled and already out. */
function GalleryMockup({ copy }: { copy: MockupCopy }): ReactNode {
  const { published } = copy;
  const tiles = ["bg-mk-brand-deep", "bg-mk-accent-soft", "bg-mk-paper-deep"];

  return (
    <Frame label={published.label}>
      <div className="space-y-2">
        {published.posts.map((post, i) => (
          <div key={post} className="flex items-center gap-2.5">
            <span
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-[0.35rem] ${tiles[i % tiles.length]}`}
            >
              <span
                className={`h-3 w-3 rounded-full ${i === 0 ? "bg-mk-accent/50" : "bg-mk-line-strong/60"}`}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.62rem] font-medium leading-snug text-mk-ink">
                {post}
              </span>
              <span className="mt-1 flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-mk-accent" />
                <span className="h-1 w-10 rounded-full bg-mk-line" />
                <span className="h-1 w-6 rounded-full bg-mk-line" />
              </span>
            </span>
          </div>
        ))}
      </div>

      <Caption>{published.caption}</Caption>
    </Frame>
  );
}

/** Data — the chart plus the three findings it produced. */
function ChartMockup({ copy }: { copy: MockupCopy }): ReactNode {
  const { report } = copy;
  const bars = [38, 62, 47, 78, 55, 90, 68];

  return (
    <Frame label={report.label}>
      <span className="text-[0.62rem] font-semibold leading-tight text-mk-ink">
        {report.title}
      </span>

      <div className="flex h-20 items-end justify-between gap-2">
        {bars.map((height, i) => (
          <span
            key={i}
            style={{ height: `${height}%` }}
            className={`w-full rounded-t-sm ${i === 5 ? "bg-mk-brand" : "bg-mk-accent-soft"}`}
          />
        ))}
      </div>

      <div className="space-y-1.5 border-t border-mk-line pt-2.5">
        {report.findings.map((finding) => (
          <div key={finding} className="flex items-start gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-mk-brand" />
            <span className="text-[0.58rem] leading-snug text-mk-ink-soft">{finding}</span>
          </div>
        ))}
      </div>

      <Caption>{report.caption}</Caption>
    </Frame>
  );
}

/** Bookkeeping — invoices chased to paid. */
function InvoicesMockup({ copy }: { copy: MockupCopy }): ReactNode {
  const { invoices } = copy;

  return (
    <Frame label={invoices.label}>
      <div className="flex gap-2">
        {[invoices.outstanding, invoices.paidThisMonth].map((label, i) => (
          <div key={label} className="flex-1 rounded-md bg-mk-paper px-2.5 py-2">
            <span className="block text-[0.52rem] uppercase tracking-[0.06em] text-mk-ink-mute">
              {label}
            </span>
            <span className="mt-0.5 block text-[0.72rem] font-bold tabular-nums text-mk-ink">
              {i === 0 ? invoices.rows[2].amount : invoices.rows[0].amount}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {invoices.rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-2 rounded-md border border-mk-line/70 bg-mk-white px-2.5 py-1.5"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[0.58rem] font-semibold tabular-nums leading-tight text-mk-ink">
                {row.id}
              </span>
              <span className="block truncate text-[0.56rem] leading-tight text-mk-ink-mute">
                {row.client}
              </span>
            </span>
            <span className="shrink-0 text-[0.58rem] font-semibold tabular-nums text-mk-ink-soft">
              {row.amount}
            </span>
            <Chip tone={row.paid ? "brand" : "mute"}>
              {row.paid ? invoices.paid : invoices.overdue}
            </Chip>
          </div>
        ))}
      </div>

      <Caption>{invoices.caption}</Caption>
    </Frame>
  );
}

/** Web — a post written, formatted and ready to publish. */
function EditorMockup({ copy }: { copy: MockupCopy }): ReactNode {
  const { draft } = copy;

  return (
    <Frame label={draft.label}>
      <div className="rounded-md border border-mk-line bg-mk-white">
        <div className="flex items-center gap-1 border-b border-mk-line px-2.5 py-1.5">
          {["B", "I", "U"].map((tool) => (
            <span
              key={tool}
              className="grid h-4 w-4 place-items-center rounded-[0.18rem] text-[0.5rem] font-bold text-mk-ink-mute"
            >
              {tool}
            </span>
          ))}
          <span className="mx-1 h-3 w-px bg-mk-line" />
          <span className="h-4 w-4 rounded-[0.18rem] bg-mk-paper-deep" />
          <span className="h-4 w-4 rounded-[0.18rem] bg-mk-paper-deep" />
        </div>

        <div className="space-y-2 p-3">
          <span className="block text-[0.7rem] font-bold leading-tight text-mk-ink">
            {draft.title}
          </span>
          <span className="block text-[0.58rem] leading-snug text-mk-ink-soft">{draft.body}</span>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="h-9 w-14 shrink-0 rounded-sm bg-mk-accent-soft" />
            <span className="flex-1 space-y-1">
              <span className="block h-1 w-3/4 rounded-full bg-mk-line-strong" />
              <span className="block h-1 w-1/2 rounded-full bg-mk-line" />
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-mk-line pt-3">
        <span className="flex items-center gap-1.5 text-[0.55rem] uppercase tracking-[0.08em] text-mk-ink-mute">
          <span className="h-1.5 w-1.5 rounded-full bg-mk-accent" />
          {draft.caption}
        </span>
        <span className="rounded-full bg-mk-brand px-2.5 py-1 text-[0.56rem] font-semibold text-white">
          {draft.publish}
        </span>
      </div>
    </Frame>
  );
}

/** Real estate — a listing that went under contract. */
function ListingMockup({ copy }: { copy: MockupCopy }): ReactNode {
  const { listing } = copy;

  return (
    <Frame label={listing.label}>
      <div className="relative aspect-16/9 overflow-hidden rounded-md bg-mk-accent-soft">
        <span className="absolute right-3 top-2.5 h-4 w-4 rounded-full bg-mk-accent/50" />
        <div className="absolute inset-x-0 bottom-2.5 flex items-end justify-center gap-1.5 px-8">
          <div className="h-8 w-1/3 rounded-t-sm bg-mk-brand/20" />
          <div className="h-12 w-1/3 rounded-t-sm bg-mk-brand/35" />
          <div className="h-6 w-1/4 rounded-t-sm bg-mk-brand/15" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-2.5 bg-mk-paper-deep/70" />
      </div>

      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-[0.62rem] font-semibold leading-tight text-mk-ink">
            {listing.address}
          </span>
          <span className="mt-0.5 block text-[0.56rem] text-mk-ink-mute">{listing.meta}</span>
        </span>
        <span className="shrink-0 text-[0.72rem] font-bold tabular-nums text-mk-ink">
          {listing.price}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[0.55rem] uppercase tracking-[0.08em] text-mk-ink-mute">
          <span className="h-1.5 w-1.5 rounded-full bg-mk-accent" />
          {listing.caption}
        </span>
        <Chip tone="dark">{listing.badge}</Chip>
      </div>
    </Frame>
  );
}

/** Insurance — a claim with every supporting document attached. */
function ClaimMockup({ copy }: { copy: MockupCopy }): ReactNode {
  const { claim } = copy;

  return (
    <Frame label={claim.label}>
      <div className="flex items-center gap-2 rounded-md bg-mk-brand-deep px-3 py-2">
        <svg
          className="h-4 w-4 shrink-0 text-mk-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 12l2 2 4-4m5.6-4A12 12 0 0112 2.9 12 12 0 013.4 6 12 12 0 003 9c0 5.6 3.8 10.3 9 11.6C17.2 19.3 21 14.6 21 9c0-1-.1-2-.4-3z"
          />
        </svg>
        <span className="min-w-0">
          <span className="block text-[0.6rem] font-semibold leading-tight text-mk-paper">
            {claim.id}
          </span>
          <span className="block text-[0.52rem] leading-tight text-mk-paper/60">{claim.policy}</span>
        </span>
        <span className="ml-auto">
          <Chip tone="dark">{claim.badge}</Chip>
        </span>
      </div>

      <div className="space-y-1.5">
        {claim.files.map((file) => (
          <div
            key={file}
            className="flex items-center gap-2 rounded-md border border-mk-line/70 bg-mk-white px-2.5 py-1.5"
          >
            <Tick />
            <span className="relative grid h-5 w-4 shrink-0 place-items-start overflow-hidden rounded-[0.18rem] border border-mk-line bg-mk-paper p-0.5">
              <span className="h-px w-2 rounded-full bg-mk-line-strong" />
              <span className="mt-0.5 h-px w-1.5 rounded-full bg-mk-line" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[0.58rem] leading-tight text-mk-ink-soft">
              {file}
            </span>
          </div>
        ))}
      </div>

      <Caption>{claim.caption}</Caption>
    </Frame>
  );
}

/** Workflow — the process, written down so it can be handed over. */
function FlowMockup({ copy }: { copy: MockupCopy }): ReactNode {
  const { process } = copy;

  return (
    <Frame label={process.label}>
      <div className="relative space-y-2">
        <span
          aria-hidden="true"
          className="absolute bottom-5 left-3 top-3 w-px bg-mk-line-strong"
        />
        {process.steps.map((step, i) => (
          <div key={step} className="relative flex items-center gap-2.5">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.58rem] font-bold tabular-nums ring-4 ring-mk-white ${
                i === 1 ? "bg-mk-brand text-white" : "bg-mk-accent-soft text-mk-brand"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`min-w-0 flex-1 rounded-md border px-2.5 py-1.5 text-[0.6rem] leading-tight ${
                i === 1
                  ? "border-mk-brand/30 bg-mk-white font-medium text-mk-ink"
                  : "border-mk-line bg-mk-paper/60 text-mk-ink-soft"
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>

      <Caption>{process.caption}</Caption>
    </Frame>
  );
}

const MOCKUPS: Record<ServiceMockup, (props: { copy: MockupCopy }) => ReactNode> = {
  inbox: InboxMockup,
  calendar: CalendarMockup,
  hiring: HiringMockup,
  checklist: ChecklistMockup,
  conversation: ConversationMockup,
  gallery: GalleryMockup,
  chart: ChartMockup,
  invoices: InvoicesMockup,
  editor: EditorMockup,
  listing: ListingMockup,
  claim: ClaimMockup,
  flow: FlowMockup,
};

/** Renders the illustration for a service, wrapped so it is never announced. */
export function ServiceMockupArt({
  mockup,
  copy,
}: {
  mockup: ServiceMockup;
  copy: MockupCopy;
}): ReactNode {
  const Art = MOCKUPS[mockup];
  return (
    <div aria-hidden="true" className="select-none">
      <Art copy={copy} />
    </div>
  );
}
