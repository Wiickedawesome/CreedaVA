/**
 * Firebase AI (Gemini) service — proxy-based client
 *
 * All Gemini calls are routed through /api/ai (server-side proxy) so that
 * the API key is never exposed in the browser bundle.
 *
 * The proxy enforces Firebase session-cookie auth and per-user rate limiting.
 */

import { buildContentPrompt, buildLandingPagePrompt } from "@/lib/utils/ai-system-prompt";
import type { TrainedPrompt } from "@/lib/utils/ai-system-prompt";
import { parseAiJson } from "@/lib/utils/ai-json";

/** Input to all generation functions — either a plain string or a split prompt */
export type PromptInput = string | TrainedPrompt;

// ─── Proxy helper ────────────────────────────────────

type ProxyType = "generate" | "stream" | "grounded";

interface ProxyParams {
  type: ProxyType;
  userContent?: string;
  systemInstruction?: string;
}

/**
 * Post a request to the server-side /api/ai proxy.
 * Throws on non-2xx responses with the error message from the proxy.
 */
async function callProxy(params: ProxyParams): Promise<Response> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.clone().json();
      if (body?.error) message = body.error;
    } catch { /* ignore */ }
    throw new Error(`[AI Proxy] ${message}`);
  }
  return res;
}

/** Build proxy params from a PromptInput */
function toProxyParams(type: ProxyType, input: PromptInput): ProxyParams {
  if (typeof input === "string") {
    return { type, userContent: input };
  }
  return {
    type,
    userContent: input.userContent,
    systemInstruction: input.systemInstruction,
  };
}

// ─── Low-level helpers ───────────────────────────────

/** Generate text from a prompt via the /api/ai proxy. */
export async function generateText(input: PromptInput): Promise<string> {
  const res = await callProxy(toProxyParams("generate", input));
  const { text } = await res.json();
  return text ?? "";
}

/**
 * Generate text from a prompt with streaming via the /api/ai proxy.
 * Returns an async generator that yields text chunks as they arrive.
 */
export async function* generateTextStream(input: PromptInput): AsyncGenerator<string, void, unknown> {
  const res = await callProxy(toProxyParams("stream", input));
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) yield chunk;
  }
}

// ─── Grounded Generation (Google Search) ─────────────

/** Source reference extracted from Gemini grounding metadata */
export interface GroundingSource {
  title: string;
  url: string;
}

/**
 * Extract grounding sources from a Gemini response's grounding metadata.
 * Returns an array of { title, url } objects for citation.
 */
export function extractGroundingSources(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: any,
): GroundingSource[] {
  try {
    const candidate = response?.candidates?.[0];
    const metadata = candidate?.groundingMetadata;
    if (!metadata?.groundingChunks) return [];

    return metadata.groundingChunks
      .filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chunk: any) => chunk.web?.uri,
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((chunk: any) => ({
        title: chunk.web.title || "Source",
        url: chunk.web.uri,
      }));
  } catch {
    return [];
  }
}

/**
 * Format grounding sources as a citation footer.
 * Returns empty string if no sources available.
 */
export function formatGroundingSources(sources: GroundingSource[]): string {
  if (sources.length === 0) return "";
  const lines = sources.map(
    (s, i) => `[${i + 1}] ${s.title} | ${s.url}`,
  );
  return `\n\n--- Sources ---\n${lines.join("\n")}`;
}

/**
 * Generate text with Google Search grounding enabled via the /api/ai proxy.
 * Returns { text, sources } where sources are extracted from grounding metadata.
 */
export async function generateTextGrounded(
  input: PromptInput,
): Promise<{ text: string; sources: GroundingSource[] }> {
  const res = await callProxy(toProxyParams("grounded", input));
  const { text, sources } = await res.json();
  return { text: text ?? "", sources: sources ?? [] };
}

/** Generate structured JSON from a prompt. */
export async function generateJSON<T = unknown>(input: PromptInput): Promise<T> {
  // Append JSON instruction to user content
  let adjusted: PromptInput;
  if (typeof input === "string") {
    adjusted = input + "\n\nReturn ONLY valid JSON, no markdown fences.";
  } else {
    adjusted = {
      systemInstruction: input.systemInstruction,
      userContent: input.userContent + "\n\nReturn ONLY valid JSON, no markdown fences.",
    };
  }
  return parseAiJson<T>(await generateText(adjusted));
}

// ─── Domain-specific AI functions ────────────────────

/** Generate a blog post draft with the editorial body the renderer keeps */
export async function generateBlogPost(topic: string, tone = "professional", length = "1,200-1,600 words") {
  const trained = buildContentPrompt(
    "Blog Content AI",
    `Write a blog post about: "${topic}"

Tone: ${tone}
Target length: ${length}

Follow BLOG BODY RULES exactly. The article renderer rebuilds your body from a
fixed whitelist, so markup outside it is deleted rather than styled — there is
no point writing <style> blocks, animation, SVG or inline styling.

The body must carry visuals, not only paragraphs:
- 3-5 <figure> blocks, each <img> + <figcaption>, using approved
  images.unsplash.com URLs.
- A <table> for every comparative or measurable section.
- Infographic blocks where the section turns on figures or a sequence:
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
  Those class names are the only ones that survive; bar lengths are computed
  from the real figures, so never invent a number to make a bar look right.

Vary the composition from post to post while keeping this same mix of pictures
and elements: use at least three different kinds of visual, never two of the
same kind back to back, and change which visual opens a section. Lead with the
two or three the argument needs rather than spending every kind equally.

Return JSON with these fields:
- title: compelling blog title (SEO-optimized, under 60 chars)
- slug: URL-friendly slug
- excerpt: 1-2 sentence summary
- content: the full article body as semantic HTML following BLOG BODY RULES
- references: [{ "label", "url", "source", "year" }] in citation order
- tags: array of 3-5 relevant tags
- metaDescription: SEO meta description (under 160 chars)

Return ONLY valid JSON, no markdown fences.`,
    "",
    { isBlog: true },
  );

  return generateJSON<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    tags: string[];
    metaDescription: string;
  }>(trained);
}

/** Generate SEO keyword suggestions for a topic */
export async function suggestKeywords(topic: string, count = 15) {
  return generateJSON<{
    keywords: {
      keyword: string;
      searchIntent: "informational" | "commercial" | "transactional" | "navigational";
      difficulty: "low" | "medium" | "high";
      suggestedTitle: string;
    }[];
  }>(`
You are an SEO expert for CreedaVA, a virtual assistant services company.
Suggest ${count} SEO keywords related to: "${topic}"

For each keyword provide:
- keyword: the search term
- searchIntent: one of informational, commercial, transactional, navigational
- difficulty: low, medium, or high based on estimated competition
- suggestedTitle: a blog/page title that targets this keyword

Return JSON with a "keywords" array.
  `);
}

/** Analyze content for SEO and suggest improvements */
export async function analyzeSEO(url: string, content?: string) {
  const prompt = content
    ? `Analyze this content for SEO:\n\n${content.slice(0, 3000)}`
    : `Provide SEO recommendations for a page at URL: ${url}`;

  return generateJSON<{
    score: number;
    issues: { severity: "high" | "medium" | "low"; issue: string; fix: string }[];
    suggestedTitle: string;
    suggestedDescription: string;
    suggestedH1: string;
    missingElements: string[];
  }>(`
You are an SEO auditor for CreedaVA.
${prompt}

Return JSON with:
- score: 0-100 SEO score
- issues: array of {severity, issue, fix}
- suggestedTitle: optimized title tag (under 60 chars)
- suggestedDescription: meta description (under 160 chars)
- suggestedH1: suggested H1 heading
- missingElements: array of missing SEO elements
  `);
}

/** Generate an email draft */
export async function generateEmail(
  purpose: string,
  context: string,
  tone: "professional" | "friendly" | "formal" = "professional",
) {
  return generateJSON<{
    subject: string;
    body: string;
    previewText: string;
  }>(`
You are writing an email for CreedaVA, a virtual assistant services company.
Purpose: ${purpose}
Context: ${context}
Tone: ${tone}

Return JSON with:
- subject: email subject line
- body: full email body in HTML (use <p>, <br>, <strong>, <em>, <ul>, <li>)
- previewText: preview/preheader text (under 100 chars)
  `);
}

/** Generate a lead follow-up suggestion */
export async function suggestFollowUp(leadName: string, status: string, notes?: string) {
  return generateJSON<{
    subject: string;
    message: string;
    bestTime: string;
    channel: string;
  }>(`
You are a sales assistant for CreedaVA.
Suggest a follow-up for lead "${leadName}" who is currently in "${status}" status.
${notes ? `Previous notes: ${notes}` : ""}

Return JSON with:
- subject: suggested email subject
- message: brief follow-up message (2-3 sentences)
- bestTime: suggested time to reach out
- channel: recommended channel (email, phone, linkedin)
  `);
}

/** Generate landing page content with creative visual design */
export async function generateLandingPage(topic: string, cta: string = "Get Started") {
  const trained = buildLandingPagePrompt(topic);

  // Override cta in the prompt result if custom cta provided
  const result = await generateJSON<{
    title: string;
    slug: string;
    headline: string;
    subheadline: string;
    ctaText: string;
    bodyHtml: string;
  }>(trained);

  // Use the provided CTA if it differs from default
  if (cta !== "Get Started") {
    result.ctaText = cta;
  }

  return result;
}

/** Generate an AI business report */
export async function generateReport(
  type: "weekly" | "monthly" | "custom",
  data: string,
) {
  return generateJSON<{
    title: string;
    summaryHtml: string;
    highlights: string[];
    recommendations: string[];
  }>(`
You are a business analyst for CreedaVA, a virtual assistant services company.
Generate a ${type} performance report.

Data context:
${data}

Return JSON with:
- title: descriptive report title
- summaryHtml: executive summary in HTML (use <p>, <h3>, <ul>, <li>). 3-5 paragraphs covering performance, trends, and areas of focus.
- highlights: array of 3-5 key highlights (short strings)
- recommendations: array of 3-5 actionable recommendations (short strings)
  `);
}

// ─── Web-Search-Enriched Generation ──────────────────

/**
 * Generate text with optional web search enrichment.
 * If webSearchQuery is provided, it fetches live data first
 * and includes it in the prompt context.
 */
export async function generateWithWebContext(
  prompt: string,
  webSearchQuery?: string,
): Promise<string> {
  let webContext = "";

  if (webSearchQuery) {
    try {
      // Lazy-load cloud functions to avoid circular deps
      const { cloudWebSearch } = await import("./cloud-functions");
      const searchResult = await cloudWebSearch(webSearchQuery, 5);
      if (searchResult.results.length > 0) {
        webContext = `\n\n--- LIVE WEB DATA (searched: "${webSearchQuery}") ---\n${searchResult.summary}`;
      }
    } catch (err) {
      console.warn("[AI] Web search enrichment failed:", err);
    }
  }

  return generateText(prompt + webContext);
}

/**
 * Generate text with full context: page-awareness, Firestore data,
 * and optional web search — the highest-level generation function.
 */
export async function generateFullContext(
  pagePath: string,
  userPrompt: string,
  options: {
    webSearchQuery?: string;
    includeMarketIntel?: boolean;
  } = {},
): Promise<string> {
  // Lazy imports to keep the initial bundle lean
  const { loadPageAwareContext } = await import("@/lib/utils/ai-page-context");
  const { buildTrainedPrompt } = await import("@/lib/utils/ai-system-prompt");

  const ctx = await loadPageAwareContext(pagePath);

  let webSearchResults: string | undefined;
  if (options.webSearchQuery) {
    try {
      const { cloudWebSearch } = await import("./cloud-functions");
      const searchResult = await cloudWebSearch(options.webSearchQuery, 5);
      webSearchResults = searchResult.summary;
    } catch {
      // Non-blocking — web search is optional enrichment
    }
  }

  const trained = buildTrainedPrompt(
    ctx.section,
    userPrompt,
    ctx.dataContext,
    {
      includeCompetitors: true,
      includeKPIs: true,
      includeSEOAlgorithms: true,
      includeMarketIntel: options.includeMarketIntel ?? false,
      pageContext: ctx.pageContext,
      webSearchResults,
    },
  );

  return generateText(trained);
}
