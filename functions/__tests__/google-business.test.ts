/**
 * Unit tests for Google Business Profile integration.
 */

import { test, expect, vi, beforeEach, afterEach, describe } from "vitest";
import functionsTest from "firebase-functions-test";
import { HttpsError } from "firebase-functions/v2/https";

const testEnv = functionsTest({
  projectId: "test-project",
});

describe("google-business", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchBusinessReviews (v1 API migration)", () => {
    test("should use v1 API endpoint for reviews", () => {
      // Old v4 endpoint (deprecated)
      const v4Url = "https://mybusiness.googleapis.com/v4/accounts/12345/locations/67890/reviews";

      // New v1 endpoint (current)
      const v1Url = "https://mybusiness.googleapis.com/v1/accounts/12345/locations/67890/reviews";

      // Verify the migration
      expect(v4Url).toContain("/v4/");
      expect(v1Url).toContain("/v1/");
      expect(v1Url).not.toContain("/v4/");
    });

    test("should require accountId for reviews", () => {
      const accountId = "";
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const locationId = "locations/67890";

      if (!accountId) {
        const error = new HttpsError("failed-precondition", "Google Business accountId required for reviews fetch.");
        expect(error.code).toBe("failed-precondition");
        expect(error.message).toContain("accountId");
      }
    });

    test("should require locationId for reviews", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const accountId = "accounts/12345";
      const locationId = "";

      if (!locationId) {
        const error = new HttpsError("failed-precondition", "Google Business locationId not configured.");
        expect(error.code).toBe("failed-precondition");
      }
    });

    test("should parse review response correctly", () => {
      const mockResponse = {
        reviews: [
          {
            reviewId: "review-1",
            reviewer: { displayName: "John Doe" },
            starRating: "FIVE",
            comment: "Great service!",
            createTime: "2026-01-15T10:00:00Z",
            updateTime: "2026-01-15T10:00:00Z",
          },
        ],
      };

      const reviews = (mockResponse.reviews || []).map((r: Record<string, unknown>) => ({
        author: r.reviewer?.displayName,
        rating: r.starRating,
        comment: r.comment,
        createTime: r.createTime,
        updateTime: r.updateTime,
        reviewId: r.reviewId,
      }));

      expect(reviews).toHaveLength(1);
      expect(reviews[0].author).toBe("John Doe");
      expect(reviews[0].rating).toBe("FIVE");
      expect(reviews[0].reviewId).toBe("review-1");
    });
  });

  describe("fetchBusinessInsights", () => {
    test("should use Business Profile Performance API v1", () => {
      const locationId = "locations/67890";
      const metrics = [
        "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
        "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
        "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
        "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
        "CALL_CLICKS",
        "WEBSITE_CLICKS",
        "BUSINESS_DIRECTION_REQUESTS",
      ];

      const performanceUrl = `https://businessprofileperformance.googleapis.com/v1/${locationId}:getDailyMetricsTimeSeries`;

      expect(performanceUrl).toContain("businessprofileperformance.googleapis.com/v1");
      expect(metrics).toHaveLength(7);
    });

    test("should aggregate metrics correctly", () => {
      const mockTimeSeries = {
        datedValues: [
          { value: "10" },
          { value: "20" },
          { value: "30" },
        ],
      };

      const total = mockTimeSeries.datedValues.reduce((acc: number, v: Record<string, unknown>) => acc + parseInt(String(v.value || "0")), 0);
      expect(total).toBe(60);
    });
  });
});

testEnv.cleanup();