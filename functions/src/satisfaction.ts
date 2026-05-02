/**
 * Satisfaction Survey — Public-facing Cloud Function for customers to submit
 * satisfaction ratings via a unique survey link.
 *
 * Flow:
 * 1. Admin sends survey email → generates token in satisfaction-tokens collection
 * 2. Customer clicks link → public page loads token data from Firestore
 * 3. Customer submits rating → calls this Cloud Function
 * 4. Function validates token, updates customer satisfaction, marks token as used
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "./admin";

interface SubmitSatisfactionRequest {
  token: string;
  ratings: Record<string, number>;
  comment?: string;
}

export const submitSatisfaction = onCall(
  { region: "us-east4", memory: "256MiB" },
  async (request) => {
    // No auth check — this is a public endpoint for customers
    const { token, ratings, comment } = request.data as SubmitSatisfactionRequest;

    if (!token || typeof token !== "string") {
      throw new HttpsError("invalid-argument", "Missing survey token");
    }
    if (!ratings || typeof ratings !== "object" || Object.keys(ratings).length === 0) {
      throw new HttpsError("invalid-argument", "Ratings are required");
    }

    // Validate each rating value is 1-5
    for (const [key, val] of Object.entries(ratings)) {
      if (typeof val !== "number" || val < 1 || val > 5) {
        throw new HttpsError("invalid-argument", `Rating for "${key}" must be between 1 and 5`);
      }
    }

    // Fetch the token document
    const tokenDoc = await db.collection("satisfaction-tokens").doc(token).get();
    if (!tokenDoc.exists) {
      throw new HttpsError("not-found", "Invalid or expired survey link");
    }

    const tokenData = tokenDoc.data()!;

    // Validate token hasn't been used
    if (tokenData.used) {
      throw new HttpsError("already-exists", "This survey has already been submitted");
    }

    // Validate token hasn't expired
    if (tokenData.expiresAt && new Date(tokenData.expiresAt) < new Date()) {
      throw new HttpsError("deadline-exceeded", "This survey link has expired");
    }

    // Compute average rating across all questions
    const ratingValues = Object.values(ratings);
    const avgRating = Math.round((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) * 10) / 10;

    // Mark token as used with all ratings
    await db.collection("satisfaction-tokens").doc(token).update({
      used: true,
      ratings,
      rating: avgRating, // backward-compatible average
      comment: comment?.trim() || "",
      submittedAt: new Date().toISOString(),
    });

    // Update the customer's satisfaction rating (average)
    if (tokenData.customerId) {
      await db.collection("customers").doc(tokenData.customerId).update({
        satisfaction: avgRating,
        updatedAt: new Date(),
      });
    }

    return {
      success: true,
      message: "Thank you for your feedback!",
    };
  },
);
