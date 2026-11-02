"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui";

// ─── Types ───────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  time?: string; // HH:mm
  endTime?: string;
  color: "teal" | "blue" | "green" | "yellow" | "red" | "gray";
  type: "booking" | "calendar-event";
  status?: string;
  description?: string;
  link?: string;
  onClick?: () => void;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  loading?: boolean;
}

// ─── Helpers ─────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: Date[] = [];

  // Pad beginning with days from previous month
  const startPad = firstDay.getDay();
  for (let i = startPad - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Pad end to fill last week
  const endPad = 7 - (days.length % 7);
  if (endPad < 7) {
    for (let i = 1; i <= endPad; i++) {
      days.push(new Date(year, month + 1, i));
    }
  }

  return days;
}

const EVENT_COLORS: Record<CalendarEvent["color"], { bg: string; text: string; dot: string }> = {
  teal: { bg: "bg-teal-500/10", text: "text-teal-500", dot: "bg-teal-500" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-500", dot: "bg-blue-500" },
  green: { bg: "bg-green-500/10", text: "text-green-500", dot: "bg-green-500" },
  yellow: { bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500" },
  red: { bg: "bg-red-500/10", text: "text-red-500", dot: "bg-red-500" },
  gray: { bg: "bg-gray-500/10", text: "text-gray-500", dot: "bg-gray-400" },
};

// ─── Component ───────────────────────────────────────

export default function CalendarView({ events, onDateClick, loading }: CalendarViewProps) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const days = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const d = new Date(ev.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return map;
  }, [events]);

  function navigateMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
  }

  function goToday() {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
  }

  function handleDateClick(date: Date) {
    setSelectedDate(date);
    onDateClick?.(date);
  }

  const selectedEvents = selectedDate
    ? eventsByDate.get(`${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`) || []
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-90">
          {MONTHS[viewMonth]} {viewYear}
        </h3>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)} aria-label="Previous month">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth(1)} aria-label="Next month">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="ml-2 text-xs text-gray-50">Loading events…</span>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-gray-10">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-gray-50 border-b border-border">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((date, i) => {
            const isCurrentMonth = date.getMonth() === viewMonth;
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const dayEvents = eventsByDate.get(key) || [];
            const hasEvents = dayEvents.length > 0;

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleDateClick(date)}
                className={[
                  "relative min-h-18 sm:min-h-22.5 p-1.5 text-left border-b border-r border-border transition-colors",
                  "hover:bg-gray-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                  isCurrentMonth ? "bg-card" : "bg-gray-10/50",
                  isSelected ? "ring-2 ring-primary ring-inset bg-primary/5" : "",
                ].join(" ")}
              >
                {/* Day number */}
                <span
                  className={[
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                    isToday ? "bg-primary text-primary-foreground" : "",
                    !isToday && isCurrentMonth ? "text-gray-80" : "",
                    !isToday && !isCurrentMonth ? "text-gray-30" : "",
                  ].join(" ")}
                >
                  {date.getDate()}
                </span>

                {/* Event indicators */}
                {hasEvents && (
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const colors = EVENT_COLORS[ev.color];
                      return (
                        <div
                          key={ev.id}
                          className={`${colors.bg} ${colors.text} rounded px-1 py-px text-[10px] leading-tight truncate`}
                          title={`${ev.time ? ev.time + " " : ""}${ev.title}`}
                        >
                          {ev.time ? <span className="font-medium">{ev.time} </span> : null}
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-gray-50 pl-1">+{dayEvents.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Dot indicator for small screens when events are hidden */}
                {hasEvents && (
                  <div className="flex gap-0.5 mt-0.5 sm:hidden">
                    {dayEvents.slice(0, 4).map((ev) => (
                      <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[ev.color].dot}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail pane */}
      {selectedDate && (
        <div className="rounded-lg border border-border p-4 bg-card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-90">
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h4>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-gray-50 hover:text-gray-70"
              aria-label="Close"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          {selectedEvents.length === 0 ? (
            <p className="text-sm text-gray-50 text-center py-4">No events on this day</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents
                .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
                .map((ev) => {
                  const colors = EVENT_COLORS[ev.color];
                  return (
                    <div
                      key={ev.id}
                      className={`flex w-full items-start gap-3 rounded-lg p-3 ${colors.bg} hover:opacity-90 transition-opacity`}
                    >
                      <button
                        type="button"
                        className="contents text-left"
                        onClick={() => ev.onClick?.()}
                        disabled={!ev.onClick}
                      >
                        <div className={`w-1 self-stretch rounded-full ${colors.dot} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${colors.text}`}>{ev.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {ev.time && (
                              <span className="text-xs text-gray-50">
                                {ev.time}{ev.endTime ? ` – ${ev.endTime}` : ""}
                              </span>
                            )}
                            {ev.status && (
                              <span className="text-[10px] uppercase tracking-wider font-medium text-gray-50">
                                {ev.status}
                              </span>
                            )}
                            {ev.type === "calendar-event" && (
                              <span className="text-[10px] text-gray-50">
                                <svg className="w-3 h-3 inline mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                Google Calendar
                              </span>
                            )}
                          </div>
                          {ev.description && (
                            <p className="text-xs text-gray-50 mt-1 line-clamp-2">{ev.description}</p>
                          )}
                        </div>
                      </button>
                      {ev.link && (
                        <a
                          href={ev.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline shrink-0"
                        >
                          Open
                        </a>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-50">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
          Confirmed booking
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Pending booking
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          Completed
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Cancelled
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          Google Calendar event
        </div>
      </div>
    </div>
  );
}
