"use client";

import { useState } from "react";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  AdminTabs,
  DataTable,
  StatusBadge,
  Modal,
  AIPromptButton,
  useToast,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { Button, Input } from "@/components/ui";
import { cloudListCalendarEvents } from "@/lib/firebase/cloud-functions";
import type { Booking } from "@/lib/types/crm";
import { statusVariant, BOOKING_STATUSES } from "@/lib/types/crm";
import type { EmailDraft } from "@/lib/types/content";

export default function BookingsPage() {
  const { data: bookings, loading, edit, del } = useCollection<Booking>("bookings", {
    orderByField: "createdAt",
  });
  const { add: addEmail } = useCollection<EmailDraft>("emails", { orderByField: "createdAt" });
  const { toast } = useToast();

  const [tab, setTab] = useState("all");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<{
    id: string; summary: string; start: string; end: string;
    description?: string; link?: string; status?: string;
  }[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", date: "", time: "", notes: "" });

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
    setCalendarLoading(true);
    try {
      const events = await cloudListCalendarEvents();
      setCalendarEvents(events);
      setCalendarOpen(true);
    } catch {
      toast("Failed — ensure Google Calendar is configured in Settings → Integrations", "error");
    } finally {
      setCalendarLoading(false);
    }
  }

  const filtered = bookings.filter((b) => tab === "all" || b.status === tab);

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
        (b as Booking & { syncedToCalendar?: boolean }).syncedToCalendar ? (
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
            ]}
            dataContext={(() => {
              const byStatus = Object.entries(bookings.reduce((acc, b) => ({ ...acc, [b.status]: (acc[b.status] || 0) + 1 }), {} as Record<string, number>)).map(([s, c]) => `${s}: ${c}`).join(", ");
              const services = [...new Set(bookings.map(b => b.service).filter(Boolean))];
              const recent = bookings.slice(0, 5).map(b => `${b.name} (${b.service}, ${b.status})`).join("; ");
              return `CreedaVA Bookings (${bookings.length} total):\nBy status: ${byStatus}\nServices: ${services.join(", ")}\nRecent: ${recent}`;
            })()}
            buildPrompt={(input, ctx) =>
              `You are a client success coordinator for CreedaVA (virtual assistant services).\n${input}\n\nBooking data:\n${ctx}\n\nBe professional and actionable.`
            }
            onResult={handleAIResult}
          />
          <Button variant="outline" size="sm" onClick={handleViewCalendar} isLoading={calendarLoading} className="w-full sm:w-auto">
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            View Calendar
          </Button>
          </div>
        }
      />

      <AdminTabs tabs={tabs} defaultValue="all" onChange={setTab} />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(b) => b.id}
        onRowClick={(b) => openDetail(b)}
        emptyMessage="No bookings found"
      />

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
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-gray-80 min-h-20"
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
                {(selected as Booking & { syncedToCalendar?: boolean; googleCalendarLink?: string }).syncedToCalendar ? (
                  <p className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      Synced
                    </span>
                    {(selected as Booking & { googleCalendarLink?: string }).googleCalendarLink && (
                      <a
                        href={(selected as Booking & { googleCalendarLink?: string }).googleCalendarLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Open in Calendar →
                      </a>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-gray-40 mt-0.5">Not synced yet</p>
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

      {/* Google Calendar Events Modal */}
      <Modal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title="Google Calendar Events"
        size="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setCalendarOpen(false)}>
            Close
          </Button>
        }
      >
        {calendarEvents.length === 0 ? (
          <p className="text-sm text-gray-50 text-center py-8">No upcoming calendar events found</p>
        ) : (
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {calendarEvents.map((ev) => (
              <div key={ev.id} className="py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-90">{ev.summary}</p>
                    <p className="text-xs text-gray-50 mt-0.5">
                      {new Date(ev.start).toLocaleString()} — {new Date(ev.end).toLocaleString()}
                    </p>
                    {ev.description && (
                      <p className="text-xs text-gray-40 mt-1 truncate">{ev.description}</p>
                    )}
                  </div>
                  {ev.link && (
                    <a href={ev.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline ml-2 shrink-0">
                      Open
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
