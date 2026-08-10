/**
 * Report delivery trigger.
 *
 * The SEO agent synthesizer writes a /report-deliveries doc every Sunday
 * with { kind: "seo-weekly", recipients: [...], status: "pending" }.
 * This trigger picks it up and sends the email via the configured SMTP
 * transport, then marks the doc "sent" (or "error" on failure).
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db, getEmailTransport, getIntegrationConfig } from "./admin";

interface ReportDeliveryDoc {
  reportId?: string;
  kind?: string;
  recipients?: string[];
  status?: string;
}

export const onReportDeliveryCreated = onDocumentCreated(
  { document: "report-deliveries/{docId}", region: "us-east4" },
  async (event) => {
    const data = event.data?.data() as ReportDeliveryDoc | undefined;
    if (!data) return;
    if (data.status !== "pending") return;
    if (data.kind !== "seo-weekly") return;

    const { reportId, recipients } = data;
    if (!reportId || !recipients?.length) {
      await event.data!.ref.set(
        { status: "error", error: "Missing reportId or recipients", updatedAt: new Date() },
        { merge: true },
      );
      return;
    }

    // Fetch the report doc for its summary content.
    let reportData: Record<string, unknown> | null = null;
    try {
      const snap = await db.collection("reports").doc(reportId).get();
      if (snap.exists) reportData = snap.data() as Record<string, unknown>;
    } catch (err) {
      console.warn("[report-delivery] failed to fetch report doc:", err);
    }

    const summary = reportData?.summary as Record<string, unknown> | undefined;
    const weekEnd = summary?.weekEnd
      ? new Date(summary.weekEnd as string).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : new Date().toLocaleDateString();

    const html = buildSeoWeeklySummaryEmail(summary ?? {}, weekEnd);

    try {
      const [transport, emailConfig] = await Promise.all([
        getEmailTransport(),
        getIntegrationConfig("email"),
      ]);

      if (!transport) {
        await event.data!.ref.set(
          { status: "error", error: "Email integration not enabled", updatedAt: new Date() },
          { merge: true },
        );
        return;
      }

      const from = `"CreedaVA SEO Agent" <${emailConfig?.config.user || "admin@creedava.com"}>`;
      await transport.sendMail({
        from,
        to: recipients.join(", "),
        subject: `SEO Weekly Summary — ${weekEnd}`,
        html,
      });

      await event.data!.ref.set(
        { status: "sent", sentAt: new Date(), updatedAt: new Date() },
        { merge: true },
      );
      console.log(`[report-delivery] SEO weekly sent to ${recipients.join(", ")}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[report-delivery] email send failed:", message);
      await event.data!.ref.set(
        { status: "error", error: message, updatedAt: new Date() },
        { merge: true },
      );
    }
  },
);

// ─── Email template ─────────────────────────────────

function row(label: string, value: unknown): string {
  return `<tr>
    <td style="padding:8px;color:#444;">${label}</td>
    <td style="padding:8px;font-weight:bold;text-align:right;">${value ?? 0}</td>
  </tr>`;
}

function buildSeoWeeklySummaryEmail(
  summary: Record<string, unknown>,
  weekEnd: string,
): string {
  const blogDrafts = summary.blogDrafts as { draftsWritten?: number } | undefined;
  const internalLinks = summary.internalLinks as {
    linksInserted?: number;
    suggestionsWritten?: number;
  } | undefined;

  return `
<div style="font-family:Roboto,sans-serif;max-width:620px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#005148,#002D72);color:white;padding:24px;border-radius:12px 12px 0 0;">
    <h1 style="margin:0;font-size:20px;">🔍 SEO Agent — Weekly Summary</h1>
    <p style="margin:6px 0 0;opacity:0.8;">Week ending ${weekEnd}</p>
  </div>
  <div style="padding:24px;background:#f9fbff;border:1px solid #e0e8f5;">
    <h2 style="color:#002D72;font-size:15px;margin:0 0 8px;">Findings this week</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      ${row("On-page audits", summary.audits)}
      ${row("Keyword gap signals", summary.gaps)}
      ${row("Citation audits", summary.citations)}
      ${row("Backlink prospects found", summary.prospects)}
      ${row("Rank history snapshots", summary.ranks)}
    </table>
    <h2 style="color:#002D72;font-size:15px;margin:0 0 8px;">Actions taken</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      ${row("SEO tasks written", summary.tasksWritten)}
      ${row("Content briefs created", summary.briefsWritten)}
      ${row("Outreach email drafts", summary.outreachWritten)}
      ${row("Blog drafts generated", blogDrafts?.draftsWritten ?? 0)}
      ${row("Internal links inserted", internalLinks?.linksInserted ?? 0)}
      ${row("Internal link suggestions", internalLinks?.suggestionsWritten ?? 0)}
    </table>
    <p style="font-size:13px;color:#666;margin:0;">
      Review tasks → <a href="https://creedava.com/admin/seo?section=agent" style="color:#005148;">SEO Hub → Agent tab</a><br>
      Review outreach → <a href="https://creedava.com/admin/seo?section=outreach" style="color:#005148;">SEO Hub → Outreach tab</a>
    </p>
  </div>
  <div style="padding:12px;text-align:center;color:#999;font-size:12px;">
    CreedaVA SEO Agent — automated weekly digest
  </div>
</div>`;
}
