/**
 * Firebase AI (Gemini) service — client-side wrapper
 *
 * Uses @google/generative-ai to call the Gemini API directly,
 * bypassing the Firebase AI Logic proxy which requires App Check.
 *
 * Prerequisites:
 *   1. NEXT_PUBLIC_GEMINI_API_KEY set in .env.local
 *   2. Key must have generativelanguage.googleapis.com enabled
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GenerativeModel, CountTokensRequest } from "@google/generative-ai";

import { buildContentPrompt, buildLandingPagePrompt } from "@/lib/utils/ai-system-prompt";
import type { TrainedPrompt } from "@/lib/utils/ai-system-prompt";

/** Input to all generation functions — either a plain string or a split prompt */
export type PromptInput = string | TrainedPrompt;

// ─── Token Budget ────────────────────────────────────

/**
 * Gemini 2.5 Flash has a 1,048,576 token context window.
 * We leave a 100K token margin for the response + safety.
 */
const TOKEN_BUDGET = 900_000;

// ─── Singleton model instance ────────────────────────

let _model: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (!_model) {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "NEXT_PUBLIC_GEMINI_API_KEY is not set. Add it to .env.local.",
      );
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    _model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }
  return _model;
}

// ─── Internal: Build Gemini request from PromptInput ─

/**
 * Convert a PromptInput to the correct generateContent params.
 * - string: passed as plain user content (legacy behavior)
 * - TrainedPrompt: system instruction separated from user content
 */
function buildRequest(input: PromptInput) {
  if (typeof input === "string") {
    return {
      request: input,
      logLabel: `plain(${input.length} chars)`,
    };
  }
  return {
    request: {
      systemInstruction: input.systemInstruction,
      contents: [{ role: "user" as const, parts: [{ text: input.userContent }] }],
    },
    logLabel: `split(sys:${input.systemInstruction.length}, user:${input.userContent.length} chars)`,
  };
}

/**
 * Count tokens and warn if over budget. Returns true if safe to proceed.
 */
async function validateTokenBudget(input: PromptInput): Promise<boolean> {
  try {
    const model = getModel();
    let countRequest: CountTokensRequest;
    if (typeof input === "string") {
      countRequest = { contents: [{ role: "user", parts: [{ text: input }] }] };
    } else {
      // SDK types lag behind API — systemInstruction is supported at runtime
      countRequest = {
        contents: [{ role: "user", parts: [{ text: input.userContent }] }],
        systemInstruction: { role: "model", parts: [{ text: input.systemInstruction }] },
      } as CountTokensRequest;
    }
    const { totalTokens } = await model.countTokens(countRequest);
    console.info(`[AI] Token count: ${totalTokens.toLocaleString()} / ${TOKEN_BUDGET.toLocaleString()} budget`);
    if (totalTokens > TOKEN_BUDGET) {
      console.warn(`[AI] ⚠️ Token count ${totalTokens} exceeds budget ${TOKEN_BUDGET} — request may fail`);
      return false;
    }
    return true;
  } catch (err) {
    // Token counting failed — proceed optimistically
    console.warn("[AI] Token counting failed, proceeding without validation:", err);
    return true;
  }
}

// ─── Low-level helpers ───────────────────────────────

/** Generate text from a prompt. Returns the text string. */
export async function generateText(input: PromptInput): Promise<string> {
  const model = getModel();
  const { request, logLabel } = buildRequest(input);
  await validateTokenBudget(input);
  console.info(`[AI] generateText — ${logLabel}`);
  const result = await model.generateContent(request);
  return result.response.text() ?? "";
}

/**
 * Generate text from a prompt with streaming.
 * Returns an async generator that yields text chunks as they arrive.
 */
export async function* generateTextStream(input: PromptInput): AsyncGenerator<string, void, unknown> {
  const model = getModel();
  const { request, logLabel } = buildRequest(input);
  await validateTokenBudget(input);
  console.info(`[AI] generateTextStream — ${logLabel}`);
  const result = await model.generateContentStream(request);
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
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
 * Generate text with Google Search grounding enabled.
 * Gemini will use real-time web search to ground factual responses.
 * Returns { text, sources } where sources are extracted from grounding metadata.
 */
export async function generateTextGrounded(
  input: PromptInput,
): Promise<{ text: string; sources: GroundingSource[] }> {
  const model = getModel();
  const { logLabel } = buildRequest(input);
  await validateTokenBudget(input);
  console.info(`[AI] generateTextGrounded — ${logLabel}`);

  // Build request with Google Search grounding tool
  let request;
  if (typeof input === "string") {
    request = {
      contents: [{ role: "user" as const, parts: [{ text: input }] }],
      tools: [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "MODE_DYNAMIC" as const } } }],
    };
  } else {
    request = {
      systemInstruction: input.systemInstruction,
      contents: [{ role: "user" as const, parts: [{ text: input.userContent }] }],
      tools: [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "MODE_DYNAMIC" as const } } }],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await model.generateContent(request as any);
  const text = result.response.text() ?? "";
  const sources = extractGroundingSources(result.response);

  if (sources.length > 0) {
    console.info(`[AI] Grounding found ${sources.length} source(s)`);
  }

  return { text, sources };
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
  const raw = await generateText(adjusted);
  // Strip potential markdown fences the model might still add
  const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```\s*$/g, "").trim();
  return JSON.parse(cleaned) as T;
}

// ─── Domain-specific AI functions ────────────────────

/** Generate a blog post draft with creative visual design */
export async function generateBlogPost(topic: string, tone = "professional", length = "800 words") {
  const trained = buildContentPrompt(
    "Blog Content AI",
    `Write a visually engaging blog post about: "${topic}"

Tone: ${tone}
Target length: ${length}

Use the CREATIVE HTML DESIGN FRAMEWORK to make the content visually stunning.
Include CSS animations, SVG icons, callout boxes, stat highlights, and a CTA section.

Return JSON with these fields:
- title: compelling blog title (SEO-optimized, under 60 chars)
- slug: URL-friendly slug
- excerpt: 1-2 sentence summary
- content: full blog post in RICH HTML with inline styles, <style> animations,
  SVG design elements, gradient CTA section, callout boxes, and visual hierarchy.
  Follow the BLOG CONTENT RULES and CREATIVE HTML DESIGN FRAMEWORK.
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

/** Generate social media posts */
export async function generateSocialPosts(
  topic: string,
  platforms: string[] = ["linkedin", "twitter", "facebook"],
) {
  return generateJSON<{
    posts: {
      platform: string;
      content: string;
      hashtags: string[];
      characterCount: number;
    }[];
  }>(`
You are a social media manager for CreedaVA, a virtual assistant services company.
Create social media posts about: "${topic}"

Platforms: ${platforms.join(", ")}

For each platform:
- Follow platform character limits (Twitter/X: 280, LinkedIn: 3000, Facebook: 63206)
- Use appropriate tone for each platform
- Include relevant hashtags
- Include a call to action

Return JSON with a "posts" array, each with: platform, content, hashtags, characterCount.
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
