/**
 * Firestore Triggers — automatic sync between Firestore and Google services.
 *
 * These fire automatically when documents are created/updated in Firestore,
 * ensuring data flows both ways between the admin CRM and Google APIs.
 *
 * - New lead → notification email to admin
 * - New contact form → notification email + booking suggestion
 * - Email draft status "queued" → auto-send via SMTP
 * - Customer status change → update Google Sheets export
 */

import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { db, getIntegrationConfig, getEmailTransport as getTransport } from "./admin";

// ─── New Lead Notification ───────────────────────────
// Sends an email to admin when a new lead is captured

export const onNewLead = onDocumentCreated(
  { document: "leads/{leadId}", region: "us-east4" },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    try {
      const transport = await getTransport();
      if (!transport) return;

      const emailConfig = await getIntegrationConfig("email");
      const adminEmail = emailConfig?.config.user || "admin@creedava.com";

      await transport.sendMail({
        from: `"CreedaVA CRM" <${adminEmail}>`,
        to: adminEmail,
        subject: `🔔 New Lead: ${data.name || data.email || "Unknown"}`,
        html: `
          <div style="font-family: Roboto, sans-serif; max-width: 500px;">
            <div style="background: #005148; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0; font-size: 16px;">New Lead Captured</h2>
            </div>
            <div style="padding: 16px; background: #f9fbff; border: 1px solid #e0e8f5; border-top: none; border-radius: 0 0 8px 8px;">
              <table style="width: 100%;">
                <tr><td style="padding: 6px; color: #666;">Name</td><td style="padding: 6px; font-weight: bold;">${data.name || "—"}</td></tr>
                <tr><td style="padding: 6px; color: #666;">Email</td><td style="padding: 6px; font-weight: bold;">${data.email || "—"}</td></tr>
                <tr><td style="padding: 6px; color: #666;">Phone</td><td style="padding: 6px; font-weight: bold;">${data.phone || "—"}</td></tr>
                <tr><td style="padding: 6px; color: #666;">Source</td><td style="padding: 6px;">${data.source || "website"}</td></tr>
                <tr><td style="padding: 6px; color: #666;">Value</td><td style="padding: 6px;">$${data.value?.toLocaleString() || "0"}</td></tr>
                ${data.notes ? `<tr><td style="padding: 6px; color: #666;">Notes</td><td style="padding: 6px;">${data.notes}</td></tr>` : ""}
              </table>
              <div style="margin-top: 12px;">
                <a href="https://creedava.com/admin/leads" style="display: inline-block; background: #005148; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px;">View in CRM →</a>
              </div>
            </div>
          </div>
        `,
      });

      // Mark notification sent
      await event.data?.ref.update({ notificationSent: true });
      console.log(`Lead notification sent for ${event.params.leadId}`);
    } catch (err) {
      console.error("Lead notification failed:", err);
    }
  },
);

// ─── New Contact Form Submission ─────────────────────
// Sends admin notification + auto-reply to the contact

export const onNewContact = onDocumentCreated(
  { document: "contacts/{contactId}", region: "us-east4" },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    try {
      const transport = await getTransport();
      if (!transport) return;

      const emailConfig = await getIntegrationConfig("email");
      const adminEmail = emailConfig?.config.user || "admin@creedava.com";

      // 1) Notify admin
      await transport.sendMail({
        from: `"CreedaVA CRM" <${adminEmail}>`,
        to: adminEmail,
        subject: `📩 Contact Form: ${data.name || data.email}`,
        html: `
          <div style="font-family: Roboto, sans-serif; max-width: 500px;">
            <div style="background: #0B2135; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0; font-size: 16px;">New Contact Form Submission</h2>
            </div>
            <div style="padding: 16px; background: #f9fbff; border: 1px solid #e0e8f5; border-radius: 0 0 8px 8px;">
              <p><strong>${data.name}</strong> — ${data.email}</p>
              ${data.phone ? `<p>Phone: ${data.phone}</p>` : ""}
              <p style="white-space: pre-line; background: white; padding: 12px; border-radius: 6px; border: 1px solid #eee;">${data.message || data.notes || "No message"}</p>
              <a href="https://creedava.com/admin/contacts" style="display: inline-block; margin-top: 8px; background: #0B2135; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px;">View in CRM →</a>
            </div>
          </div>
        `,
      });

      // 2) Auto-reply to the person who submitted
      if (data.email) {
        await transport.sendMail({
          from: `"CreedaVA" <${adminEmail}>`,
          to: data.email,
          subject: "Thank you for contacting CreedaVA!",
          html: `
            <div style="font-family: Roboto, sans-serif; max-width: 500px;">
              <div style="background: #005148; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 20px;">Thank You, ${data.name || "there"}!</h1>
              </div>
              <div style="padding: 20px; background: #f9fbff; border: 1px solid #e0e8f5; border-radius: 0 0 8px 8px;">
                <p>We&apos;ve received your message and will get back to you within 24 hours.</p>
                <p>In the meantime, feel free to explore our <a href="https://creedava.com/services" style="color: #005148;">services</a> or <a href="https://creedava.com/pricing" style="color: #005148;">pricing</a>.</p>
                <p style="color: #666; margin-top: 16px;">Best regards,<br><strong>The CreedaVA Team</strong></p>
              </div>
            </div>
          `,
        });
      }

      await event.data?.ref.update({ notificationSent: true, autoReplied: !!data.email });
      console.log(`Contact notification + auto-reply for ${event.params.contactId}`);
    } catch (err) {
      console.error("Contact notification failed:", err);
    }
  },
);

// ─── Email Auto-Send on "queued" Status ──────────────
// When an email draft is updated to status "queued", auto-send it

export const onEmailQueued = onDocumentUpdated(
  { document: "emails/{emailId}", region: "us-east4" },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    // Only fire when status changes to "queued"
    if (before.status === after.status || after.status !== "queued") return;
    if (!after.recipientEmail || !after.subject || !after.body) return;

    try {
      const transport = await getTransport();
      if (!transport) {
        await event.data?.after?.ref.update({
          status: "draft",
          sendError: "Email SMTP not configured",
        });
        return;
      }

      const emailConfig = await getIntegrationConfig("email");
      const fromEmail = emailConfig?.config.user || "admin@creedava.com";

      const result = await transport.sendMail({
        from: `"CreedaVA" <${fromEmail}>`,
        to: after.recipientEmail,
        subject: after.subject,
        html: after.body,
      });

      await event.data?.after?.ref.update({
        status: "sent",
        sentAt: new Date(),
        messageId: result.messageId,
      });

      // Log to email-log
      await db.collection("email-log").add({
        to: after.recipientEmail,
        subject: after.subject,
        status: "sent",
        messageId: result.messageId,
        sentAt: new Date(),
        source: "auto-send-trigger",
      });

      console.log(`Email ${event.params.emailId} auto-sent to ${after.recipientEmail}`);
    } catch (err) {
      console.error("Email auto-send failed:", err);
      await event.data?.after?.ref.update({
        status: "failed",
        sendError: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
);

// ─── Booking Confirmation Email ──────────────────────
// Auto-send a confirmation email when a booking is confirmed

export const onBookingConfirmed = onDocumentUpdated(
  { document: "bookings/{bookingId}", region: "us-east4" },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    // Only fire when status changes TO "confirmed"
    if (before.status === after.status || after.status !== "confirmed") return;
    if (!after.email) return;

    try {
      const transport = await getTransport();
      if (!transport) return;

      const emailConfig = await getIntegrationConfig("email");
      const adminEmail = emailConfig?.config.user || "admin@creedava.com";
      const dateStr = after.date
        ? new Date(after.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
        : "TBD";

      await transport.sendMail({
        from: `"CreedaVA" <${adminEmail}>`,
        to: after.email,
        subject: `Booking Confirmed — ${after.service} on ${dateStr}`,
        html: `
          <div style="font-family: Roboto, sans-serif; max-width: 500px;">
            <div style="background: #005148; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 20px;">Booking Confirmed ✓</h1>
            </div>
            <div style="padding: 20px; background: #f9fbff; border: 1px solid #e0e8f5; border-radius: 0 0 8px 8px;">
              <p>Hi ${after.name},</p>
              <p>Your booking has been confirmed:</p>
              <table style="width: 100%; margin: 12px 0;">
                <tr><td style="padding: 6px; color: #666;">Service</td><td style="padding: 6px; font-weight: bold;">${after.service}</td></tr>
                <tr><td style="padding: 6px; color: #666;">Date</td><td style="padding: 6px; font-weight: bold;">${dateStr}</td></tr>
                <tr><td style="padding: 6px; color: #666;">Time</td><td style="padding: 6px; font-weight: bold;">${after.time || "TBD"}</td></tr>
              </table>
              ${after.googleCalendarLink ? `<p><a href="${after.googleCalendarLink}" style="color: #005148;">View in Google Calendar →</a></p>` : ""}
              <p style="margin-top: 16px; color: #666;">If you need to reschedule, reply to this email or contact us.</p>
              <p style="color: #666;">Best regards,<br><strong>The CreedaVA Team</strong></p>
            </div>
          </div>
        `,
      });

      await event.data?.after?.ref.update({ confirmationEmailSent: true });
      console.log(`Booking confirmation email sent for ${event.params.bookingId}`);
    } catch (err) {
      console.error("Booking confirmation email failed:", err);
    }
  },
);
