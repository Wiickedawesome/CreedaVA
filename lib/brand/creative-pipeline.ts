/**
 * The creative pipeline: brief in, rendered post out.
 *
 * Kept out of the route so the same sequence can be exercised without an
 * authenticated request — the renderer is the part most likely to break, and
 * testing it should not require a session cookie.
 *
 * Three steps:
 *   1. the planner model designs the post (idea, composition, wording, captions)
 *   2. the photo slot is filled — curated Unsplash photo, model-drawn scene, or
 *      nothing
 *   3. the design is rendered to a PNG at the requested canvas size
 */

import { GoogleGenAI } from "@google/genai";
import { creativeImage } from "./creative-render";
import { fetchPhotoDataUrl, libraryPhotoUrl } from "./creative-photo";
import {
  FORMATS,
  buildPhotoPrompt,
  buildPlanPrompt,
  creativeFilename,
  parsePlan,
  type CreativeFormat,
  type CreativePlan,
  type Design,
  type Tone,
} from "./creative";

/** Writes the design. Text only, so cost is noise next to an image. */
export const PLANNER_MODEL = "gemini-3.1-flash-lite";

/** Draws a custom photo slot, in order of preference. */
const IMAGE_MODELS = ["gemini-nano-banana-2.1", "gemini-3.1-flash-image"];

export type PlanResult =
  | { ok: true; plan: CreativePlan }
  | { ok: false; reason: "planning-failed" | "malformed" };

function isMissingModel(err: unknown): boolean {
  const text = err instanceof Error ? err.message : String(err);
  return /not found|unsupported model|does not exist|NOT_FOUND|404/i.test(text);
}

/** Write the design for a brief. */
export async function planCreative(
  ai: GoogleGenAI,
  brief: string,
  tone: Tone,
): Promise<PlanResult> {
  try {
    const planned = await ai.models.generateContent({
      model: PLANNER_MODEL,
      contents: buildPlanPrompt(brief, tone),
    });
    const plan = parsePlan(planned.text ?? "");
    return plan ? { ok: true, plan } : { ok: false, reason: "malformed" };
  } catch (err) {
    console.error("[creative] planning failed:", err);
    return { ok: false, reason: "planning-failed" };
  }
}

/**
 * Draw a custom photo slot.
 *
 * No logo reference here: this image sits *behind* the composition, and the
 * renderer adds the mark on top. Sending the mark would invite the model to
 * paste it somewhere the layout does not want it.
 */
async function drawCustomPhoto(
  ai: GoogleGenAI,
  prompt: string,
  format: CreativeFormat,
): Promise<string | null> {
  for (const model of IMAGE_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: FORMATS[format].aspectRatio },
        },
      });

      const image = res.candidates?.[0]?.content?.parts?.find(
        (part) => part.inlineData?.data,
      );
      if (!image?.inlineData?.data) continue;

      const mimeType = image.inlineData.mimeType ?? "image/png";
      return `data:${mimeType};base64,${image.inlineData.data}`;
    } catch (err) {
      console.error(`[creative] ${model} failed:`, err);
      // A missing model is worth one retry on the fallback; anything else
      // (quota, safety block, bad request) fails the same way everywhere.
      if (!isMissingModel(err)) break;
    }
  }
  return null;
}

/** Fill the photo slot, or return null so the composition draws as type only. */
export async function resolvePhoto(
  ai: GoogleGenAI,
  design: Design,
  format: CreativeFormat,
): Promise<string | null> {
  if (design.photoSource === "library") {
    return fetchPhotoDataUrl(libraryPhotoUrl(design.photoId, format));
  }
  if (design.photoSource === "custom") {
    return drawCustomPhoto(ai, buildPhotoPrompt(design, format), format);
  }
  return null;
}

export interface RenderedCreative {
  plan: CreativePlan;
  image: {
    dataUrl: string;
    width: number;
    height: number;
    filename: string;
  };
  /** True when a photo was requested but could not be fetched or drawn. */
  photoDropped: boolean;
}

export type CreativeResult =
  | { ok: true; creative: RenderedCreative }
  | {
      ok: false;
      reason: "planning-failed" | "malformed" | "render-failed";
      /** Present when the words survive even though the picture did not. */
      plan?: CreativePlan;
    };

/** Run all three steps. */
export async function buildCreative(
  ai: GoogleGenAI,
  brief: string,
  tone: Tone,
  format: CreativeFormat,
): Promise<CreativeResult> {
  const planned = await planCreative(ai, brief, tone);
  if (!planned.ok) return planned;

  const { plan } = planned;
  const photo = await resolvePhoto(ai, plan.design, format);

  try {
    const rendered = creativeImage(plan.design, format, photo);
    const bytes = Buffer.from(await rendered.arrayBuffer());
    return {
      ok: true,
      creative: {
        plan,
        image: {
          dataUrl: `data:image/png;base64,${bytes.toString("base64")}`,
          width: FORMATS[format].width,
          height: FORMATS[format].height,
          filename: creativeFilename(format),
        },
        photoDropped: plan.design.photoSource !== "none" && photo === null,
      },
    };
  } catch (err) {
    console.error("[creative] render failed:", err);
    // The words are still worth returning; the picture can be retried.
    return { ok: false, reason: "render-failed", plan };
  }
}
