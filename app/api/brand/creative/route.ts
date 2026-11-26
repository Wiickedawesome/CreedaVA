/**
 * /api/brand/creative — one brief in, a finished social post out.
 *
 * The work lives in `lib/brand/creative-pipeline.ts`; this handler is auth,
 * validation and error mapping. Auth and budget mirror /api/ai: an admin
 * session plus the image limiter, because a custom photo costs money. Nothing
 * is written to Storage — the PNG comes back as a data URL and the client saves
 * what it keeps.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAdminUidFromSession } from "@/lib/firebase/admin-session";
import { checkImageGenerationLimit } from "../../ai/rate-limit";
import { buildCreative } from "@/lib/brand/creative-pipeline";
import {
  LIMITS,
  isFormat,
  isTone,
  type CreativeFormat,
  type Tone,
} from "@/lib/brand/creative";

const MESSAGES = {
  "planning-failed": "Could not design the post. Try again.",
  malformed: "The design came back malformed. Try again.",
  "render-failed": "Could not draw that composition. Try another angle.",
} as const;

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
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const brief = typeof body.brief === "string" ? body.brief.trim() : "";
  if (brief.length < 10) {
    return NextResponse.json(
      { error: "Describe the post in a sentence or two" },
      { status: 400 },
    );
  }
  if (brief.length > LIMITS.brief) {
    return NextResponse.json(
      { error: `Keep the brief under ${LIMITS.brief} characters` },
      { status: 400 },
    );
  }

  const formatValue = typeof body.format === "string" ? body.format : "";
  if (!isFormat(formatValue)) {
    return NextResponse.json({ error: "Pick a size" }, { status: 400 });
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

  const result = await buildCreative(
    new GoogleGenAI({ apiKey }),
    brief,
    tone,
    format,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: MESSAGES[result.reason], plan: result.plan },
      { status: 502 },
    );
  }

  const { plan, image, photoDropped } = result.creative;
  return NextResponse.json({ plan, image, photoDropped });
}
