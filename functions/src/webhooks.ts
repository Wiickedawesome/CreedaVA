/**
 * Webhook handlers — receives data from external forms and services.
 *
 * Currently handles:
 * - Google Forms (via Apps Script webhook)
 * - Generic contact/booking form submissions
 */

import { onRequest } from "firebase-functions/v2/https";
import { db, getIntegrationConfig } from "./admin";
import cors from "cors";
import * as nodemailer from "nodemailer";

const corsHandler = cors({ origin: true });

// ─── Google Forms / Generic Form Webhook ─────────────

export const handleFormWebhook = onRequest(
  { region: "us-east4" },
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      try {
        const data = req.body;
        const formType = data.formType || "contact";
        const apiKey = req.headers["x-api-key"] || req.query.key;

        // Optional: verify API key from integrations config
        if (apiKey) {
          const doc = await db.collection("integrations").doc("webhooks").get();
          const config = doc.data();
          if (config?.apiKey && config.apiKey !== apiKey) {
            res.status(401).json({ error: "Invalid API key" });
            return;
          }
        }

        // Route to appropriate collection based on form type
        switch (formType) {
          case "contact":
            await db.collection("contacts").add({
              name: data.name || "",
              email: data.email || "",
              phone: data.phone || "",
              company: data.company || "",
              notes: data.message || data.notes || "",
              source: data.source || "form-webhook",
              tags: ["form-submission"],
              createdAt: new Date(),
            });

            // Send notification email
            if (data.notifyEmail) {
              try {
                const emailConfig = await getIntegrationConfig("email");
                if (emailConfig?.enabled && emailConfig.config.user && emailConfig.config.pass) {
                  const transport = nodemailer.createTransport({
                    host: emailConfig.config.host || "smtp.gmail.com",
                    port: parseInt(emailConfig.config.port || "587"),
                    secure: emailConfig.config.port === "465",
                    auth: { user: emailConfig.config.user, pass: emailConfig.config.pass },
                  });
                  await transport.sendMail({
                    from: `"CreedaVA" <${emailConfig.config.user}>`,
                    to: data.notifyEmail,
                    replyTo: data.email || undefined,
                    subject: `New message from ${data.name || "Contact Form"}`,
                    html: `
                      <h2>New Contact Form Submission</h2>
                      <p><strong>Name:</strong> ${data.name || "—"}</p>
                      <p><strong>Email:</strong> ${data.email || "—"}</p>
                      <p><strong>Company:</strong> ${data.company || "—"}</p>
                      <p><strong>Message:</strong></p>
                      <blockquote style="border-left:3px solid #005148;padding-left:12px;color:#444;">${data.message || data.notes || "—"}</blockquote>
                      <hr/>
                      <p style="color:#888;font-size:12px;">View in <a href="https://creeda-va-host-creeda-va.us-east4.hosted.app/admin/contacts">CRM Dashboard</a></p>
                    `,
                  });
                }
              } catch (emailErr) {
                console.error("Contact notification email failed:", emailErr);
              }
            }
            break;

          case "booking":
            await db.collection("bookings").add({
              name: data.name || "",
              email: data.email || "",
              phone: data.phone || "",
              service: data.service || "General",
              date: data.date || new Date().toISOString(),
              time: data.time || "",
              status: "pending",
              notes: data.notes || "",
              source: "form-webhook",
              createdAt: new Date(),
            });
            break;

          case "lead":
            await db.collection("leads").add({
              name: data.name || "",
              email: data.email || "",
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
                const emailConfig = await getIntegrationConfig("email");
                if (emailConfig?.enabled && emailConfig.config.user && emailConfig.config.pass) {
                  const transport = nodemailer.createTransport({
                    host: emailConfig.config.host || "smtp.gmail.com",
                    port: parseInt(emailConfig.config.port || "587"),
                    secure: emailConfig.config.port === "465",
                    auth: {
                      user: emailConfig.config.user,
                      pass: emailConfig.config.pass,
                    },
                  });
                  await transport.sendMail({
                    from: `"CreedaVA" <${emailConfig.config.user}>`,
                    to: data.notifyEmail,
                    subject: `New lead from ${data.pageTitle || "Landing Page"}`,
                    html: `
                      <h2>New Lead Submission</h2>
                      <p><strong>From:</strong> ${data.pageTitle || "Landing Page"}</p>
                      <p><strong>Source:</strong> ${data.source || "form-webhook"}</p>
                      <hr/>
                      <p><strong>Name:</strong> ${data.name || "—"}</p>
                      <p><strong>Email:</strong> ${data.email || "—"}</p>
                      <p><strong>Phone:</strong> ${data.phone || "—"}</p>
                      <p><strong>Company:</strong> ${data.company || "—"}</p>
                      <p><strong>Message:</strong> ${data.notes || "—"}</p>
                      <hr/>
                      <p style="color:#888;font-size:12px;">View in <a href="https://creeda-va-host-creeda-va.us-east4.hosted.app/admin/leads">CRM Dashboard</a></p>
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
