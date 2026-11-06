import { type NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { createRateLimiter } from "@/lib/utils/rate-limit";

/** Escape HTML entities to prevent XSS in email templates. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LEN = { name: 200, email: 254, phone: 50, company: 200, service: 200, notes: 2000, time: 50 };

function clamp(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

// This endpoint is unauthenticated, writes to Firestore and queues an admin
// notification email, so an unlimited caller can burn quota and inbox space.
const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production" && limiter.isLimited(req)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } },
      );
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      service,
      date,
      time,
      notes,
      source,
    } = body;

    const name = clamp(`${firstName ?? ""} ${lastName ?? ""}`, MAX_LEN.name);
    const cleanEmail = clamp(email, MAX_LEN.email).toLowerCase();

    if (!name || !cleanEmail || !clamp(service, MAX_LEN.service)) {
      return NextResponse.json(
        { error: "Name, email, and service are required" },
        { status: 400 },
      );
    }

    if (!EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const cleanDate = clamp(date, 10);
    if (cleanDate && !DATE_RE.test(cleanDate)) {
      return NextResponse.json(
        { error: "Invalid date format (expected YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    const cleanService = clamp(service, MAX_LEN.service);
    const cleanPhone = clamp(phone, MAX_LEN.phone);
    const cleanCompany = clamp(company, MAX_LEN.company);
    const cleanTime = clamp(time, MAX_LEN.time);
    const cleanNotes = clamp(notes, MAX_LEN.notes);
    const cleanSource = typeof source === "string" ? source.slice(0, 50) : "join-page";

    // Write the booking document
    const bookingRef = await adminDb.collection("bookings").add({
      name,
      email: cleanEmail,
      phone: cleanPhone,
      company: cleanCompany,
      service: cleanService,
      date: cleanDate,
      time: cleanTime,
      status: "pending",
      notes: cleanNotes,
      source: cleanSource,
      tags: ["booking-form"],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Also create a queued email so onEmailQueued trigger notifies admin
    // immediately (onBookingConfirmed only fires on status → "confirmed").
    const dateLabel = cleanDate ? new Date(cleanDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "TBD";

    // Escape all user-supplied values before embedding in HTML email
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(cleanEmail);
    const safePhone = escapeHtml(cleanPhone || "—");
    const safeService = escapeHtml(cleanService);
    const safeTime = escapeHtml(cleanTime || "TBD");
    const safeNotes = cleanNotes ? escapeHtml(cleanNotes) : "";

    await adminDb.collection("emails").add({
      recipientEmail: "admin@creedava.com",
      subject: `New Booking Request — ${safeName}: ${safeService}`,
      body: `
        <div style="font-family:Roboto,sans-serif;max-width:500px;">
          <div style="background:#005148;color:white;padding:16px;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;font-size:16px;">New Booking Request</h2>
          </div>
          <div style="padding:16px;background:#F7F7F2;border:1px solid #e0e8f5;border-radius:0 0 8px 8px;">
            <table style="width:100%;">
              <tr><td style="padding:6px;color:#666;">Name</td><td style="padding:6px;font-weight:bold;">${safeName}</td></tr>
              <tr><td style="padding:6px;color:#666;">Email</td><td style="padding:6px;">${safeEmail}</td></tr>
              <tr><td style="padding:6px;color:#666;">Phone</td><td style="padding:6px;">${safePhone}</td></tr>
              <tr><td style="padding:6px;color:#666;">Service</td><td style="padding:6px;font-weight:bold;">${safeService}</td></tr>
              <tr><td style="padding:6px;color:#666;">Date</td><td style="padding:6px;font-weight:bold;">${dateLabel}</td></tr>
              <tr><td style="padding:6px;color:#666;">Time</td><td style="padding:6px;">${safeTime}</td></tr>
              ${safeNotes ? `<tr><td style="padding:6px;color:#666;">Notes</td><td style="padding:6px;">${safeNotes}</td></tr>` : ""}
            </table>
            <div style="margin-top:12px;">
              <a href="https://creedava.com/admin/bookings" style="display:inline-block;background:#005148;color:white;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:14px;">View in CRM →</a>
            </div>
          </div>
        </div>
      `,
      status: "queued",
      source: "booking-form",
      relatedId: bookingRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/booking] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
