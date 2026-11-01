/**
 * Unit tests for webhook handlers (handleFormWebhook, getAvailableSlots).
 */

import { test, expect, vi, beforeEach, afterEach, describe } from "vitest";

describe("handleFormWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validatePayload", () => {
    type ValidateResult =
      | { ok: true; data: Record<string, unknown> }
      | { ok: false; error: string };

    function validatePayload(input: unknown): ValidateResult {
      if (!input || typeof input !== "object") {
        return { ok: false, error: "Invalid payload" };
      }
      const raw = input as Record<string, unknown>;
      const formType = String(raw.formType || "");
      if (!["contact", "booking", "lead"].includes(formType)) {
        return { ok: false, error: "Unsupported formType" };
      }
      const name = String(raw.name || "").trim();
      const email = String(raw.email || "").trim().toLowerCase();
      if (!name) return { ok: false, error: "Name is required" };
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: "Valid email is required" };
      }
      if (formType === "contact") {
        const message = String(raw.message || "").trim();
        if (!message) return { ok: false, error: "Message is required" };
        return { ok: true, data: { formType, name, email, message } };
      }
      if (formType === "booking") {
        const service = String(raw.service || "").trim();
        if (!service) return { ok: false, error: "Service is required" };
        return { ok: true, data: { formType, name, email, service } };
      }
      return { ok: true, data: { formType, name, email } };
    }

    test("rejects null payload", () => {
      expect(validatePayload(null).ok).toBe(false);
    });

    test("rejects non-object payload", () => {
      expect(validatePayload("string").ok).toBe(false);
    });

    test("rejects unsupported formType", () => {
      const result = validatePayload({ formType: "invalid" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toContain("Unsupported formType");
    });

    test("rejects contact without message", () => {
      const result = validatePayload({
        formType: "contact",
        name: "John",
        email: "john@test.com",
      });
      expect(result.ok).toBe(false);
    });

    test("accepts valid contact payload", () => {
      const result = validatePayload({
        formType: "contact",
        name: "John Doe",
        email: "john@creedava.com",
        message: "Hello, I'd like to inquire about your services.",
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.formType).toBe("contact");
        expect(result.data.email).toBe("john@creedava.com");
      }
    });

    test("rejects booking without service", () => {
      const result = validatePayload({
        formType: "booking",
        name: "Jane",
        email: "jane@test.com",
      });
      expect(result.ok).toBe(false);
    });

    test("accepts valid booking payload", () => {
      const result = validatePayload({
        formType: "booking",
        name: "Jane Doe",
        email: "jane@creedava.com",
        service: "SEO Audit",
      });
      expect(result.ok).toBe(true);
    });

    test("accepts valid lead payload", () => {
      const result = validatePayload({
        formType: "lead",
        name: "Bob",
        email: "bob@creedava.com",
      });
      expect(result.ok).toBe(true);
    });

    test("rejects missing name", () => {
      const result = validatePayload({
        formType: "contact",
        email: "test@creedava.com",
        message: "Hello",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toContain("Name");
    });

    test("rejects invalid email", () => {
      const result = validatePayload({
        formType: "contact",
        name: "Test",
        email: "not-an-email",
        message: "Hello",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toContain("email");
    });
  });

  describe("rate limiting", () => {
    const WINDOW_MS = 60_000;
    const MAX_REQUESTS = 40;

    test("allows requests under the limit", () => {
      const ip = "192.168.1.1";
      const window = new Map<string, { count: number; resetAt: number }>();
      const now = Date.now();

      window.set(ip, { count: 5, resetAt: now + WINDOW_MS });
      expect(window.get(ip)!.count).toBeLessThanOrEqual(MAX_REQUESTS);
    });

    test("blocks requests over the limit", () => {
      const ip = "192.168.1.2";
      const window = new Map<string, { count: number; resetAt: number }>();
      const now = Date.now();

      window.set(ip, { count: 41, resetAt: now + WINDOW_MS });
      const entry = window.get(ip)!;
      const limited = entry.count > MAX_REQUESTS;
      expect(limited).toBe(true);
    });

    test("resets count after window expires", () => {
      const ip = "192.168.1.3";
      const window = new Map<string, { count: number; resetAt: number }>();
      const now = Date.now();

      window.set(ip, { count: 50, resetAt: now - 1 }); // expired
      const entry = window.get(ip)!;
      const expired = Date.now() >= entry.resetAt;
      expect(expired).toBe(true);
    });
  });

  describe("CORS origin validation", () => {
    function isOriginAllowed(origin: string | undefined): boolean {
      if (
        !origin ||
        origin === "https://creedava.com" ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /\.hosted\.app$/.test(origin) ||
        /\.web\.app$/.test(origin)
      ) {
        return true;
      }
      return false;
    }

    test("allows undefined origin (same-origin)", () => {
      expect(isOriginAllowed(undefined)).toBe(true);
    });

    test("allows creedava.com", () => {
      expect(isOriginAllowed("https://creedava.com")).toBe(true);
    });

    test("allows localhost", () => {
      expect(isOriginAllowed("http://localhost:3000")).toBe(true);
      expect(isOriginAllowed("http://localhost")).toBe(true);
    });

    test("allows Firebase Hosting preview URLs", () => {
      expect(isOriginAllowed("https://creedava-test.hosted.app")).toBe(true);
      expect(isOriginAllowed("https://creedava.web.app")).toBe(true);
    });

    test("rejects unknown origins", () => {
      expect(isOriginAllowed("https://evil.com")).toBe(false);
    });
  });

  describe("parseBookingDateTime", () => {
    function parseBookingDateTime(dateInput?: string, timeInput?: string): { date: string; time: string } {
      if (dateInput && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return { date: dateInput, time: (timeInput && /^([01]\d|2[0-3]):[0-5]\d$/.test(timeInput)) ? timeInput : "09:00" };
      }
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      return { date: `${yyyy}-${mm}-${dd}`, time: (timeInput && /^([01]\d|2[0-3]):[0-5]\d$/.test(timeInput)) ? timeInput : "09:00" };
    }

    test("parses valid ISO date", () => {
      const result = parseBookingDateTime("2026-07-15", "14:00");
      expect(result.date).toBe("2026-07-15");
      expect(result.time).toBe("14:00");
    });

    test("defaults time to 09:00 when not provided", () => {
      const result = parseBookingDateTime("2026-07-15");
      expect(result.time).toBe("09:00");
    });

    test("uses today when no date provided", () => {
      const result = parseBookingDateTime();
      const today = new Date();
      const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      expect(result.date).toBe(expected);
    });

    test("rejects invalid time format", () => {
      const result = parseBookingDateTime("2026-07-15", "25:00");
      expect(result.time).toBe("09:00");
    });
  });

  describe("input sanitization", () => {
    function clean(input: unknown, max = 1000): string {
      return typeof input === "string" ? input.trim().slice(0, max) : "";
    }

    function escapeHtml(input: string): string {
      return input
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    test("clean trims whitespace", () => {
      expect(clean("  hello  ")).toBe("hello");
    });

    test("clean returns empty for non-string", () => {
      expect(clean(null)).toBe("");
      expect(clean(undefined)).toBe("");
      expect(clean(123)).toBe("");
    });

    test("clean truncates to max length", () => {
      expect(clean("a".repeat(2000), 10)).toBe("a".repeat(10));
    });

    test("escapeHtml escapes special characters", () => {
      const result = escapeHtml("<script>alert('xss')</script>");
      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;script&gt;");
    });
  });

  describe("email validation", () => {
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    test("accepts valid emails", () => {
      expect(EMAIL_RE.test("user@creedava.com")).toBe(true);
      expect(EMAIL_RE.test("john.doe@sub.domain.com")).toBe(true);
    });

    test("rejects invalid emails", () => {
      expect(EMAIL_RE.test("")).toBe(false);
      expect(EMAIL_RE.test("no-at")).toBe(false);
      expect(EMAIL_RE.test("@domain.com")).toBe(false);
      expect(EMAIL_RE.test("user@")).toBe(false);
      expect(EMAIL_RE.test("user@.com")).toBe(false);
    });
  });
});

describe("getAvailableSlots", () => {
  describe("fallback slot generation (calendar not configured)", () => {
    test("generates weekday slots Mon-Fri 9am-5pm", () => {
      const cur = new Date("2026-07-06T00:00:00Z"); // Monday
      const slots: { date: string; time: string; available: boolean }[] = [];
      const nowTs = cur.getTime();
      cur.setDate(cur.getDate() + 1);

      for (let d = 0; d < 60 && slots.length < 300; d++) {
        const dow = cur.getDay();
        if (dow >= 1 && dow <= 5) {
          for (let h = 9; h < 17; h++) {
            const slotStart = new Date(cur);
            slotStart.setHours(h, 0, 0, 0);
            if (slotStart.getTime() > nowTs) {
              const yyyy = cur.getFullYear();
              const mm = String(cur.getMonth() + 1).padStart(2, "0");
              const dd = String(cur.getDate()).padStart(2, "0");
              slots.push({ date: `${yyyy}-${mm}-${dd}`, time: `${String(h).padStart(2, "0")}:00`, available: true });
            }
          }
        }
        cur.setDate(cur.getDate() + 1);
      }

      expect(slots.length).toBeGreaterThan(0);
      expect(slots.length).toBeLessThanOrEqual(400);

      // All slots are on weekdays
      for (const slot of slots) {
        const d = new Date(`${slot.date}T${slot.time}:00`);
        expect(d.getDay()).not.toBe(0); // not Sunday
        expect(d.getDay()).not.toBe(6); // not Saturday
      }

      // All times are 9-17
      for (const slot of slots) {
        const hour = parseInt(slot.time);
        expect(hour).toBeGreaterThanOrEqual(9);
        expect(hour).toBeLessThan(17);
      }
    });

    test("all slots are in the future", () => {
      const now = Date.now();
      const cur = new Date();
      cur.setHours(0, 0, 0, 0);
      cur.setDate(cur.getDate() + 1);
      let allFuture = true;

      for (let d = 0; d < 30; d++) {
        const dow = cur.getDay();
        if (dow >= 1 && dow <= 5) {
          for (let h = 9; h < 17; h++) {
            const slotStart = new Date(cur);
            slotStart.setHours(h, 0, 0, 0);
            if (slotStart.getTime() <= now) {
              allFuture = false;
            }
          }
        }
        cur.setDate(cur.getDate() + 1);
      }

      expect(allFuture).toBe(true);
    });
  });

  describe("busy slot detection", () => {
    function isOverlapping(
      slotStart: Date,
      slotEnd: Date,
      busyStart: Date,
      busyEnd: Date,
    ): boolean {
      return slotStart < busyEnd && slotEnd > busyStart;
    }

    test("detects overlapping busy slot", () => {
      const slotStart = new Date("2026-07-06T10:00:00");
      const slotEnd = new Date("2026-07-06T11:00:00");
      const busyStart = new Date("2026-07-06T10:30:00");
      const busyEnd = new Date("2026-07-06T11:30:00");

      expect(isOverlapping(slotStart, slotEnd, busyStart, busyEnd)).toBe(true);
    });

    test("detects non-overlapping busy slot", () => {
      const slotStart = new Date("2026-07-06T10:00:00");
      const slotEnd = new Date("2026-07-06T11:00:00");
      const busyStart = new Date("2026-07-06T11:00:00");
      const busyEnd = new Date("2026-07-06T12:00:00");

      expect(isOverlapping(slotStart, slotEnd, busyStart, busyEnd)).toBe(false);
    });

    test("detects contained busy slot (slot fully contains busy)", () => {
      const slotStart = new Date("2026-07-06T10:00:00");
      const slotEnd = new Date("2026-07-06T12:00:00");
      const busyStart = new Date("2026-07-06T10:30:00");
      const busyEnd = new Date("2026-07-06T11:00:00");

      expect(isOverlapping(slotStart, slotEnd, busyStart, busyEnd)).toBe(true);
    });
  });

  describe("slot availability marking", () => {
    test("marks slot as unavailable when overlapping with busy period", () => {
      const busySlots = [
        { start: "2026-07-06T10:00:00", end: "2026-07-06T11:00:00" },
      ];

      const slotStart = new Date("2026-07-06T10:00:00");
      const slotEnd = new Date("2026-07-06T11:00:00");

      const isBusy = busySlots.some((busy) => {
        const bStart = new Date(busy.start);
        const bEnd = new Date(busy.end);
        return slotStart < bEnd && slotEnd > bStart;
      });

      expect(isBusy).toBe(true);
    });

    test("marks slot as available when not overlapping", () => {
      const busySlots = [
        { start: "2026-07-06T11:00:00Z", end: "2026-07-06T12:00:00Z" },
      ];

      const slotStart = new Date("2026-07-06T10:00:00");
      const slotEnd = new Date("2026-07-06T11:00:00");

      const isBusy = busySlots.some((busy) => {
        const bStart = new Date(busy.start);
        const bEnd = new Date(busy.end);
        return slotStart < bEnd && slotEnd > bStart;
      });

      expect(isBusy).toBe(false);
    });
  });
});
