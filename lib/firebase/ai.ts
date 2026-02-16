/**
 * Firebase AI (Gemini) service — client-side wrapper
 *
 * Uses firebase/ai (Firebase AI Logic) which proxies Gemini through
 * the Firebase project, requiring no separate API key in the client.
 *
 * Prerequisites:
 *   1. Firebase project with AI Logic enabled in the console
 *   2. Gemini Developer API provider selected
 */

import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import type { GenerativeModel } from "firebase/ai";
import { app } from "@/lib/firebase/config";

// ─── Singleton model instance ────────────────────────

let _model: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (!_model) {
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    _model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
  }
  return _model;
}

// ─── Low-level helpers ───────────────────────────────

/** Generate text from a prompt. Returns the text string. */
export async function generateText(prompt: string): Promise<string> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text() ?? "";
}

/** Generate structured JSON from a prompt. */
export async function generateJSON<T = unknown>(prompt: string): Promise<T> {
  const raw = await generateText(prompt + "\n\nReturn ONLY valid JSON, no markdown fences.");
  // Strip potential markdown fences the model might still add
  const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```\s*$/g, "").trim();
  return JSON.parse(cleaned) as T;
}

// ─── Domain-specific AI functions ────────────────────

/** Generate a blog post draft */
export async function generateBlogPost(topic: string, tone = "professional", length = "800 words") {
  return generateJSON<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    tags: string[];
    metaDescription: string;
  }>(`
You are a content writer for CreedaVA, a virtual assistant services company.
Write a blog post about: "${topic}"

Tone: ${tone}
Target length: ${length}

Return JSON with these fields:
- title: compelling blog title
- slug: URL-friendly slug
- excerpt: 1-2 sentence summary
- content: full blog post in HTML (use <h2>, <p>, <ul>, <li>, <strong>, <em> tags)
- tags: array of 3-5 relevant tags
- metaDescription: SEO meta description (under 160 chars)
  `);
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

/** Generate landing page content */
export async function generateLandingPage(topic: string, cta: string = "Get Started") {
  return generateJSON<{
    title: string;
    slug: string;
    headline: string;
    subheadline: string;
    ctaText: string;
    bodyHtml: string;
  }>(`
You are a conversion copywriter for CreedaVA, a virtual assistant services company.
Create landing page content for: "${topic}"
CTA button: "${cta}"

Return JSON with:
- title: page title (under 60 chars)
- slug: URL-friendly slug
- headline: attention-grabbing H1 (under 10 words)
- subheadline: supporting text (1-2 sentences)
- ctaText: call-to-action button text
- bodyHtml: landing page body in HTML (use <h2>, <p>, <ul>, <li>, <strong>, <em>). Include benefits, social proof, and a features section. Keep it concise and conversion-focused.
  `);
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
