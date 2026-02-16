/**
 * Webhook handlers — receives data from external forms and services.
 *
 * Currently handles:
 * - Google Forms (via Apps Script webhook)
 * - Generic contact/booking form submissions
 */

import { onRequest } from "firebase-functions/v2/https";
import { db } from "./admin";
import cors from "cors";

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
              source: "form-webhook",
              tags: ["form-submission"],
              createdAt: new Date(),
            });
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
