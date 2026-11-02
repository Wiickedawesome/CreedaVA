/**
 * Curated Unsplash photos used for blog thumbnails (`featuredImage`).
 *
 * We pin explicit photo IDs instead of calling an image-search API: no key,
 * no rate limit, no unpredictable results. `pickFeaturedImage()` scores each
 * photo's keywords against the post's title/tags/text so the fallback is
 * deterministic and reviewable.
 *
 * All URLs must point at `images.unsplash.com`, which is allow-listed in
 * `next.config.mjs` under `images.remotePatterns`.
 */

export interface ThumbnailPhoto {
  /** Unsplash photo id, e.g. "photo-1521737711867-e3b97375f902" */
  id: string;
  /** Short human description used in AI prompt instructions */
  label: string;
  /** Lowercase tokens used for keyword scoring */
  keywords: string[];
}

export const THUMBNAIL_PHOTOS: ThumbnailPhoto[] = [
  {
    id: "photo-1521737711867-e3b97375f902",
    label: "team meeting around a table",
    keywords: ["team", "collaboration", "meeting", "office", "company", "business", "growth"],
  },
  {
    id: "photo-1498050108023-c5249f4df085",
    label: "person working at a laptop",
    keywords: ["laptop", "remote", "work", "productivity", "delegation", "freelance", "tips"],
  },
  {
    id: "photo-1560472354-b33ff0c44a43",
    label: "business handshake",
    keywords: ["hire", "hiring", "partner", "client", "deal", "onboarding", "contract"],
  },
  {
    id: "photo-1593642632559-0c6d3fc62b89",
    label: "home office desk",
    keywords: ["home", "office", "workspace", "setup", "remote", "work-life"],
  },
  {
    id: "photo-1552664730-d307ca884978",
    label: "team planning at a whiteboard",
    keywords: ["process", "workflow", "planning", "strategy", "optimization", "sop", "operations"],
  },
  {
    id: "photo-1556745753-b2904692b3cd",
    label: "customer support agent with headset",
    keywords: ["customer", "support", "service", "chat", "call", "satisfaction", "inbox"],
  },
  {
    id: "photo-1551288049-bebda4e38f71",
    label: "analytics dashboard on a screen",
    keywords: ["analytics", "data", "dashboard", "report", "metrics", "bi", "kpi", "growth", "roi"],
  },
  {
    id: "photo-1522071820081-009f0129c71c",
    label: "diverse team collaborating",
    keywords: ["bilingual", "multilingual", "diverse", "culture", "spanish", "global"],
  },
  {
    id: "photo-1507003211169-0a1dd7228f2d",
    label: "small business owner portrait",
    keywords: ["owner", "entrepreneur", "founder", "startup", "small-business", "solo"],
  },
  {
    id: "photo-1515378960530-7c0da6231fb1",
    label: "casual coffee meeting",
    keywords: ["coffee", "conversation", "consultation", "discovery", "call", "meeting"],
  },
  {
    id: "photo-1454165804606-c3d57bc86b40",
    label: "planning notes with charts",
    keywords: ["planning", "notes", "audit", "checklist", "review", "mistakes"],
  },
  {
    id: "photo-1553877522-43269d4ea984",
    label: "person working on a laptop in an office",
    keywords: ["admin", "assistant", "virtual", "assistant", "task", "time", "saving"],
  },
];

/** Fallback used when nothing scores — a neutral business/office image. */
const DEFAULT_PHOTO = THUMBNAIL_PHOTOS[0]!;

const UNSPLASH_BASE = "https://images.unsplash.com";
/** 16:9 to match the `aspect-video` / `h-48` thumbnail containers. */
const THUMBNAIL_WIDTH = 1200;
const THUMBNAIL_HEIGHT = 675;

/** Build the CDN URL for a thumbnail photo id. */
export function thumbnailUrl(photoId: string): string {
  return `${UNSPLASH_BASE}/${photoId}?w=${THUMBNAIL_WIDTH}&h=${THUMBNAIL_HEIGHT}&fit=crop&auto=format&q=80`;
}

/**
 * Deterministically choose the best-matching thumbnail for a post.
 *
 * Scores each photo by how many of its keywords appear in the given text.
 * Ties resolve to the earlier photo, so repeated calls are stable.
 */
export function pickFeaturedImage(text: string): string {
  const haystack = text.toLowerCase();

  let best = DEFAULT_PHOTO;
  let bestScore = 0;

  for (const photo of THUMBNAIL_PHOTOS) {
    const score = photo.keywords.reduce(
      (total, keyword) => (haystack.includes(keyword) ? total + 1 : total),
      0,
    );
    if (score > bestScore) {
      best = photo;
      bestScore = score;
    }
  }

  return thumbnailUrl(best.id);
}

/** Human-readable list injected into AI prompts so the model picks a valid id. */
export function thumbnailPromptList(): string {
  return THUMBNAIL_PHOTOS.map(
    (photo) => `- ${thumbnailUrl(photo.id)}  (${photo.label})`,
  ).join("\n");
}
