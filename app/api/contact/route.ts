import { type NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = { name: 200, email: 254, phone: 50, company: 200, message: 5000 };

// Best-effort abuse protection: each instance keeps its own sliding window.
// Behind Firebase App Hosting every request carries x-forwarded-for.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_MAX_TRACKED_IPS = 10_000;

const requestLog = new Map<string, number[]>();

function isRateLimited(clientIp: string, now: number): boolean {
  const recent = (requestLog.get(clientIp) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(clientIp, recent);
    return true;
  }

  recent.push(now);
  requestLog.set(clientIp, recent);

  // Bound memory if the instance sees many distinct clients.
  if (requestLog.size > RATE_LIMIT_MAX_TRACKED_IPS) requestLog.clear();

  return false;
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production" && isRateLimited(clientIp(req), Date.now())) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(RATE_LIMIT_WINDOW_MS / 1000) } },
      );
    }

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
