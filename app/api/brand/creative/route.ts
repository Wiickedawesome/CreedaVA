/**
 * /api/brand/creative — one brief in, a finished post out.
 *
 *   1. the planner model reads the brief and decides what the post is: the
 *      idea, the image direction, the words inside the image, and a caption
 *      for each platform
 *   2. the image model draws that direction, with the real brand mark attached
 *      as a reference image so it is reproduced rather than reconstructed
 *
 * Why a reference image and not a fine-tune: the Gemini API has no fine-tuning
 * path at all — no model supports it — so there is nothing to distil the mark
 * into. Attaching the artwork is the documented way to keep a brand element
 * faithful, and it needs no training run.
 *
 * Auth and budget mirror /api/ai: admin session, plus the image limiter,
 * because every generation costs money. Nothing is written to Storage here; the
 * client uploads only what it keeps.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAdminUidFromSession } from "@/lib/firebase/admin-session";
import { checkImageGenerationLimit } from "../../ai/rate-limit";
import { EMAIL_LOGO_PNG_BASE64 } from "@/lib/brand/email-logo";
import {
  FORMATS,
  LIMITS,
  buildImagePrompt,
  buildPlanPrompt,
  isFormat,
  isTone,
  parsePlan,
  type CreativeFormat,
  type Tone,
} from "@/lib/brand/creative";

/** Writes the plan. Text only, so cost is noise next to the image. */
const PLANNER_MODEL = "gemini-3.1-flash-lite";

/**
 * Draws the image, in order of preference.
 *
 * The first is the model documented as the workhorse for multi-reference input,
 * which is exactly what a mark reference is. The second is the previous
 * generation, kept as a fallback so a model retirement degrades instead of
 * breaking the studio outright.
 */
const IMAGE_MODELS = ["gemini-nano-banana-2.1", "gemini-3.1-flash-image"];

/** Two is enough to pick between without tripling the bill. */
const CANDIDATES = 2;

interface CreativeImage {
  dataUrl: string;
  mimeType: string;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function isMissingModel(err: unknown): boolean {
  const text = err instanceof Error ? err.message : String(err);
  return /not found|unsupported model|does not exist|NOT_FOUND|404/i.test(text);
}

/**
 * Draw one candidate.
 *
 * The mark travels as an inline part beside the text prompt, which is how the
 * reference-image pattern works: the model sees the actual artwork instead of a
 * description of it.
 */
async function draw(
  ai: GoogleGenAI,
  prompt: string,
  aspectRatio: string,
): Promise<CreativeImage | null> {
  let lastError: unknown = null;

  for (const model of IMAGE_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: EMAIL_LOGO_PNG_BASE64,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio },
        },
      });

      const image = res.candidates?.[0]?.content?.parts?.find(
        (part) => part.inlineData?.data,
      );
      if (!image?.inlineData?.data) {
        lastError = new Error(`${model} returned no image`);
        continue;
      }

      const mimeType = image.inlineData.mimeType ?? "image/png";
      return {
        mimeType,
        dataUrl: `data:${mimeType};base64,${image.inlineData.data}`,
      };
    } catch (err) {
      lastError = err;
      console.error(`[/api/brand/creative] ${model} failed:`, err);
      // A missing model is worth one retry on the fallback; anything else
      // (quota, safety block, bad request) will fail the same way everywhere.
      if (!isMissingModel(err)) break;
    }
  }

  console.error("[/api/brand/creative] no image drawn:", lastError);
  return null;
}

export async function POST(request: NextRequest) {
  const uid = await getAdminUidFromSession();
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await checkImageGenerationLimit(uid);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Hourly image budget reached. Try again later." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Expected a JSON body");
  }

  const brief = typeof body.brief === "string" ? body.brief.trim() : "";
  if (brief.length < 10) {
    return badRequest("Describe the post in a sentence or two");
  }
  if (brief.length > LIMITS.brief) {
    return badRequest(`Keep the brief under ${LIMITS.brief} characters`);
  }

  const formatValue = typeof body.format === "string" ? body.format : "";
  if (!isFormat(formatValue)) {
    return badRequest("Pick a size");
  }
  const format: CreativeFormat = formatValue;

  const toneValue = typeof body.tone === "string" ? body.tone : "warm";
  const tone: Tone = isTone(toneValue) ? toneValue : "warm";

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[/api/brand/creative] GEMINI_API_KEY is not set");
    return NextResponse.json(
      { error: "Image generation is temporarily unavailable" },
      { status: 503 },
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  let plan: ReturnType<typeof parsePlan>;
  try {
    const planned = await ai.models.generateContent({
      model: PLANNER_MODEL,
      contents: buildPlanPrompt(brief, tone),
    });
    plan = parsePlan(planned.text ?? "");
  } catch (err) {
    console.error("[/api/brand/creative] planning failed:", err);
    return NextResponse.json(
      { error: "Could not write the post. Try again." },
      { status: 502 },
    );
  }

  if (!plan) {
    return NextResponse.json(
      { error: "The post came back malformed. Try again." },
      { status: 502 },
    );
  }

  const prompt = buildImagePrompt(plan, format);
  const drawn = await Promise.all(
    Array.from({ length: CANDIDATES }, () =>
      draw(ai, prompt, FORMATS[format].aspectRatio),
    ),
  );

  const images = drawn.filter((image): image is CreativeImage => image !== null);

  // A plan with no image is still useful — the caption costs nothing and the
  // admin can retry the picture. Say so rather than discarding the text.
  if (images.length === 0) {
    return NextResponse.json(
      {
        plan,
        images: [],
        message: "The words came through, but no image was drawn. Try again.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ plan, images });
}
