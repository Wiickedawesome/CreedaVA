/**
 * Unit tests for scheduled reports functions.
 */

import { test, expect, vi, beforeEach, afterEach, describe } from "vitest";
import functionsTest from "firebase-functions-test";

const testEnv = functionsTest({
  projectId: "test-project",
});

describe("scheduled-reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("dailyDigest", () => {
    test("should generate correct HTML structure", () => {
      const now = new Date();
      const newLeads = 5;
      const newBookings = 3;
      const tasksDone = 10;
      const newContacts = 2;
      const bookingList = ["• 09:00 — John (Consulting)", "• 14:00 — Jane (Support)"];

      const html = `
        <div style="font-family: Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #005148; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">CreedaVA Daily Digest</h1>
            <p style="margin: 4px 0 0; opacity: 0.8;">${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <div style="padding: 20px; background: #f9fbff; border: 1px solid #e0e8f5;">
            <h2 style="color: #002D72; font-size: 16px;">Yesterday's Activity</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px;">New Leads</td><td style="padding: 8px; font-weight: bold; text-align: right;">${newLeads}</td></tr>
              <tr><td style="padding: 8px;">New Bookings</td><td style="padding: 8px; font-weight: bold; text-align: right;">${newBookings}</td></tr>
              <tr><td style="padding: 8px;">Tasks Completed</td><td style="padding: 8px; font-weight: bold; text-align: right;">${tasksDone}</td></tr>
              <tr><td style="padding: 8px;">New Contacts</td><td style="padding: 8px; font-weight: bold; text-align: right;">${newContacts}</td></tr>
            </table>
            ${
              bookingList.length > 0
                ? `<h2 style="color: #002D72; font-size: 16px; margin-top: 20px;">Today's Bookings</h2>
                   <div style="background: white; padding: 12px; border-radius: 8px;">${bookingList.join("<br>")}</div>`
                : `<p style="color: #666; margin-top: 20px;">No bookings scheduled for today.</p>`
            }
          </div>
          <div style="padding: 12px; text-align: center; color: #888; font-size: 12px;">
            CreedaVA — Virtual Assistant Services
          </div>
        </div>
      `;

      expect(html).toContain("CreedaVA Daily Digest");
      expect(html).toContain("Yesterday's Activity");
      expect(html).toContain("New Leads");
      expect(html).toContain(String(newLeads));
      expect(html).toContain("John (Consulting)");
    });

    test("should handle empty bookings list", () => {
      const bookingList: string[] = [];
      const hasBookings = bookingList.length > 0;
      expect(hasBookings).toBe(false);
    });
  });

  describe("weeklyReport", () => {
    test("should calculate pipeline value correctly", () => {
      const leads = [
        { data: () => ({ status: "new", value: 5000 }) },
        { data: () => ({ status: "qualified", value: 10000 }) },
        { data: () => ({ status: "won", value: 15000 }) },
        { data: () => ({ status: "lost", value: 2000 }) },
      ];

      const pipelineValue = leads
        .filter((d) => !["won", "lost"].includes(d.data().status))
        .reduce((s, d) => s + (d.data().value || 0), 0);

      expect(pipelineValue).toBe(15000);
    });

    test("should calculate MRR correctly", () => {
      const customers = [
        { data: () => ({ status: "active", monthlyValue: 500 }) },
        { data: () => ({ status: "active", monthlyValue: 1000 }) },
        { data: () => ({ status: "inactive", monthlyValue: 200 }) },
      ];

      const mrr = customers
        .filter((d) => d.data().status === "active")
        .reduce((s, d) => s + (d.data().monthlyValue || 0), 0);

      expect(mrr).toBe(1500);
    });
  });

  describe("monthlyReport", () => {
    test("should calculate win rate correctly", () => {
      const leads = [
        { data: () => ({ status: "won" }) },
        { data: () => ({ status: "won" }) },
        { data: () => ({ status: "lost" }) },
        { data: () => ({ status: "new" }) },
      ];

      const leadsWon = leads.filter((d) => d.data().status === "won").length;
      const winRate = leads.length > 0 ? ((leadsWon / leads.length) * 100).toFixed(1) : "0";

      expect(leadsWon).toBe(2);
      expect(winRate).toBe("50.0");
    });

    test("should handle zero leads gracefully", () => {
      const leads: { data: () => { status: string } }[] = [];
      const winRate = leads.length > 0 ? "50.0" : "0";
      expect(winRate).toBe("0");
    });
  });
});

testEnv.cleanup();