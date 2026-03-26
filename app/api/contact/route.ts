import { type NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = { name: 200, email: 254, phone: 50, company: 200, message: 5000 };

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, company, message, source } = body;

    const name = str(`${firstName ?? ""} ${lastName ?? ""}`, MAX_LEN.name);
    const cleanEmail = str(email, MAX_LEN.email).toLowerCase();

    if (!name || !cleanEmail || !str(message, MAX_LEN.message)) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 },
      );
    }

    if (!EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Write to leads — onNewLead trigger fires automatically and sends
    // the admin notification email (see functions/src/triggers.ts).
    await adminDb.collection("leads").add({
      name,
      email: cleanEmail,
      phone: str(phone, MAX_LEN.phone),
      company: str(company, MAX_LEN.company),
      source: typeof source === "string" ? source.slice(0, 50) : "contact-page",
      status: "new",
      value: 0,
      notes: str(message, MAX_LEN.message),
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
