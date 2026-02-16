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
 *     calendarId: "admin@creedava.com",
 *     serviceAccountEmail: "calendar@creeda-va.iam.gserviceaccount.com",
 *     serviceAccountKey: "{ ... JSON key ... }",
 *   }
 * }
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { google, calendar_v3 } from "googleapis";
import { getIntegrationConfig } from "./admin";

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
  const calendarId = config.calendarId || "primary";

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
