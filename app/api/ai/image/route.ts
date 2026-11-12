/**
 * /api/ai/image — generate article images that look like photographs.
 *
 * Three steps, in order:
 *   1. the text model writes a scene brief from the post itself, so subjects
 *      differ between posts instead of repeating a house shot
 *   2. the image model draws several candidates of that scene
 *   3. each candidate is screened by the vision model against `AI_TELLS` and
 *      dropped if it cannot pass
 *
 * Only survivors are returned, as data URLs. Uploading is left to the client,
 * which already owns `uploadImage` and the admin's Storage rules — this route
 * needs no bucket credentials and writes nothing.
 *
 * Auth and rate limiting mirror /api/ai; image generation has its own smaller
 * budget because each generation costs real money.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAdminUidFromSession } from "@/lib/firebase/admin-session";
import { checkImageGenerationLimit } from "../rate-limit";
import {
  buildImagePrompt,
  buildSceneRequest,
  buildScreeningRequest,
  parseScreening,
} from "@/lib/utils/product-photography";

/** Draws the image. Flash-Lite is ~$0.034 per 1K image — the cheap end. */
const IMAGE_MODEL = "gemini-3.1-flash-lite-image";

/** Writes the scene brief and screens candidates. Text only, so cost is noise. */
const REVIEW_MODEL = "gemini-3.1-flash-lite";

/** Candidates per request. More than one is the only reliable way to avoid a
 * dud; the admin sees only the survivors and picks. */
const CANDIDATES = 3;

/** Matches `.mk-article--wide img { aspect-ratio: 16/9 }`, so an article image
 * is never cropped by the stylesheet. The API spells it with a colon; the CSS
 * uses a slash. */
const ASPECT_RATIO = "16:9";

const MAX_TITLE_LENGTH = 200;
const MAX_EXCERPT_LENGTH = 600;

interface Candidate {
  dataUrl: string;
  mimeType: string;
}

interface Rejected {
  /** What the screener objected to, so a failure is explainable. */
  tells: string[];
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

/** Ask the text model for a scene brief. Falls back to the title alone. */
async function writeSceneBrief(
  ai: GoogleGenAI,
  title: string,
  excerpt: string,
): Promise<string> {
  try {
    const res = await ai.models.generateContent({
      model: REVIEW_MODEL,
      contents: buildSceneRequest(title, excerpt),
    });
    const scene = res.text?.trim();
    return scene && scene.length > 20 ? scene : title;
  } catch (err) {
    console.error("[/api/ai/image] scene brief failed, using the title:", err);
    return `A calm working still life suggesting: ${title}`;
  }
}

/** True when the vision model cannot name a tell. Fails closed. */
async function passesScreening(
  ai: GoogleGenAI,
  candidate: Candidate,
): Promise<boolean> {
  try {
    const res = await ai.models.generateContent({
      model: REVIEW_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: buildScreeningRequest() },
            {
              inlineData: {
                mimeType: candidate.mimeType,
                data: candidate.dataUrl.split(",")[1] ?? "",
              },
            },
          ],
        },
      ],
    });
    return parseScreening(res.text ?? "").passes;
  } catch (err) {
    // A screener that cannot run is not evidence of a good image.
    console.error("[/api/ai/image] screening failed:", err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const uid = await getAdminUidFromSession();
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = await checkImageGenerationLimit(uid);
  if (!allowed) {
    return NextResponse.json(
      { error: "Image generation limit reached. Try again next hour." },
      { status: 429 },
    );
  }

  let body: { title?: string; excerpt?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const title = body.title?.trim() ?? "";
  const excerpt = body.excerpt?.trim() ?? "";

  if (!title) {
    return badRequest("A title is required to choose a subject");
  }
  if (title.length > MAX_TITLE_LENGTH || excerpt.length > MAX_EXCERPT_LENGTH) {
    return badRequest("Title or excerpt is too long");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[/api/ai/image] GEMINI_API_KEY is not set");
    return NextResponse.json(
      { error: "Image generation is temporarily unavailable" },
      { status: 503 },
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const scene = await writeSceneBrief(ai, title, excerpt);
  const prompt = buildImagePrompt(scene);

  // Draw all candidates together: they are independent, and serialising them
  // would make the panel feel broken.
  const drawn = await Promise.all(
    Array.from({ length: CANDIDATES }, async (): Promise<Candidate | null> => {
      try {
        const res = await ai.models.generateContent({
          model: IMAGE_MODEL,
          contents: prompt,
          config: {
            responseModalities: ["IMAGE"],
            imageConfig: { aspectRatio: ASPECT_RATIO },
          },
        });
        const image = res.candidates?.[0]?.content?.parts?.find(
          (part) => part.inlineData?.data,
        );
        if (!image?.inlineData?.data) return null;

        const mimeType = image.inlineData.mimeType ?? "image/png";
        return {
          mimeType,
          dataUrl: `data:${mimeType};base64,${image.inlineData.data}`,
        };
      } catch (err) {
        console.error("[/api/ai/image] generation failed:", err);
        return null;
      }
    }),
  );

  const generated = drawn.filter((c): c is Candidate => c !== null);
  if (generated.length === 0) {
    return NextResponse.json(
      { error: "No image could be generated. Try again." },
      { status: 502 },
    );
  }

  const verdicts = await Promise.all(
    generated.map((candidate) => passesScreening(ai, candidate)),
  );

  const accepted: Candidate[] = [];
  const rejected: Rejected[] = [];
  generated.forEach((candidate, i) => {
    if (verdicts[i]) {
      accepted.push(candidate);
    } else {
      rejected.push({ tells: ["did not pass the AI-tell screening"] });
    }
  });

  // Nothing survived. Return the best guess anyway and say so, rather than
  // failing the request outright — the admin can still judge it themselves.
  if (accepted.length === 0) {
    return NextResponse.json({
      scene,
      candidates: generated.map((candidate) => ({ ...candidate, flagged: true })),
      screened: 0,
      message: "None of the candidates passed screening — review before using.",
    });
  }

  return NextResponse.json({
    scene,
    candidates: accepted.map((candidate) => ({ ...candidate, flagged: false })),
    screened: accepted.length,
  });
}
