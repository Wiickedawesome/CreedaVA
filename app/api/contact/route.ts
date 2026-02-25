import { type NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, company, message, source } = body;

    const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!name || !cleanEmail || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 },
      );
    }

    // Write to leads — onNewLead trigger fires automatically and sends
    // the admin notification email (see functions/src/triggers.ts).
    await adminDb.collection("leads").add({
      name,
      email: cleanEmail,
      phone: phone ?? "",
      company: company ?? "",
      source: source ?? "contact-page",
      status: "new",
      value: 0,
      notes: message,
      tags: ["contact-form"],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/contact] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
