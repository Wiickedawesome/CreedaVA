import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Firestore ───────────────────────────────────
const mockAddDoc = vi.fn();
const mockCollection = vi.fn().mockReturnValue("mail-collection-ref");
const mockServerTimestamp = vi.fn().mockReturnValue({ _type: "serverTimestamp" });

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

vi.mock("@/lib/firebase/config", () => ({
  app: {},
  db: { name: "mock-db" },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockAddDoc.mockResolvedValue({ id: "email-doc-123" });
});

describe("Trigger Email", () => {
  describe("queueEmail", () => {
    it("creates a document in the mail collection", async () => {
      const { queueEmail } = await import("@/lib/firebase/trigger-email");

      const docId = await queueEmail({
        to: "client@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
      });

      expect(docId).toBe("email-doc-123");
      expect(mockCollection).toHaveBeenCalledWith({ name: "mock-db" }, "mail");
      expect(mockAddDoc).toHaveBeenCalledWith(
        "mail-collection-ref",
        expect.objectContaining({
          to: ["client@example.com"],
          message: expect.objectContaining({
            subject: "Test Subject",
            html: "<p>Hello</p>",
          }),
        }),
      );
    });

    it("handles array of recipients", async () => {
      const { queueEmail } = await import("@/lib/firebase/trigger-email");

      await queueEmail({
        to: ["a@example.com", "b@example.com"],
        subject: "Multi",
        html: "<p>Hi</p>",
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        "mail-collection-ref",
        expect.objectContaining({
          to: ["a@example.com", "b@example.com"],
        }),
      );
    });

    it("includes cc, bcc, and replyTo when provided", async () => {
      const { queueEmail } = await import("@/lib/firebase/trigger-email");

      await queueEmail({
        to: "client@example.com",
        subject: "Full",
        html: "<p>Full options</p>",
        cc: "cc@example.com",
        bcc: ["bcc1@example.com", "bcc2@example.com"],
        replyTo: "reply@creedava.com",
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        "mail-collection-ref",
        expect.objectContaining({
          cc: ["cc@example.com"],
          bcc: ["bcc1@example.com", "bcc2@example.com"],
          replyTo: "reply@creedava.com",
        }),
      );
    });

    it("includes text and attachments when provided", async () => {
      const { queueEmail } = await import("@/lib/firebase/trigger-email");

      await queueEmail({
        to: "client@example.com",
        subject: "Attachment",
        html: "<p>See attached</p>",
        text: "See attached",
        attachments: [{ filename: "report.pdf", path: "/tmp/report.pdf" }],
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        "mail-collection-ref",
        expect.objectContaining({
          message: expect.objectContaining({
            text: "See attached",
            attachments: [{ filename: "report.pdf", path: "/tmp/report.pdf" }],
          }),
        }),
      );
    });
  });

  describe("queueTemplateEmail", () => {
    it("sends a welcome email", async () => {
      const { queueTemplateEmail } = await import("@/lib/firebase/trigger-email");

      const docId = await queueTemplateEmail("welcome", "new@creedava.com", {
        name: "Alex",
      });

      expect(docId).toBe("email-doc-123");
      expect(mockAddDoc).toHaveBeenCalledWith(
        "mail-collection-ref",
        expect.objectContaining({
          to: ["new@creedava.com"],
          message: expect.objectContaining({
            subject: "Welcome to CreedaVA!",
            html: expect.stringContaining("Alex"),
          }),
        }),
      );
    });

    it("sends a booking confirmation email", async () => {
      const { queueTemplateEmail } = await import("@/lib/firebase/trigger-email");

      await queueTemplateEmail("booking-confirmation", "client@example.com", {
        name: "Maria",
        date: "Jan 15, 2025",
        time: "10:00 AM",
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        "mail-collection-ref",
        expect.objectContaining({
          message: expect.objectContaining({
            html: expect.stringContaining("Jan 15, 2025"),
          }),
        }),
      );
    });

    it("sends a lead followup email", async () => {
      const { queueTemplateEmail } = await import("@/lib/firebase/trigger-email");

      await queueTemplateEmail("lead-followup", "lead@example.com", {
        name: "John",
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        "mail-collection-ref",
        expect.objectContaining({
          message: expect.objectContaining({
            subject: "Following Up — CreedaVA",
            html: expect.stringContaining("John"),
          }),
        }),
      );
    });

    it("sends a survey invite email", async () => {
      const { queueTemplateEmail } = await import("@/lib/firebase/trigger-email");

      await queueTemplateEmail("survey-invite", "client@example.com", {
        name: "Sarah",
        token: "abc123",
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        "mail-collection-ref",
        expect.objectContaining({
          message: expect.objectContaining({
            html: expect.stringContaining("abc123"),
          }),
        }),
      );
    });

    it("throws for unknown template", async () => {
      const { queueTemplateEmail } = await import("@/lib/firebase/trigger-email");

      // @ts-expect-error - testing invalid template
      await expect(queueTemplateEmail("nonexistent", "a@b.com", {})).rejects.toThrow(
        "Unknown email template: nonexistent",
      );
    });
  });
});
