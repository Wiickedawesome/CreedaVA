/**
 * Brand photography for article images.
 *
 * The brief is "does not look AI". That cannot be held by prompting alone — an
 * image model reproduces the glossy tells it was trained on no matter how the
 * request is phrased. So it is enforced in two places:
 *
 *   1. `IMAGE_STYLE_SPEC` describes a real camera in a real room, and names the
 *      tells explicitly so the prompt is at least pushing the right way.
 *   2. `SCREENING_CHECKLIST` sends every candidate back to a vision model that
 *      has to argue the image is *not* obviously generated. A candidate that
 *      fails is discarded before it is ever shown.
 *
 * Deliberately no people. A stock-photo face is the strongest AI tell there is,
 * and a convincing one reads as an invented client photo — the same honesty
 * problem as the fake testimonials removed from the blog. Still life, surfaces
 * and working spaces carry the brand without claiming anyone exists.
 */

/**
 * Style clause appended to every image request.
 *
 * Written as constraints on a photograph rather than adjectives about one, so
 * the model has something concrete to satisfy.
 */
export const IMAGE_STYLE_SPEC = `Shot on a 35mm camera with a 50mm lens at f/2.8, natural light only.
Single soft window light from one side, gentle falloff into shadow; no second
light source, no artificial fill. Neutral-to-warm white balance, muted palette,
true-to-life saturation. Honest materials — worn wood, linen, uncoated paper
with visible fibre, matte ceramic, brushed metal with fingerprints. Real
texture and fine grain, slight dust, one element imperfect or off-centre.
Composed as a candid documentary still life, not a product render.

Avoid absolutely: glowing gradients, neon or volumetric light, holographic or
floating interface elements, levitating objects, perfect symmetry, teal-and-
orange cinematic grading, heavy lens flare, extreme bokeh, plastic or
over-smoothed surfaces, oversaturated colour, HDR halos, and any text,
lettering, logo or watermark.`;

/**
 * Tells a screener looks for. Kept as a list rather than prose so the vision
 * model has discrete things to answer rather than a vague question.
 */
export const AI_TELLS = [
  "glowing or neon light that has no physical source",
  "floating, holographic or levitating interface elements",
  "implausible physics or objects that do not rest on anything",
  "over-perfect symmetry or a sterile showroom-perfect arrangement",
  "teal-and-orange cinematic colour grading",
  "waxy, plastic or otherwise over-smoothed surfaces",
  "physically wrong shadows or shadow direction contradicting the light",
  "garbled text, fake lettering or a smudged logo",
  "an obviously rendered, painted or illustration look rather than a photograph",
  "stock-photo perfection that no real room or desk has",
] as const;

/** The composed image prompt for a scene. */
export function buildImagePrompt(scene: string): string {
  return `${scene.trim()}\n\n${IMAGE_STYLE_SPEC}`;
}

/**
 * The brief the text model answers before anything is drawn.
 *
 * Asking the text model for the scene keeps subjects from repeating across
 * posts, which is the same variance problem the article bodies had.
 */
export function buildSceneRequest(title: string, excerpt: string): string {
  return `You are a photography director for CreedaVA, a virtual assistant and
business process outsourcing company. Its brand is calm, warm and practical:
cream paper, deep green, natural light.

Propose ONE photograph to illustrate this article:

Title: ${title}
Summary: ${excerpt}

Rules for the scene:
- A still life or working environment ONLY. No people, no hands, no faces, no
  silhouettes of people.
- No screens showing dashboards, charts or interfaces, and no text of any kind.
- Ordinary, believable objects that suit the article's subject — a desk, a
  notebook, plants, a mug, files, a window, textiles.
- It must read as a photograph someone actually took, not a staged product shot.

Reply with the scene only: one or two sentences describing what is in frame,
the surface, and the direction of the light. No preamble, no quotation marks.`;
}

/** Parse the screener's verdict. Tolerant of stray prose around the JSON. */
export function parseScreening(
  raw: string,
): { passes: boolean; tells: string[] } {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    // An unreadable verdict is not a pass. Failing closed keeps a broken
    // screener from silently letting every candidate through.
    return { passes: false, tells: ["screener returned no verdict"] };
  }

  try {
    const parsed = JSON.parse(match[0]) as {
      passes?: unknown;
      tells?: unknown;
    };
    const tells = Array.isArray(parsed.tells)
      ? parsed.tells.filter((t): t is string => typeof t === "string")
      : [];
    return { passes: parsed.passes === true, tells };
  } catch {
    return { passes: false, tells: ["screener verdict was not valid JSON"] };
  }
}

/** The screening prompt: audit the candidate, do not describe it. */
export function buildScreeningRequest(): string {
  return `You are auditing an image that was generated for a professional
services blog. It will be published as a real photograph, so a reader must not
be able to tell it was generated.

Check the image against each tell:
${AI_TELLS.map((tell, i) => `${i + 1}. ${tell}`).join("\n")}

Judge only what you can see. Ordinary imperfection is good and is NOT a tell —
real photographs are slightly soft, slightly off-centre and slightly dusty.
Do not flag "it looks like stock photography" unless you can name a specific
tell from the list.

Reply with JSON only:
{"passes": true or false, "tells": ["short reason", ...]}

"passes" is true only when you cannot name a tell with any confidence. If the
image is an illustration rather than a photograph, passes is false.`;
}
