"use client";

import { useState, useRef, useMemo } from "react";
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
import { lazyGenerateEmail as generateEmail } from "@/lib/firebase/ai-lazy";
import { cloudSendEmail, cloudSendBulkEmail } from "@/lib/firebase/cloud-functions";
import type { EmailDraft } from "@/lib/types/content";
import { uploadImage, uploadFile } from "@/lib/firebase/storage";
import Image from "next/image";

const emptyForm = {
  subject: "",
  body: "",
  previewText: "",
  purpose: "",
  status: "draft" as "draft" | "sent",
  images: [] as string[],
  attachments: [] as { name: string; url: string; type: string }[],
};

export default function EmailsPage() {
  const { data: emails, loading, add, edit, del } = useCollection<EmailDraft>("emails", {
    orderByField: "createdAt",
  });
  // Fetch settings to get aliases
  const { data: integrations } = useCollection("integrations");
  const emailSettings = useMemo(() => integrations.find((i) => i.id === "email")?.config || {}, [integrations]);
  const aliases = useMemo(() => {
    const list: {label: string, value: string}[] = [];
    if (emailSettings.user) list.push({ label: emailSettings.user, value: emailSettings.user });
    if (emailSettings.aliases) {
      emailSettings.aliases.split(',').forEach((s: any) => {
        const email = s.trim();
        if (email) list.push({ label: email, value: email });
      });
    }
    return list;
  }, [emailSettings]);
  
  const { toast } = useToast();

  const [tab, setTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<EmailDraft | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("");
  const [sending, setSending] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRecipients, setBulkRecipients] = useState("");
  const [bulkSending, setBulkSending] = useState(false);

  // Image/attachment state
  const [uploading, setUploading] = useState(false);
  const emailImageRef = useRef<HTMLInputElement>(null);
  const emailAttachRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => emails.filter((e) => tab === "all" || e.status === tab), [emails, tab]);

  const tabs = [
    { label: "All", value: "all", badge: emails.length },
    { label: "Draft", value: "draft", badge: emails.filter((e) => e.status === "draft").length },
    { label: "Sent", value: "sent", badge: emails.filter((e) => e.status === "sent").length },
  ];

  function openModal(email?: EmailDraft) {
    if (email) {
      setSelected(email);
      setForm({
        subject: email.subject,
        body: email.body,
        previewText: email.previewText,
        purpose: email.purpose,
        status: email.status,
        images: email.images || [],
        attachments: email.attachments || [],
      });
    } else {
      setSelected(null);
      setForm({ ...emptyForm });
    }
    setModalOpen(true);
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
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkSent() {
    if (!selected) return;
    try {
      await edit(selected.id, { status: "sent" as const });
      toast("Marked as sent");
      setModalOpen(false);
    } catch {
      toast("Failed to update", "error");
    }
  }

  async function handleSendEmail() {
    if (!selected || !recipient.trim()) {
      toast("Enter a recipient email address", "error");
      return;
    }
    setSending(true);
    try {
      const result = await cloudSendEmail({
        to: recipient,
        from: sender || undefined,
        subject: selected.subject,
        html: selected.body,
      });
      if (result.success) {
        await edit(selected.id, { status: "sent" as const });
        toast("Email sent successfully!", "success");
        setRecipient("");
        setModalOpen(false);
      } else {
        toast("Email sending failed — check integration settings", "error");
      }
    } catch {
      toast("Failed to send — ensure Email SMTP is configured in Settings → Integrations", "error");
    } finally {
      setSending(false);
    }
  }

  async function handleBulkSend() {
    if (!selected) return;
    const emails = bulkRecipients.split(/[,;\n]+/).map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0) {
      toast("Enter at least one recipient email", "error");
      return;
    }
    setBulkSending(true);
    try {
      const result = await cloudSendBulkEmail({
        recipients: emails,
        subject: selected.subject,
        html: selected.body,
      });
      if (result.success) {
        await edit(selected.id, { status: "sent" as const });
        toast(`Sent to ${result.sent} of ${emails.length} recipients`, "success");
        setBulkRecipients("");
        setBulkOpen(false);
        setModalOpen(false);
      } else {
        toast(`${result.sent} sent, ${result.failed} failed`, "error");
      }
    } catch {
      toast("Bulk send failed — check SMTP config in Settings → Integrations", "error");
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

  // ── Email image/attachment handlers ──
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
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
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
      setForm(f => ({ ...f, attachments: [...f.attachments, ...newAtts] }));
      toast(`${newAtts.length} file(s) attached`);
    } catch {
      toast("Upload failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeEmailImage(index: number) {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  function removeEmailAttachment(index: number) {
    setForm(f => ({ ...f, attachments: f.attachments.filter((_, i) => i !== index) }));
  }

  const columns: Column<EmailDraft>[] = [
    {
      key: "subject",
      header: "Subject",
      render: (e) => (
        <span className="text-sm font-medium text-gray-90 truncate max-w-sm block">
          {e.subject}
        </span>
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
        <StatusBadge
          status={e.status}
          variant={e.status === "sent" ? "success" : "default"}
        />
      ),
    },
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
        title="Email Drafts"
        description="AI-composed emails for outreach &amp; follow-ups"
        actions={
          <div className="flex items-center gap-2">
          <AIPromptButton
            section="Email AI"
            description="Compose professional emails with AI. Describe the purpose and context, and AI will generate a subject line, preview text, and full email body."
            placeholder="e.g. Follow-up email after a product demo with John from Acme Corp. Keep it professional but friendly."
            presets={[
              { label: "Follow-up", prompt: "Write a follow-up email after an initial consultation about virtual assistant services. Professional tone." },
              { label: "Cold Outreach", prompt: "Write a cold outreach email to a startup founder introducing CreedaVA's virtual assistant services. Friendly and concise." },
              { label: "Thank You", prompt: "Write a thank you email to a new client who just signed up for our virtual assistant services." },
            ]}
            onResult={(raw) => {
              try {
                const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```\s*$/g, "").trim();
                const result = JSON.parse(cleaned);
                setSelected(null);
                setForm({
                  subject: result.subject || "",
                  body: result.body || "",
                  previewText: result.previewText || "",
                  purpose: "",
                  status: "draft",
                  images: [],
                  attachments: [],
                });
                setModalOpen(true);
                toast("AI content loaded \u2014 edit and save when ready", "success");
              } catch {
                generateEmail(raw.slice(0, 200), "", "professional").then((r) => {
                  setSelected(null);
                  setForm({
                    subject: r.subject || "",
                    body: r.body || "",
                    previewText: r.previewText || "",
                    purpose: "",
                    status: "draft",
                    images: [],
                    attachments: [],
                  });
                  setModalOpen(true);
                  toast("AI content loaded \u2014 edit and save when ready", "success");
                }).catch(() => toast("AI generation failed", "error"));
              }
            }}
            buildPrompt={(input) =>
              `You are an email copywriter for CreedaVA, a virtual assistant services company.
Compose an email based on: "${input}"

Return ONLY valid JSON with:
- subject: email subject line
- previewText: short preview text (50-80 chars)
- body: full email body in HTML

No markdown fences.`
            }
          />
          <Button size="sm" onClick={() => openModal()}>
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Email
          </Button>
          </div>
        }
      />

      <AdminTabs tabs={tabs} defaultValue="all" onChange={setTab} />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(e) => e.id}
        onRowClick={(e) => openModal(e)}
        emptyMessage="No emails yet — compose one or let AI draft it"
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? `Edit: ${selected.subject}` : "New Email"}
        size="lg"
        footer={
          <>
            {selected && (
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            )}
            {selected?.status === "draft" && (
              <Button variant="outline" size="sm" onClick={handleMarkSent}>
                Mark Sent
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const subject = encodeURIComponent(form.subject);
                const body = encodeURIComponent(form.body.replace(/<[^>]*>/g, ""));
                window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, "_blank");
              }}
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              Gmail
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={saving}>
              {selected ? "Update" : "Save Draft"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
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
          <Input
            label="Purpose"
            placeholder="e.g. Follow-up after demo"
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          />
          <RichTextEditor
            label="Email Body"
            value={form.body}
            onChange={(val) => setForm({ ...form, body: val })}
            placeholder="Compose your email..."
            minHeight="200px"
          />

          {/* ── Images ──────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-50 uppercase tracking-wide">Images</label>
              <Button variant="outline" size="sm" onClick={() => emailImageRef.current?.click()} isLoading={uploading}>
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                Upload
              </Button>
              <input ref={emailImageRef} type="file" accept="image/*" multiple className="hidden" onChange={handleEmailImageUpload} />
            </div>
            {form.images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {form.images.map((url, i) => (
                  <div key={i} className="relative group w-full h-20">
                    <Image src={url} alt="" fill className="rounded-lg object-cover" />
                    <button
                      onClick={() => removeEmailImage(i)}
                      className="absolute top-1 right-1 bg-white/90 text-gray-60 rounded p-0.5 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-40">No images</p>
            )}
          </div>

          {/* ── Attachments ─────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-50 uppercase tracking-wide">Attachments</label>
              <Button variant="outline" size="sm" onClick={() => emailAttachRef.current?.click()} isLoading={uploading}>
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                Attach
              </Button>
              <input ref={emailAttachRef} type="file" multiple className="hidden" onChange={handleEmailAttachUpload} />
            </div>
            {form.attachments.length > 0 ? (
              <div className="space-y-1">
                {form.attachments.map((att, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-10 text-sm">
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 text-gray-70 hover:text-primary">
                      <svg className="w-4 h-4 text-gray-40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      <span className="truncate">{att.name}</span>
                    </a>
                    <button onClick={() => removeEmailAttachment(i)} className="text-gray-40 hover:text-red-500 shrink-0 ml-2">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-40">No attachments</p>
            )}
          </div>

          {/* ── Send section (edit mode, draft only) ── */}
          {selected?.status === "draft" && (
            <div className="border-t border-border pt-4">
              <label className="text-xs font-medium text-gray-50 uppercase tracking-wide">Send via Email</label>
              <div className="space-y-3 mt-2">
                {aliases.length > 1 && (
                  <Select
                    label="From Address"
                    options={aliases}
                    value={sender || aliases[0]?.value}
                    onChange={(e) => setSender(e.target.value)}
                  />
                )}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="recipient@example.com"
                    type="email"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleSendEmail} isLoading={sending}>
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    Send
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-40 mt-1">Sends via SMTP configured in Settings &rarr; Integrations</p>
              <div className="mt-3 pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  Bulk Send to Multiple
                </Button>
              </div>
            </div>
          )}
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
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-70">
          Delete this email draft? This cannot be undone.
        </p>
      </Modal>

      {/* Bulk Send Modal */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Send Email"
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleBulkSend} isLoading={bulkSending}>
              Send to All
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-70">
            Sending: <strong>{selected?.subject}</strong>
          </p>
          <div>
            <label className="text-xs font-medium text-gray-50 uppercase tracking-wide">Recipients</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-80 placeholder:text-gray-40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              rows={4}
              placeholder={"email1@example.com\nemail2@example.com\nemail3@example.com"}
              value={bulkRecipients}
              onChange={(e) => setBulkRecipients(e.target.value)}
            />
            <p className="text-xs text-gray-40 mt-1">One email per line, or separate with commas</p>
          </div>
          <p className="text-xs text-gray-50">
            {bulkRecipients.split(/[,;\n]+/).map((e) => e.trim()).filter(Boolean).length} recipient(s)
          </p>
        </div>
      </Modal>
    </div>
  );
}
