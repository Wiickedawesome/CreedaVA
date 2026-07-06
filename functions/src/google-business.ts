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
  if (!integration?.enabled) {
    throw new HttpsError("failed-precondition", "Google Business Profile integration not enabled. Configure in Admin → Integrations.");
  }
  const config = integration.config;

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

  const rawAccount = String(config.accountId || "").trim();
  const rawLocation = String(config.locationId || "").trim();
  // Normalize: stored values may be raw IDs ("om-12345", "47033...") or already
  // prefixed ("accounts/om-12345", "locations/47033..."). Strip then re-prefix
  // so every call site has a predictable resource name shape.
  const accountBare = rawAccount.replace(/^accounts\//, "");
  const locationBare = rawLocation.replace(/^locations\//, "");
  const accountName = accountBare ? `accounts/${accountBare}` : "";
  const locationName = locationBare ? `locations/${locationBare}` : "";

  return {
    auth: authClient,
    accountId: accountBare,
    locationId: locationBare,
    accountName, // "accounts/{id}"
    locationName, // "locations/{id}"
  };
}

// ─── Fetch Reviews ───────────────────────────────────

export const fetchBusinessReviews = onCall(
  { region: "us-east4", memory: "256MiB" },
  async (request) => {
    verifyAdminEmail(request.auth?.token?.email);

    const { auth, accountName, locationName } = await getBusinessClient();
    if (!locationName) {
      throw new HttpsError("failed-precondition", "Google Business locationId not configured.");
    }

    try {
      // Fetch location info — Business Profile v1 takes just "locations/{id}"
      const response = await google.mybusinessbusinessinformation({
        version: "v1",
        auth,
      }).locations.get({
        name: locationName,
        readMask: "name,title,storefrontAddress",
      });

      // Fetch reviews via the Business Profile API v1.
      // Google deprecated the legacy v4 endpoint in early 2026.
      if (!accountName) {
        throw new HttpsError("failed-precondition", "Google Business accountId required for reviews fetch.");
      }
      const reviewsUrl = `https://mybusiness.googleapis.com/v1/${accountName}/${locationName}/reviews`;
      const reviewsRes = await authClient_fetch(auth, reviewsUrl);

      const reviews = reviewsRes?.reviews || [];

      // Save to Firestore
      const batch = db.batch();
      for (const review of reviews) {
        const docRef = db.collection("business-reviews").doc(review.reviewId || review.name?.split("/").pop() || `review-${Date.now()}`);
        batch.set(docRef, {
          ...review,
          syncedAt: new Date().toISOString(),
          locationName: response.data?.title || locationName,
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

    const { auth, locationName } = await getBusinessClient();
    if (!locationName) {
      throw new HttpsError("failed-precondition", "Google Business locationId not configured.");
    }

    try {
      // Business Profile Performance API uses just "locations/{id}"
      const performanceUrl = `https://businessprofileperformance.googleapis.com/v1/${locationName}:getDailyMetricsTimeSeries`;

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
