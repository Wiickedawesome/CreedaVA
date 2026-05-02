/**
 * Outreach send-on-approval trigger.
 *
 * When a /outreach-emails doc transitions status → "approved", send the
 * email via the configured SMTP transport, then flip status to "sent" and
 * record sentAt + messageId. All outcomes are logged to /ai-activity-log.
 */

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db, getEmailTransport, getIntegrationConfig } from "../admin";

interface OutreachEmailDoc {
  status?: string;
  subject?: string;
  body?: string;
  targetUrl?: string;
  targetDomain?: string;
  toEmail?: string;
  approvedBy?: string;
  sentAt?: unknown;
  messageId?: string;
}

export const onOutreachEmailApproved = onDocumentUpdated(
  { document: "outreach-emails/{emailId}", region: "us-east4" },
  async (event) => {
    const before = event.data?.before.data() as OutreachEmailDoc | undefined;
    const after = event.data?.after.data() as OutreachEmailDoc | undefined;
    if (!after) return;
    if (before?.status === after.status) return;
    if (after.status !== "approved") return;
    if (!after.toEmail) {
      await event.data!.after.ref.set(
        { status: "needs-recipient", error: "Missing toEmail", updatedAt: new Date() },
        { merge: true },
      );
      return;
    }
    if (!after.subject || !after.body) {
      await event.data!.after.ref.set(
        { status: "error", error: "Missing subject/body", updatedAt: new Date() },
        { merge: true },
      );
      return;
    }

    try {
      const transport = await getEmailTransport();
      if (!transport) {
        await event.data!.after.ref.set(
          { status: "error", error: "Email integration not enabled", updatedAt: new Date() },
          { merge: true },
        );
        return;
      }
      const integration = await getIntegrationConfig("email");
      const fromEmail = integration?.config.user || "admin@creedava.com";
      const html = bodyToHtml(after.body);

      const result = await transport.sendMail({
        from: `"CreedaVA" <${fromEmail}>`,
        to: after.toEmail,
        subject: after.subject,
        html,
        replyTo: fromEmail,
      });

      await event.data!.after.ref.set(
        {
          status: "sent",
          sentAt: new Date(),
          messageId: result.messageId,
          error: null,
          updatedAt: new Date(),
        },
        { merge: true },
      );

      await db.collection("ai-activity-log").add({
        kind: "auto-action",
        action: "outreach-email-sent",
        target: `outreach-emails/${event.params.emailId}`,
        before: { status: before?.status ?? null },
        after: {
          status: "sent",
          to: after.toEmail,
          targetDomain: after.targetDomain ?? null,
          messageId: result.messageId,
        },
        risk: "destructive",
        createdAt: new Date(),
      });

      await db.collection("email-log").add({
        type: "outreach",
        to: after.toEmail,
        subject: after.subject,
        status: "sent",
        messageId: result.messageId,
        targetDomain: after.targetDomain ?? null,
        sentAt: new Date(),
        sentBy: after.approvedBy ?? "seo-agent",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await event.data!.after.ref.set(
        { status: "error", error: message, updatedAt: new Date() },
        { merge: true },
      );
      await db.collection("ai-activity-log").add({
        kind: "auto-action",
        action: "outreach-email-failed",
        target: `outreach-emails/${event.params.emailId}`,
        before: { status: before?.status ?? null },
        after: { status: "error", error: message },
        risk: "destructive",
        createdAt: new Date(),
      });
    }
  },
);

function bodyToHtml(body: string): string {
  // If it already looks like HTML, pass through. Otherwise convert plain
  // text with paragraph + line breaks.
  if (/<\/?(p|div|br|html|body)/i.test(body)) return body;
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}
