import { type NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
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

    const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!name || !cleanEmail || !service) {
      return NextResponse.json(
        { error: "Name, email, and service are required" },
        { status: 400 },
      );
    }

    // Write the booking document
    const bookingRef = await adminDb.collection("bookings").add({
      name,
      email: cleanEmail,
      phone: phone ?? "",
      company: company ?? "",
      service,
      date: date ?? "",
      time: time ?? "",
      status: "pending",
      notes: notes ?? "",
      source: source ?? "join-page",
      tags: ["booking-form"],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Also create a queued email so onEmailQueued trigger notifies admin
    // immediately (onBookingConfirmed only fires on status → "confirmed").
    const dateLabel = date ? new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "TBD";
    await adminDb.collection("emails").add({
      recipientEmail: "admin@creedava.com",
      subject: `New Booking Request — ${name}: ${service}`,
      body: `
        <div style="font-family:Roboto,sans-serif;max-width:500px;">
          <div style="background:#005148;color:white;padding:16px;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;font-size:16px;">New Booking Request</h2>
          </div>
          <div style="padding:16px;background:#f9fbff;border:1px solid #e0e8f5;border-radius:0 0 8px 8px;">
            <table style="width:100%;">
              <tr><td style="padding:6px;color:#666;">Name</td><td style="padding:6px;font-weight:bold;">${name}</td></tr>
              <tr><td style="padding:6px;color:#666;">Email</td><td style="padding:6px;">${cleanEmail}</td></tr>
              <tr><td style="padding:6px;color:#666;">Phone</td><td style="padding:6px;">${phone ?? "—"}</td></tr>
              <tr><td style="padding:6px;color:#666;">Service</td><td style="padding:6px;font-weight:bold;">${service}</td></tr>
              <tr><td style="padding:6px;color:#666;">Date</td><td style="padding:6px;font-weight:bold;">${dateLabel}</td></tr>
              <tr><td style="padding:6px;color:#666;">Time</td><td style="padding:6px;">${time ?? "TBD"}</td></tr>
              ${notes ? `<tr><td style="padding:6px;color:#666;">Notes</td><td style="padding:6px;">${notes}</td></tr>` : ""}
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
