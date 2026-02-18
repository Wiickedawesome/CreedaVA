/**
 * Cloud Functions client — calls Firebase Cloud Functions from the admin UI.
 *
 * Provides typed wrappers for all cloud function endpoints:
 * - Email (send, bulk send)
 * - Google Calendar (list events)
 * - Google Ads (sync campaigns)
 * - Search Console (fetch SEO data)
 * - Google Business Profile (reviews, insights)
 * - Google Analytics (GA4 reports, realtime)
 * - Google Sheets (CRM export, reports)
 * - Google Drive (files, client folders)
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./config";

// Initialize Functions SDK (same region as our Cloud Functions)
const functions = getFunctions(app, "us-east4");

// ─── Email ───────────────────────────────────────────

interface SendEmailParams {
  to: string;
  from?: string;
  subject: string;
  html: string;
  replyTo?: string;
  cc?: string;
  bcc?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId: string;
}

interface BulkEmailParams {
  recipients: string[];
  subject: string;
  html: string;
  replyTo?: string;
}

interface BulkEmailResult {
  success: boolean;
  sent: number;
  failed: number;
  details: { email: string; success: boolean; error?: string }[];
}

export async function cloudSendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const fn = httpsCallable<SendEmailParams, SendEmailResult>(functions, "sendEmail");
  const result = await fn(params);
  return result.data;
}

export async function cloudSendBulkEmail(params: BulkEmailParams): Promise<BulkEmailResult> {
  const fn = httpsCallable<BulkEmailParams, BulkEmailResult>(functions, "sendBulkEmail");
  const result = await fn(params);
  return result.data;
}

// ─── Inbox (IMAP) ────────────────────────────────────

interface FetchInboxParams {
  folder?: string;
  limit?: number;
  page?: number;
  filter?: string;
}

interface InboxMessageResult {
  uid: number;
  messageId: string;
  from: string;
  fromName: string;
  to: string;
  cc?: string;
  subject: string;
  date: string;
  preview: string;
  bodyHtml?: string;
  bodyText?: string;
  seen: boolean;
  flagged: boolean;
  hasAttachments: boolean;
  attachments?: { filename: string; contentType: string; size: number }[];
}

interface FetchInboxResult {
  success: boolean;
  messages: InboxMessageResult[];
  total: number;
  folder: string;
  page: number;
  aliases?: string[];
}

interface FetchEmailResult {
  success: boolean;
  message: InboxMessageResult;
}

interface MailboxFolder {
  name: string;
  path: string;
  specialUse: string | null;
  listed: boolean;
}

interface SyncInboxResult {
  success: boolean;
  synced: number;
}

export async function cloudFetchInbox(params?: FetchInboxParams): Promise<FetchInboxResult> {
  const fn = httpsCallable<FetchInboxParams | undefined, FetchInboxResult>(functions, "fetchInbox");
  const result = await fn(params);
  return result.data;
}

export async function cloudFetchEmailMessage(uid: number, folder?: string): Promise<FetchEmailResult> {
  const fn = httpsCallable<{ uid: number; folder?: string }, FetchEmailResult>(functions, "fetchEmailMessage");
  const result = await fn({ uid, folder });
  return result.data;
}

export async function cloudListMailboxFolders(): Promise<MailboxFolder[]> {
  const fn = httpsCallable<void, { success: boolean; folders: MailboxFolder[] }>(functions, "listMailboxFolders");
  const result = await fn();
  return result.data.folders;
}

export async function cloudSyncInbox(): Promise<SyncInboxResult> {
  const fn = httpsCallable<void, SyncInboxResult>(functions, "syncInboxToFirestore");
  const result = await fn();
  return result.data;
}

// ─── Google Calendar ─────────────────────────────────

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
  link?: string;
  status?: string;
  attendees?: { email: string; name?: string; response?: string }[];
}

interface CalendarEventsResult {
  events: CalendarEvent[];
}

export async function cloudListCalendarEvents(): Promise<CalendarEvent[]> {
  const fn = httpsCallable<void, CalendarEventsResult>(functions, "listCalendarEvents");
  const result = await fn();
  return result.data.events;
}

// ─── Google Ads ──────────────────────────────────────

interface AdsSyncResult {
  success: boolean;
  campaignsSynced: number;
  syncedAt: string;
}

export async function cloudSyncCampaignData(): Promise<AdsSyncResult> {
  const fn = httpsCallable<void, AdsSyncResult>(functions, "syncCampaignData");
  const result = await fn();
  return result.data;
}

// ─── Google Search Console ───────────────────────────

interface SearchQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchConsoleResult {
  success: boolean;
  period: { startDate: string; endDate: string };
  queries: SearchQuery[];
  pages: SearchPage[];
  summary: {
    totalClicks: number;
    totalImpressions: number;
    avgCTR: number;
    avgPosition: number;
  };
}

export async function cloudFetchSearchConsoleData(
  days = 28,
): Promise<SearchConsoleResult> {
  const fn = httpsCallable<{ days: number }, SearchConsoleResult>(
    functions,
    "fetchSearchConsoleData",
  );
  const result = await fn({ days });
  return result.data;
}

// ─── Integration Status Check ────────────────────────

export type IntegrationProvider =
  | "email"
  | "google-calendar"
  | "google-ads"
  | "search-console"
  | "webhooks";

export interface IntegrationConfig {
  provider: IntegrationProvider;
  enabled: boolean;
  config: Record<string, string>;
  lastSyncedAt?: string;
}

// ─── Google Business Profile ─────────────────────────

interface BusinessReviewsResult {
  success: boolean;
  reviewCount: number;
  locationName: string;
  syncedAt: string;
}

interface BusinessInsightsResult {
  success: boolean;
  metrics: Record<string, number>;
  period: { startDate: string; endDate: string };
}

export async function cloudFetchBusinessReviews(): Promise<BusinessReviewsResult> {
  const fn = httpsCallable<void, BusinessReviewsResult>(functions, "fetchBusinessReviews");
  const result = await fn();
  return result.data;
}

export async function cloudFetchBusinessInsights(): Promise<BusinessInsightsResult> {
  const fn = httpsCallable<void, BusinessInsightsResult>(functions, "fetchBusinessInsights");
  const result = await fn();
  return result.data;
}

// ─── Google Analytics (GA4 Data API) ─────────────────

interface GADailyData {
  date: string;
  activeUsers: number;
  sessions: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  newUsers: number;
  conversions: number;
}

interface GATopPage {
  path: string;
  pageViews: number;
  users: number;
  avgDuration: number;
}

interface GATrafficSource {
  channel: string;
  sessions: number;
  users: number;
  conversions: number;
}

interface GAReportResult {
  success: boolean;
  summary: {
    totalUsers: number;
    totalSessions: number;
    totalPageViews: number;
    avgBounceRate: number;
    avgSessionDuration: number;
    totalNewUsers: number;
    totalConversions: number;
  };
  dailyData: GADailyData[];
  topPages: GATopPage[];
  trafficSources: GATrafficSource[];
  period: { startDate: string; endDate: string };
}

interface GARealtimeResult {
  success: boolean;
  activeUsers: number;
  topPages: { page: string; activeUsers: number; pageViews: number }[];
}

export async function cloudFetchAnalyticsReport(days = 30): Promise<GAReportResult> {
  const fn = httpsCallable<{ days: number }, GAReportResult>(functions, "fetchAnalyticsReport");
  const result = await fn({ days });
  return result.data;
}

export async function cloudFetchRealtimeAnalytics(): Promise<GARealtimeResult> {
  const fn = httpsCallable<void, GARealtimeResult>(functions, "fetchRealtimeAnalytics");
  const result = await fn();
  return result.data;
}

// ─── Google Sheets ───────────────────────────────────

interface SheetsExportResult {
  success: boolean;
  rowCount: number;
  spreadsheetId: string;
  spreadsheetUrl: string;
  syncedAt: string;
  message?: string;
}

interface ReportSheetResult {
  success: boolean;
  spreadsheetUrl: string;
  sheetTitle: string;
}

export async function cloudExportToSheets(
  collection: "leads" | "customers" | "contacts" | "bookings" | "tasks" | "campaigns" | "blog",
): Promise<SheetsExportResult> {
  const fn = httpsCallable<{ collection: string }, SheetsExportResult>(functions, "exportToSheets");
  const result = await fn({ collection });
  return result.data;
}

export async function cloudGenerateReportSheet(): Promise<ReportSheetResult> {
  const fn = httpsCallable<void, ReportSheetResult>(functions, "generateReportSheet");
  const result = await fn();
  return result.data;
}

// ─── Google Drive ────────────────────────────────────

interface DriveFile {
  id: string;
  name: string;
  type: "file" | "folder";
  mimeType: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  webLink: string;
  icon: string;
  thumbnail: string;
}

interface DriveListResult {
  success: boolean;
  files: DriveFile[];
  folderId: string;
}

interface ClientFolderResult {
  success: boolean;
  folderId: string;
  folderUrl: string;
  subfolders: { name: string; id: string }[];
}

interface UploadResult {
  success: boolean;
  fileId: string;
  webLink: string;
  downloadLink: string;
}

export async function cloudListDriveFiles(folderId?: string): Promise<DriveListResult> {
  const fn = httpsCallable<{ folderId?: string }, DriveListResult>(functions, "listDriveFiles");
  const result = await fn({ folderId });
  return result.data;
}

export async function cloudCreateClientFolder(
  clientName: string,
  clientId?: string,
): Promise<ClientFolderResult> {
  const fn = httpsCallable<{ clientName: string; clientId?: string }, ClientFolderResult>(
    functions,
    "createClientFolder",
  );
  const result = await fn({ clientName, clientId });
  return result.data;
}

export async function cloudUploadReportToDrive(
  fileName: string,
  content: string, // base64
  mimeType?: string,
  folderId?: string,
): Promise<UploadResult> {
  const fn = httpsCallable<
    { fileName: string; content: string; mimeType?: string; folderId?: string },
    UploadResult
  >(functions, "uploadReportToDrive");
  const result = await fn({ fileName, content, mimeType, folderId });
  return result.data;
}

// ─── Web Search & Market Intelligence ────────────────

interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface WebSearchResponse {
  success: boolean;
  query: string;
  results: WebSearchResult[];
  summary: string;
  searchedAt: string;
}

interface CompetitorSearchResponse {
  success: boolean;
  competitors: Record<string, WebSearchResult[]>;
}

interface IndustryTrendsResponse {
  success: boolean;
  trends: WebSearchResult[];
  keywords: WebSearchResult[];
}

/** Search the web for real-time market data */
export async function cloudWebSearch(
  query: string,
  numResults = 5,
): Promise<WebSearchResponse> {
  const fn = httpsCallable<
    { query: string; numResults?: number },
    WebSearchResponse
  >(functions, "webSearch");
  const result = await fn({ query, numResults });
  return result.data;
}

/** Search for competitor news and updates */
export async function cloudCompetitorSearch(
  competitor?: string,
): Promise<CompetitorSearchResponse> {
  const fn = httpsCallable<
    { competitor?: string },
    CompetitorSearchResponse
  >(functions, "competitorSearch");
  const result = await fn({ competitor });
  return result.data;
}

/** Get latest VA industry trends */
export async function cloudIndustryTrends(): Promise<IndustryTrendsResponse> {
  const fn = httpsCallable<void, IndustryTrendsResponse>(
    functions,
    "industryTrends",
  );
  const result = await fn();
  return result.data;
}

// ─── Satisfaction Survey ─────────────────────────────

interface SubmitSatisfactionParams {
  token: string;
  ratings: Record<string, number>;
  comment?: string;
}

interface SubmitSatisfactionResult {
  success: boolean;
  message: string;
}

export async function cloudSubmitSatisfaction(params: SubmitSatisfactionParams): Promise<SubmitSatisfactionResult> {
  const fn = httpsCallable<SubmitSatisfactionParams, SubmitSatisfactionResult>(functions, "submitSatisfaction");
  const result = await fn(params);
  return result.data;
}

// ─── Integration Test ────────────────────────────────

export interface IntegrationTestResult {
  success: boolean;
  provider: string;
  message: string;
  details?: string;
  testedAt: string;
}

export interface VerifyAllResult {
  results: IntegrationTestResult[];
  summary: { total: number; connected: number; failed: number; unconfigured: number };
}

export async function cloudTestIntegration(provider: string): Promise<IntegrationTestResult> {
  const fn = httpsCallable<{ provider: string }, IntegrationTestResult>(functions, "testIntegration");
  const result = await fn({ provider });
  return result.data;
}

export async function cloudVerifyAllIntegrations(): Promise<VerifyAllResult> {
  const fn = httpsCallable<Record<string, never>, VerifyAllResult>(functions, "verifyAllIntegrations");
  const result = await fn({});
  return result.data;
}
