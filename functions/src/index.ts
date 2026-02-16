/**
 * CreedaVA Cloud Functions — Main Entry
 *
 * Exports all callable/HTTP cloud functions for external service integrations.
 * These run alongside the Firebase client SDK (Firestore, Auth, AI, Data Connect).
 */

// Email
export { sendEmail, sendBulkEmail } from "./email";

// Google Calendar
export { syncBookingToCalendar, updateCalendarOnBookingChange, listCalendarEvents } from "./calendar";

// Google Ads
export { syncCampaignData } from "./ads";

// Google Search Console
export { fetchSearchConsoleData } from "./search-console";

// Google Business Profile
export { fetchBusinessReviews, fetchBusinessInsights } from "./google-business";

// Google Analytics (GA4 Data API)
export { fetchAnalyticsReport, fetchRealtimeAnalytics } from "./google-analytics";

// Google Sheets
export { exportToSheets, generateReportSheet } from "./google-sheets";

// Google Drive
export { listDriveFiles, createClientFolder, uploadReportToDrive } from "./google-drive";

// Webhooks (forms, etc.)
export { handleFormWebhook } from "./webhooks";

// Scheduled tasks
export { dailyDigest, weeklyReport, dailyGoogleSync } from "./scheduled";

// Firestore triggers (automatic sync)
export { onNewLead, onNewContact, onEmailQueued, onBookingConfirmed } from "./triggers";
