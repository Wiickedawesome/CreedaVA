"use client";

import { buildTrainedPrompt } from "@/lib/utils/ai-system-prompt";
import { parseAiJson } from "@/lib/utils/ai-json";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  AdminTabs,
  DataTable,
  StatusBadge,
  Modal,
  useToast,
  Select,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { Button, Input } from "@/components/ui";
import { AIPromptButton, RichTextEditor } from "@/components/admin";
import {
  cloudSendEmail,
  cloudSendBulkEmail,
  cloudSyncInbox,
} from "@/lib/firebase/cloud-functions";
import type { EmailDraft, InboxMessage } from "@/lib/types/content";
import { uploadImage, uploadFile } from "@/lib/firebase/storage";
import Image from "next/image";
import dynamic from "next/dynamic";
import { update } from "@/lib/firebase/firestore";
import {
  BUSINESS_ADDRESSES,
  SENDABLE_ADDRESS_OPTIONS,
  isReceivedBy,
  mailboxDisplayName,
  senderForReply,
  DEFAULT_SENDER_ADDRESS,
} from "@/lib/constants/business-emails";

/** Tabs that render the draft table — everything except Inbox and Outreach. */
const DRAFT_TABS = ["drafts", "sent", "all"];

const EMAIL_TABS = ["inbox", "drafts", "sent", "all", "outreach"] as const;

const OutreachSection = dynamic(() => import("./_components/outreach-section"), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-50">Loading outreach…</p>,
});

// ─── Business Addresses ─────────────────────────────
// Canonical list lives in lib/constants/business-emails so the inbox filter,
// the per-address counters and the compose picker cannot drift apart — and so
// the Gmail sign-in mailbox (`integrations/email.user`) never appears here.

/** Short date for the address-health cards — "12 Nov" is enough to spot a dead alias. */
function formatReceivedDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "unknown";
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

const emptyForm = {
  subject: "",
  body: "",
  previewText: "",
  purpose: "",
  status: "draft" as "draft" | "sent",
  images: [] as string[],
  attachments: [] as { name: string; url: string; type: string }[],
};

const SURVEY_TEMPLATE_BODY = `<div style="max-width:600px;margin:0 auto;font-family:'Roboto',Arial,sans-serif;color:#0B2135;">
  <div style="text-align:center;padding:24px 0;">
    <img src="/logo.webp" alt="CreedaVA" width="120" style="margin-bottom:12px;height: auto;" />
  </div>
  <div style="background:#F7F7F2;border-radius:12px;padding:32px;border:1px solid #e8edf5;">
    <h2 style="margin:0 0 8px;color:#005148;font-size:22px;">How are we doing?</h2>
    <p style="margin:0 0 20px;color:#444;font-size:15px;line-height:1.6;">
      Hi {{CUSTOMER_NAME}},<br/><br/>
      Your feedback helps us improve the services we provide. Please take a moment to rate your experience — it only takes 30 seconds.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="{{SURVEY_LINK}}" style="display:inline-block;background:#005148;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:16px;">
        Share Your Feedback →
      </a>
    </div>
    <p style="margin:20px 0 0;color:#888;font-size:13px;text-align:center;">
      This link is unique to you and will expire in 30 days.
    </p>
  </div>
  <div style="text-align:center;padding:24px 0;color:#888;font-size:12px;">
    <p>CreedaVA — Virtual Assistant Services</p>
    <p><a href="https://creedava.com" style="color:#005148;">creedava.com</a></p>
  </div>
</div>`;

export default function EmailsPage() {
  // ─── Collections ──────────────────
  const { data: emails, loading: draftsLoading, add, edit, del } = useCollection<EmailDraft>("emails", {
    orderByField: "createdAt",
  });
  const { data: inboxMessages, loading: inboxLoading, refetch: refetchInbox } = useCollection<InboxMessage>("inbox", {
    orderByField: "date",
  });
  const { data: integrations } = useCollection("integrations");

  const emailSettings = useMemo(() => integrations.find((i) => i.id === "email")?.config || {}, [integrations]);

  // Only used to detect whether inbound sync is configured at all — the
  // addresses themselves come from BUSINESS_ADDRESSES, not from this config.
  const hasMailboxConfig = Boolean(emailSettings.user);

  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ─── UI State ─────────────────────
  const [tab, setTab] = useState(() => {
    const requested = searchParams?.get("tab") ?? "";
    return (EMAIL_TABS as readonly string[]).includes(requested) ? requested : "inbox";
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<EmailDraft | null>(null);
  const [selectedInbox, setSelectedInbox] = useState<InboxMessage | null>(null);
  const [inboxViewOpen, setInboxViewOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState(DEFAULT_SENDER_ADDRESS);
  const [sending, setSending] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRecipients, setBulkRecipients] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [inboxFilter, setInboxFilter] = useState("all");

  // Image/attachment state
  const [uploading, setUploading] = useState(false);
  const emailImageRef = useRef<HTMLInputElement>(null);
  const emailAttachRef = useRef<HTMLInputElement>(null);

  // System template preview
  const [surveyPreviewOpen, setSurveyPreviewOpen] = useState(false);

  // Auto-seed or update satisfaction survey template
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || draftsLoading) return;
    const existing = emails.find((e) => e.purpose === "satisfaction-survey");
    if (!existing) {
      seededRef.current = true;
      add({
        purpose: "satisfaction-survey",
        subject: "We'd love your feedback — CreedaVA Satisfaction Survey",
        body: SURVEY_TEMPLATE_BODY,
        previewText: "Customer satisfaction survey template",
        status: "draft" as const,
      }).catch(() => { seededRef.current = false; });
    } else if (existing.body.includes("https://creedava.com/logo.webp") || existing.body.includes('alt="CreedaVA" width="20"')) {
      // Update stale template with correct logo
      seededRef.current = true;
      edit(existing.id, { body: SURVEY_TEMPLATE_BODY } as Partial<EmailDraft>).catch(() => { seededRef.current = false; });
    }
  }, [draftsLoading, emails, add, edit]);

  // ─── Derived data ─────────────────
  const filteredInbox = useMemo(() => {
    let msgs = inboxMessages.filter((m) => !m.archived);
    const filter = BUSINESS_ADDRESSES.find((entry) => entry.label === inboxFilter);
    if (filter) msgs = msgs.filter((m) => isReceivedBy(m, filter));
    return msgs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [inboxMessages, inboxFilter]);

  const unreadCount = useMemo(() => inboxMessages.filter((m) => !m.seen && !m.archived).length, [inboxMessages]);

  /**
   * Per-mailbox receiving state. "Nothing received yet" is the useful signal
   * here: it means mail to that address is not reaching the synced inbox, which
   * is the only way this app can tell whether an alias is live.
   */
  const mailboxHealth = useMemo(
    () =>
      BUSINESS_ADDRESSES.map((entry) => {
        const mine = inboxMessages.filter((m) => !m.archived && isReceivedBy(m, entry));
        const latest = mine.reduce<string | null>((newest, m) => {
          if (!newest) return m.date;
          return new Date(m.date) > new Date(newest) ? m.date : newest;
        }, null);
        return {
          entry,
          count: mine.length,
          unread: mine.filter((m) => !m.seen).length,
          lastReceived: latest ? formatReceivedDate(latest) : null,
        };
      }),
    [inboxMessages],
  );

  // Separate system templates from user drafts
  const surveyTemplate = useMemo(() => emails.find((e) => e.purpose === "satisfaction-survey"), [emails]);
  const userEmails = useMemo(() => emails.filter((e) => e.purpose !== "satisfaction-survey"), [emails]);

  const filteredDrafts = useMemo(() => {
    if (tab === "drafts") return userEmails.filter((e) => e.status === "draft");
    if (tab === "sent") return userEmails.filter((e) => e.status === "sent");
    return userEmails;
  }, [userEmails, tab]);

  const tabs = [
    { label: "Inbox", value: "inbox", badge: unreadCount || undefined },
    { label: "Drafts", value: "drafts", badge: userEmails.filter((e) => e.status === "draft").length || undefined },
    { label: "Sent", value: "sent", badge: userEmails.filter((e) => e.status === "sent").length || undefined },
    { label: "All Drafts", value: "all", badge: userEmails.length || undefined },
    { label: "Outreach", value: "outreach" },
  ];

  // ─── Sync inbox ───────────────────
  const handleTabChange = useCallback(
    (value: string) => {
      setTab(value);
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("tab", value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await cloudSyncInbox();
      if (result.synced > 0) {
        toast(`Synced ${result.synced} new email(s)`, "success");
        refetchInbox();
      } else {
        toast("Inbox is up to date");
      }
    } catch {
      toast("Failed to sync inbox — check email config in Settings → Integrations", "error");
    } finally {
      setSyncing(false);
    }
  }, [toast, refetchInbox]);

  const initialSyncDone = useRef(false);

  useEffect(() => {
    if (hasMailboxConfig && !inboxLoading && inboxMessages.length === 0 && !initialSyncDone.current) {
      initialSyncDone.current = true;
      handleSync();
    }
  }, [hasMailboxConfig, inboxLoading, inboxMessages.length, handleSync]);

  // ─── Compose / Draft Handlers ─────

  function openCompose(replyTo?: InboxMessage) {
    setSelected(null);
    if (replyTo) {
      setForm({
        subject: replyTo.subject.startsWith("Re:") ? replyTo.subject : `Re: ${replyTo.subject}`,
        body: `<br/><br/><hr/><p><em>On ${new Date(replyTo.date).toLocaleDateString()}, ${replyTo.fromName} &lt;${replyTo.from}&gt; wrote:</em></p><blockquote style="border-left:3px solid #ccc;padding-left:12px;margin-left:0;color:#666">${replyTo.bodyHtml || replyTo.bodyText || replyTo.preview}</blockquote>`,
        previewText: "",
        purpose: "reply",
        status: "draft",
        images: [],
        attachments: [],
      });
      setRecipient(replyTo.from);
      setSender(senderForReply(replyTo));
    } else {
      setForm({ ...emptyForm });
      setRecipient("");
      setSender(DEFAULT_SENDER_ADDRESS);
    }
    setComposeOpen(true);
  }

  function openDraft(email: EmailDraft) {
    setSelected(email);
    setForm({
      subject: email.subject,
      body: email.body,
      previewText: email.previewText ?? "",
      purpose: email.purpose ?? "",
      status: email.status,
      images: email.images || [],
      attachments: email.attachments || [],
    });
    setModalOpen(true);
  }

  function openInboxMessage(msg: InboxMessage) {
    setSelectedInbox(msg);
    setInboxViewOpen(true);
    if (!msg.seen) {
      update("inbox", msg.id, { seen: true }).catch(() => {});
    }
  }

  async function handleSave() {
    if (!form.subject.trim()) return;
    setSaving(true);
    try {
      const data = {
        subject: form.subject,
        body: form.body,
        previewText: form.previewText,
        purpose: form.purpose,
        status: form.status,
        images: form.images,
        attachments: form.attachments,
      };
      if (selected) {
        await edit(selected.id, data);
        toast("Email updated");
      } else {
        await add(data);
        toast("Email saved as draft");
      }
      setModalOpen(false);
      setComposeOpen(false);
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendEmail() {
    if (!recipient.trim()) {
      toast("Enter a recipient email address", "error");
      return;
    }
    if (!form.subject.trim()) {
      toast("Enter a subject", "error");
      return;
    }
    setSending(true);
    try {
      const result = await cloudSendEmail({
        to: recipient,
        from: sender || undefined,
        subject: form.subject,
        html: form.body,
      });
      if (result.success) {
        if (selected) {
          await edit(selected.id, { status: "sent" as const });
        } else {
          await add({
            subject: form.subject,
            body: form.body,
            previewText: form.previewText,
            purpose: form.purpose || "sent",
            status: "sent" as const,
            images: form.images,
            attachments: form.attachments,
          });
        }
        toast("Email sent!", "success");
        setRecipient("");
        setModalOpen(false);
        setComposeOpen(false);
      } else {
        toast("Email sending failed", "error");
      }
    } catch {
      toast("Failed to send — ensure Email is configured in Settings → Integrations", "error");
    } finally {
      setSending(false);
    }
  }

  async function handleBulkSend() {
    const emailList = bulkRecipients.split(/[,;\n]+/).map((e) => e.trim()).filter(Boolean);
    if (emailList.length === 0) {
      toast("Enter at least one recipient email", "error");
      return;
    }
    setBulkSending(true);
    try {
      const result = await cloudSendBulkEmail({
        recipients: emailList,
        from: sender,
        subject: form.subject,
        html: form.body,
      });
      if (result.success) {
        if (selected) await edit(selected.id, { status: "sent" as const });
        toast(`Sent to ${result.sent} of ${emailList.length} recipients`, "success");
        setBulkRecipients("");
        setBulkOpen(false);
        setModalOpen(false);
        setComposeOpen(false);
      } else {
        toast(`${result.sent} sent, ${result.failed} failed`, "error");
      }
    } catch {
      toast("Bulk send failed — check SMTP config", "error");
    } finally {
      setBulkSending(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await del(selected.id);
      toast("Email deleted");
      setDeleteOpen(false);
      setModalOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleEmailImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const folder = `emails/${selected?.id || "new_" + Date.now()}`;
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadImage(file, folder);
        urls.push(result.url);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
      toast(`${urls.length} image(s) uploaded`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleEmailAttachUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const folder = `emails/${selected?.id || "new_" + Date.now()}/attachments`;
      const newAtts: { name: string; url: string; type: string }[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadFile(file, folder);
        newAtts.push({ name: result.name, url: result.url, type: result.type });
      }
      setForm((f) => ({ ...f, attachments: [...f.attachments, ...newAtts] }));
      toast(`${newAtts.length} file(s) attached`);
    } catch {
      toast("Upload failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeEmailImage(index: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  function removeEmailAttachment(index: number) {
    setForm((f) => ({ ...f, attachments: f.attachments.filter((_, i) => i !== index) }));
  }

  // ─── Inbox Table Columns ──────────
  const inboxColumns: Column<InboxMessage>[] = [
    {
      key: "from",
      header: "From",
      render: (m) => (
        <div className={`min-w-0 ${!m.seen ? "font-semibold" : ""}`}>
          <p className="text-sm text-gray-90 truncate">{m.fromName || m.from}</p>
          {m.fromName && m.fromName !== m.from && (
            <p className="text-xs text-gray-50 truncate">{m.from}</p>
          )}
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (m) => (
        <div className="min-w-0 flex-1">
          <p className={`text-sm truncate max-w-md ${!m.seen ? "text-gray-90 font-medium" : "text-gray-70"}`}>
            {m.subject}
          </p>
          <p className="text-xs text-gray-50 truncate max-w-md">{m.preview}</p>
        </div>
      ),
    },
    {
      key: "receivedBy",
      header: "To",
      render: (m) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-10 text-gray-60 whitespace-nowrap">
          {mailboxDisplayName(m)}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (m) => (
        <span className={`text-xs whitespace-nowrap ${!m.seen ? "text-gray-80 font-medium" : "text-gray-50"}`}>
          {formatDate(m.date)}
        </span>
      ),
    },
    {
      key: "hasAttachments",
      header: "",
      render: (m) =>
        m.hasAttachments ? (
          <svg className="w-4 h-4 text-gray-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        ) : null,
    },
  ];

  // ─── Draft Table Columns ──────────
  const draftColumns: Column<EmailDraft>[] = [
    {
      key: "subject",
      header: "Subject",
      render: (e) => (
        <span className="text-sm font-medium text-gray-90 truncate max-w-sm block">{e.subject}</span>
      ),
    },
    {
      key: "purpose",
      header: "Purpose",
      render: (e) => (
        <span className="text-sm text-gray-60 truncate max-w-xs block">{e.purpose}</span>
      ),
    },
    {
      key: "previewText",
      header: "Preview",
      render: (e) => (
        <span className="text-sm text-gray-50 truncate max-w-xs block">{e.previewText}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (e) => (
        <StatusBadge status={e.status} variant={e.status === "sent" ? "success" : "default"} />
      ),
    },
  ];

  const loading = draftsLoading || inboxLoading;

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
        title="Email"
        description="Inbox, drafts, and outbound emails for all business addresses"
        actions={
          <div className="flex items-center gap-2">
            <AIPromptButton
              section="Email AI"
              description="Compose professional emails with AI."
              placeholder="e.g. Follow-up email after a product demo..."
              presets={[
                { label: "Follow-up", prompt: "Write a follow-up email after an initial consultation about virtual assistant services. Professional tone." },
                { label: "Cold Outreach", prompt: "Write a cold outreach email to a startup founder introducing CreedaVA virtual assistant services." },
                { label: "Thank You", prompt: "Write a thank you email to a new client who just signed up." },
                { label: "Re-engagement", prompt: "Write a re-engagement email to a prospect who went silent. Offer a new incentive." },
                { label: "Onboarding", prompt: "Write a warm onboarding welcome email for new clients with next steps." },
                { label: "Service Update", prompt: "Write an email announcing a new service offering. Highlight benefits and include a CTA." },
                { label: "Testimonial Request", prompt: "Write a polite email asking a happy client for a testimonial or review." },
                { label: "Meeting Recap", prompt: "Write a meeting recap email with key discussion points, action items, and next steps." },
              ]}
              onResult={(raw) => {
                try {
                  const result = parseAiJson<{ subject?: string; body?: string; previewText?: string }>(raw);
                  setForm({
                    subject: result.subject || "",
                    body: result.body || "",
                    previewText: result.previewText || "",
                    purpose: "",
                    status: "draft",
                    images: [],
                    attachments: [],
                  });
                  setSelected(null);
                  setComposeOpen(true);
                  toast("AI content loaded — edit and send when ready", "success");
                } catch {
                  toast("AI returned an unreadable response — try again", "error");
                }
              }}
              buildPrompt={(input) =>
                buildTrainedPrompt(
                  "Emails",
                  `Compose an email based on: "${input}"\n\nReturn ONLY valid JSON with:\n- subject: email subject line\n- previewText: short preview text (50-80 chars)\n- body: full email body in HTML\n\nNo markdown fences.`,
                  "",
                  { includeCompetitors: true },
                )
              }
            />
            <Button size="sm" variant="outline" onClick={handleSync} isLoading={syncing}>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Sync
            </Button>
            <Button size="sm" onClick={() => openCompose()}>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Compose
            </Button>
          </div>
        }
      />

      {/* Business Address Health — one card per mailbox, doubles as the filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {mailboxHealth.map(({ entry, count, unread, lastReceived }) => {
          const isActive = inboxFilter === entry.label;
          return (
            <button
              key={entry.label}
              onClick={() => { setInboxFilter(isActive ? "all" : entry.label); setTab("inbox"); }}
              className={`rounded-lg border p-3 text-left transition-colors ${
                isActive ? "border-primary bg-primary/10" : "border-border bg-card hover:border-gray-30"
              }`}
            >
              <p className="text-xs text-gray-50 truncate">{entry.label}</p>
              <p className="text-[11px] text-gray-40 truncate">{entry.address}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-semibold text-gray-90">{count}</span>
                {unread > 0 && (
                  <span className="text-xs font-medium text-primary">{unread} new</span>
                )}
              </div>
              <p className="text-[11px] text-gray-40 mt-0.5">
                {lastReceived ? `Last ${lastReceived}` : "No mail yet"}
              </p>
            </button>
          );
        })}
      </div>

      {/* System Templates — pinned */}
      {surveyTemplate && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-10 border-b border-border">
            <p className="text-xs font-medium text-gray-50 uppercase tracking-wider">System Templates</p>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" /><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-90">Satisfaction Survey Email</p>
                <p className="text-xs text-gray-50">{surveyTemplate.subject}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-soft text-success-text">Active</span>
              <button
                onClick={() => setSurveyPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:text-primary-light hover:bg-primary/5 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                Preview
              </button>
              <button
                onClick={() => openDraft(surveyTemplate)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-50 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminTabs tabs={tabs} activeTab={tab} onChange={handleTabChange} />

      {/* Inbox Tab */}
      {tab === "inbox" && (
        <>
          {inboxFilter !== "all" && (
            <div className="flex items-center gap-2 text-sm text-gray-60">
              Filtered: <span className="font-medium text-gray-80">{inboxFilter}</span>
              <button onClick={() => setInboxFilter("all")} className="text-primary hover:underline text-xs">Clear</button>
            </div>
          )}
          <DataTable
            columns={inboxColumns}
            data={filteredInbox}
            keyExtractor={(m) => m.id}
            onRowClick={(m) => openInboxMessage(m)}
            emptyMessage="No emails in inbox — click Sync to check for new messages"
          />
        </>
      )}

      {/* Drafts / Sent / All Tab */}
      {DRAFT_TABS.includes(tab) && (
        <DataTable
          columns={draftColumns}
          data={filteredDrafts}
          keyExtractor={(e) => e.id}
          onRowClick={(e) => openDraft(e)}
          emptyMessage="No emails — compose one or let AI draft it"
        />
      )}

      {/* Outreach Tab */}
      {tab === "outreach" && <OutreachSection />}

      {/* ─── Inbox View Modal ─────────────────── */}
      <Modal
        open={inboxViewOpen}
        onClose={() => setInboxViewOpen(false)}
        title={selectedInbox?.subject || "Email"}
        size="lg"
        footer={
          <>
            <Button
              size="sm"
              onClick={() => {
                if (selectedInbox) openCompose(selectedInbox);
                setInboxViewOpen(false);
              }}
            >
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 17 4 12 9 7" />
                <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
              </svg>
              Reply
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const subject = encodeURIComponent(`Fwd: ${selectedInbox?.subject || ""}`);
                const body = encodeURIComponent(selectedInbox?.bodyText || selectedInbox?.preview || "");
                window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, "_blank");
              }}
            >
              Forward in Gmail
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setInboxViewOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        {selectedInbox && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-90">{selectedInbox.fromName}</p>
                <p className="text-xs text-gray-50">{selectedInbox.from}</p>
              </div>
              <p className="text-xs text-gray-50">{new Date(selectedInbox.date).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-50">
              <span>To:</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-10 text-gray-60">{selectedInbox.receivedBy || selectedInbox.to}</span>
              {selectedInbox.cc && (
                <>
                  <span className="ml-2">Cc:</span>
                  <span className="text-gray-60">{selectedInbox.cc}</span>
                </>
              )}
            </div>
            {selectedInbox.hasAttachments && selectedInbox.attachments && (
              <div className="flex flex-wrap gap-2">
                {selectedInbox.attachments.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-10 text-xs text-gray-60">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                    {a.filename} ({formatSize(a.size)})
                  </span>
                ))}
              </div>
            )}
            <hr className="border-border" />
            {/* `.rich-html` comes from admin-styles.css. `prose` emitted no CSS
                (@tailwindcss/typography is not a dependency), so this body used
                to render as unstyled run-on text. */}
            <div
              className="rich-html"
              dangerouslySetInnerHTML={{ __html: selectedInbox.bodyHtml || selectedInbox.bodyText || selectedInbox.preview }}
            />
          </div>
        )}
      </Modal>

      {/* ─── Compose / Edit Draft Modal ───────── */}
      <Modal
        open={composeOpen || modalOpen}
        onClose={() => { setComposeOpen(false); setModalOpen(false); }}
        title={selected ? `Edit: ${selected.subject}` : "Compose Email"}
        size="lg"
        footer={
          <>
            {selected && (
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Bulk
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => { setComposeOpen(false); setModalOpen(false); }}>
              Cancel
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} isLoading={saving}>
              {selected ? "Update Draft" : "Save Draft"}
            </Button>
            <Button size="sm" onClick={handleSendEmail} isLoading={sending}>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Send
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Select
              label="From"
              options={SENDABLE_ADDRESS_OPTIONS}
              value={sender}
              onChange={(e) => setSender(e.target.value)}
            />
            <Input
              label="To"
              placeholder="recipient@example.com"
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <Input
            label="Subject"
            placeholder="Email subject line"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <Input
            label="Preview Text"
            placeholder="Short preview text (50-80 chars)"
            value={form.previewText}
            onChange={(e) => setForm({ ...form, previewText: e.target.value })}
          />
          <RichTextEditor
            label="Email Body"
            value={form.body}
            onChange={(val) => setForm({ ...form, body: val })}
            placeholder="Compose your email..."
            minHeight="200px"
          />

          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-50 uppercase tracking-wide">Images</label>
              <Button variant="outline" size="sm" onClick={() => emailImageRef.current?.click()} isLoading={uploading}>
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload
              </Button>
              <input ref={emailImageRef} type="file" accept="image/*" multiple className="hidden" onChange={handleEmailImageUpload} />
            </div>
            {form.images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {form.images.map((url, i) => (
                  <div key={i} className="relative group w-full h-20">
                    <Image src={url} alt={`Email image ${i + 1}`} fill className="rounded-lg object-cover" />
                    <button
                      onClick={() => removeEmailImage(i)}
                      className="absolute top-1 right-1 bg-gray-10/90 text-gray-60 rounded p-0.5 hover:text-error-text opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-50">No images</p>
            )}
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-50 uppercase tracking-wide">Attachments</label>
              <Button variant="outline" size="sm" onClick={() => emailAttachRef.current?.click()} isLoading={uploading}>
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
                Attach
              </Button>
              <input ref={emailAttachRef} type="file" multiple className="hidden" onChange={handleEmailAttachUpload} />
            </div>
            {form.attachments.length > 0 ? (
              <div className="space-y-1">
                {form.attachments.map((att, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-10 text-sm">
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 text-gray-70 hover:text-primary">
                      <svg className="w-4 h-4 text-gray-50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      <span className="truncate">{att.name}</span>
                    </a>
                    <button
                      onClick={() => removeEmailAttachment(i)}
                      className="text-gray-50 hover:text-error-text shrink-0 ml-2"
                      aria-label="Remove attachment"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-50">No attachments</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Email"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleting}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-gray-70">Delete this email? This cannot be undone.</p>
      </Modal>

      {/* Bulk Send Modal */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Send"
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleBulkSend} isLoading={bulkSending}>Send to All</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-70">
            Subject: <strong>{form.subject}</strong>
          </p>
          <Select
            label="Send From"
            options={SENDABLE_ADDRESS_OPTIONS}
            value={sender}
            onChange={(e) => setSender(e.target.value)}
          />
          <div>
            <label className="text-xs font-medium text-gray-50 uppercase tracking-wide">Recipients</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-80 placeholder:text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              rows={4}
              placeholder={"email1@example.com\nemail2@example.com"}
              value={bulkRecipients}
              onChange={(e) => setBulkRecipients(e.target.value)}
            />
            <p className="text-xs text-gray-50 mt-1">One email per line, or separate with commas</p>
          </div>
          <p className="text-xs text-gray-50">
            {bulkRecipients.split(/[,;\n]+/).map((e) => e.trim()).filter(Boolean).length} recipient(s)
          </p>
        </div>
      </Modal>
      {/* Survey Email Preview Modal */}
      <Modal
        open={surveyPreviewOpen}
        onClose={() => setSurveyPreviewOpen(false)}
        title="Satisfaction Survey Email"
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => {
              if (surveyTemplate) openDraft(surveyTemplate);
              setSurveyPreviewOpen(false);
            }}>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Edit Template
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setSurveyPreviewOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        {surveyTemplate && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-gray-10 p-3">
              <p className="text-xs text-gray-50 mb-1">Subject</p>
              <p className="text-sm font-medium text-gray-90">{surveyTemplate.subject}</p>
            </div>
            <div
              className="rounded-lg border border-border bg-card p-6"
              dangerouslySetInnerHTML={{ __html: surveyTemplate.body
                .replace(/\{\{CUSTOMER_NAME\}\}/g, "John Doe")
                .replace(/\{\{SURVEY_LINK\}\}/g, "/satisfaction/demo")
              }}
            />
            <p className="text-xs text-gray-50 text-center">
              This template is sent from the Customers page when requesting satisfaction feedback.
              <br />Placeholders <code className="text-primary">{'{{CUSTOMER_NAME}}'}</code> and <code className="text-primary">{'{{SURVEY_LINK}}'}</code> are replaced automatically.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 604800000) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}
