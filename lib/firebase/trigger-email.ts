/**
 * Firebase Trigger Email Extension helper.
 *
 * Instead of calling Cloud Functions directly to send emails, you can
 * write a document to the "mail" Firestore collection and the
 * Trigger Email extension sends it automatically.
 *
 * Prerequisites:
 *   1. Install the "Trigger Email from Firestore" extension in Firebase Console
 *   2. Configure it with your SMTP credentials (same Nodemailer config)
 *   3. Set the collection to "mail"
 *
 * Benefits over direct Cloud Functions:
 *   - Automatic retries on failure
 *   - Delivery status tracked in Firestore (pending → processing → success/error)
 *   - No cold-start latency — the extension manages its own function
 *   - Audit trail of all sent emails
 *
 * @see https://extensions.dev/extensions/firebase/firestore-send-email
 */

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

const MAIL_COLLECTION = "mail";

interface EmailAttachment {
  filename: string;
  content?: string;
  path?: string;
  encoding?: string;
}

interface TriggerEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
  /** Optional headers for tracking */
  headers?: Record<string, string>;
}

/**
 * Queue an email for sending via the Trigger Email extension.
 * Creates a document in the "mail" collection which the extension picks up.
 *
 * @returns The Firestore document ID for tracking delivery status.
 *
 * @example
 * await queueEmail({
 *   to: "client@example.com",
 *   subject: "Welcome to CreedaVA!",
 *   html: "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
 * });
 */
export async function queueEmail(options: TriggerEmailOptions): Promise<string> {
  const docRef = await addDoc(collection(db, MAIL_COLLECTION), {
    to: Array.isArray(options.to) ? options.to : [options.to],
    message: {
      subject: options.subject,
      html: options.html,
      ...(options.text ? { text: options.text } : {}),
      ...(options.attachments ? { attachments: options.attachments } : {}),
      ...(options.headers ? { headers: options.headers } : {}),
    },
    ...(options.cc ? { cc: Array.isArray(options.cc) ? options.cc : [options.cc] } : {}),
    ...(options.bcc ? { bcc: Array.isArray(options.bcc) ? options.bcc : [options.bcc] } : {}),
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Queue a templated email. Useful for common email types with consistent formatting.
 */
export async function queueTemplateEmail(
  template: "welcome" | "booking-confirmation" | "lead-followup" | "survey-invite",
  to: string,
  data: Record<string, string>,
): Promise<string> {
  const templates: Record<string, { subject: string; html: (d: Record<string, string>) => string }> = {
    welcome: {
      subject: "Welcome to CreedaVA!",
      html: (d) => `
        <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #005148; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to CreedaVA</h1>
          </div>
          <div style="padding: 32px; background: #F9FBFF;">
            <p>Hi ${d.name || "there"},</p>
            <p>Thank you for reaching out to CreedaVA! We&apos;re excited to help you save time and scale your operations with our virtual assistant services.</p>
            <p>A member of our team will be in touch shortly to discuss your needs.</p>
            <p style="margin-top: 24px;">
              <a href="https://creedava.com/services" style="background: #005148; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View Our Services</a>
            </p>
          </div>
          <div style="padding: 16px; text-align: center; color: #666; font-size: 12px;">
            <p>&copy; CreedaVA. All rights reserved.</p>
          </div>
        </div>`,
    },
    "booking-confirmation": {
      subject: `Booking Confirmed — ${data.date || ""}`,
      html: (d) => `
        <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #005148; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0;">Booking Confirmed</h1>
          </div>
          <div style="padding: 32px; background: #F9FBFF;">
            <p>Hi ${d.name || "there"},</p>
            <p>Your booking has been confirmed for <strong>${d.date || "the scheduled date"}</strong> at <strong>${d.time || "the scheduled time"}</strong>.</p>
            ${d.notes ? `<p><em>Notes: ${d.notes}</em></p>` : ""}
            <p>If you need to reschedule, please contact us at <a href="https://creedava.com/contact">creedava.com/contact</a>.</p>
          </div>
        </div>`,
    },
    "lead-followup": {
      subject: "Following Up — CreedaVA",
      html: (d) => `
        <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #005148; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0;">Just Checking In</h1>
          </div>
          <div style="padding: 32px; background: #F9FBFF;">
            <p>Hi ${d.name || "there"},</p>
            <p>We wanted to follow up on your inquiry about our virtual assistant services. We&apos;d love to help you streamline your operations.</p>
            <p>Would you like to schedule a quick call to discuss your needs?</p>
            <p style="margin-top: 24px;">
              <a href="https://creedava.com/contact" style="background: #005148; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Schedule a Call</a>
            </p>
          </div>
        </div>`,
    },
    "survey-invite": {
      subject: "How did we do? — CreedaVA",
      html: (d) => `
        <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #005148; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0;">We Value Your Feedback</h1>
          </div>
          <div style="padding: 32px; background: #F9FBFF;">
            <p>Hi ${d.name || "there"},</p>
            <p>We&apos;d love to hear about your experience with CreedaVA. Your feedback helps us improve our services.</p>
            <p style="margin-top: 24px;">
              <a href="https://creedava.com/satisfaction${d.token ? `?token=${d.token}` : ""}" style="background: #005148; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Take Survey (2 min)</a>
            </p>
          </div>
        </div>`,
    },
  };

  const tmpl = templates[template];
  if (!tmpl) throw new Error(`Unknown email template: ${template}`);

  return queueEmail({
    to,
    subject: tmpl.subject,
    html: tmpl.html(data),
  });
}
