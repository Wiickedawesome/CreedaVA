/**
 * Email Cloud Function — sends emails using SMTP (Gmail, Outlook, etc.)
 * or can be swapped for SendGrid/Resend API.
 *
 * Config stored in Firestore: integrations/email
 * {
 *   enabled: true,
 *   provider: "smtp" | "sendgrid" | "resend",
 *   config: {
 *     // SMTP
 *     host: "smtp.gmail.com",
 *     port: "587",
 *     user: "admin@creedava.com",
 *     pass: "app-password",
 *     // SendGrid
 *     apiKey: "SG.xxx",
 *     // Resend
 *     apiKey: "re_xxx",
 *   }
 * }
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, getIntegrationConfig, getEmailTransport, verifyAdminEmail } from "./admin";

// ─── Types ───────────────────────────────────────────

interface SendEmailRequest {
  to: string;
  from?: string;
  subject: string;
  html: string;
  replyTo?: string;
  cc?: string;
  bcc?: string;
  // If provided, save a copy to Firestore
  saveToCollection?: string;
}

interface BulkEmailRequest {
  recipients: string[];
  subject: string;
  html: string;
  replyTo?: string;
}

// ─── SMTP Transport ──────────────────────────────────

/** Thin wrapper that throws an HttpsError on missing/disabled config. */
async function getTransport() {
  const transport = await getEmailTransport();
  if (!transport) {
    throw new HttpsError("failed-precondition", "Email integration not enabled. Configure in Admin → Integrations.");
  }
  return transport;
}

// ─── Send Single Email ──────────────────────────────

export const sendEmail = onCall(
  { region: "us-east4", memory: "256MiB", ingressSettings: "ALLOW_INTERNAL_AND_GCLB" },
  async (request) => {
    // Verify auth
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }
    verifyAdminEmail(request.auth.token.email);

    const data = request.data as SendEmailRequest;
    if (!data.to || !data.subject || !data.html) {
      throw new HttpsError("invalid-argument", "Missing: to, subject, html");
    }

    const transport = await getTransport();
    const integration = await getIntegrationConfig("email");
    
    // Determine 'from' address
    let sentFrom = integration?.config.user || "admin@creedava.com";
    if (data.from) {
      const aliases = (integration?.config.aliases || "").split(",").map((s: string) => s.trim().toLowerCase());
      if (aliases.includes(data.from.toLowerCase()) || data.from.toLowerCase() === integration?.config.user?.toLowerCase()) {
        sentFrom = data.from;
      }
    } else if (integration?.config.fromEmail) {
      // Backwards compatibility
      sentFrom = integration.config.fromEmail;
    }

    const result = await transport.sendMail({
      from: `"CreedaVA" <${sentFrom}>`,
      to: data.to,
      subject: data.subject,
      html: data.html,
      replyTo: data.replyTo,
      cc: data.cc,
      bcc: data.bcc,
    });

    // Log to Firestore
    await db.collection("email-log").add({
      to: data.to,
      subject: data.subject,
      status: "sent",
      messageId: result.messageId,
      sentAt: new Date(),
      sentBy: request.auth.token.email,
    });

    // Mark related email draft as sent if saveToCollection ID was provided
    if (data.saveToCollection) {
      try {
        const docRef = db.collection("emails").doc(data.saveToCollection);
        await docRef.update({ status: "sent", sentAt: new Date(), messageId: result.messageId });
      } catch { /* doc may not exist — ignore */ }
    }

    return { success: true, messageId: result.messageId };
  },
);

// ─── Send Bulk Email ─────────────────────────────────

export const sendBulkEmail = onCall(
  { region: "us-east4", memory: "512MiB", timeoutSeconds: 300, ingressSettings: "ALLOW_INTERNAL_AND_GCLB" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }
    if (!request.auth.token.email?.endsWith("@creedava.com")) {
      throw new HttpsError("permission-denied", "Must be @creedava.com");
    }

    const data = request.data as BulkEmailRequest;
    if (!data.recipients?.length || !data.subject || !data.html) {
      throw new HttpsError("invalid-argument", "Missing: recipients, subject, html");
    }

    const transport = await getTransport();
    const integration = await getIntegrationConfig("email");
    const fromEmail = integration?.config.user || "admin@creedava.com";

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const recipient of data.recipients) {
      try {
        await transport.sendMail({
          from: `"CreedaVA" <${fromEmail}>`,
          to: recipient,
          subject: data.subject,
          html: data.html,
          replyTo: data.replyTo,
        });
        results.push({ email: recipient, success: true });
      } catch (err) {
        results.push({
          email: recipient,
          success: false,
          error: err instanceof Error ? err.message : "Failed",
        });
      }
    }

    // Log bulk send
    await db.collection("email-log").add({
      type: "bulk",
      totalRecipients: data.recipients.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      subject: data.subject,
      sentAt: new Date(),
      sentBy: request.auth.token.email,
    });

    return {
      success: true,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      details: results,
    };
  },
);
