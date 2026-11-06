"use client";

import { useState, useEffect, useMemo, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/ui";
import { trackEvent } from "@/lib/firebase/analytics";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/context";

/**
 * Booking flow for `/join` ("Book a Consultation").
 *
 * Client Component: the calendar, slot list and multi-step form are all
 * interactive. Everything else on the page is static, so this is the only file
 * that ships JS for the route.
 *
 * The booking contract is unchanged from the previous implementation — same
 * `SLOTS_URL`, same `generateFallbackSlots()` fallback so the form always works
 * even when the calendar integration is down, same `/api/booking` payload, same
 * `trackEvent` call, same `step` state machine and calendar-grid maths. Only the
 * presentation is new.
 *
 * Visual language — "appointment ledger". Contact is an open intake sheet with
 * underline fields, so this page deliberately does the opposite: enclosed
 * hairline cells, squared controls, a grid whose rules are drawn by the layout
 * itself, and no shadowed floating card. The two pages are siblings but should
 * not read as one template.
 */

type JoinCopy = Dictionary["join"];

interface Slot {
  date: string;
  time: string;
  available: boolean;
}

const SLOTS_URL = "/getAvailableSlots";

/** Generates Mon–Fri 9am–5pm slots for the next 60 days when the
 *  server-side calendar integration is unavailable. Bookings still
 *  write to Firestore — nothing is lost. */
function generateFallbackSlots(): Slot[] {
  const slots: Slot[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);
  const nowTs = Date.now();
  for (let d = 0; d < 60 && slots.length < 300; d++) {
    const dow = cursor.getDay();
    if (dow >= 1 && dow <= 5) {
      for (let h = 9; h < 17; h++) {
        const slotStart = new Date(cursor);
        slotStart.setHours(h, 0, 0, 0);
        if (slotStart.getTime() > nowTs) {
          const yyyy = cursor.getFullYear();
          const mm = String(cursor.getMonth() + 1).padStart(2, "0");
          const dd = String(cursor.getDate()).padStart(2, "0");
          slots.push({ date: `${yyyy}-${mm}-${dd}`, time: `${String(h).padStart(2, "0")}:00`, available: true });
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
}

function formatDate(dateStr: string, locale = "en-US") {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(time: string) {
  const [h] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:00 ${suffix}`;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const ARROW = (
  <svg
    aria-hidden="true"
    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const CHEVRON_LEFT = (
  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const CHEVRON_RIGHT = (
  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

/** Small uppercase field label used across the panel. */
function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }): ReactNode {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mk-ink-mute"
    >
      {children}
    </label>
  );
}

/** Squared action button — deliberately not a pill and not rounded. */
function LedgerButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  fullWidth = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "outline";
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}): ReactNode {
  const skin =
    variant === "primary"
      ? "bg-mk-brand text-white hover:bg-mk-brand-bright"
      : "border border-mk-line-strong text-mk-ink hover:border-mk-brand hover:text-mk-brand";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex min-h-12 items-center justify-center gap-2 px-6 text-[0.92rem] font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${skin} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

/** Boxed hairline field — the opposite of `/contact`'s open underline fields. */
function SlipField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
}): ReactNode {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="mt-2 w-full border border-mk-line-strong bg-mk-white px-3 py-2.5 text-[0.95rem] text-mk-ink transition-colors duration-150 placeholder:text-mk-ink-mute/70 focus:border-mk-brand focus:outline-none"
      />
    </div>
  );
}

/** Step marker: a squared numeral, its label, and a rule that fills the row. */
function StepRail({ step, copy }: { step: number; copy: JoinCopy }): ReactNode {
  const steps = [copy.step1, copy.step2];

  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {steps.map((label, index) => {
        const number = index + 1;
        const reached = step >= number;

        return (
          <li
            key={label}
            className="flex min-w-0 flex-1 items-center gap-2 last:flex-none sm:gap-3"
          >
            <span
              aria-hidden="true"
              className={`flex h-8 w-8 shrink-0 items-center justify-center border text-[0.7rem] font-bold tabular-nums ${
                reached
                  ? "border-mk-brand bg-mk-brand text-white"
                  : "border-mk-line-strong text-mk-ink-mute"
              }`}
            >
              {String(number).padStart(2, "0")}
            </span>
            {/* Wraps rather than forcing the rail wider than the viewport. */}
            <span
              className={`min-w-0 text-[0.8rem] font-semibold leading-tight sm:text-[0.85rem] ${
                reached ? "text-mk-ink" : "text-mk-ink-mute"
              }`}
            >
              {label}
            </span>
            {number < steps.length ? (
              <span aria-hidden="true" className="hidden h-px flex-1 bg-mk-line sm:block" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function JoinHero({ copy }: { copy: JoinCopy }): ReactNode {
  return (
    <section className="bg-mk-paper pb-6 sm:pb-8 lg:pb-10">
      <Container>
        <div className="max-w-3xl pb-10 pt-16 sm:pt-20 lg:pb-12 lg:pt-24">
          <h1 className="font-display text-[clamp(2.2rem,5.4vw,4rem)] font-extrabold leading-[1] tracking-[-0.04em] text-mk-ink">
            {copy.heroTitle}
          </h1>
          <p className="mt-6 max-w-[46ch] text-[1.05rem] leading-[1.7] text-mk-ink-soft sm:text-[1.12rem]">
            {copy.heroDesc}
          </p>
        </div>

        {/* Timezone is the one fact that changes what a visitor picks, so it sits above the panel. */}
        <p className="flex items-start gap-3 border-t border-mk-line pt-5 text-[0.85rem] leading-[1.6] text-mk-ink-soft">
          <span aria-hidden="true" className="mt-2 h-px w-8 shrink-0 bg-mk-line-strong" />
          {copy.timezoneNote}
        </p>
      </Container>
    </section>
  );
}

function ConfirmationSlip({
  copy,
  date,
  time,
  email,
  dateLocale,
}: {
  copy: JoinCopy;
  date: string;
  time: string;
  email: string;
  dateLocale: string;
}): ReactNode {
  return (
    <section className="bg-mk-white py-20 sm:py-24 lg:py-28">
      <Container size="sm">
        <div className="border border-mk-line bg-mk-white">
          {/* Ticket stub: a solid brand bar marks this as a finished booking, not a form step. */}
          <div aria-hidden="true" className="h-1 bg-mk-brand" />

          <div className="border-b border-mk-line px-6 py-8 sm:px-10 sm:py-10">
            <h1 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-mk-ink">
              {copy.successTitle}
            </h1>
          </div>

          <dl className="divide-y divide-mk-line px-6 sm:px-10">
            <div className="flex flex-wrap items-baseline justify-between gap-3 py-5">
              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mk-ink-mute">
                {copy.successBooked}
              </dt>
              <dd className="font-display text-[1.05rem] font-bold tracking-[-0.01em] text-mk-ink">
                {formatDate(date, dateLocale)} {copy.atTime} {formatTime(time)}{" "}
                <span className="text-[0.85rem] font-medium text-mk-ink-soft">{copy.belizeTime}</span>
              </dd>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-3 py-5">
              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mk-ink-mute">
                {copy.successInvite}
              </dt>
              <dd className="text-[0.95rem] font-medium break-words text-mk-ink">
                {email}{" "}
                <span className="text-mk-ink-soft">{copy.successShortly}</span>
              </dd>
            </div>
          </dl>

          <div className="border-t border-mk-line px-6 py-6 sm:px-10">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-[0.92rem] font-semibold text-mk-brand hover:text-mk-brand-bright"
            >
              {copy.backToHome}
              {ARROW}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function JoinContent({
  t,
  locale,
}: {
  t: Dictionary;
  locale: Locale;
}): ReactNode {
  const copy = t.join;
  const dateLocale = locale === "es" ? "es-ES" : "en-US";

  // The dropdown mirrors /services so adding a category there adds it here.
  // "General Consultation" leads because it is the sensible default for
  // someone who has not decided which service they need yet.
  const serviceOptions = [
    copy.generalConsultation,
    ...t.services.categories.map((category) => category.title),
  ];

  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    service: copy.generalConsultation,
    notes: "",
  });

  // Fetch available slots on mount — falls back to generated slots on any error
  // so the booking form ALWAYS works regardless of calendar integration state.
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(SLOTS_URL);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        const loaded: Slot[] = data.slots || [];
        setSlots(loaded.length > 0 ? loaded : generateFallbackSlots());
      } catch {
        // Calendar integration unavailable — use client-generated slots.
        // Booking still completes and lands in Firestore.
        setSlots(generateFallbackSlots());
      } finally {
        setLoadingSlots(false);
      }
    }
    load();
  }, []);

  // Set of dates that have available slots
  const availableDateSet = useMemo(
    () => new Set(slots.filter((s) => s.available).map((s) => s.date)),
    [slots],
  );

  // Build calendar grid for current month view
  const calendarDays = useMemo(() => {
    const { year, month } = calMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push(ds);
    }
    return cells;
  }, [calMonth]);

  // Get available times for selected date
  const availableTimes = slots.filter(
    (s) => s.date === selectedDate && s.available,
  );

  const today = toDateStr(new Date());

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          company: form.company,
          service: form.service,
          date: selectedDate,
          time: selectedTime,
          notes: form.notes,
          source: "join-page",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      void trackEvent("form_submission", "/join", {
        formName: "booking",
        source: "join-page",
        service: form.service,
      });
      setSubmitted(true);
    } catch {
      setError(copy.submitError);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <ConfirmationSlip
        copy={copy}
        date={selectedDate}
        time={selectedTime}
        email={form.email}
        dateLocale={dateLocale}
      />
    );
  }

  return (
    <>
      <JoinHero copy={copy} />

      <section className="bg-mk-white pb-20 pt-4 sm:pb-24 lg:pb-28">
        <Container>
          <div className="mx-auto max-w-4xl">
            <StepRail step={step} copy={copy} />

            <div className="mt-8 border border-mk-line bg-mk-white">
              {/* ── Step 1: calendar and time slots ───────────────────── */}
              {step === 1 && (
                <div className="p-5 sm:p-8">
                  <h2 className="font-display text-[1.2rem] font-extrabold leading-tight tracking-[-0.02em] text-mk-ink">
                    {copy.selectDateTime}
                  </h2>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-mk-line-strong border-t-mk-brand" />
                    </div>
                  ) : (
                    <>
                      <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_14rem] lg:gap-10">
                        {/* Calendar grid */}
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-3 border-b border-mk-line pb-3">
                            <button
                              type="button"
                              aria-label="Previous month"
                              title="Previous month"
                              onClick={() =>
                                setCalMonth((m) => {
                                  const d = new Date(m.year, m.month - 1, 1);
                                  return { year: d.getFullYear(), month: d.getMonth() };
                                })
                              }
                              className="flex h-8 w-8 items-center justify-center border border-mk-line-strong text-mk-ink-mute transition-colors hover:border-mk-brand hover:text-mk-brand"
                            >
                              {CHEVRON_LEFT}
                            </button>

                            <h3 className="font-display text-[0.95rem] font-bold tracking-[-0.01em] text-mk-ink">
                              {copy.months[calMonth.month]} {calMonth.year}
                            </h3>

                            <button
                              type="button"
                              aria-label="Next month"
                              title="Next month"
                              onClick={() =>
                                setCalMonth((m) => {
                                  const d = new Date(m.year, m.month + 1, 1);
                                  return { year: d.getFullYear(), month: d.getMonth() };
                                })
                              }
                              className="flex h-8 w-8 items-center justify-center border border-mk-line-strong text-mk-ink-mute transition-colors hover:border-mk-brand hover:text-mk-brand"
                            >
                              {CHEVRON_RIGHT}
                            </button>
                          </div>

                          <div className="mt-3 grid grid-cols-7">
                            {copy.days.map((day) => (
                              <div
                                key={day}
                                className="py-2 text-center text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-mk-ink-mute"
                              >
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Ledger grid: the 1px gaps are the rules. */}
                          <div className="grid grid-cols-7 gap-px bg-mk-line">
                            {calendarDays.map((dateStr, i) => {
                              if (!dateStr) {
                                return <div key={`empty-${i}`} className="bg-mk-white" />;
                              }
                              const day = new Date(dateStr + "T12:00:00").getDate();
                              const hasSlots = availableDateSet.has(dateStr);
                              const isPast = dateStr < today;
                              const isSelected = selectedDate === dateStr;

                              return (
                                <button
                                  key={dateStr}
                                  type="button"
                                  disabled={!hasSlots || isPast}
                                  onClick={() => {
                                    setSelectedDate(dateStr);
                                    setSelectedTime("");
                                  }}
                                  className={`relative flex aspect-square items-center justify-center text-[0.85rem] font-medium transition-colors duration-150 ${
                                    isSelected
                                      ? "bg-mk-brand text-white"
                                      : hasSlots && !isPast
                                        ? "bg-mk-white text-mk-ink hover:bg-mk-accent-soft"
                                        /* Unavailable days stay at full `ink-mute` (5.53:1 on
                                           white). A `/40` alpha here measured 1.77:1 — the day
                                           numbers became unreadable, and a visitor cannot tell
                                           an unavailable day from a blank cell. The muted
                                           colour, missing availability dot and `cursor-default`
                                           already carry the disabled meaning. */
                                        : "cursor-default bg-mk-white text-mk-ink-mute"
                                  }`}
                                >
                                  {day}
                                  {hasSlots && !isPast && !isSelected ? (
                                    <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-mk-brand" />
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Time slots */}
                        <div className="min-w-0">
                          {selectedDate ? (
                            <>
                              <p className="border-b border-mk-line pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mk-ink-mute">
                                {formatDate(selectedDate, dateLocale)}
                              </p>

                              {availableTimes.length > 0 ? (
                                <div className="mt-2 grid grid-cols-3 gap-px bg-mk-line sm:grid-cols-4 lg:max-h-80 lg:grid-cols-1 lg:overflow-y-auto">
                                  {availableTimes.map((slot) => (
                                    <button
                                      key={slot.time}
                                      type="button"
                                      onClick={() => setSelectedTime(slot.time)}
                                      className={`px-3 py-2.5 text-center text-[0.85rem] font-medium transition-colors duration-150 lg:text-left ${
                                        selectedTime === slot.time
                                          ? "bg-mk-brand text-white"
                                          : "bg-mk-white text-mk-ink hover:bg-mk-accent-soft"
                                      }`}
                                    >
                                      {formatTime(slot.time)}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-3 text-[0.85rem] text-mk-ink-soft">
                                  {copy.noTimesAvailable}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="border border-dashed border-mk-line-strong px-4 py-8 text-center text-[0.85rem] leading-[1.6] text-mk-ink-mute">
                              {copy.selectDatePrompt}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-8 border-t border-mk-line pt-6">
                        <LedgerButton
                          fullWidth
                          disabled={!selectedDate || !selectedTime}
                          onClick={() => setStep(2)}
                        >
                          {copy.continue}
                          {ARROW}
                        </LedgerButton>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Step 2: details ───────────────────────────────────── */}
              {step === 2 && (
                <form onSubmit={handleSubmit} data-analytics-form="join">
                  <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-mk-line px-5 py-5 sm:px-8">
                    <div>
                      <h2 className="font-display text-[1.2rem] font-extrabold leading-tight tracking-[-0.02em] text-mk-ink">
                        {copy.yourDetails}
                      </h2>
                      <p className="mt-1.5 text-[0.9rem] text-mk-ink-soft">
                        {formatDate(selectedDate, dateLocale)} {copy.atTime}{" "}
                        {formatTime(selectedTime)}{" "}
                        <span className="text-[0.82rem]">{copy.belizeTime}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[0.85rem] font-semibold text-mk-brand underline-offset-4 hover:text-mk-brand-bright hover:underline"
                    >
                      {copy.change}
                    </button>
                  </div>

                  <div className="space-y-6 px-5 py-7 sm:px-8">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <SlipField
                        id="join-first-name"
                        label={copy.firstName}
                        placeholder="John"
                        value={form.firstName}
                        onChange={(v) => setForm({ ...form, firstName: v })}
                        autoComplete="given-name"
                        required
                      />
                      <SlipField
                        id="join-last-name"
                        label={copy.lastName}
                        placeholder="Doe"
                        value={form.lastName}
                        onChange={(v) => setForm({ ...form, lastName: v })}
                        autoComplete="family-name"
                        required
                      />
                    </div>

                    <SlipField
                      id="join-email"
                      label={copy.email}
                      type="email"
                      placeholder="john@company.com"
                      value={form.email}
                      onChange={(v) => setForm({ ...form, email: v })}
                      autoComplete="email"
                      required
                    />

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <SlipField
                        id="join-phone"
                        label={copy.phone}
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={form.phone}
                        onChange={(v) => setForm({ ...form, phone: v })}
                        autoComplete="tel"
                      />
                      <SlipField
                        id="join-company"
                        label={copy.company}
                        placeholder="Company name"
                        value={form.company}
                        onChange={(v) => setForm({ ...form, company: v })}
                        autoComplete="organization"
                      />
                    </div>

                    <div>
                      <FieldLabel htmlFor="join-service">{copy.service}</FieldLabel>
                      <select
                        id="join-service"
                        name="service"
                        title={copy.service}
                        value={form.service}
                        onChange={(e) => setForm({ ...form, service: e.target.value })}
                        className="mt-2 w-full border border-mk-line-strong bg-mk-white px-3 py-2.5 text-[0.95rem] text-mk-ink transition-colors duration-150 focus:border-mk-brand focus:outline-none"
                      >
                        {serviceOptions.map((service) => (
                          <option key={service}>{service}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <FieldLabel htmlFor="join-notes">{copy.notes}</FieldLabel>
                      <textarea
                        id="join-notes"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        rows={3}
                        placeholder={copy.notesPlaceholder}
                        className="mt-2 w-full resize-y border border-mk-line-strong bg-mk-white px-3 py-2.5 text-[0.95rem] text-mk-ink transition-colors duration-150 placeholder:text-mk-ink-mute/70 focus:border-mk-brand focus:outline-none"
                      />
                    </div>

                    {error && (
                      <p role="alert" className="text-[0.9rem] text-red-600">
                        {error}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-mk-line px-5 py-5 sm:flex-row sm:px-8">
                    <LedgerButton variant="outline" onClick={() => setStep(1)}>
                      {copy.back}
                    </LedgerButton>
                    <LedgerButton type="submit" fullWidth disabled={submitting}>
                      {copy.bookConsultation}
                      {ARROW}
                    </LedgerButton>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
