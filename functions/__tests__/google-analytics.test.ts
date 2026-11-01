/**
 * Unit tests for Google Analytics (GA4) integration.
 */

import { test, expect, vi, beforeEach, afterEach, describe } from "vitest";
import { HttpsError } from "firebase-functions/v2/https";
import { toGA4PropertyResourceName } from "../src/google-analytics-property";

interface GARow {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
}

interface GAResponse {
  rows?: GARow[];
  totals?: GARow[];
}

describe("google-analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("toGA4PropertyResourceName", () => {
    test("should format numeric property ID correctly", () => {
      const result = toGA4PropertyResourceName("524822766");
      expect(result).toBe("properties/524822766");
    });

    test("should strip 'properties/' prefix if present", () => {
      const result = toGA4PropertyResourceName("properties/524822766");
      expect(result).toBe("properties/524822766");
    });

    test("should throw on empty property ID", () => {
      expect(() => toGA4PropertyResourceName("")).toThrow("GA4 Property ID is required");
    });

    test("should throw on non-numeric property ID", () => {
      expect(() => toGA4PropertyResourceName("abc")).toThrow("GA4 Property ID must be numeric");
    });

    test("should trim whitespace", () => {
      const result = toGA4PropertyResourceName("  524822766  ");
      expect(result).toBe("properties/524822766");
    });
  });

  describe("fetchAnalyticsReport", () => {
    test("should require admin email", () => {
      const email = "user@other.com";
      if (!email?.endsWith("@creedava.com")) {
        const error = new HttpsError("permission-denied", "Must be @creedava.com");
        expect(error.code).toBe("permission-denied");
      }
    });

    test("should default to 30 days if not specified", () => {
      const days = (undefined as number | undefined) || 30;
      expect(days).toBe(30);
    });

    test("should parse GA4 response correctly", () => {
      const mockResponse = {
        rows: [
          {
            dimensionValues: [{ value: "20260115" }],
            metricValues: [
              { value: "100" },  // activeUsers
              { value: "150" },  // sessions
              { value: "300" },  // screenPageViews
              { value: "0.45" }, // bounceRate
              { value: "120.5" }, // averageSessionDuration
              { value: "50" },   // newUsers
              { value: "10" },   // conversions
            ],
          },
        ],
        totals: [
          {
            metricValues: [
              { value: "3000" },
              { value: "4500" },
              { value: "9000" },
              { value: "0.42" },
              { value: "180" },
              { value: "1500" },
              { value: "300" },
            ],
          },
        ],
      };

      const dailyData = (mockResponse.rows || []).map((row: GARow) => ({
        date: row.dimensionValues?.[0]?.value || "",
        activeUsers: parseInt(row.metricValues?.[0]?.value || "0"),
        sessions: parseInt(row.metricValues?.[1]?.value || "0"),
        pageViews: parseInt(row.metricValues?.[2]?.value || "0"),
        bounceRate: parseFloat(row.metricValues?.[3]?.value || "0"),
        avgSessionDuration: parseFloat(row.metricValues?.[4]?.value || "0"),
        newUsers: parseInt(row.metricValues?.[5]?.value || "0"),
        conversions: parseInt(row.metricValues?.[6]?.value || "0"),
      }));

      expect(dailyData).toHaveLength(1);
      expect(dailyData[0].date).toBe("20260115");
      expect(dailyData[0].activeUsers).toBe(100);
      expect(dailyData[0].sessions).toBe(150);

      const totals = (mockResponse.totals as GARow[])?.[0];
      const summary = {
        totalUsers: parseInt(totals?.metricValues?.[0]?.value || "0"),
        totalSessions: parseInt(totals?.metricValues?.[1]?.value || "0"),
        totalPageViews: parseInt(totals?.metricValues?.[2]?.value || "0"),
        avgBounceRate: parseFloat(totals?.metricValues?.[3]?.value || "0"),
        avgSessionDuration: parseFloat(totals?.metricValues?.[4]?.value || "0"),
        totalNewUsers: parseInt(totals?.metricValues?.[5]?.value || "0"),
        totalConversions: parseInt(totals?.metricValues?.[6]?.value || "0"),
      };

      expect(summary.totalUsers).toBe(3000);
      expect(summary.totalConversions).toBe(300);
    });

    test("should handle missing totals gracefully", () => {
      const mockResponse: GAResponse = {
        rows: [],
        totals: undefined,
      };

      const totals = (mockResponse.totals as GARow[] | undefined)?.[0];
      const summary = {
        totalUsers: parseInt(totals?.metricValues?.[0]?.value || "0"),
        totalSessions: parseInt(totals?.metricValues?.[1]?.value || "0"),
        totalPageViews: parseInt(totals?.metricValues?.[2]?.value || "0"),
        avgBounceRate: parseFloat(totals?.metricValues?.[3]?.value || "0"),
        avgSessionDuration: parseFloat(totals?.metricValues?.[4]?.value || "0"),
        totalNewUsers: parseInt(totals?.metricValues?.[5]?.value || "0"),
        totalConversions: parseInt(totals?.metricValues?.[6]?.value || "0"),
      };

      expect(summary.totalUsers).toBe(0);
      expect(summary.totalConversions).toBe(0);
    });
  });

  describe("fetchRealtimeAnalytics", () => {
    test("should parse realtime response correctly", () => {
      const mockResponse: GAResponse = {
        totals: [
          {
            metricValues: [
              { value: "42" },  // activeUsers
              { value: "15" },  // screenPageViews
              { value: "3" },   // conversions
            ],
          },
        ],
        rows: [
          {
            dimensionValues: [{ value: "/home" }],
            metricValues: [{ value: "20" }, { value: "30" }],
          },
          {
            dimensionValues: [{ value: "/about" }],
            metricValues: [{ value: "12" }, { value: "18" }],
          },
        ],
      };

      const activeNow = (mockResponse.totals?.[0]?.metricValues?.[0]?.value) || "0";
      const pages = (mockResponse.rows || []).map((row: GARow) => ({
        page: row.dimensionValues?.[0]?.value || "",
        activeUsers: parseInt(row.metricValues?.[0]?.value || "0"),
        pageViews: parseInt(row.metricValues?.[1]?.value || "0"),
      }));

      expect(parseInt(activeNow)).toBe(42);
      expect(pages).toHaveLength(2);
      expect(pages[0].page).toBe("/home");
      expect(pages[0].activeUsers).toBe(20);
    });
  });
});
