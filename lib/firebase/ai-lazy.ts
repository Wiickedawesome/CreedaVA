/**
 * Lazy-loaded AI helpers
 *
 * Each function dynamically imports lib/firebase/ai only when called,
 * keeping the firebase/ai SDK out of the initial page bundle.
 *
 * v2 — Also exposes the AI Engine for advanced context-aware operations.
 */

export async function lazyGenerateText(
  ...args: Parameters<typeof import("./ai").generateText>
) {
  const { generateText } = await import("./ai");
  return generateText(...args);
}

export async function lazyGenerateBlogPost(
  ...args: Parameters<typeof import("./ai").generateBlogPost>
) {
  const { generateBlogPost } = await import("./ai");
  return generateBlogPost(...args);
}

export async function lazySuggestKeywords(
  ...args: Parameters<typeof import("./ai").suggestKeywords>
) {
  const { suggestKeywords } = await import("./ai");
  return suggestKeywords(...args);
}

export async function lazyAnalyzeSEO(
  ...args: Parameters<typeof import("./ai").analyzeSEO>
) {
  const { analyzeSEO } = await import("./ai");
  return analyzeSEO(...args);
}

export async function lazyGenerateSocialPosts(
  ...args: Parameters<typeof import("./ai").generateSocialPosts>
) {
  const { generateSocialPosts } = await import("./ai");
  return generateSocialPosts(...args);
}

export async function lazyGenerateEmail(
  ...args: Parameters<typeof import("./ai").generateEmail>
) {
  const { generateEmail } = await import("./ai");
  return generateEmail(...args);
}

export async function lazyGenerateLandingPage(
  ...args: Parameters<typeof import("./ai").generateLandingPage>
) {
  const { generateLandingPage } = await import("./ai");
  return generateLandingPage(...args);
}

export async function lazyGenerateReport(
  ...args: Parameters<typeof import("./ai").generateReport>
) {
  const { generateReport } = await import("./ai");
  return generateReport(...args);
}

// ─── AI Engine v2 (lazy-loaded) ──────────────────────

/** Generate with full page-aware context + web search enrichment */
export async function lazyGenerateFullContext(
  ...args: Parameters<typeof import("./ai").generateFullContext>
) {
  const { generateFullContext } = await import("./ai");
  return generateFullContext(...args);
}

/** Generate with optional web search context */
export async function lazyGenerateWithWebContext(
  ...args: Parameters<typeof import("./ai").generateWithWebContext>
) {
  const { generateWithWebContext } = await import("./ai");
  return generateWithWebContext(...args);
}

/** Lazy-load the full AI Engine for advanced operations */
export async function lazyGetAIEngine() {
  const { aiEngine } = await import("./ai-engine");
  return aiEngine;
}

/** Run SEO analysis with full business data context */
export async function lazyRunSEOAnalysis() {
  const { runSEOAnalysis } = await import("./ai-engine");
  return runSEOAnalysis();
}

/** Generate and auto-save blog post to Firestore */
export async function lazyGenerateAndSaveBlogPost(
  topic: string,
  targetKeyword?: string,
) {
  const { generateAndSaveBlogPost } = await import("./ai-engine");
  return generateAndSaveBlogPost(topic, targetKeyword);
}

/** Analyze sales pipeline with AI */
export async function lazyAnalyzePipeline() {
  const { analyzePipeline } = await import("./ai-engine");
  return analyzePipeline();
}

/** Analyze customer health and churn risk */
export async function lazyAnalyzeCustomerHealth() {
  const { analyzeCustomerHealth } = await import("./ai-engine");
  return analyzeCustomerHealth();
}

/** Generate content strategy */
export async function lazyGenerateContentStrategy(weeks?: number) {
  const { generateContentStrategy } = await import("./ai-engine");
  return generateContentStrategy(weeks);
}

/** Generate market intelligence report */
export async function lazyGenerateMarketIntelReport() {
  const { generateMarketIntelReport } = await import("./ai-engine");
  return generateMarketIntelReport();
}

/** Generate and save AI report to Firestore */
export async function lazyGenerateAndSaveReport(
  type: "daily" | "weekly" | "monthly" | "seo" | "competitor" | "market",
  pagePath?: string,
) {
  const { generateAndSaveReport } = await import("./ai-engine");
  return generateAndSaveReport(type, pagePath);
}
