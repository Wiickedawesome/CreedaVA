import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/ui";

export type MarketingTone = "paper" | "white" | "deep" | "navy" | "tint";

const TONE_CLASSES: Record<MarketingTone, string> = {
  paper: "bg-mk-paper text-mk-ink",
  white: "bg-mk-white text-mk-ink",
  deep: "bg-mk-brand-deep text-mk-paper",
  navy: "bg-mk-navy-deep text-mk-paper",
  tint: "bg-mk-accent-soft text-mk-ink",
};

const SECTION_PADDING = {
  default: "py-16 sm:py-20 lg:py-28",
  none: "",
} as const;

/**
 * Full-bleed marketing band. Owns the vertical rhythm and surface colour so
 * sections cannot drift into one another with mismatched padding.
 */
export function Section({
  id,
  tone = "paper",
  containerSize = "xl",
  padding = "default",
  className = "",
  children,
}: {
  id?: string;
  tone?: MarketingTone;
  containerSize?: "md" | "lg" | "xl";
  padding?: keyof typeof SECTION_PADDING;
  className?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <section
      id={id}
      className={`relative scroll-mt-24 ${SECTION_PADDING[padding]} ${TONE_CLASSES[tone]} ${className}`}
    >
      <Container size={containerSize}>{children}</Container>
    </section>
  );
}

/**
 * Soft blurred light bloom behind a dark band.
 *
 * Every dark surface on the marketing site is lit the same way: one or two
 * blurred circles of a bright tint bleeding in from the edges, which is what
 * stops a flat fill from reading as a slab. Green bands pass an accent tint
 * (`bg-mk-accent/10`); navy bands pass `bg-mk-navy-bright/…`. Size, position,
 * tint and blur stay at the call site because they differ per band; only the
 * shared `absolute` + `pointer-events-none` + `aria-hidden` plumbing lives here.
 */
export function Bloom({ className = "" }: { className?: string }): ReactNode {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
    />
  );
}

/** Small uppercase label that opens each band: a short rule followed by the text. */
export function Eyebrow({
  children,
  onDark = false,
  className = "",
}: {
  children: ReactNode;
  onDark?: boolean;
  className?: string;
}): ReactNode {
  return (
    <p
      className={`flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] ${
        onDark ? "text-mk-paper/70" : "text-mk-ink-mute"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`h-px w-8 shrink-0 ${onDark ? "bg-white/25" : "bg-mk-line-strong"}`}
      />
      {children}
    </p>
  );
}

// A page title and a section heading are two different sizes. `level` picks the
// tag, so it picks the scale too — an `h1` from this component matches the
// standalone page titles on /pricing, /about and /news exactly.
const TITLE_SCALE = {
  1: "text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.98] tracking-[-0.045em]",
  2: "text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.08] tracking-[-0.025em]",
} as const;

export function SectionHeading({
  eyebrow,
  title,
  lede,
  onDark = false,
  align = "start",
  level = 2,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: string;
  onDark?: boolean;
  align?: "start" | "center";
  /** Use 1 when this heading is the page's main title (no hero above it). */
  level?: 1 | 2;
  className?: string;
}): ReactNode {
  const centered = align === "center";
  const Heading = level === 1 ? "h1" : "h2";

  return (
    <header
      className={`${centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}
    >
      {eyebrow ? (
        <Eyebrow onDark={onDark} className={centered ? "justify-center" : ""}>
          {eyebrow}
        </Eyebrow>
      ) : null}
      <Heading
        className={`mt-4 font-display ${TITLE_SCALE[level]} font-extrabold ${
          onDark ? "text-mk-paper" : "text-mk-ink"
        }`}
      >
        {title}
      </Heading>
      {lede ? (
        <p
          className={`mt-5 text-[1.02rem] leading-[1.7] sm:text-[1.08rem] ${
            onDark ? "text-mk-paper/70" : "text-mk-ink-soft"
          }`}
        >
          {lede}
        </p>
      ) : null}
    </header>
  );
}

type CtaVariant = "primary" | "outline" | "outlineDark" | "light" | "quiet";

const CTA_CLASSES: Record<CtaVariant, string> = {
  primary:
    "bg-mk-brand text-white shadow-[var(--mk-shadow-brand)] hover:bg-mk-brand-bright",
  outline:
    "border border-mk-line-strong bg-mk-white/80 text-mk-ink hover:border-mk-brand hover:text-mk-brand",
  outlineDark:
    "border border-white/20 text-mk-paper hover:border-white/40 hover:bg-white/5",
  light:
    "bg-mk-accent text-mk-brand-deep hover:bg-white",
  quiet: "text-mk-brand hover:text-mk-brand-bright",
};

const CTA_ARROW = (
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

export function CtaLink({
  href,
  variant = "primary",
  analytics,
  children,
  className = "",
}: {
  href: string;
  variant?: CtaVariant;
  analytics?: string;
  children: ReactNode;
  className?: string;
}): ReactNode {
  return (
    <Link
      href={href}
      data-analytics-cta={analytics}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.95rem] font-semibold transition-colors duration-200 ${
        variant === "quiet" ? "" : "min-h-12"
      } ${CTA_CLASSES[variant]} ${className}`}
    >
      {children}
      {CTA_ARROW}
    </Link>
  );
}

type ButtonSize = "sm" | "md" | "lg";

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "min-h-9 px-4 py-2 text-[0.82rem]",
  md: "min-h-12 px-6 py-3 text-[0.95rem]",
  lg: "min-h-13 px-7 py-3.5 text-[1rem]",
};

/**
 * The `<button>` twin of `CtaLink`, sharing the same `CTA_CLASSES` so a form
 * submit and a navigation link cannot drift apart.
 *
 * This exists because forms were reaching for the legacy `components/ui/button`,
 * which still paints `rounded-md` in `--primary` — a second, squarer button
 * style appearing on the landing pages and the forum modal.
 */
export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  fullWidth = false,
  isLoading = false,
  disabled = false,
  onClick,
  className = "",
  children,
}: {
  variant?: CtaVariant;
  size?: ButtonSize;
  type?: "button" | "submit";
  fullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}): ReactNode {
  const inactive = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={inactive}
      aria-busy={isLoading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
        fullWidth ? "w-full" : ""
      } ${BUTTON_SIZE[size]} ${CTA_CLASSES[variant]} ${className}`}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}

/** Static pill used for chips and micro-labels. */
export function Pill({
  children,
  onDark = false,
  className = "",
}: {
  children: ReactNode;
  onDark?: boolean;
  className?: string;
}): ReactNode {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.78rem] font-medium ${
        onDark
          ? "border-white/15 bg-white/5 text-mk-paper/80"
          : "border-mk-line bg-mk-white text-mk-ink-soft"
      } ${className}`}
    >
      {children}
    </span>
  );
}
