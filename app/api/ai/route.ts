/**
 * /api/ai — Server-side Gemini API proxy
 *
 * Routes ALL Gemini calls through this handler so the API key is never
 * exposed in the browser bundle. Enforces Firebase session-cookie auth
 * and per-user rate limiting before forwarding to the Gemini API.
 *
 * Request body shape:
 * {
 *   type: "generate" | "stream" | "grounded" | "chat"
 *   // For "generate" / "stream" / "grounded":
 *   userContent?: string          // plain-string prompt (legacy)
 *   systemInstruction?: string    // split-prompt system instruction
 *   // For "chat" (tool-calling loop):
 *   systemInstruction: string
 *   contents: Content[]           // full conversation history
 * }
 *
 * Response:
 *   "generate"  → { text: string }
 *   "stream"    → text/plain stream
 *   "grounded"  → { text: string; sources: { title: string; url: string }[] }
 *   "chat"      → { parts: Part[]; text: string }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  FunctionCallingMode,
} from "@google/generative-ai";
import type { Content, Part } from "@google/generative-ai";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { ALL_TOOLS } from "@/lib/firebase/ai-tools";
import { checkRateLimit, checkGroundedSearchLimit } from "./rate-limit";

// ─── Auth helper ─────────────────────────────────────

async function getUidFromSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("__session")?.value;
    if (!session) return null;
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

// ─── Grounding source extractor ───────────────────────

interface GroundingSource {
  title: string;
  url: string;
}

interface GroundingChunk {
  web?: {
    title?: string;
    uri?: string;
  };
}

interface GroundingResponse {
  candidates?: {
    groundingMetadata?: {
      groundingChunks?: GroundingChunk[];
    };
  }[];
}

function extractSources(response: GroundingResponse): GroundingSource[] {
  try {
    const metadata = response?.candidates?.[0]?.groundingMetadata;
    if (!metadata?.groundingChunks) return [];
    return (
      metadata.groundingChunks
        .filter((chunk): chunk is GroundingChunk & { web: { uri: string; title?: string } } => Boolean(chunk.web?.uri))
        .map((chunk) => ({ title: chunk.web.title || "Source", url: chunk.web.uri }))
    );
  } catch {
    return [];
  }
}

// ─── Route handler ────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Verify session
  const uid = await getUidFromSession();
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Rate limit
  const { allowed, remaining } = await checkRateLimit(uid);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again next hour." },
      {
        status: 429,
        headers: { "X-RateLimit-Remaining": "0" },
      },
    );
  }

  // 3. Parse body
  let body: {
    type: "generate" | "stream" | "grounded" | "chat";
    userContent?: string;
    systemInstruction?: string;
    contents?: Content[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, userContent, systemInstruction, contents } = body;

  // 3b. Input validation
  const MAX_INPUT_LENGTH = 50_000;
  if (userContent && userContent.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: `Input too long (max ${MAX_INPUT_LENGTH} characters)` },
      { status: 400 },
    );
  }
  if (systemInstruction && systemInstruction.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: `System instruction too long (max ${MAX_INPUT_LENGTH} characters)` },
      { status: 400 },
    );
  }
  // Validate contents array size for chat requests
  if (contents && Array.isArray(contents)) {
    const totalParts = contents.reduce(
      (sum, c) => sum + (Array.isArray(c.parts) ? c.parts.length : 0),
      0,
    );
    if (totalParts > 500) {
      return NextResponse.json(
        { error: "Conversation history too large" },
        { status: 400 },
      );
    }
  }

  // 4. Init Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[/api/ai] GEMINI_API_KEY is not set");
    return NextResponse.json(
      { error: "AI service is temporarily unavailable" },
      { status: 503 },
    );
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  const PRIMARY_MODEL = "gemini-2.5-flash";
  const FALLBACK_MODEL = "gemini-2.0-flash";

  // Server-side requests have no Referer by default.
  // If the API key has HTTP referrer restrictions set in Google Cloud Console,
  // injecting the production origin satisfies the restriction.
  const geminiRequestOptions = {
    customHeaders: { Referer: "https://creedava.com" },
  };

  // ── Handle each call type ──────────────────────

  try {
    // ── "generate": single text generation ──
    if (type === "generate") {
      const model = genAI.getGenerativeModel({ model: PRIMARY_MODEL }, geminiRequestOptions);
      const request =
        systemInstruction && userContent
          ? {
              systemInstruction,
              contents: [
                { role: "user" as const, parts: [{ text: userContent }] },
              ],
            }
          : (userContent ?? "");
      const result = await model.generateContent(request);
      const text = result.response.text() ?? "";
      return NextResponse.json(
        { text },
        { headers: { "X-RateLimit-Remaining": String(remaining) } },
      );
    }

    // ── "stream": streaming text generation ──
    if (type === "stream") {
      const model = genAI.getGenerativeModel({ model: PRIMARY_MODEL }, geminiRequestOptions);
      const request =
        systemInstruction && userContent
          ? {
              systemInstruction,
              contents: [
                { role: "user" as const, parts: [{ text: userContent }] },
              ],
            }
          : (userContent ?? "");
      const result = await model.generateContentStream(request);
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) controller.enqueue(encoder.encode(chunkText));
          }
          controller.close();
        },
      });
      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-RateLimit-Remaining": String(remaining),
        },
      });
    }

    // ── "grounded": Google Search grounding ──
    if (type === "grounded") {
      const groundedLimit = await checkGroundedSearchLimit(uid);
      if (!groundedLimit.allowed) {
        return NextResponse.json(
          { error: "Daily grounded search limit reached. Try again tomorrow." },
          { status: 429, headers: { "X-RateLimit-Remaining": "0" } },
        );
      }
      const model = genAI.getGenerativeModel({ model: PRIMARY_MODEL }, geminiRequestOptions);
      const groundingRequest =
        systemInstruction && userContent
          ? {
              systemInstruction,
              contents: [
                { role: "user" as const, parts: [{ text: userContent }] },
              ],
              tools: [
                {
                  googleSearchRetrieval: {
                    dynamicRetrievalConfig: { mode: "MODE_DYNAMIC" as const },
                  },
                },
              ],
            }
          : {
              contents: [
                { role: "user" as const, parts: [{ text: userContent ?? "" }] },
              ],
              tools: [
                {
                  googleSearchRetrieval: {
                    dynamicRetrievalConfig: { mode: "MODE_DYNAMIC" as const },
                  },
                },
              ],
            };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await model.generateContent(groundingRequest as any);
      const text = result.response.text() ?? "";
      const sources = extractSources(result.response);
      return NextResponse.json(
        { text, sources },
        { headers: { "X-RateLimit-Remaining": String(remaining) } },
      );
    }

    // ── "chat": tool-calling (single round, called per loop iteration) ──
    if (type === "chat") {
      if (!systemInstruction || !Array.isArray(contents)) {
        return NextResponse.json(
          { error: "chat type requires systemInstruction and contents" },
          { status: 400 },
        );
      }
      const model = genAI.getGenerativeModel({
        model: PRIMARY_MODEL,
        tools: [ALL_TOOLS],
        toolConfig: {
          functionCallingConfig: { mode: FunctionCallingMode.AUTO },
        },
      }, geminiRequestOptions);
      const result = await model.generateContent({
        systemInstruction,
        contents: contents as Content[],
      });
      const candidate = result.response.candidates?.[0];
      const parts: Part[] = candidate?.content?.parts ?? [];
      const text = result.response.text() ?? "";
      return NextResponse.json(
        { parts, text },
        { headers: { "X-RateLimit-Remaining": String(remaining) } },
      );
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err) {
    console.error("[/api/ai] Gemini primary model error:", err);

    // Fallback: retry generate/chat with secondary model
    if (type === "generate" || type === "chat") {
      try {
        console.log(`[/api/ai] Retrying with fallback model: ${FALLBACK_MODEL}`);
        if (type === "generate") {
          const fallbackModel = genAI.getGenerativeModel(
            { model: FALLBACK_MODEL },
            geminiRequestOptions,
          );
          const request =
            systemInstruction && userContent
              ? {
                  systemInstruction,
                  contents: [
                    { role: "user" as const, parts: [{ text: userContent }] },
                  ],
                }
              : (userContent ?? "");
          const result = await fallbackModel.generateContent(request);
          const text = result.response.text() ?? "";
          return NextResponse.json(
            { text },
            { headers: { "X-RateLimit-Remaining": String(remaining) } },
          );
        }
        if (type === "chat" && systemInstruction && Array.isArray(contents)) {
          const fallbackModel = genAI.getGenerativeModel(
            {
              model: FALLBACK_MODEL,
              tools: [ALL_TOOLS],
              toolConfig: {
                functionCallingConfig: { mode: FunctionCallingMode.AUTO },
              },
            },
            geminiRequestOptions,
          );
          const result = await fallbackModel.generateContent({
            systemInstruction,
            contents: contents as Content[],
          });
          const candidate = result.response.candidates?.[0];
          const parts: Part[] = candidate?.content?.parts ?? [];
          const text = result.response.text() ?? "";
          return NextResponse.json(
            { parts, text },
            { headers: { "X-RateLimit-Remaining": String(remaining) } },
          );
        }
      } catch (fallbackErr) {
        console.error("[/api/ai] Fallback model also failed:", fallbackErr);
      }
    }

    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 },
    );
  }
}
