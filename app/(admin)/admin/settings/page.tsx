"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/firebase";
import { useCollection } from "@/hooks/useCollection";
import { createWithId, subscribe } from "@/lib/firebase/firestore";
import { cloudTestIntegration, cloudVerifyAllIntegrations } from "@/lib/firebase/cloud-functions";
import type { IntegrationTestResult, VerifyAllResult } from "@/lib/firebase/cloud-functions";
import { PageHeader, useToast } from "@/components/admin";
import { Button, Input } from "@/components/ui";

// ─── Types ───────────────────────────────────────────

interface Setting {
  id: string;
  key: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Integration {
  id: string;
  provider: string;
  enabled: boolean;
  config: Record<string, string>;
  lastSyncedAt?: string;
  lastTestedAt?: string;
  lastTestSuccess?: boolean;
  lastTestMessage?: string;
}

interface ProviderConfig {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  fields: { key: string; label: string; type: "text" | "password" | "email"; required: boolean; placeholder: string; description?: string }[];
  docsUrl: string;
}

// ─── SVG Icons ───────────────────────────────────────

function MailIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function CalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function BarChartIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function SearchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BuildingIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
    </svg>
  );
}

function TrendingIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function TableIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function FolderIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function WebhookIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" />
      <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06" />
      <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8H12" />
    </svg>
  );
}

// ─── Provider Configurations ─────────────────────────

const PROVIDERS: ProviderConfig[] = [
  {
    id: "email",
    label: "Email (SMTP)",
    description: "Send emails from the dashboard — follow-ups, campaigns, and notifications.",
    icon: <MailIcon />,
    fields: [
      { key: "host", label: "SMTP Host", type: "text", required: true, placeholder: "smtp.gmail.com" },
      { key: "port", label: "Port", type: "text", required: true, placeholder: "587" },
      { key: "user", label: "Primary Email Address", type: "email", required: true, placeholder: "admin@creedava.com" },
      { key: "aliases", label: "Sender Aliases (Comma Separated)", type: "text", required: false, placeholder: "hello@creedava.com, team@creedava.com", description: "Use these as 'From' addresses. Add them as aliases in your Google Admin console." },
      { key: "pass", label: "App Password", type: "password", required: true, placeholder: "16-char app password" },
    ],
    docsUrl: "https://support.google.com/accounts/answer/185833",
  },
  {
    id: "google-calendar",
    label: "Google Calendar",
    description: "Auto-sync bookings to Google Calendar.",
    icon: <CalendarIcon />,
    fields: [
      { key: "calendarId", label: "Calendar ID", type: "text", required: true, placeholder: "admin@creedava.com" },
      { key: "serviceAccountEmail", label: "Service Account Email", type: "email", required: false, placeholder: "cal@creeda-va.iam.gserviceaccount.com" },
      { key: "serviceAccountKey", label: "Service Account JSON Key", type: "password", required: true, placeholder: "Paste full JSON key" },
    ],
    docsUrl: "https://console.cloud.google.com/apis/library/calendar-json.googleapis.com",
  },
  {
    id: "google-ads",
    label: "Google Ads",
    description: "Sync campaign data — impressions, clicks, conversions, and spend.",
    icon: <BarChartIcon />,
    fields: [
      { key: "developerToken", label: "Developer Token", type: "password", required: true, placeholder: "From Google Ads API Center" },
      { key: "clientId", label: "OAuth Client ID", type: "text", required: true, placeholder: "xxx.apps.googleusercontent.com" },
      { key: "clientSecret", label: "OAuth Client Secret", type: "password", required: true, placeholder: "GOCSPX-xxx" },
      { key: "refreshToken", label: "Refresh Token", type: "password", required: true, placeholder: "1//0xxx" },
      { key: "customerId", label: "Customer ID", type: "text", required: true, placeholder: "123-456-7890" },
    ],
    docsUrl: "https://developers.google.com/google-ads/api/docs/first-call/overview",
  },
  {
    id: "search-console",
    label: "Search Console",
    description: "Fetch real SEO data — queries, impressions, CTR, and positions.",
    icon: <SearchIcon />,
    fields: [
      { key: "siteUrl", label: "Site URL", type: "text", required: true, placeholder: "https://creedava.com" },
      { key: "serviceAccountEmail", label: "Service Account Email", type: "email", required: false, placeholder: "seo@creeda-va.iam.gserviceaccount.com" },
      { key: "serviceAccountKey", label: "Service Account JSON Key", type: "password", required: true, placeholder: "Paste full JSON key" },
    ],
    docsUrl: "https://console.cloud.google.com/apis/library/searchconsole.googleapis.com",
  },
  {
    id: "google-business",
    label: "Business Profile",
    description: "Manage reviews, local SEO, and business posts.",
    icon: <BuildingIcon />,
    fields: [
      { key: "accountId", label: "Account ID", type: "text", required: true, placeholder: "accounts/123456789" },
      { key: "locationId", label: "Location ID", type: "text", required: true, placeholder: "locations/987654321" },
      { key: "serviceAccountEmail", label: "Service Account Email", type: "email", required: false, placeholder: "gmb@creeda-va.iam.gserviceaccount.com" },
      { key: "serviceAccountKey", label: "Service Account JSON Key", type: "password", required: true, placeholder: "Paste full JSON key" },
    ],
    docsUrl: "https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com",
  },
  {
    id: "google-analytics",
    label: "Analytics Admin",
    description: "GA4 properties, data streams, and audience definitions.",
    icon: <TrendingIcon />,
    fields: [
      { key: "propertyId", label: "GA4 Property ID", type: "text", required: true, placeholder: "properties/123456789" },
      { key: "serviceAccountEmail", label: "Service Account Email", type: "email", required: false, placeholder: "ga@creeda-va.iam.gserviceaccount.com" },
      { key: "serviceAccountKey", label: "Service Account JSON Key", type: "password", required: true, placeholder: "Paste full JSON key" },
    ],
    docsUrl: "https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com",
  },
  {
    id: "google-sheets",
    label: "Google Sheets",
    description: "Export CRM data and reports to Sheets automatically.",
    icon: <TableIcon />,
    fields: [
      { key: "spreadsheetId", label: "Spreadsheet ID", type: "text", required: false, placeholder: "Auto-created if blank" },
      { key: "serviceAccountEmail", label: "Service Account Email", type: "email", required: false, placeholder: "sheets@creeda-va.iam.gserviceaccount.com" },
      { key: "serviceAccountKey", label: "Service Account JSON Key", type: "password", required: true, placeholder: "Paste full JSON key" },
    ],
    docsUrl: "https://console.cloud.google.com/apis/library/sheets.googleapis.com",
  },
  {
    id: "google-drive",
    label: "Google Drive",
    description: "Store client files, proposals, and reports in shared folders.",
    icon: <FolderIcon />,
    fields: [
      { key: "folderId", label: "Root Folder ID", type: "text", required: true, placeholder: "Drive folder ID for CreedaVA files" },
      { key: "serviceAccountEmail", label: "Service Account Email", type: "email", required: false, placeholder: "drive@creeda-va.iam.gserviceaccount.com" },
      { key: "serviceAccountKey", label: "Service Account JSON Key", type: "password", required: true, placeholder: "Paste full JSON key" },
    ],
    docsUrl: "https://console.cloud.google.com/apis/library/drive.googleapis.com",
  },
  {
    id: "webhooks",
    label: "Form Webhooks",
    description: "Receive data from Google Forms, Typeform, etc.",
    icon: <WebhookIcon />,
    fields: [
      { key: "apiKey", label: "Webhook API Key", type: "password", required: false, placeholder: "Optional — secure your endpoint" },
    ],
    docsUrl: "#",
  },
];

// ─── Component ───────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: settings, loading: settingsLoading, add, edit } = useCollection<Setting>("settings");
const { toast } = useToast();

  // ─── General settings state ─────────
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [companyName, setCompanyName] = useState("CreedaVA");
  const [companyEmail, setCompanyEmail] = useState("");
  const [timezone, setTimezone] = useState("America/Belize");
  const [saving, setSaving] = useState(false);

  // ─── Integrations state (REAL-TIME listener) ─────────────
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(true);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, IntegrationTestResult>>({});
  const [verifyingAll, setVerifyingAll] = useState(false);
  const hasAutoVerified = useRef(false);

  // ── Real-time listener for integrations collection ──
  // This ensures test results from Cloud Functions push to the UI immediately
  useEffect(() => {
    if (!user || !user.email?.endsWith("@creedava.com")) {
      setIntegrationsLoading(false);
      return;
    }

    const unsubscribe = subscribe<Integration>("integrations", (data) => {
      setIntegrations(data);
      setIntegrationsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load general settings
  useEffect(() => {
    const existing = settings.find((s) => s.key === "business");
    if (existing) {
      try {
        const parsed = JSON.parse(existing.value);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.companyEmail) setCompanyEmail(parsed.companyEmail);
        if (parsed.timezone) setTimezone(parsed.timezone);
        if (parsed.emailNotifications !== undefined) setEmailNotifications(parsed.emailNotifications);
        if (parsed.weeklyDigest !== undefined) setWeeklyDigest(parsed.weeklyDigest);
      } catch { /* ignore parse errors */ }
    }
  }, [settings]);

  // Pre-fill integration form data from live Firestore data
  useEffect(() => {
    const prefilled: Record<string, Record<string, string>> = {};
    for (const integration of integrations) {
      prefilled[integration.provider] = integration.config || {};
    }
    setFormData(prefilled);
  }, [integrations]);

  // ── Auto-verify all enabled integrations on first load ──
  // Runs once after integrations load so status badges are always current
  useEffect(() => {
    if (integrationsLoading || hasAutoVerified.current) return;
    const enabledCount = integrations.filter((i) => i.enabled).length;
    if (enabledCount === 0) return;
    hasAutoVerified.current = true;

    // Silent background verify — no toast spam
    cloudVerifyAllIntegrations()
      .then((res: VerifyAllResult) => {
        const resultMap: Record<string, IntegrationTestResult> = {};
        for (const r of res.results) {
          resultMap[r.provider] = r;
        }
        setTestResults(resultMap);
      })
      .catch(() => {
        // Silently fail — user can manually verify
      });
  }, [integrationsLoading, integrations]);

  // ─── Handlers ──────────────────────

  async function handleSaveGeneral() {
    setSaving(true);
    try {
      const existing = settings.find((s) => s.key === "business");
      const value = JSON.stringify({ companyName, companyEmail, timezone, emailNotifications, weeklyDigest });
      if (existing) {
        await edit(existing.id, { value });
      } else {
        await add({ key: "business", value });
      }
      toast("Settings saved");
    } catch {
      toast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  }

  function getIntegration(providerId: string) {
    return integrations.find((i) => i.provider === providerId);
  }

  function isEnabled(providerId: string) {
    return getIntegration(providerId)?.enabled ?? false;
  }

  function getFieldValue(providerId: string, fieldKey: string) {
    return formData[providerId]?.[fieldKey] || "";
  }

  function setFieldValue(providerId: string, fieldKey: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], [fieldKey]: value },
    }));
  }

  async function handleSaveIntegration(providerId: string) {
    setSavingProvider(providerId);
    try {
      const config = formData[providerId] || {};
      // Use provider name as document ID so Cloud Functions can find it
      await createWithId("integrations", providerId, {
        provider: providerId,
        enabled: true,
        config,
      });
      // Real-time listener auto-updates UI — no manual refetch needed
      toast(`${providerId} integration saved`);

      // Auto-test after saving to immediately verify connection
      setTestingProvider(providerId);
      try {
        const result = await cloudTestIntegration(providerId);
        setTestResults((prev) => ({ ...prev, [providerId]: result }));
        if (result.success) {
          toast(`${providerId} — ${result.details || "Connected"}`);
        } else {
          toast(`${providerId} — ${result.details || result.message}`, "error");
        }
      } catch {
        // Test failed but save succeeded — user can re-test manually
      } finally {
        setTestingProvider(null);
      }
    } catch {
      toast(`Failed to save ${providerId}`, "error");
    } finally {
      setSavingProvider(null);
    }
  }

  async function handleTestConnection(providerId: string) {
    setTestingProvider(providerId);
    try {
      const result = await cloudTestIntegration(providerId);
      setTestResults((prev) => ({ ...prev, [providerId]: result }));
      if (result.success) {
        toast(`${providerId} — ${result.details || "Connected"}`);
      } else {
        toast(`${providerId} — ${result.details || result.message}`, "error");
      }
      // Cloud Function persists to Firestore → real-time listener picks it up
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Test failed";
      const failResult: IntegrationTestResult = {
        success: false,
        provider: providerId,
        message: "Error",
        details: msg,
        testedAt: new Date().toISOString(),
      };
      setTestResults((prev) => ({ ...prev, [providerId]: failResult }));
      toast(`${providerId} — ${msg}`, "error");
    } finally {
      setTestingProvider(null);
    }
  }

  async function handleVerifyAll() {
    setVerifyingAll(true);
    try {
      const res = await cloudVerifyAllIntegrations();
      const resultMap: Record<string, IntegrationTestResult> = {};
      for (const r of res.results) {
        resultMap[r.provider] = r;
      }
      setTestResults(resultMap);
      toast(`Verified: ${res.summary.connected} connected, ${res.summary.failed} failed, ${res.summary.unconfigured} not configured`);
    } catch {
      toast("Failed to verify integrations", "error");
    } finally {
      setVerifyingAll(false);
    }
  }

  async function handleToggle(providerId: string) {
    const existing = getIntegration(providerId);
    if (!existing) return;
    try {
      await createWithId("integrations", providerId, {
        provider: providerId,
        enabled: !existing.enabled,
      });
      // Real-time listener auto-updates UI
      toast(`${providerId} ${existing.enabled ? "disabled" : "enabled"}`);
    } catch {
      toast(`Failed to toggle ${providerId}`, "error");
    }
  }

  const loading = settingsLoading || integrationsLoading;
  const connectedCount = PROVIDERS.filter((p) => {
    const testResult = testResults[p.id];
    const integration = getIntegration(p.id);
    // Count as connected only if verified via test
    return (testResult?.success ?? integration?.lastTestSuccess) === true;
  }).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Profile, preferences, and integrations" />
        <div className="flex items-center justify-center py-20 text-gray-50">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Profile, preferences, and integrations" />

      {/* ─── Profile ──────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <svg className="w-5 h-5 text-gray-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Profile</h2>
        </div>
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <Image 
              src={user.photoURL} 
              alt={user.displayName || "User"} 
              width={56} 
              height={56} 
              className="w-14 h-14 rounded-full" 
              referrerPolicy="no-referrer" 
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-lg">
              {user?.displayName?.charAt(0) ?? "?"}
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{user?.displayName ?? "Unknown"}</p>
            <p className="text-sm text-gray-60">{user?.email ?? ""}</p>
            <p className="text-xs text-gray-40 mt-0.5">Signed in via Google</p>
          </div>
        </div>
      </section>

      {/* ─── Business Information ─────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <svg className="w-5 h-5 text-gray-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Business</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
          <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <Input label="Contact Email" type="email" placeholder="hello@creedava.com" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} />
          <div className="sm:col-span-2">
            <label htmlFor="company-timezone" className="text-xs font-medium text-gray-70 mb-1 block">Timezone</label>
            <select
              id="company-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-border bg-gray-10/50 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="America/Belize">America / Belize (CST)</option>
              <option value="America/New_York">America / New York (EST)</option>
              <option value="America/Chicago">America / Chicago (CST)</option>
              <option value="America/Denver">America / Denver (MST)</option>
              <option value="America/Los_Angeles">America / Los Angeles (PST)</option>
              <option value="Europe/London">Europe / London (GMT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </section>

      {/* ─── Notifications ────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <svg className="w-5 h-5 text-gray-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Notifications</h2>
        </div>
        <div className="space-y-4 max-w-lg">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-gray-80">Email Notifications</p>
              <p className="text-xs text-gray-40">Alerts for new leads and bookings</p>
            </div>
            <span
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${emailNotifications ? "bg-primary" : "bg-gray-30"}`}
            >
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="sr-only"
                aria-label="Email notifications"
              />
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-card shadow-sm transition-transform ${emailNotifications ? "translate-x-5" : "translate-x-0"}`}
              />
            </span>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-gray-80">Weekly Digest</p>
              <p className="text-xs text-gray-40">Weekly summary of CRM activity</p>
            </div>
            <span
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${weeklyDigest ? "bg-primary" : "bg-gray-30"}`}
            >
              <input
                type="checkbox"
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
                className="sr-only"
                aria-label="Weekly digest"
              />
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-card shadow-sm transition-transform ${weeklyDigest ? "translate-x-5" : "translate-x-0"}`}
              />
            </span>
          </label>
        </div>
      </section>

      {/* ─── Save General ─────────────────────────────── */}
      <div className="flex justify-end">
        <Button onClick={handleSaveGeneral} isLoading={saving}>Save Settings</Button>
      </div>

      {/* ─── Divider ──────────────────────────────────── */}
      <hr className="border-border" />

      {/* ─── Integrations ─────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Integrations</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-40">{connectedCount} of {PROVIDERS.length} connected</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleVerifyAll}
              disabled={verifyingAll}
            >
              {verifyingAll ? (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" /></svg>
                  Verifying…
                </span>
              ) : (
                "Verify All"
              )}
            </Button>
          </div>
        </div>

        {/* Webhook URL */}
        <div className="rounded-lg border border-border bg-gray-10 px-4 py-3 mb-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-gray-70">Webhook URL</span>
          <code className="bg-gray-10/80 border border-border px-2 py-0.5 rounded text-xs font-mono text-gray-60">
            https://us-east4-creeda-va.cloudfunctions.net/handleFormWebhook
          </code>
        </div>

        {/* Provider list */}
        <div className="space-y-2">
          {PROVIDERS.map((provider) => {
            const expanded = expandedProvider === provider.id;
            const enabled = isEnabled(provider.id);

            return (
              <div
                key={provider.id}
                className={`rounded-xl border transition-all ${
                  expanded ? "border-primary/30 shadow-sm" : "border-border"
                } bg-card`}
              >
                {/* Header row */}
                <button
                  className="flex w-full items-center gap-4 p-4 text-left"
                  onClick={() => setExpandedProvider(expanded ? null : provider.id)}
                >
                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${enabled ? "bg-primary/10 text-primary" : "bg-gray-10 text-gray-40"}`}>
                    {provider.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm">{provider.label}</span>
                      {(() => {
                        const testResult = testResults[provider.id];
                        const integration = getIntegration(provider.id);
                        const lastTestSuccess = testResult?.success ?? integration?.lastTestSuccess;
                        const isTesting = testingProvider === provider.id;

                        if (isTesting) {
                          return (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                              <svg className="w-2.5 h-2.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" /></svg>
                              Testing…
                            </span>
                          );
                        }
                        if (lastTestSuccess === true) {
                          return (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              Verified
                            </span>
                          );
                        }
                        if (lastTestSuccess === false) {
                          return (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                              Failed
                            </span>
                          );
                        }
                        if (enabled) {
                          return (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
                              Untested
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <p className="text-xs text-gray-50 truncate">{provider.description}</p>
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-40 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded config */}
                {expanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {provider.fields.map((field) => (
                        <div key={field.key} className={field.key === "serviceAccountKey" ? "sm:col-span-2" : ""}>
                          <label className="text-xs font-medium text-gray-70 mb-1 block">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          {field.key === "serviceAccountKey" ? (
                            <textarea
                              className="w-full rounded-lg border border-border bg-gray-10 p-2.5 text-sm font-mono text-foreground focus:border-primary focus:outline-none min-h-18 resize-y"
                              placeholder={field.placeholder}
                              value={getFieldValue(provider.id, field.key)}
                              onChange={(e) => setFieldValue(provider.id, field.key, e.target.value)}
                            />
                          ) : (
                            <Input
                              type={field.type}
                              placeholder={field.placeholder}
                              value={getFieldValue(provider.id, field.key)}
                              onChange={(e) => setFieldValue(provider.id, field.key, e.target.value)}
                            />
                          )}
                          {field.description && <p className="text-[10px] text-gray-50 mt-1">{field.description}</p>}
                        </div>
                      ))}
                    </div>

                    {/* Test result detail */}
                    {(() => {
                      const testResult = testResults[provider.id];
                      const integration = getIntegration(provider.id);
                      const result = testResult || (integration?.lastTestMessage ? {
                        success: integration.lastTestSuccess ?? false,
                        details: integration.lastTestMessage,
                        testedAt: integration.lastTestedAt,
                      } : null);
                      if (!result) return null;
                      return (
                        <div className={`rounded-lg px-3 py-2 text-xs ${
                          result.success ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-300"
                        }`}>
                          <p className="font-medium">{result.success ? "✓ Connected" : "✗ Connection failed"}</p>
                          {result.details && <p className="mt-0.5 opacity-80 break-all">{result.details}</p>}
                          {result.testedAt && <p className="mt-1 text-[10px] opacity-50">Tested {new Date(result.testedAt).toLocaleString()}</p>}
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-3 pt-1">
                      <Button size="sm" onClick={() => handleSaveIntegration(provider.id)} disabled={savingProvider === provider.id}>
                        {savingProvider === provider.id ? "Saving..." : enabled ? "Update" : "Connect"}
                      </Button>
                      {enabled && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTestConnection(provider.id)}
                          disabled={testingProvider === provider.id}
                        >
                          {testingProvider === provider.id ? "Testing..." : "Test Connection"}
                        </Button>
                      )}
                      {enabled && (
                        <Button variant="secondary" size="sm" onClick={() => handleToggle(provider.id)}>Disable</Button>
                      )}
                      {provider.docsUrl !== "#" && (
                        <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline ml-auto">
                          Docs
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Danger Zone ──────────────────────────────── */}
      <section className="rounded-xl border border-red-500/60 bg-red-500/5 p-6">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h2 className="text-sm font-semibold text-red-600 tracking-wide uppercase">Danger Zone</h2>
        </div>
        <p className="text-xs text-gray-50 mb-4">These actions are irreversible. Proceed with caution.</p>
        <Button variant="danger" size="sm" disabled>Delete All Data</Button>
      </section>
    </div>
  );
}
