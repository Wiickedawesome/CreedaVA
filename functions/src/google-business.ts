/**
 * Google Business Profile Cloud Function
 *
 * Fetches Google My Business reviews, posts, and Q&A data.
 * Syncs to Firestore for the admin dashboard.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { google } from "googleapis";
import { db, getIntegrationConfig, verifyAdminEmail } from "./admin";

// ─── Auth helper ─────────────────────────────────────

async function getBusinessClient() {
  const integration = await getIntegrationConfig("google-business");
  const config = integration?.config ?? {};

  let authClient;
  if (config.serviceAccountKey) {
    const key = JSON.parse(config.serviceAccountKey);
    authClient = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: [
        "https://www.googleapis.com/auth/business.manage",
      ],
    });
  } else {
    authClient = new google.auth.GoogleAuth({
      scopes: [
        "https://www.googleapis.com/auth/business.manage",
      ],
    });
  }

  return {
    auth: authClient,
    accountId: config.accountId || "",
    locationId: config.locationId || "",
  };
}

// ─── Fetch Reviews ───────────────────────────────────

export const fetchBusinessReviews = onCall(
  { region: "us-east4", memory: "256MiB" },
  async (request) => {
    verifyAdminEmail(request.auth?.token?.email);

    const { auth, accountId, locationId } = await getBusinessClient();

    try {
      // Fetch location info
      const response = await google.mybusinessbusinessinformation({
        version: "v1",
        auth,
      }).locations.get({
        name: `${accountId}/${locationId}`,
        readMask: "name,title,storefrontAddress",
      });

      // Fetch reviews directly via REST
      const reviewsUrl = `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/reviews`;
      const reviewsRes = await authClient_fetch(auth, reviewsUrl);

      const reviews = reviewsRes?.reviews || [];

      // Save to Firestore
      const batch = db.batch();
      for (const review of reviews) {
        const docRef = db.collection("business-reviews").doc(review.reviewId || review.name?.split("/").pop() || `review-${Date.now()}`);
        batch.set(docRef, {
          ...review,
          syncedAt: new Date().toISOString(),
          locationName: response.data?.title || locationId,
        }, { merge: true });
      }
      await batch.commit();

      return {
        success: true,
        reviewCount: reviews.length,
        locationName: response.data?.title || "",
        syncedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error("GMB reviews fetch failed:", err);
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to fetch reviews");
    }
  },
);

// ─── Fetch Business Insights ─────────────────────────

export const fetchBusinessInsights = onCall(
  { region: "us-east4", memory: "256MiB" },
  async (request) => {
    verifyAdminEmail(request.auth?.token?.email);

    const { auth, accountId, locationId } = await getBusinessClient();

    try {
      // Business Profile Performance API
      const performanceUrl = `https://businessprofileperformance.googleapis.com/v1/${accountId}/${locationId}:getDailyMetricsTimeSeries`;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const metrics = [
        "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
        "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
        "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
        "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
        "CALL_CLICKS",
        "WEBSITE_CLICKS",
        "BUSINESS_DIRECTION_REQUESTS",
      ];

      const results: Record<string, number> = {};
      for (const metric of metrics) {
        try {
          const res = await authClient_fetch(auth, `${performanceUrl}?dailyMetric=${metric}&dailyRange.startDate.year=${startDate.getFullYear()}&dailyRange.startDate.month=${startDate.getMonth() + 1}&dailyRange.startDate.day=${startDate.getDate()}&dailyRange.endDate.year=${endDate.getFullYear()}&dailyRange.endDate.month=${endDate.getMonth() + 1}&dailyRange.endDate.day=${endDate.getDate()}`);
          const total = res?.timeSeries?.datedValues?.reduce((acc: number, v: { value?: string }) => acc + (parseInt(v.value || "0")), 0) || 0;
          results[metric] = total;
        } catch {
          results[metric] = 0;
        }
      }

      // Save snapshot
      await db.collection("business-insights").add({
        ...results,
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
        syncedAt: new Date().toISOString(),
      });

      return {
        success: true,
        metrics: results,
        period: {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        },
      };
    } catch (err) {
      console.error("GMB insights fetch failed:", err);
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to fetch insights");
    }
  },
);

// ─── Helper: authenticated fetch ─────────────────────

async function authClient_fetch(auth: InstanceType<typeof google.auth.JWT> | InstanceType<typeof google.auth.GoogleAuth>, url: string) {
  let token: string | null | undefined;
  if (auth instanceof google.auth.JWT) {
    const creds = await auth.authorize();
    token = creds.access_token;
  } else {
    token = await (auth as InstanceType<typeof google.auth.GoogleAuth>).getAccessToken();
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GMB API error ${res.status}: ${text}`);
  }
  return res.json();
}
