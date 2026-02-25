"use client";

import { buildTrainedPrompt } from "@/lib/utils/ai-system-prompt";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  AdminTabs,
  DataTable,
  StatusBadge,
  Modal,
  AIPromptButton,
  CalendarView,
  useToast,
} from "@/components/admin";
import type { Column, CalendarEvent } from "@/components/admin";
import { Button, Input } from "@/components/ui";
import { cloudListCalendarEvents, cloudRetrySyncBooking } from "@/lib/firebase/cloud-functions";
import type { Booking } from "@/lib/types/crm";
import { statusVariant, BOOKING_STATUSES } from "@/lib/types/crm";
import type { EmailDraft } from "@/lib/types/content";

export default function BookingsPage() {
  const { data: bookings, loading, add, edit, del } = useCollection<Booking>("bookings", {
    orderByField: "createdAt",
  });
  const { add: addEmail } = useCollection<EmailDraft>("emails", { orderByField: "createdAt" });
  const { toast } = useToast();

  const [tab, setTab] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<{
    id: string; summary: string; start: string; end: string;
    description?: string; link?: string; status?: string;
  }[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", date: "", time: "", notes: "" });
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  // ─── Calendar data: merge bookings + Google Calendar events ───
  const fetchCalendarEvents = useCallback(async () => {
    if (calendarLoading) return;
    setCalendarLoading(true);
    try {
      const events = await cloudListCalendarEvents();
      setCalendarEvents(events);
    } catch {
      // Silently fail — calendar events are optional overlay
    } finally {
      setCalendarLoading(false);
    }
  }, [calendarLoading]);

  // Load Google Calendar events when switching to calendar view
  useEffect(() => {
    if (viewMode === "calendar" && calendarEvents.length === 0) {
      fetchCalendarEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // Auto-refresh Google Calendar events every 60 seconds while in calendar view
  useEffect(() => {
    if (viewMode !== "calendar") return;
    const id = setInterval(() => { fetchCalendarEvents(); }, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // Map bookings to CalendarEvent format
  const bookingCalendarEvents: CalendarEvent[] = useMemo(
    () =>
      bookings.map((b) => {
        const color: CalendarEvent["color"] =
          b.status === "confirmed" ? "teal"
            : b.status === "completed" ? "green"
              : b.status === "cancelled" ? "red"
                : "yellow";
        return {
          id: `booking-${b.id}`,
          title: `${b.service || "Consultation"} — ${b.name}`,
          date: b.date,
          time: b.time,
          color,
          type: "booking" as const,
          status: b.status,
          description: b.notes,
          link: b.googleCalendarLink,
          onClick: () => openDetail(b),
        };
      }),
    [bookings],
  );

  // Map Google Calendar events to CalendarEvent format
  const googleCalendarEvents: CalendarEvent[] = useMemo(
    () =>
      calendarEvents
        .filter((ev) => {
          // Skip events that are already represented by a booking
          return !bookings.some((b) => b.googleCalendarLink && ev.link && b.googleCalendarLink === ev.link);
        })
        .map((ev) => {
          const startDate = new Date(ev.start);
          return {
            id: `gcal-${ev.id}`,
            title: ev.summary,
            date: startDate.toISOString().split("T")[0],
            time: startDate.toTimeString().slice(0, 5),
            endTime: ev.end ? new Date(ev.end).toTimeString().slice(0, 5) : undefined,
            color: "blue" as const,
            type: "calendar-event" as const,
            status: ev.status,
            description: ev.description,
            link: ev.link,
          };
        }),
    [calendarEvents, bookings],
  );

  const allCalendarEvents = useMemo(
    () => [...bookingCalendarEvents, ...googleCalendarEvents],
    [bookingCalendarEvents, googleCalendarEvents],
  );

  /** Save AI output — emails go to the Emails collection, analysis goes to booking notes */
  async function handleAIResult(result: string) {
    const text = result.trim();
    // Detect email-like content: look for "Subject:" pattern
    const subjectMatch = text.match(/Subject\s*:\s*(.+)/i);
    const isEmail = !!subjectMatch;

    if (isEmail) {
      const subject = subjectMatch![1].trim();
      // Body = everything after the subject line
      const bodyStart = text.indexOf(subjectMatch![0]) + subjectMatch![0].length;
      const body = text.slice(bodyStart).trim();
      try {
        await addEmail({
          purpose: "follow-up",
          subject,
          body,
          previewText: body.slice(0, 120).replace(/\n/g, " "),
          status: "draft",
        });
        toast("Email draft saved to Emails", "success");
      } catch {
        toast("Failed to save email draft", "error");
      }
    } else {
      // Save analysis / non-email output as a note on the selected booking
      if (selected) {
        try {
          const existing = selected.notes || "";
          const updated = existing
            ? `${existing}\n\n--- AI Insight ---\n${text}`
            : `--- AI Insight ---\n${text}`;
          await edit(selected.id, { notes: updated });
          setForm((f) => ({ ...f, notes: updated }));
          toast("AI insight saved to booking notes", "success");
        } catch {
          toast("Failed to save AI insight", "error");
        }
      } else {
        // No booking selected — save as a standalone email draft for reference
        try {
          await addEmail({
            purpose: "ai-generated",
            subject: "AI Generated — Bookings",
            body: text,
            previewText: text.slice(0, 120).replace(/\n/g, " "),
            status: "draft",
          });
          toast("AI content saved to Emails as draft", "success");
        } catch {
          toast("Failed to save AI content", "error");
        }
      }
    }
  }

  async function handleViewCalendar() {
    setViewMode("calendar");
    setCalendarLoading(true);
    try {
      const events = await cloudListCalendarEvents();
      setCalendarEvents(events);
    } catch {
      toast("Failed — ensure Google Calendar is configured in Settings → Integrations", "error");
    } finally {
      setCalendarLoading(false);
    }
  }

  async function handleRetrySync() {
    if (!selected) return;
    setSyncing(true);
    try {
      const result = await cloudRetrySyncBooking(selected.id);
      toast("Synced to Google Calendar", "success");
      setSelected({ ...selected, syncedToCalendar: true, googleCalendarLink: result.link || selected.googleCalendarLink });
      // Refresh calendar events if in calendar view
      if (viewMode === "calendar") fetchCalendarEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      toast(msg.includes("not enabled") ? "Google Calendar integration not configured in Settings" : msg, "error");
    } finally {
      setSyncing(false);
    }
  }

  async function handleCreate() {
    if (!form.name || !form.email) {
      toast("Name and Email are required", "error");
      return;
    }
    setSaving(true);
    try {
      await add({
        name: form.name,
        email: form.email,
        phone: form.phone,
        service: form.service || "General Consultation",
        date: form.date || new Date().toISOString().split("T")[0],
        time: form.time,
        status: "pending",
        source: "admin",
        notes: form.notes,
      });
      toast("Booking created successfully", "success");
      setCreateOpen(false);
      setForm({ name: "", email: "", phone: "", service: "", date: "", time: "", notes: "" });
    } catch {
      toast("Failed to create booking", "error");
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => bookings.filter((b) => tab === "all" || b.status === tab), [bookings, tab]);

  const tabs = [
    { label: "All", value: "all", badge: bookings.length },
    ...BOOKING_STATUSES.map((s) => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: s,
      badge: bookings.filter((b) => b.status === s).length,
    })),
  ];

  function openDetail(booking: Booking) {
    setSelected(booking);
    setForm({
      name: booking.name || "",
      email: booking.email || "",
      phone: booking.phone || "",
      service: booking.service || "",
      date: booking.date || "",
      time: booking.time || "",
      notes: booking.notes || "",
    });
    setDetailOpen(true);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      await edit(selected.id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        service: form.service,
        date: form.date,
        time: form.time,
        notes: form.notes,
      });
      toast("Booking updated");
      setSelected({ ...selected, ...form });
    } catch {
      toast("Failed to update", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status: Booking["status"]) {
    if (!selected) return;
    try {
      await edit(selected.id, { status });
      toast(`Booking marked as ${status}`);
      setSelected({ ...selected, status });
    } catch {
      toast("Failed to update status", "error");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await del(selected.id);
      toast("Booking deleted");
      setDeleteOpen(false);
      setDetailOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete booking", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Booking>[] = [
    { key: "name", header: "Name", render: (b) => <span className="font-medium text-gray-90">{b.name}</span> },
    { key: "email", header: "Email" },
    { key: "service", header: "Service" },
    {
      key: "date",
      header: "Date",
      render: (b) => (
        <span>{new Date(b.date).toLocaleDateString()}{b.time ? ` at ${b.time}` : ""}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (b) => <StatusBadge status={b.status} variant={statusVariant[b.status]} />,
    },
    {
      key: "syncedToCalendar" as keyof Booking,
      header: "Calendar",
      render: (b) =>
        b.syncedToCalendar ? (
          <span title="Synced to Google Calendar" className="inline-flex items-center gap-1 text-xs text-green-600">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            Synced
          </span>
        ) : (
          <span className="text-xs text-gray-40">—</span>
        ),
    },
    { key: "source", header: "Source", render: (b) => <span className="capitalize">{b.source || "—"}</span> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Manage service bookings and appointments"
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <AIPromptButton
            section="Bookings AI"
            description="Improve booking follow-up and conversion"
            placeholder="e.g. Draft follow-up emails for pending bookings, analyze service popularity..."
            presets={[
              { label: "Follow-up Emails", prompt: "Draft follow-up emails for pending/recent bookings. For each pending booking write a short confirmation/follow-up email (subject + 3 sentences). Be professional and reassuring." },
              { label: "Service Analysis", prompt: "Analyze booking patterns and service popularity. Provide: most popular services, conversion rates by status, suggestions for improving booking completion, and ideas for new service offerings." },
              { label: "Thank You Email", prompt: "Draft a professional thank-you email template that thanks the client, summarises what was discussed, suggests next steps, and asks for a referral. Include subject line." },
              { label: "No-Show Recovery", prompt: "Draft a friendly re-engagement email for clients who missed their booking. Offer to reschedule and emphasize value. Include subject line and 3-4 sentences." },
              { label: "Upsell After Call", prompt: "Draft a post-consultation email that upsells additional services based on common booking types. Include 2-3 service recommendations with benefits." },
              { label: "Weekly Summary", prompt: "Generate a weekly booking summary report. Cover: total bookings, completion rate, most requested services, cancellations, and revenue opportunity from pending bookings." },
              { label: "Reminder Template", prompt: "Draft a booking reminder email to send 24 hours before the scheduled call. Professional, concise, includes what to prepare for the meeting." },
              { label: "Availability Tips", prompt: "Analyze booking times and suggest optimal availability windows. Identify peak demand hours and recommend schedule adjustments to maximize bookings." },
            ]}
            dataContext={(() => {
              const byStatus = Object.entries(bookings.reduce((acc, b) => ({ ...acc, [b.status]: (acc[b.status] || 0) + 1 }), {} as Record<string, number>)).map(([s, c]) => `${s}: ${c}`).join(", ");
              const services = [...new Set(bookings.map(b => b.service).filter(Boolean))];
              const recent = bookings.slice(0, 5).map(b => `${b.name} (${b.service}, ${b.status})`).join("; ");
              return `CreedaVA Bookings (${bookings.length} total):\nBy status: ${byStatus}\nServices: ${services.join(", ")}\nRecent: ${recent}`;
            })()}
            buildPrompt={(input, ctx) =>
              buildTrainedPrompt("Bookings", input, ctx, { includeKPIs: true })
            }
            onResult={handleAIResult}
          />
          <Button variant="outline" size="sm" onClick={() => {
            if (viewMode === "calendar") {
              setViewMode("table");
            } else {
              handleViewCalendar();
            }
          }} isLoading={calendarLoading} className="w-full sm:w-auto">
            {viewMode === "calendar" ? (
              <>
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                Table View
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                Calendar View
              </>
            )}
          </Button>
          <Button size="sm" onClick={() => { setForm({ name: "", email: "", phone: "", service: "", date: "", time: "", notes: "" }); setCreateOpen(true); }}>
            New Booking
          </Button>
          </div>
        }
      />

      <AdminTabs tabs={tabs} defaultValue="all" onChange={setTab} />

      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(b) => b.id}
          onRowClick={(b) => openDetail(b)}
          emptyMessage="No bookings found"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-50">
              <span className="font-medium text-gray-70">{bookings.length}</span> bookings
              {googleCalendarEvents.length > 0 && (
                <>
                  {" · "}
                  <span className="font-medium text-gray-70">{googleCalendarEvents.length}</span> calendar events
                </>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={fetchCalendarEvents} isLoading={calendarLoading}>
              <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
              Refresh Events
            </Button>
          </div>
          <CalendarView
            events={allCalendarEvents}
            loading={calendarLoading}
            onDateClick={(date) => {
              // Pre-fill the "New Booking" form with the selected date
              const iso = date.toISOString().split("T")[0];
              setForm({ name: "", email: "", phone: "", service: "", date: iso, time: "", notes: "" });
            }}
          />
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Booking"
        size="lg"
        footer={
          <div className="flex justify-end gap-2 text-right">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} isLoading={saving}>
              Create
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Service" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input label="Time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-70 mb-1">Notes</label>
            <textarea
              className="w-full rounded-md border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-80 min-h-20"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Booking notes"
            />
          </div>
        </div>
      </Modal>

      {/* Detail / Edit Modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Booking Details"
        size="lg"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)} className="w-full sm:w-auto">
              Delete
            </Button>
            <div className="flex-1 hidden sm:block" />
            <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={saving} className="w-full sm:w-auto">
              Update
            </Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="Service" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
              <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Input label="Time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-70 mb-1">Notes</label>
              <textarea
                className="w-full rounded-md border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-80 min-h-20"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Booking notes"
              />
            </div>

            {/* Status & Calendar info */}
            <hr className="border-border" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-50">Status</span>
                <p className="mt-0.5"><StatusBadge status={selected.status} variant={statusVariant[selected.status]} /></p>
              </div>
              <div>
                <span className="text-gray-50">Google Calendar</span>
                {selected.syncedToCalendar ? (
                  <p className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      Synced
                    </span>
                    {selected.googleCalendarLink && (
                      <a
                        href={selected.googleCalendarLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Open in Calendar →
                      </a>
                    )}
                  </p>
                ) : (
                  <p className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-40">Not synced yet</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRetrySync}
                      isLoading={syncing}
                      className="text-xs h-6 px-2 py-0"
                    >
                      Sync Now
                    </Button>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <span className="text-sm text-gray-50 self-center mr-2">Update status:</span>
              {BOOKING_STATUSES.filter((s) => s !== selected.status).map((s) => (
                <Button key={s} variant="outline" size="sm" onClick={() => handleStatusChange(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Booking"
        size="sm"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleting} className="w-full sm:w-auto">
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-70">
          Are you sure you want to delete this booking for <strong>{selected?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>

    </div>
  );
}
