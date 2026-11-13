/**
 * Sunday synthesizer skill.
 *
 * Reads the past 7 days of findings from all collections, dedupes, prioritizes,
 * and writes:
 *   - upserted /seo-tasks docs (the agent's "to-do list")
 *   - /content-briefs for striking-distance keywords
 *   - /outreach-emails drafts for top backlink-prospects
 *   - a /reports doc summarizing the week
 *
 * Quota: 0 Custom Search queries. Uses Gemini for prose generation only when
 * GEMINI_API_KEY is configured.
 */

import { db } from "../admin";
import { getAgentConfig } from "./config";
import { matchesBrand } from "./backlinks";
import { writeBlogDraftsFromBriefs } from "./content-writer";
import { injectInternalLinks } from "./internal-links";
import { syncFindings, type FindingInput } from "./findings";
import type { SkillContext, SkillResult } from "./types";

const SEVEN_DAYS_MS = 7 * 86_400_000;

export async function runSynthesizer(ctx: SkillContext): Promise<SkillResult> {
  const config = await getAgentConfig();
  const since = new Date(Date.now() - SEVEN_DAYS_MS);

  // ─ Pull last 7 days of findings ──────────────────
  const [audits, gaps, citations, prospects, ranks] = await Promise.all([
    db.collection("onpage-audits").where("updatedAt", ">=", since).get().catch(() => null),
    db.collection("keyword-gaps").where("updatedAt", ">=", since).get().catch(() => null),
    db.collection("citation-audits").where("updatedAt", ">=", since).get().catch(() => null),
    db.collection("backlink-prospects").where("updatedAt", ">=", since).get().catch(() => null),
    db.collection("rank-history").where("updatedAt", ">=", since).get().catch(() => null),
  ]);

  const rankDrops: FindingInput[] = [];
  let schemaInjected = 0;
  let briefsWritten = 0;
  let outreachWritten = 0;

  if (audits) {
    // ─ Thin-content → auto content-brief ────────────
    for (const doc of audits.docs) {
      const a = doc.data();
      const issues = (a.issues as Array<{ code: string }> | undefined) ?? [];
      const hasThin = issues.some((i) => i.code === "thin-content");
      if (!hasThin) continue;
      const briefId = `brief_expand_${slug(a.pathKey as string ?? "unknown")}`;
      try {
        await db.collection("content-briefs").doc(briefId).set(
          {
            type: "expand-thin-content",
            keyword: a.pathKey,
            status: "draft",
            priority: 65,
            rankingPage: a.url,
            wordCount: a.wordCount ?? 0,
            recommendedOutline: [
              `Expand existing content on ${a.pathKey} (currently ${a.wordCount ?? 0} words)`,
              "Add detailed explanations, examples, and supporting data",
              "Include FAQ section with 3–5 relevant questions",
              "Target 800+ words minimum",
            ],
            generatedAt: new Date().toISOString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { merge: true },
        );
        briefsWritten++;
      } catch (err) {
        console.warn("[synthesizer] thin-content brief failed:", err);
      }
    }

    // ─ Blog schema-missing → auto-inject Article JSON-LD ──
    for (const doc of audits.docs) {
      const a = doc.data();
      const issues = (a.issues as Array<{ code: string }> | undefined) ?? [];
      const hasSchemaIssue = issues.some((i) => i.code === "schema-missing");
      if (!hasSchemaIssue) continue;
      const pathKey = a.pathKey as string ?? "";
      // Only auto-inject for blog posts — marketing pages need human review.
      // Blog posts are served from /news/:slug, not /blog/:slug.
      if (!pathKey.startsWith("/news/")) continue;
      const blogSlug = pathKey.replace(/^\/news\//, "");
      if (!blogSlug) continue;
      try {
        const blogSnap = await db
          .collection("blog")
          .where("slug", "==", blogSlug)
          .limit(1)
          .get();
        if (blogSnap.empty) continue;
        const blogDoc = blogSnap.docs[0];
        const blogData = blogDoc.data();
        // Only write if jsonLd isn't already present.
        if (blogData.jsonLd) continue;
        const articleSchema = {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: blogData.title ?? "",
          description: blogData.excerpt ?? blogData.metaDescription ?? "",
          author: {
            "@type": "Organization",
            name: "CreedaVA",
            url: "https://creedava.com",
          },
          publisher: {
            "@type": "Organization",
            name: "CreedaVA",
            url: "https://creedava.com",
          },
          datePublished: blogData.publishedAt ?? blogData.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
          dateModified: blogData.updatedAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://creedava.com/news/${blogSlug}`,
          },
        };
        await blogDoc.ref.set(
          { jsonLd: articleSchema, updatedAt: new Date() },
          { merge: true },
        );
        await db.collection("ai-activity-log").add({
          toolName: "auto_inject_article_schema",
          domain: "seo",
          risk: "auto",
          decision: "auto-execute",
          args: { blogId: blogDoc.id, slug: blogSlug },
          result: { success: true },
          executedAt: new Date(),
        });
        schemaInjected++;
      } catch (err) {
        console.warn("[synthesizer] schema inject failed:", err);
      }
    }
  }

  // ─ Convert striking-distance gaps into content briefs + tasks ──
  if (gaps) {
    const striking = gaps.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((g) => (g as { type?: string }).type === "striking-distance")
      .sort((a, b) => ((b as { priority?: number }).priority ?? 0) - ((a as { priority?: number }).priority ?? 0))
      .slice(0, 10);

    for (const g of striking) {
      const gap = g as {
        id: string;
        keyword: string;
        currentPosition?: number;
        impressions?: number;
        rankingPage?: string;
        priority?: number;
      };
      const briefId = `brief_${slug(gap.keyword)}`;
      await db.collection("content-briefs").doc(briefId).set(
        {
          keyword: gap.keyword,
          status: "draft",
          priority: gap.priority ?? 50,
          currentPosition: gap.currentPosition,
          impressions: gap.impressions,
          rankingPage: gap.rankingPage,
          recommendedOutline: defaultOutline(gap.keyword),
          generatedAt: new Date().toISOString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true },
      );
    }

  }

  // ─ Backlink prospects → outreach drafts ─────────
  if (prospects) {
    const top = prospects.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => ((p as { status?: string }).status ?? "new") === "new")
      .sort((a, b) => ((b as { score?: number }).score ?? 0) - ((a as { score?: number }).score ?? 0))
      .slice(0, 15);
    for (const p of top) {
      const prosp = p as {
        id: string;
        domain?: string;
        url?: string;
        title?: string;
        kind?: string;
        score?: number;
      };
      // Guard against loosely-matched brand mentions ("Creed Ave", "Creedova",
      // etc.) that may already be sitting in backlink-prospects from before the
      // search filter was tightened — don't draft outreach for them.
      if (
        prosp.kind === "unlinked-brand-mention" &&
        !matchesBrand(`${prosp.title ?? ""} ${prosp.url ?? ""} ${prosp.domain ?? ""}`)
      ) {
        continue;
      }
      const emailId = `email_${prosp.id}`;
      const draft = composeOutreachEmail(prosp);
      await db.collection("outreach-emails").doc(emailId).set(
        {
          prospectId: prosp.id,
          kind: prosp.kind,
          targetDomain: prosp.domain,
          targetUrl: prosp.url,
          targetTitle: prosp.title,
          subject: draft.subject,
          body: draft.body,
          // Default to the general contact inbox — admin can update before sending.
          // The send trigger requires toEmail to be set or it marks the doc needs-recipient.
          toEmail: "contact@creedava.com",
          status: "draft",
          score: prosp.score ?? 0,
          generatedAt: new Date().toISOString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true },
      );
      outreachWritten++;
    }
  }

  // ─ Rank drops → findings ────────────────────────
  if (ranks) {
    const byKeyword = new Map<string, Array<{ position: number; dayKey: string }>>();
    for (const d of ranks.docs) {
      const r = d.data() as { keyword?: string; position?: number; dayKey?: string };
      if (!r.keyword || typeof r.position !== "number") continue;
      const arr = byKeyword.get(r.keyword) ?? [];
      arr.push({ position: r.position, dayKey: r.dayKey ?? "" });
      byKeyword.set(r.keyword, arr);
    }
    for (const [kw, history] of byKeyword) {
      if (history.length < 4) continue;
      history.sort((a, b) => a.dayKey.localeCompare(b.dayKey));
      const oldAvg = avg(history.slice(0, Math.floor(history.length / 2)).map((x) => x.position));
      const newAvg = avg(history.slice(Math.floor(history.length / 2)).map((x) => x.position));
      const drop = newAvg - oldAvg;
      // Threshold scales with position tier — a drop from #3→6 is far more
      // impactful than a drop from #60→63. Flat threshold created noise.
      const threshold = oldAvg <= 10 ? 3 : oldAvg <= 20 ? 5 : 8;
      if (drop < threshold) continue;

      rankDrops.push({
        skill: "rank-drop",
        scope: "keyword",
        target: kw,
        code: "rank-drop",
        severity: newAvg <= 10 ? "high" : "medium",
        message: `"${kw}" fell from #${oldAvg.toFixed(1)} to #${newAvg.toFixed(1)} this week`,
        evidence: `${history.length} days of rank-history`,
      });
    }
  }

  // Rank drops are the only finding this skill produces: everything else it
  // emits (briefs, outreach drafts, the weekly report) is already a surface a
  // human acts on directly.
  let findingsWritten = 0;
  try {
    findingsWritten = (await syncFindings("rank-drop", rankDrops)).written;
  } catch (err) {
    console.warn("[synthesizer] rank-drop finding sync failed:", err);
  }

  // ─ Competitor content gaps → high-priority briefs ──
  try {
    const compGaps = await db.collection("competitor-content-gaps")
      .where("updatedAt", ">=", since)
      .orderBy("priority", "desc")
      .limit(10)
      .get();
    for (const doc of compGaps.docs) {
      const gap = doc.data() as {
        keyword?: string;
        ourPage?: string;
        competitorWordCount?: number;
        ourWordCount?: number;
        competitorHeadings?: number;
        ourHeadings?: number;
        competitorSchemaTypes?: string[];
        priority?: number;
      };
      if (!gap.keyword) continue;
      const briefId = `brief_comp_${slug(gap.keyword)}`;
      const wordGap = (gap.competitorWordCount ?? 0) - (gap.ourWordCount ?? 0);
      const headingGap = (gap.competitorHeadings ?? 0) - (gap.ourHeadings ?? 0);
      await db.collection("content-briefs").doc(briefId).set(
        {
          keyword: gap.keyword,
          type: "competitor-gap",
          status: "draft",
          priority: gap.priority ?? 75,
          rankingPage: gap.ourPage,
          recommendedOutline: [
            wordGap > 0 ? `Add ~${wordGap} more words to match competitor depth` : "Word count is competitive",
            headingGap > 0 ? `Add ${headingGap} more section headings for structure` : "Heading structure is competitive",
            ...(gap.competitorSchemaTypes?.length ? [`Add schema: ${gap.competitorSchemaTypes.join(", ")}`] : []),
            "Add more images, examples, or data to increase engagement",
            "Include FAQ section targeting PAA questions",
          ],
          competitorAnalysis: {
            wordGap,
            headingGap,
            competitorSchemaTypes: gap.competitorSchemaTypes ?? [],
          },
          generatedAt: new Date().toISOString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true },
      );
    }
  } catch (err) {
    console.warn("[synthesizer] competitor-content-gaps read failed:", err);
  }

  // ─ Brief → blog draft pipeline ──────────────────
  let blogDrafts = { draftsWritten: 0, skipped: 0 };
  try {
    blogDrafts = await writeBlogDraftsFromBriefs(config, ctx.runId);
  } catch (err) {
    console.warn("[seo-agent] content-writer failed:", err);
  }

  // ─ Internal-link injection on recent posts ─────
  let internalLinks = { postsUpdated: 0, linksInserted: 0, suggestionsWritten: 0 };
  try {
    internalLinks = await injectInternalLinks(config, ctx.runId);
  } catch (err) {
    console.warn("[seo-agent] internal-links failed:", err);
  }

  // ─ Write the weekly report doc ──────────────────
  const reportId = `seo-weekly-${new Date().toISOString().split("T")[0]}`;
  const summary = {
    weekEnd: new Date().toISOString(),
    audits: audits?.size ?? 0,
    gaps: gaps?.size ?? 0,
    citations: citations?.size ?? 0,
    prospects: prospects?.size ?? 0,
    ranks: ranks?.size ?? 0,
    schemaInjected,
    findingsWritten,
    briefsWritten,
    outreachWritten,
    blogDrafts,
    internalLinks,
    recipients: config.summaryRecipients,
  };
  await db.collection("reports").doc(reportId).set(
    {
      kind: "seo-weekly",
      generatedAt: new Date().toISOString(),
      summary,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    { merge: true },
  );

  // Trigger email delivery (handled by existing scheduled.ts machinery if available;
  // here we just write a /report-deliveries doc the existing transporter can pick up).
  try {
    await db.collection("report-deliveries").add({
      reportId,
      kind: "seo-weekly",
      recipients: config.summaryRecipients,
      status: "pending",
      createdAt: new Date(),
    });
  } catch {
    /* non-fatal */
  }

  return {
    status: "ok",
    findings:
      findingsWritten +
      briefsWritten +
      outreachWritten +
      blogDrafts.draftsWritten +
      internalLinks.postsUpdated +
      internalLinks.suggestionsWritten,
    queriesUsed: ctx.queriesUsed(),
    summary,
  };
}

// ─── Helpers ─────────────────────────────────────────


function defaultOutline(keyword: string): string[] {
  return [
    `What is ${keyword}? (definition + use cases)`,
    `When to hire / use ${keyword}`,
    `How to evaluate providers (criteria + checklist)`,
    `Cost & ROI analysis`,
    `Real client examples / case studies`,
    `Common pitfalls & how to avoid them`,
    `FAQ (3–5 PAA-style questions)`,
    `Call-to-action: book a discovery call`,
  ];
}

function composeOutreachEmail(p: {
  domain?: string;
  url?: string;
  title?: string;
  kind?: string;
}): { subject: string; body: string } {
  const site = p.domain ?? "your site";
  const title = p.title ?? "your recent piece";
  if (p.kind === "unlinked-brand-mention") {
    return {
      subject: `Quick fix on your ${site} mention of CreedaVA`,
      body: [
        `Hi there,`,
        ``,
        `Thanks for mentioning CreedaVA in "${title}" — really appreciate it!`,
        ``,
        `I noticed the mention isn't linked. Would you mind adding a link to https://creedava.com so readers can find us? Happy to return the favor on our resources page.`,
        ``,
        `— John, CreedaVA`,
      ].join("\n"),
    };
  }
  if (p.kind === "guest-post") {
    return {
      subject: `Guest contribution for ${site}`,
      body: [
        `Hi there,`,
        ``,
        `I run CreedaVA, a bilingual virtual assistant agency, and saw your "${title}" page.`,
        ``,
        `I'd love to contribute a tested, original piece — happy to tailor a topic to your audience (e.g. "How small US firms hire VAs in Belize" or "Bilingual VA workflows for legal teams").`,
        ``,
        `Want me to send 2–3 outline ideas?`,
        ``,
        `— John, CreedaVA`,
      ].join("\n"),
    };
  }
  if (p.kind === "competitor-mention") {
    return {
      subject: `Alternative perspective for "${title}"`,
      body: [
        `Hi,`,
        ``,
        `Loved your piece "${title}". A lot of readers in that space evaluate options like ours too — CreedaVA is a US-friendly, bilingual VA agency based in Belize with same-timezone coverage.`,
        ``,
        `If it'd add value, happy to share a one-pager you can reference. No strings.`,
        ``,
        `— John, CreedaVA`,
      ].join("\n"),
    };
  }
  // Default: resources-page
  return {
    subject: `Resource suggestion for "${title}"`,
    body: [
      `Hi,`,
      ``,
      `I came across your resources page on ${site} — great curation. CreedaVA might be a fit: we're a bilingual VA agency built specifically for US small businesses needing same-timezone help.`,
      ``,
      `Would you consider adding us? Happy to share testimonials or a short blurb.`,
      ``,
      `— John, CreedaVA`,
    ].join("\n"),
  };
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 200);
}

function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
