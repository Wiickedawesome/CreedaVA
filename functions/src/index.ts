/**
 * CreedaVA Cloud Functions — Main Entry
 *
 * Exports all callable/HTTP cloud functions for external service integrations.
 * These run alongside the Firebase client SDK (Firestore, Auth, AI, Data Connect).
 */

// Email
export { sendEmail, sendBulkEmail } from "./email";

// Google Calendar
export { syncBookingToCalendar, updateCalendarOnBookingChange, retrySyncBooking, listCalendarEvents, getAvailableSlots } from "./calendar";

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

// Inbox (IMAP)
export { fetchInbox, fetchEmailMessage, listMailboxFolders, syncInboxToFirestore } from "./inbox";

// Scheduled tasks
export { weeklyReport, monthlyReport, dailyGoogleSync, cleanupAnalytics } from "./scheduled";

// Firestore triggers (automatic sync)
export { onNewLead, onNewContact, onEmailQueued, onBookingConfirmed } from "./triggers";

// Web Search & Market Intelligence (AI access to internet)
export { webSearch, competitorSearch, industryTrends } from "./web-search";

// Satisfaction Survey (public customer feedback)
export { submitSatisfaction } from "./satisfaction";

// Integration connectivity tests
export { testIntegration, verifyAllIntegrations } from "./test-integration";
