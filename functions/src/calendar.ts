/**
 * Google Calendar Cloud Function — syncs bookings to Google Calendar.
 *
 * Requires a Google Cloud Service Account with Calendar API enabled.
 * The service account must be shared (delegated) to the target calendar.
 *
 * Config stored in Firestore: integrations/google-calendar
 * {
 *   enabled: true,
 *   config: {
 *     calendarId: "c_e686abbcbcc12442a9a588c639e5cfecd0ead1adf814a6a49dd94c6f55acd466@group.calendar.google.com",
 *     serviceAccountEmail: "calendar@creeda-va.iam.gserviceaccount.com",
 *     serviceAccountKey: "{ ... JSON key ... }",
 *   }
 * }
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { google, calendar_v3 } from "googleapis";
import { getIntegrationConfig } from "./admin";
import cors from "cors";
import * as admin from "firebase-admin";

const corsHandler = cors({ origin: true });
const APP_CHECK_HEADER = "x-firebase-appcheck";

async function verifyAppCheckToken(req: Parameters<typeof corsHandler>[0]): Promise<boolean> {
  // App Check is best-effort — never block calendar/booking requests.
  // Token failures are logged only; rate limiting provides abuse protection.
  const header = req.headers[APP_CHECK_HEADER];
  const token = Array.isArray(header) ? header[0] : header;

  if (!token || typeof token !== "string") {
    console.warn("[App Check] No token provided — allowing (best-effort)");
    return true;
  }

  try {
    await admin.appCheck().verifyToken(token);
    return true;
  } catch {
    console.warn("[App Check] Token validation failed — allowing (best-effort)");
    return true;
  }
}

// ─── Auth helper ─────────────────────────────────────

async function getCalendarClient(): Promise<{
  calendar: calendar_v3.Calendar;
  calendarId: string;
}> {
  const integration = await getIntegrationConfig("google-calendar");
  if (!integration || !integration.enabled) {
    throw new HttpsError(
      "failed-precondition",
      "Google Calendar integration not enabled. Configure in Admin → Integrations.",
    );
  }

  const { config } = integration;
  let authClient;

  if (config.serviceAccountKey) {
    // Service account JSON key
    const key = JSON.parse(config.serviceAccountKey);
    authClient = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
  } else {
    // Application Default Credentials (Cloud Functions environment)
    authClient = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
  }

  const calendar = google.calendar({ version: "v3", auth: authClient });
  const calendarId = config.calendarId || "c_e686abbcbcc12442a9a588c639e5cfecd0ead1adf814a6a49dd94c6f55acd466@group.calendar.google.com";

  return { calendar, calendarId };
}

// ─── Booking → Calendar Event mapper ─────────────────

interface BookingData {
  name: string;
  email: string;
  phone?: string;
  service: string;
  date: string;
  time?: string;
  status: string;
  notes?: string;
}

function bookingToEvent(booking: BookingData): calendar_v3.Schema$Event {
  const startDate = new Date(booking.date);
  if (booking.time) {
    const [hours, minutes] = booking.time.split(":").map(Number);
    startDate.setHours(hours || 9, minutes || 0, 0, 0);
  } else {
    startDate.setHours(9, 0, 0, 0);
  }
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour

  return {
    summary: `[CreedaVA] ${booking.service} — ${booking.name}`,
    description: [
      `Service: ${booking.service}`,
      `Client: ${booking.name}`,
      `Email: ${booking.email}`,
      booking.phone ? `Phone: ${booking.phone}` : "",
      booking.notes ? `Notes: ${booking.notes}` : "",
      `Status: ${booking.status}`,
    ]
      .filter(Boolean)
      .join("\n"),
    start: {
      dateTime: startDate.toISOString(),
      timeZone: "America/Belize",
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: "America/Belize",
    },
    attendees: [{ email: booking.email, displayName: booking.name }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
    colorId: booking.status === "confirmed" ? "2" : "5", // green for confirmed, yellow for pending
  };
}

// ─── Auto-sync on booking creation ───────────────────

export const syncBookingToCalendar = onDocumentCreated(
  { document: "bookings/{bookingId}", region: "us-east4" },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const booking = snapshot.data() as BookingData;

    try {
      const { calendar, calendarId } = await getCalendarClient();
      const calendarEvent = bookingToEvent(booking);

      const result = await calendar.events.insert({
        calendarId,
        requestBody: calendarEvent,
        sendUpdates: "all", // Notify attendees
      });

      // Store the Google Calendar event ID back in Firestore
      await snapshot.ref.update({
        googleCalendarEventId: result.data.id,
        googleCalendarLink: result.data.htmlLink,
        syncedToCalendar: true,
      });

      console.log(`Booking ${event.params.bookingId} synced to Calendar: ${result.data.id}`);
    } catch (err) {
      console.error("Calendar sync failed:", err);
      await snapshot.ref.update({
        syncedToCalendar: false,
        calendarSyncError: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
);

// ─── Update calendar event when booking changes ──────

export const updateCalendarOnBookingChange = onDocumentUpdated(
  { document: "bookings/{bookingId}", region: "us-east4" },
  async (event) => {
    const after = event.data?.after?.data() as BookingData & {
      googleCalendarEventId?: string;
    };
    if (!after?.googleCalendarEventId) return;

    try {
      const { calendar, calendarId } = await getCalendarClient();
      const calendarEvent = bookingToEvent(after);

      if (after.status === "cancelled") {
        // Cancel the calendar event
        await calendar.events.delete({
          calendarId,
          eventId: after.googleCalendarEventId,
          sendUpdates: "all",
        });
      } else {
        // Update the calendar event
        await calendar.events.update({
          calendarId,
          eventId: after.googleCalendarEventId,
          requestBody: calendarEvent,
          sendUpdates: "all",
        });
      }
    } catch (err) {
      console.error("Calendar update failed:", err);
    }
  },
);

// ─── List upcoming calendar events (callable) ────────

export const listCalendarEvents = onCall(
  { region: "us-east4" },
  async (request) => {
    if (!request.auth?.token.email?.endsWith("@creedava.com")) {
      throw new HttpsError("permission-denied", "Must be @creedava.com");
    }

    const { calendar, calendarId } = await getCalendarClient();
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const result = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: twoWeeksFromNow.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 50,
    });

    return {
      events: (result.data.items || []).map((e) => ({
        id: e.id,
        summary: e.summary,
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        description: e.description,
        link: e.htmlLink,
        status: e.status,
        attendees: e.attendees?.map((a) => ({
          email: a.email,
          name: a.displayName,
          response: a.responseStatus,
        })),
      })),
    };
  },
);

// ─── Public: Get available booking slots ─────────────

export const getAvailableSlots = onRequest(
  { region: "us-east4" },
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      const appCheckOk = await verifyAppCheckToken(req);
      if (!appCheckOk) {
        res.status(401).json({ error: "Missing or invalid App Check token" });
        return;
      }

      try {
        let calendarClient: Awaited<ReturnType<typeof getCalendarClient>> | null = null;
        try {
          calendarClient = await getCalendarClient();
        } catch (integrationErr) {
          // Google Calendar not configured — return generic weekday slots so
          // booking always works. Bookings still land in Firestore.
          console.warn("[Calendar] Integration not configured, returning fallback slots:", integrationErr);
          const fallbackSlots: { date: string; time: string; available: boolean }[] = [];
          const cur = new Date();
          cur.setHours(0, 0, 0, 0);
          cur.setDate(cur.getDate() + 1);
          const nowTs = Date.now();
          for (let d = 0; d < 60 && fallbackSlots.length < 300; d++) {
            const dow = cur.getDay();
            if (dow >= 1 && dow <= 5) {
              for (let h = 9; h < 17; h++) {
                const slotStart = new Date(cur);
                slotStart.setHours(h, 0, 0, 0);
                if (slotStart.getTime() > nowTs) {
                  const yyyy = cur.getFullYear();
                  const mm = String(cur.getMonth() + 1).padStart(2, "0");
                  const dd = String(cur.getDate()).padStart(2, "0");
                  fallbackSlots.push({ date: `${yyyy}-${mm}-${dd}`, time: `${String(h).padStart(2, "0")}:00`, available: true });
                }
              }
            }
            cur.setDate(cur.getDate() + 1);
          }
          res.status(200).json({ slots: fallbackSlots, fallback: true });
          return;
        }

        const { calendar, calendarId } = calendarClient;

        // Look 60 days ahead
        const now = new Date();
        const endDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

        const busyRes = await calendar.freebusy.query({
          requestBody: {
            timeMin: now.toISOString(),
            timeMax: endDate.toISOString(),
            timeZone: "America/Belize",
            items: [{ id: calendarId }],
          },
        });

        const busySlots = busyRes.data.calendars?.[calendarId]?.busy || [];

        // Generate available 1-hour slots (Mon-Fri 9am-5pm Belize time)
        const slots: { date: string; time: string; available: boolean }[] = [];
        const cursor = new Date(now);
        cursor.setHours(0, 0, 0, 0);
        // Move to next day
        cursor.setDate(cursor.getDate() + 1);

        for (let d = 0; d < 60; d++) {
          const day = cursor.getDay();
          if (day >= 1 && day <= 5) { // Mon-Fri
            for (let hour = 9; hour < 17; hour++) {
              const slotStart = new Date(cursor);
              slotStart.setHours(hour, 0, 0, 0);
              const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

              // Check if this slot overlaps with any busy period
              const isBusy = busySlots.some((busy) => {
                const busyStart = new Date(busy.start!);
                const busyEnd = new Date(busy.end!);
                return slotStart < busyEnd && slotEnd > busyStart;
              });

              // Only include future slots
              if (slotStart > now) {
                slots.push({
                  date: slotStart.toISOString().split("T")[0],
                  time: `${String(hour).padStart(2, "0")}:00`,
                  available: !isBusy,
                });
              }
            }
          }
          cursor.setDate(cursor.getDate() + 1);
        }

        res.status(200).json({ slots });
      } catch (err) {
        console.error("Available slots error:", err);
        res.status(500).json({
          error: err instanceof Error ? err.message : "Failed to fetch availability",
        });
      }
    });
  },
);
