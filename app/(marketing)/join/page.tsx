"use client";

import { useState, useEffect, useMemo, type FormEvent } from "react";
import { Container, Input, Button } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";
import { getAppCheckHeaders } from "@/lib/firebase/app-check";
import Link from "next/link";

interface Slot {
  date: string;
  time: string;
  available: boolean;
}

const WEBHOOK_URL = "/handleFormWebhook";
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

export default function JoinPage() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "es" ? "es-ES" : "en-US";
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
    service: "General Consultation",
    notes: "",
  });

  // Fetch available slots on mount — falls back to generated slots on any error
  // so the booking form ALWAYS works regardless of calendar integration state.
  useEffect(() => {
    async function load() {
      try {
        const appCheckHeaders = await getAppCheckHeaders();
        const res = await fetch(SLOTS_URL, { headers: appCheckHeaders });
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
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(await getAppCheckHeaders()),
      };

      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          formType: "booking",
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone,
          company: form.company,
          service: form.service,
          date: `${selectedDate}T${selectedTime}:00`,
          time: selectedTime,
          notes: form.notes,
          source: "join-page",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setError(t.join.submitError);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="py-20 lg:py-32 bg-linear-to-b from-gray-10 to-white">
        <Container size="sm">
          <div className="text-center bg-white rounded-2xl shadow-lg p-12">
            <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-3">
              {t.join.successTitle}
            </h2>
            <p className="text-gray-60 mb-2">
              {t.join.successBooked}{" "}
              <strong className="text-gray-90">{formatDate(selectedDate, dateLocale)}</strong> {t.join.atTime}{" "}
              <strong className="text-gray-90">{formatTime(selectedTime)}</strong> {t.join.belizeTime}.
            </p>
            <p className="text-gray-50 text-sm mb-6">
              {t.join.successInvite} <strong>{form.email}</strong> {t.join.successShortly}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-md hover:bg-primary-light transition-colors"
            >
              {t.join.backToHome}
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-linear-to-b from-gray-10 to-white">
        <Container size="md">
          <div className="text-center mb-10">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-100 mb-4">
              {t.join.heroTitle}
            </h1>
            <p className="text-lg text-gray-60 max-w-lg mx-auto">
              {t.join.heroDesc}
            </p>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-3 mb-10">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step >= s
                      ? "bg-primary text-white"
                      : "bg-gray-20 text-gray-50"
                  }`}
                >
                  {s}
                </div>
                <span className={`text-sm font-medium ${step >= s ? "text-gray-90" : "text-gray-40"}`}>
                  {s === 1 ? t.join.step1 : t.join.step2}
                </span>
                {s < 2 && (
                  <div className={`w-12 h-0.5 mx-1 ${step > 1 ? "bg-primary" : "bg-gray-20"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Step 1: Calendar */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-bold text-gray-100 mb-1">
                  {t.join.selectDateTime}
                </h2>
                <p className="text-sm text-gray-50 mb-6">
                  {t.join.timezoneNote}
                </p>

                {loadingSlots ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Calendar grid */}
                      <div className="flex-1 min-w-0">
                        {/* Month navigation */}
                        <div className="flex items-center justify-between mb-4">
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
                            className="p-1.5 rounded-lg text-gray-50 hover:bg-gray-10 hover:text-gray-80 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                          </button>
                          <h3 className="text-sm font-bold text-gray-90">
                            {t.join.months[calMonth.month]} {calMonth.year}
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
                            className="p-1.5 rounded-lg text-gray-50 hover:bg-gray-10 hover:text-gray-80 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 mb-1">
                          {t.join.days.map((d) => (
                            <div key={d} className="text-center text-xs font-medium text-gray-40 py-2">
                              {d}
                            </div>
                          ))}
                        </div>

                        {/* Day cells */}
                        <div className="grid grid-cols-7 gap-1">
                          {calendarDays.map((dateStr, i) => {
                            if (!dateStr) return <div key={`empty-${i}`} />;
                            const day = new Date(dateStr + "T12:00:00").getDate();
                            const hasSlots = availableDateSet.has(dateStr);
                            const isPast = dateStr < today;
                            const isSelected = selectedDate === dateStr;

                            return (
                              <button
                                key={dateStr}
                                type="button"
                                disabled={!hasSlots || isPast}
                                onClick={() => { setSelectedDate(dateStr); setSelectedTime(""); }}
                                className={`relative aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                  isSelected
                                    ? "bg-primary text-white"
                                    : hasSlots && !isPast
                                      ? "text-gray-90 hover:bg-primary/10 hover:text-primary"
                                      : "text-gray-30 cursor-default"
                                }`}
                              >
                                {day}
                                {hasSlots && !isPast && !isSelected && (
                                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Time slots (right side) */}
                      <div className="lg:w-48 shrink-0">
                        {selectedDate ? (
                          <>
                            <p className="text-xs font-medium text-gray-50 mb-3 uppercase tracking-wide">
                              {formatDate(selectedDate, dateLocale)}
                            </p>
                            <div className="flex flex-row flex-wrap lg:flex-col gap-2 max-h-72 lg:overflow-y-auto">
                              {availableTimes.length > 0 ? (
                                availableTimes.map((slot) => (
                                  <button
                                    key={slot.time}
                                    type="button"
                                    onClick={() => setSelectedTime(slot.time)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                      selectedTime === slot.time
                                        ? "bg-primary text-white"
                                        : "bg-gray-10 text-gray-70 hover:bg-primary/10 hover:text-primary"
                                    }`}
                                  >
                                    {formatTime(slot.time)}
                                  </button>
                                ))
                              ) : (
                                <p className="text-sm text-gray-40">{t.join.noTimesAvailable}</p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-gray-40 text-center">
                              {t.join.selectDatePrompt}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      size="lg"
                      fullWidth
                      disabled={!selectedDate || !selectedTime}
                      onClick={() => setStep(2)}
                      className="mt-6"
                    >
                      {t.join.continue}
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Contact Info */}
            {step === 2 && (
              <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-100">{t.join.yourDetails}</h2>
                    <p className="text-sm text-gray-50">
                      {formatDate(selectedDate, dateLocale)} {t.join.atTime} {formatTime(selectedTime)} {t.join.belizeTime}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    {t.join.change}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label={t.join.firstName}
                      placeholder="John"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                    />
                    <Input
                      label={t.join.lastName}
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <Input
                    label={t.join.email}
                    type="email"
                    placeholder="john@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label={t.join.phone}
                      placeholder="+1 (555) 123-4567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                    <Input
                      label={t.join.company}
                      placeholder="Company name"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="service-select" className="block text-sm font-medium text-gray-70 mb-1">{t.join.service}</label>
                    <select
                      id="service-select"
                      name="service"
                      aria-label={t.join.service}
                      title={t.join.service}
                      value={form.service}
                      onChange={(e) => setForm({ ...form, service: e.target.value })}
                      className="w-full rounded-lg border border-gray-20 bg-white px-3 py-2.5 text-sm text-gray-90 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    >
                      {t.join.services.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-70 mb-1">{t.join.notes}</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                      placeholder={t.join.notesPlaceholder}
                      className="w-full rounded-lg border border-gray-20 bg-white px-3 py-2.5 text-sm text-gray-90 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(1)}
                    >
                      {t.join.back}
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      fullWidth
                      isLoading={submitting}
                    >
                      {t.join.bookConsultation}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
