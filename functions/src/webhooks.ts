/**
 * Webhook handlers — receives data from external forms and services.
 *
 * Currently handles:
 * - Google Forms (via Apps Script webhook)
 * - Generic contact/booking form submissions
 */

import { onRequest } from "firebase-functions/v2/https";
import { db, getIntegrationConfig, getEmailTransport } from "./admin";
import cors from "cors";
import * as admin from "firebase-admin";

type FormType = "contact" | "booking" | "lead";

type ContactPayload = {
  formType: "contact";
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  notifyEmail?: string;
  source?: string;
};

type BookingPayload = {
  formType: "booking";
  name: string;
  email: string;
  phone?: string;
  service: string;
  date?: string;
  time?: string;
  notes?: string;
  source?: string;
};

type LeadPayload = {
  formType: "lead";
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  source?: string;
  value?: string | number;
  notifyEmail?: string;
  pageTitle?: string;
};

type WebhookPayload = ContactPayload | BookingPayload | LeadPayload;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^[\d+()\-\s.]{7,30}$/;
const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 40;
const requestWindow = new Map<string, { count: number; resetAt: number }>();
const APP_CHECK_HEADER = "x-firebase-appcheck";

function clean(input: unknown, max = 1000): string {
  return typeof input === "string" ? input.trim().slice(0, max) : "";
}

function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getClientIp(req: Parameters<typeof corsHandler>[0]): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const existing = requestWindow.get(ip);

  if (!existing || now >= existing.resetAt) {
    requestWindow.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  existing.count += 1;
  return existing.count > RATE_LIMIT_MAX;
}

async function verifyAppCheckToken(req: Parameters<typeof corsHandler>[0]): Promise<boolean> {
  // Skip strict App Check in emulator unless explicitly forced.
  if (process.env.FUNCTIONS_EMULATOR === "true") return true;
  if (process.env.APP_CHECK_REQUIRED === "false") return true;

  const header = req.headers[APP_CHECK_HEADER];
  const token = Array.isArray(header) ? header[0] : header;

  // Best-effort: if no token is provided, allow the request.
  // Public endpoints (contact form, booking, etc.) rely on rate limiting
  // for abuse protection. App Check is a bonus layer, not a gate.
  // Tokens may be absent when reCAPTCHA is blocked by ad blockers,
  // corporate firewalls, or browser privacy features (e.g. Firefox TCP).
  if (!token || typeof token !== "string") {
    console.warn("[App Check] No token provided — allowing request (best-effort mode)");
    return true;
  }

  try {
    await admin.appCheck().verifyToken(token);
    return true;
  } catch {
    // Token was provided but is invalid — reject to prevent spoofing.
    console.warn("[App Check] Invalid token provided — rejecting request");
    return false;
  }
}

function parseBookingDateTime(dateInput?: string, timeInput?: string): {
  date: string;
  time: string;
} {
  const dateRaw = clean(dateInput, 30);
  const timeRaw = clean(timeInput, 10);

  if (isoDateRe.test(dateRaw)) {
    return { date: dateRaw, time: timeRe.test(timeRaw) ? timeRaw : "09:00" };
  }

  if (dateRaw) {
    const parsed = new Date(dateRaw);
    if (!Number.isNaN(parsed.getTime())) {
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, "0");
      const dd = String(parsed.getDate()).padStart(2, "0");
      const hh = String(parsed.getHours()).padStart(2, "0");
      const mins = String(parsed.getMinutes()).padStart(2, "0");
      return {
        date: `${yyyy}-${mm}-${dd}`,
        time: timeRe.test(timeRaw) ? timeRaw : `${hh}:${mins}`,
      };
    }
  }

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: timeRe.test(timeRaw) ? timeRaw : "09:00" };
}

function validatePayload(input: unknown): { ok: true; data: WebhookPayload } | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Invalid payload" };
  }

  const raw = input as Record<string, unknown>;
  const formType = clean(raw.formType, 30) as FormType;

  if (!["contact", "booking", "lead"].includes(formType)) {
    return { ok: false, error: "Unsupported formType" };
  }

  const name = clean(raw.name, 200);
  const email = clean(raw.email, 320).toLowerCase();
  const phone = clean(raw.phone, 30);
  const source = clean(raw.source, 80);

  if (!name) return { ok: false, error: "Name is required" };
  if (!email || !isValidEmail(email)) return { ok: false, error: "Valid email is required" };
  if (phone && !phoneRe.test(phone)) return { ok: false, error: "Invalid phone format" };

  if (formType === "contact") {
    const message = clean(raw.message, 5000);
    if (!message) return { ok: false, error: "Message is required" };
    const payload: ContactPayload = {
      formType,
      name,
      email,
      phone,
      company: clean(raw.company, 200),
      message,
      notifyEmail: clean(raw.notifyEmail, 320),
      source,
    };
    return { ok: true, data: payload };
  }

  if (formType === "booking") {
    const service = clean(raw.service, 200);
    if (!service) return { ok: false, error: "Service is required" };
    const payload: BookingPayload = {
      formType,
      name,
      email,
      phone,
      service,
      date: clean(raw.date, 64),
      time: clean(raw.time, 10),
      notes: clean(raw.notes, 5000),
      source,
    };
    return { ok: true, data: payload };
  }

  const payload: LeadPayload = {
    formType,
    name,
    email,
    phone,
    company: clean(raw.company, 200),
    notes: clean(raw.notes, 5000),
    source,
    value:
      typeof raw.value === "number" || typeof raw.value === "string"
        ? raw.value
        : 0,
    notifyEmail: clean(raw.notifyEmail, 320),
    pageTitle: clean(raw.pageTitle, 200),
  };
  return { ok: true, data: payload };
}

/** Allow requests from the production domain, localhost (dev), and Firebase App Hosting / Hosting preview URLs. */
const corsHandler = cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      origin === "https://creedava.com" ||
      /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
      /\.hosted\.app$/.test(origin) ||
      /\.web\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
});

// ─── Google Forms / Generic Form Webhook ─────────────

export const handleFormWebhook = onRequest(
  { region: "us-east4", memory: "256MiB", timeoutSeconds: 30 },
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      try {
        const appCheckOk = await verifyAppCheckToken(req);
        if (!appCheckOk) {
          res.status(401).json({ error: "Missing or invalid App Check token" });
          return;
        }

        const ip = getClientIp(req);
        if (isRateLimited(ip)) {
          res.status(429).json({ error: "Too many requests. Please try again later." });
          return;
        }

        const webhookCfg = await getIntegrationConfig("webhooks");
        const configuredApiKey = webhookCfg?.config?.apiKey || "";
        const apiKeyHeader = req.headers["x-api-key"];
        const apiKey =
          typeof apiKeyHeader === "string"
            ? apiKeyHeader
            : typeof req.query.key === "string"
              ? req.query.key
              : "";

        if (configuredApiKey && apiKey !== configuredApiKey) {
          res.status(401).json({ error: "Invalid API key" });
          return;
        }

        const validation = validatePayload(req.body);
        if (!validation.ok) {
          res.status(400).json({ error: validation.error });
          return;
        }

        const data = validation.data;
        const formType = data.formType;

        // Route to appropriate collection based on form type
        switch (formType) {
          case "contact":
            await db.collection("contacts").add({
              name: data.name,
              email: data.email,
              phone: data.phone || "",
              company: data.company || "",
              notes: data.message || "",
              source: data.source || "form-webhook",
              tags: ["form-submission"],
              createdAt: new Date(),
            });

            // Send notification email
            if (data.notifyEmail) {
              try {
                const [transport, emailConfig] = await Promise.all([
                  getEmailTransport(),
                  getIntegrationConfig("email"),
                ]);
                if (transport) {
                  await transport.sendMail({
                    from: `"CreedaVA" <${emailConfig?.config.user || "admin@creedava.com"}>`,
                    to: data.notifyEmail,
                    replyTo: data.email || undefined,
                    subject: `New message from ${escapeHtml(data.name || "Contact Form")}`,
                    html: `
                      <h2>New Contact Form Submission</h2>
                      <p><strong>Name:</strong> ${escapeHtml(data.name || "—")}</p>
                      <p><strong>Email:</strong> ${escapeHtml(data.email || "—")}</p>
                      <p><strong>Company:</strong> ${escapeHtml(data.company || "—")}</p>
                      <p><strong>Message:</strong></p>
                      <blockquote style="border-left:3px solid #005148;padding-left:12px;color:#444;">${escapeHtml(data.message || "—")}</blockquote>
                      <hr/>
                      <p style="color:#888;font-size:12px;">View in <a href="https://creedava.com/admin/contacts">CRM Dashboard</a></p>
                    `,
                  });
                }
              } catch (emailErr) {
                console.error("Contact notification email failed:", emailErr);
              }
            }
            break;

          case "booking":
            {
              const slot = parseBookingDateTime(data.date, data.time);
            await db.collection("bookings").add({
              name: data.name,
              email: data.email,
              phone: data.phone || "",
              service: data.service || "General",
              date: slot.date,
              time: slot.time,
              status: "pending",
              notes: data.notes || "",
              source: "form-webhook",
              createdAt: new Date(),
            });
            }
            break;

          case "lead":
            await db.collection("leads").add({
              name: data.name,
              email: data.email,
              phone: data.phone || "",
              company: data.company || "",
              source: data.source || "form-webhook",
              status: "new",
              value: data.value ? Number(data.value) : 0,
              notes: data.notes || "",
              createdAt: new Date(),
            });

            // Send notification email if notifyEmail is specified (landing page forms)
            if (data.notifyEmail) {
              try {
                const [transport, emailConfig] = await Promise.all([
                  getEmailTransport(),
                  getIntegrationConfig("email"),
                ]);
                if (transport) {
                  await transport.sendMail({
                    from: `"CreedaVA" <${emailConfig?.config.user || "admin@creedava.com"}>`,
                    to: data.notifyEmail,
                    subject: `New lead from ${escapeHtml(data.pageTitle || "Landing Page")}`,
                    html: `
                      <h2>New Lead Submission</h2>
                      <p><strong>From:</strong> ${escapeHtml(data.pageTitle || "Landing Page")}</p>
                      <p><strong>Source:</strong> ${escapeHtml(data.source || "form-webhook")}</p>
                      <hr/>
                      <p><strong>Name:</strong> ${escapeHtml(data.name || "—")}</p>
                      <p><strong>Email:</strong> ${escapeHtml(data.email || "—")}</p>
                      <p><strong>Phone:</strong> ${escapeHtml(data.phone || "—")}</p>
                      <p><strong>Company:</strong> ${escapeHtml(data.company || "—")}</p>
                      <p><strong>Message:</strong> ${escapeHtml(data.notes || "—")}</p>
                      <hr/>
                      <p style="color:#888;font-size:12px;">View in <a href="https://creedava.com/admin/leads">CRM Dashboard</a></p>
                    `,
                  });
                }
              } catch (emailErr) {
                console.error("Lead notification email failed:", emailErr);
              }
            }
            break;

          default:
            // Store in a generic submissions collection
            await db.collection("form-submissions").add({
              formType,
              data,
              receivedAt: new Date(),
            });
        }

        res.status(200).json({
          success: true,
          message: `${formType} submission received`,
        });
      } catch (err) {
        console.error("Webhook error:", err);
        res.status(500).json({
          error: err instanceof Error ? err.message : "Internal error",
        });
      }
    });
  },
);
