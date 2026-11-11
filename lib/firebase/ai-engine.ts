/**
 * AI Engine v2 — Advanced capabilities
 *
 * Builds on top of the base AI service (`ai.ts`) with:
 * - Auto-loading page-aware Firestore context
 * - Intelligent prompt construction with all training data
 * - Firestore write-back (create blog posts, save reports, update SEO)
 * - Market intelligence integration via cloud functions
 * - Structured analysis with scoring algorithms
 *
 * Usage:
 *   import { aiEngine } from "@/lib/firebase/ai-engine";
 *   const result = await aiEngine.analyzeAndRespond("/admin/leads", "How are our leads doing?");
 */

import { generateText } from "./ai";
import { parseAiJson } from "@/lib/utils/ai-json";
import { create, createWithId } from "./firestore";
import { cloudWebSearch } from "./cloud-functions";
import {
  buildTrainedPrompt,
  buildReportPrompt,
  DAILY_STATUS_PROMPT,
} from "@/lib/utils/ai-system-prompt";
import {
  loadPageAwareContext,
} from "@/lib/utils/ai-page-context";

// ─── Web Search Helpers ──────────────────────────────

/**
 * Fetch real-time web data for a set of queries and format as a string
 * that can be injected into the AI prompt as `webSearchResults`.
 * Fails silently — returns empty string if the cloud function is unavailable.
 */
async function fetchWebContext(queries: string[]): Promise<string> {
  try {
    const results = await Promise.allSettled(
      queries.map((q) => cloudWebSearch(q, 5)),
    );
    const sections: string[] = [];
    for (let i = 0; i < queries.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled" && r.value.success && r.value.results.length > 0) {
        const items = r.value.results
          .map((sr) => `  - ${sr.title}: ${sr.snippet} (${sr.link})`)
          .join("\n");
        sections.push(`[${queries[i]}]\n${items}`);
      }
    }
    return sections.length > 0 ? sections.join("\n\n") : "";
  } catch {
    return "";
  }
}

// ─── Core: Context-Aware Generation ──────────────────

/**
 * Options for AI analysis calls. All web mastery modules can be toggled individually,
 * or use `includeWebMastery: true` to include all of them.
 */
interface AnalyzeOptions {
  includeCompetitors?: boolean;
  includeKPIs?: boolean;
  includeSEOAlgorithms?: boolean;
  includeMarketIntel?: boolean;
  includeDesignSystem?: boolean;
  includeCreativeFramework?: boolean;
  includeBlogRules?: boolean;
  includeAIO?: boolean;
  includeGEO?: boolean;
  includeSERP?: boolean;
  includeSEM?: boolean;
  includeAnalytics?: boolean;
  includeTechnicalSEO?: boolean;
  includeAuthority?: boolean;
  includeCRO?: boolean;
  includeWebMastery?: boolean;
  customInstructions?: string;
  /** Pre-fetched web search results formatted as text (injected into prompt) */
  webSearchResults?: string;
}

/**
 * Auto-detect which web mastery modules to include based on the admin page.
 */
function autoDetectWebModules(pagePath: string): Partial<AnalyzeOptions> {
  const p = pagePath.replace(/^\/admin\/?/, "").toLowerCase();
  if (p.startsWith("seo") || p === "blog") {
    return { includeAIO: true, includeGEO: true, includeSERP: true, includeTechnicalSEO: true, includeAuthority: true };
  }
  if (p.startsWith("marketing/campaigns")) {
    return { includeSEM: true, includeAnalytics: true, includeCRO: true };
  }
  if (p.startsWith("marketing/landing")) {
    return { includeCRO: true, includeAIO: true, includeSERP: true };
  }
  if (p === "analytics" || p.startsWith("analytics")) {
    return { includeAnalytics: true, includeSERP: true, includeCRO: true };
  }
  if (p === "forum") {
    return { includeAIO: true, includeAuthority: true };
  }
  return {};
}

/** Resolve the module flags for a page + caller overrides. */
function promptOptions(
  pageContext: string,
  options: AnalyzeOptions,
  auto: Partial<AnalyzeOptions>,
): Parameters<typeof buildTrainedPrompt>[3] {
  return {
    includeCompetitors: options.includeCompetitors ?? true,
    includeKPIs: options.includeKPIs ?? true,
    includeSEOAlgorithms: options.includeSEOAlgorithms ?? true,
    includeMarketIntel: options.includeMarketIntel ?? false,
    includeDesignSystem: options.includeDesignSystem ?? false,
    includeCreativeFramework: options.includeCreativeFramework ?? false,
    includeBlogRules: options.includeBlogRules ?? false,
    includeAIO: options.includeAIO ?? auto.includeAIO ?? false,
    includeGEO: options.includeGEO ?? auto.includeGEO ?? false,
    includeSERP: options.includeSERP ?? auto.includeSERP ?? false,
    includeSEM: options.includeSEM ?? auto.includeSEM ?? false,
    includeAnalytics: options.includeAnalytics ?? auto.includeAnalytics ?? false,
    includeTechnicalSEO: options.includeTechnicalSEO ?? auto.includeTechnicalSEO ?? false,
    includeAuthority: options.includeAuthority ?? auto.includeAuthority ?? false,
    includeCRO: options.includeCRO ?? auto.includeCRO ?? false,
    includeWebMastery: options.includeWebMastery ?? false,
    pageContext,
    customInstructions: options.customInstructions,
    webSearchResults: options.webSearchResults,
  };
}

/** Load page context and assemble the trained prompt for this request. */
async function buildEnginePrompt(
  pagePath: string,
  userPrompt: string,
  options: AnalyzeOptions,
): Promise<ReturnType<typeof buildTrainedPrompt>> {
  const ctx = await loadPageAwareContext(pagePath);
  return buildTrainedPrompt(
    ctx.section,
    userPrompt,
    ctx.dataContext,
    promptOptions(ctx.pageContext, options, autoDetectWebModules(pagePath)),
  );
}

/**
 * The main AI entry point. Automatically loads relevant Firestore data
 * based on the current admin page, builds a fully-trained prompt, and
 * generates a response. Auto-includes relevant web mastery modules
 * based on the page context.
 */
export async function analyzeAndRespond(
  pagePath: string,
  userPrompt: string,
  options: AnalyzeOptions = {},
): Promise<string> {
  return generateText(await buildEnginePrompt(pagePath, userPrompt, options));
}

/**
 * Generate structured JSON with full context awareness.
 */
export async function analyzeAndRespondJSON<T = unknown>(
  pagePath: string,
  userPrompt: string,
  options: AnalyzeOptions = {},
): Promise<T> {
  const trained = await buildEnginePrompt(
    pagePath,
    `${userPrompt}\n\nReturn ONLY valid JSON, no markdown fences.`,
    options,
  );
  return parseAiJson<T>(await generateText(trained));
}

// ─── SEO Analysis Engine ─────────────────────────────

export interface SEOAnalysisResult {
  overallScore: number;
  categories: {
    contentQuality: { score: number; issues: string[]; recommendations: string[] };
    technicalSEO: { score: number; issues: string[]; recommendations: string[] };
    keywordStrategy: { score: number; issues: string[]; recommendations: string[] };
    competitivePosition: { score: number; issues: string[]; recommendations: string[] };
    linkProfile: { score: number; issues: string[]; recommendations: string[] };
  };
  quickWins: { action: string; expectedImpact: string; effort: "low" | "medium" | "high" }[];
  contentGaps: { keyword: string; searchVolume: string; difficulty: string; suggestedContent: string }[];
  prioritizedActions: { rank: number; action: string; owner: string; timeline: string; impact: string }[];
}

/**
 * Run a comprehensive SEO analysis using all available data.
 * This cross-references blog content, keywords, audits, landing pages,
 * and competitor intelligence to produce actionable recommendations.
 */
export async function runSEOAnalysis(): Promise<SEOAnalysisResult> {
  // Fetch real-time competitive SEO data
  const webData = await fetchWebContext([
    "virtual assistant services SEO best practices 2025",
    "Belize BPO outsourcing industry trends",
    "bilingual virtual assistant market analysis",
  ]);

  return analyzeAndRespondJSON<SEOAnalysisResult>(
    "/admin/seo/keywords",
    `Run a comprehensive SEO analysis for CreedaVA. Analyze our current content library, keyword coverage, technical SEO health, and competitive positioning. Identify the top content gaps where competitors rank but we don't. Provide a prioritized action plan to reach page 1 for our target keywords.

Return JSON with this exact structure:
{
  "overallScore": number (0-100),
  "categories": {
    "contentQuality": { "score": number, "issues": string[], "recommendations": string[] },
    "technicalSEO": { "score": number, "issues": string[], "recommendations": string[] },
    "keywordStrategy": { "score": number, "issues": string[], "recommendations": string[] },
    "competitivePosition": { "score": number, "issues": string[], "recommendations": string[] },
    "linkProfile": { "score": number, "issues": string[], "recommendations": string[] }
  },
  "quickWins": [{ "action": string, "expectedImpact": string, "effort": "low"|"medium"|"high" }],
  "contentGaps": [{ "keyword": string, "searchVolume": string, "difficulty": string, "suggestedContent": string }],
  "prioritizedActions": [{ "rank": number, "action": string, "owner": string, "timeline": string, "impact": string }]
}`,
    { includeSEOAlgorithms: true, includeMarketIntel: true, includeAIO: true, includeGEO: true, includeSERP: true, includeTechnicalSEO: true, includeAuthority: true, webSearchResults: webData },
  );
}

// ─── Market Intelligence Engine ──────────────────────

export interface MarketIntelReport {
  marketOverview: string;
  competitorMoves: { competitor: string; action: string; impact: string; ourResponse: string }[];
  opportunities: { opportunity: string; size: string; urgency: "high" | "medium" | "low"; action: string }[];
  threats: { threat: string; severity: "high" | "medium" | "low"; mitigation: string }[];
  trendAlert: { trend: string; relevance: string; recommendation: string }[];
}

/**
 * Generate a market intelligence report analyzing competitors,
 * trends, and opportunities in the VA industry.
 */
export async function generateMarketIntelReport(): Promise<MarketIntelReport> {
  // Fetch real-time market intelligence
  const webData = await fetchWebContext([
    "virtual assistant industry news 2025",
    "BPO outsourcing market trends Latin America",
    "remote staffing agency competitors",
  ]);

  return analyzeAndRespondJSON<MarketIntelReport>(
    "/admin/analytics",
    `Generate a comprehensive market intelligence report for CreedaVA. Analyze:
1. Current competitive landscape and recent competitor moves
2. Market opportunities we should pursue immediately
3. Threats to our market position
4. Industry trends and how we should respond
5. Specific actions to capture market share

Base your analysis on our actual business data and the competitive intelligence provided.

Return JSON with:
{
  "marketOverview": "2-3 paragraph HTML summary",
  "competitorMoves": [{ "competitor": string, "action": string, "impact": string, "ourResponse": string }],
  "opportunities": [{ "opportunity": string, "size": string, "urgency": "high"|"medium"|"low", "action": string }],
  "threats": [{ "threat": string, "severity": "high"|"medium"|"low", "mitigation": string }],
  "trendAlert": [{ "trend": string, "relevance": string, "recommendation": string }]
}`,
    { includeMarketIntel: true, includeCompetitors: true, webSearchResults: webData },
  );
}

// ─── Content Generation Engine ───────────────────────

export interface GeneratedBlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  metaDescription: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  internalLinks: string[];
  seoScore: number;
}

/**
 * Generate an SEO-optimized blog post that is engineered to outrank
 * competitors for the target keyword. Uses full business context +
 * SEO algorithms to produce content designed for page 1.
 */
export async function generateSEOBlogPost(
  topic: string,
  targetKeyword?: string,
): Promise<GeneratedBlogPost> {
  // Fetch real-time search data for the topic to ground the content
  const searchQueries = [
    `${targetKeyword || topic} best practices 2025`,
    `${topic} virtual assistant outsourcing`,
  ];
  const webData = await fetchWebContext(searchQueries);

  return analyzeAndRespondJSON<GeneratedBlogPost>(
    "/admin/blog",
    `Write an SEO-optimized blog post about: "${topic}"
${targetKeyword ? `Target keyword: "${targetKeyword}"` : "Suggest the best target keyword based on our keyword gap analysis."}

Follow BLOG BODY RULES. The article renderer rebuilds the body from a fixed
whitelist, so anything outside it is deleted rather than styled:
- 1,200-1,600 words, 6-9 <h2> sections, <h3> for sub-points.
- 3-5 <figure> blocks (<img> + <figcaption>) using approved images.unsplash.com
  URLs, one every two or three sections.
- A <table> for every comparative or measurable section.
- Infographic blocks for the sections that turn on figures or a sequence:
    <div class="mk-stats">
      <div class="mk-stat"><strong>15</strong><span>minutes a day to read it</span></div>
    </div>
    <div class="mk-bars">
      <div class="mk-bar"><span>Referral</span><strong>78%</strong></div>
      <div class="mk-bar"><span>Paid social</span><strong>42%</strong></div>
    </div>
    <div class="mk-flow">
      <div class="mk-step"><strong>Define the questions</strong><span>One sentence.</span></div>
    </div>
    <div class="mk-mockup">
      <div class="mk-mockup-title">Bookings · today</div>
      <div class="mk-stat"><strong>12</strong><span>confirmed</span></div>
    </div>
  Those class names are the only ones that survive the renderer; every other
  wrapper, class, inline style and SVG is deleted.
- One <blockquote> for the sentence worth remembering.
- An FAQ section of 3-5 <details>/<summary> pairs.
- A numbered <a href="#source-1">[1]</a> marker on every factual claim, and the
  matching \`references\` entries in citation order.
- No <style> blocks, no <script>, no inline styling, no SVG, no h1 in the body.

Return JSON:
{
  "title": "SEO-optimized title (under 60 chars, includes primary keyword)",
  "slug": "url-friendly-slug",
  "excerpt": "1-2 sentence summary",
  "content": "Full article body as semantic HTML per BLOG BODY RULES, with figures, tables and metric strips",
  "references": [{ "label": "…", "url": "https://…", "source": "…", "year": "2025" }],
  "tags": ["3-5 relevant tags"],
  "metaDescription": "Meta description under 160 chars with CTA",
  "targetKeyword": "the primary keyword targeted",
  "secondaryKeywords": ["3-5 secondary keywords covered"],
  "internalLinks": ["suggested internal links to our existing content"],
  "seoScore": number (0-100, based on the SEO scoring rubric)
}`,
    {
      includeSEOAlgorithms: true,
      includeCompetitors: true,
      includeDesignSystem: true,
      includeBlogRules: true,
      includeAIO: true,
      includeGEO: true,
      includeSERP: true,
      webSearchResults: webData,
    },
  );
}

// ─── Auto-Write: Save AI outputs to Firestore ───────

/**
 * Generate and automatically save a blog post to Firestore.
 * Returns the created document ID.
 */
export async function generateAndSaveBlogPost(
  topic: string,
  targetKeyword?: string,
): Promise<{ id: string; post: GeneratedBlogPost }> {
  const post = await generateSEOBlogPost(topic, targetKeyword);

  const id = await create("blog", {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    tags: post.tags,
    metaDescription: post.metaDescription,
    status: "draft",
    author: "CreedaVA AI",
  });

  return { id, post };
}

/**
 * Generate and save an AI report to Firestore.
 */
export async function generateAndSaveReport(
  type: "daily" | "weekly" | "monthly" | "seo" | "competitor" | "market",
  pagePath: string = "/admin/analytics",
): Promise<string> {
  const ctx = await loadPageAwareContext(pagePath);

  const promptMap: Record<string, string> = {
    daily: DAILY_STATUS_PROMPT,
    weekly: "Generate a weekly performance report with trend analysis and next-week recommendations.",
    monthly: "Generate a monthly strategic report with MoM comparisons and quarterly projections.",
    seo: "Generate an SEO performance report with ranking changes, content gaps, and technical issues.",
    competitor: "Generate a competitive intelligence report analyzing how we compare to top VA companies.",
    market: "Generate a market analysis report with industry trends and growth opportunities.",
  };

  // Use buildReportPrompt directly with generateText — avoids double-wrapping
  // that happened when the old string prompt was re-wrapped by analyzeAndRespondJSON
  const reportPrompt = buildReportPrompt(type, promptMap[type] || promptMap.weekly, ctx.dataContext);
  // Append JSON instruction to user content
  const jsonPrompt = {
    systemInstruction: reportPrompt.systemInstruction,
    userContent: reportPrompt.userContent + "\n\nReturn ONLY valid JSON, no markdown fences.",
  };
  const report = parseAiJson<{
    title: string;
    summaryHtml: string;
    highlights: string[];
    recommendations: string[];
    score?: number;
  }>(await generateText(jsonPrompt));

  const id = await create("reports", {
    ...report,
    type,
    category: "on-demand" as const,
    dataSources: ctx.loadedCollections,
  });

  // Fire-and-forget: regenerate dynamic presets based on this report
  refreshDynamicPresets(report, ctx.dataContext).catch((err) =>
    console.warn("[AI Engine] Dynamic preset refresh failed:", err),
  );

  return id;
}

// ─── Dynamic AI-Driven Presets ───────────────────────

export interface DynamicPreset {
  label: string;
  prompt: string;
}

/**
 * After a report is generated, ask AI to suggest contextual presets
 * that would be most useful given current business state.
 * Saves to Firestore `settings/ai-presets` for all admin pages.
 */
async function refreshDynamicPresets(
  reportData: { title: string; highlights: string[]; recommendations: string[] },
  dataContext: string,
): Promise<void> {
  const prompt = buildTrainedPrompt(
    "Dashboard AI",
    `Based on the latest report and current business data, generate smart preset prompt suggestions for the AI assistant.

LATEST REPORT: "${reportData.title}"
KEY HIGHLIGHTS:
${reportData.highlights.map((h) => `- ${h}`).join("\n")}

RECOMMENDATIONS:
${reportData.recommendations.map((r) => `- ${r}`).join("\n")}

CURRENT DATA:
${dataContext.slice(0, 3000)}

Generate exactly 5 contextual preset suggestions. Each should be a specific, actionable prompt the user can click to get immediate AI analysis. Focus on:
1. Issues needing attention RIGHT NOW based on the report
2. Growth opportunities the data reveals
3. Risks or problems to investigate
4. Strategic moves to consider
5. Quick wins available today

Return ONLY valid JSON array — no markdown, no code fences:
[
  { "label": "Short Label (2-4 words)", "prompt": "Full detailed prompt the AI should execute..." },
  ...
]`,
    dataContext,
    { includeCompetitors: true, includeKPIs: true, includeMarketIntel: true },
  );

  try {
    const presets = parseAiJson<DynamicPreset[]>(await generateText(prompt));

    if (!Array.isArray(presets) || presets.length === 0) return;

    // Validate shape
    const valid = presets
      .filter((p) => p.label && p.prompt)
      .slice(0, 5)
      .map((p) => ({ label: String(p.label), prompt: String(p.prompt) }));

    if (valid.length === 0) return;

    await createWithId("settings", "ai-presets", {
      presets: valid,
      generatedFrom: reportData.title,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[AI Engine] Failed to parse dynamic presets:", err);
  }
}

/**
 * Generate SEO metadata suggestions for a page and optionally save to Firestore.
 */
export async function generatePageSEO(
  pagePath: string,
  pageContent: string,
  autoSave = false,
): Promise<{
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  keywords: string[];
}> {
  const result = await analyzeAndRespondJSON<{
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    keywords: string[];
  }>(
    "/admin/seo/content",
    `Optimize SEO metadata for the page at path "${pagePath}".

Page content summary:
${pageContent.slice(0, 2000)}

Apply our SEO algorithms to create the best possible metadata for Google ranking.

Return JSON:
{
  "title": "SEO title (under 60 chars, keyword-rich)",
  "description": "Meta description (under 160 chars, includes CTA)",
  "ogTitle": "Open Graph title",
  "ogDescription": "Open Graph description",
  "keywords": ["5-10 target keywords for this page"]
}`,
    { includeSEOAlgorithms: true },
  );

  if (autoSave) {
    try {
      await create("page-seo", {
        path: pagePath,
        ...result,
        noIndex: false,
      });
    } catch (err) {
      console.warn("[AI Engine] Failed to auto-save page SEO:", err);
    }
  }

  return result;
}

// ─── Pipeline Intelligence ───────────────────────────

export interface PipelineInsight {
  healthScore: number;
  pipelineValue: number;
  projectedRevenue: number;
  conversionRate: number;
  avgDealCycle: string;
  atRiskLeads: { name: string; reason: string; suggestedAction: string }[];
  hotLeads: { name: string; score: number; reason: string; nextStep: string }[];
  bottlenecks: { stage: string; count: number; avgDays: number; suggestion: string }[];
  recommendations: string[];
}

/**
 * Analyze the sales pipeline and provide intelligent insights.
 */
export async function analyzePipeline(): Promise<PipelineInsight> {
  return analyzeAndRespondJSON<PipelineInsight>(
    "/admin/leads",
    `Analyze our sales pipeline in detail. For each lead, assess:
- Likelihood of conversion based on source, value, and stage
- Time in current stage vs average
- Risk signals (no activity, low engagement)

Identify our highest-value opportunities and biggest pipeline risks.

Return JSON:
{
  "healthScore": number (0-100),
  "pipelineValue": number (total dollar value of open deals),
  "projectedRevenue": number (weighted by conversion probability),
  "conversionRate": number (win rate percentage),
  "avgDealCycle": "average days from new to won",
  "atRiskLeads": [{ "name": string, "reason": string, "suggestedAction": string }],
  "hotLeads": [{ "name": string, "score": number, "reason": string, "nextStep": string }],
  "bottlenecks": [{ "stage": string, "count": number, "avgDays": number, "suggestion": string }],
  "recommendations": ["prioritized list of actions"]
}`,
  );
}

// ─── Customer Health Engine ──────────────────────────

export interface CustomerHealthReport {
  overallHealth: number;
  churnRisk: { customer: string; risk: "high" | "medium" | "low"; signals: string[]; action: string }[];
  upsellOpportunities: { customer: string; opportunity: string; estimatedValue: number; approach: string }[];
  retentionScore: number;
  mrrTrend: string;
  recommendations: string[];
}

/**
 * Analyze customer health, churn risk, and upsell opportunities.
 */
export async function analyzeCustomerHealth(): Promise<CustomerHealthReport> {
  return analyzeAndRespondJSON<CustomerHealthReport>(
    "/admin/customers",
    `Perform a comprehensive customer health analysis:
1. Score each active customer's health based on engagement, billing, satisfaction
2. Identify customers at risk of churning and why
3. Find upsell/cross-sell opportunities based on service usage patterns
4. Calculate retention metrics and MRR trends

Return JSON:
{
  "overallHealth": number (0-100),
  "churnRisk": [{ "customer": string, "risk": "high"|"medium"|"low", "signals": string[], "action": string }],
  "upsellOpportunities": [{ "customer": string, "opportunity": string, "estimatedValue": number, "approach": string }],
  "retentionScore": number (0-100),
  "mrrTrend": "description of MRR trend",
  "recommendations": ["prioritized actions"]
}`,
  );
}

// ─── Content Strategy Engine ─────────────────────────

export interface ContentStrategy {
  contentCalendar: { week: number; type: string; topic: string; targetKeyword: string; expectedImpact: string }[];
  topicClusters: { pillar: string; clusters: string[]; priority: "high" | "medium" | "low" }[];
  contentGaps: { topic: string; competitorsCovering: number; searchDemand: string; recommendation: string }[];
  suggestions: string[];
}

/**
 * Generate a data-driven content strategy based on keyword gaps,
 * competitor analysis, and current content performance.
 */
export async function generateContentStrategy(weeks: number = 4): Promise<ContentStrategy> {
  // Fetch current content marketing trends
  const webData = await fetchWebContext([
    "content marketing strategy virtual assistants 2025",
    "bilingual content SEO strategy",
  ]);

  return analyzeAndRespondJSON<ContentStrategy>(
    "/admin/blog",
    `Create a ${weeks}-week content strategy for CreedaVA that maximizes organic traffic growth.

Requirements:
1. Analyze our existing blog content and identify what's working vs not
2. Use our keyword data to identify highest-opportunity topics
3. Create topic clusters around pillar content strategies
4. Map each piece of content to a target keyword with search intent
5. Ensure content velocity meets our target of 8+ posts/month
6. Include a mix of content types: guides, comparisons, case studies, news/commentary

Return JSON:
{
  "contentCalendar": [{ "week": number, "type": string, "topic": string, "targetKeyword": string, "expectedImpact": string }],
  "topicClusters": [{ "pillar": string, "clusters": string[], "priority": "high"|"medium"|"low" }],
  "contentGaps": [{ "topic": string, "competitorsCovering": number, "searchDemand": string, "recommendation": string }],
  "suggestions": ["strategic recommendations"]
}`,
    { includeSEOAlgorithms: true, includeMarketIntel: true, webSearchResults: webData },
  );
}

// ─── Export as a unified engine ──────────────────────

// ─── Revenue Forecast Engine ────────────────────────────────────────────────

export interface RevenueForecast {
  currentMRR: number;
  projected3MonthMRR: number;
  projected12MonthMRR: number;
  growthRatePercent: number;
  churnAdjustedRevenue: number;
  expansionRevenuePotential: number;
  confidenceScore: number;
  keyAssumptions: string[];
  risks: { risk: string; probability: "high" | "medium" | "low"; impact: string }[];
  growthLevers: { lever: string; estimatedImpactDollars: number; timeToImpact: string }[];
}

/**
 * Forecast revenue for the next 3 and 12 months using customer data,
 * churn patterns, and pipeline intelligence. Used by ARIA on the dashboard.
 */
export async function forecastRevenue(): Promise<RevenueForecast> {
  return analyzeAndRespondJSON<RevenueForecast>(
    "/admin",
    `Forecast CreedaVA revenue for the next 3 and 12 months.

Use the business data above (MRR, churn rate, active customers, pipeline, win rate)
to produce a realistic, data-grounded forecast.

Return JSON with exactly this structure:
{
  "currentMRR": number,
  "projected3MonthMRR": number,
  "projected12MonthMRR": number,
  "growthRatePercent": number,
  "churnAdjustedRevenue": number,
  "expansionRevenuePotential": number,
  "confidenceScore": number (0-100),
  "keyAssumptions": ["...list of assumptions..."],
  "risks": [{ "risk": string, "probability": "high"|"medium"|"low", "impact": string }],
  "growthLevers": [{ "lever": string, "estimatedImpactDollars": number, "timeToImpact": string }]
}`,
    { includeCompetitors: true, includeKPIs: true, includeMarketIntel: true },
  );
}

export const aiEngine = {
  // Core
  analyzeAndRespond,
  analyzeAndRespondJSON,

  // SEO
  runSEOAnalysis,
  generatePageSEO,

  // Market Intelligence
  generateMarketIntelReport,

  // Content
  generateSEOBlogPost,
  generateAndSaveBlogPost,
  generateContentStrategy,

  // Sales
  analyzePipeline,

  // Customer Success
  analyzeCustomerHealth,

  // Revenue
  forecastRevenue,

  // Reports
  generateAndSaveReport,
};
