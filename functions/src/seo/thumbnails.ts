/**
 * Curated Unsplash thumbnails for SEO-agent-written blog drafts.
 *
 * NOTE: functions/ is a separate TypeScript project (`rootDir: "src"`), so it
 * cannot import from the Next app's `lib/`. This list intentionally mirrors
 * `lib/constants/blog-images.ts` — keep the two in sync when adding photos.
 */

export interface ThumbnailPhoto {
  id: string;
  label: string;
  keywords: string[];
}

const THUMBNAIL_PHOTOS: ThumbnailPhoto[] = [
  { id: "photo-1521737711867-e3b97375f902", label: "team meeting around a table", keywords: ["team", "collaboration", "meeting", "office", "company", "business", "growth"] },
  { id: "photo-1498050108023-c5249f4df085", label: "person working at a laptop", keywords: ["laptop", "remote", "work", "productivity", "delegation", "freelance", "tips"] },
  { id: "photo-1560472354-b33ff0c44a43", label: "business handshake", keywords: ["hire", "hiring", "partner", "client", "deal", "onboarding", "contract"] },
  { id: "photo-1593642632559-0c6d3fc62b89", label: "home office desk", keywords: ["home", "office", "workspace", "setup", "remote", "work-life"] },
  { id: "photo-1552664730-d307ca884978", label: "team planning at a whiteboard", keywords: ["process", "workflow", "planning", "strategy", "optimization", "sop", "operations"] },
  { id: "photo-1556745753-b2904692b3cd", label: "customer support agent with headset", keywords: ["customer", "support", "service", "chat", "call", "satisfaction", "inbox"] },
  { id: "photo-1551288049-bebda4e38f71", label: "analytics dashboard on a screen", keywords: ["analytics", "data", "dashboard", "report", "metrics", "bi", "kpi", "growth", "roi"] },
  { id: "photo-1522071820081-009f0129c71c", label: "diverse team collaborating", keywords: ["bilingual", "multilingual", "diverse", "culture", "spanish", "global"] },
  { id: "photo-1507003211169-0a1dd7228f2d", label: "small business owner portrait", keywords: ["owner", "entrepreneur", "founder", "startup", "small-business", "solo"] },
  { id: "photo-1515378960530-7c0da6231fb1", label: "casual coffee meeting", keywords: ["coffee", "conversation", "consultation", "discovery", "call", "meeting"] },
  { id: "photo-1454165804606-c3d57bc86b40", label: "planning notes with charts", keywords: ["planning", "notes", "audit", "checklist", "review", "mistakes"] },
  { id: "photo-1553877522-43269d4ea984", label: "person working on a laptop in an office", keywords: ["admin", "assistant", "virtual", "task", "time", "saving"] },
];

const DEFAULT_PHOTO = THUMBNAIL_PHOTOS[0]!;
const UNSPLASH_BASE = "https://images.unsplash.com";

/** 16:9 to match the thumbnail containers on /news and /news/[slug]. */
export function thumbnailUrl(photoId: string): string {
  return `${UNSPLASH_BASE}/${photoId}?w=1200&h=675&fit=crop&auto=format&q=80`;
}

const APPROVED_URLS = new Set(THUMBNAIL_PHOTOS.map((p) => thumbnailUrl(p.id)));

/** Guard against the model inventing an arbitrary image URL. */
export function isApprovedThumbnail(url: unknown): boolean {
  return typeof url === "string" && APPROVED_URLS.has(url);
}

/** Deterministically pick the best-matching thumbnail for the given text. */
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

/** Human-readable allow-list injected into the writer prompt. */
export function thumbnailPromptList(): string {
  return THUMBNAIL_PHOTOS.map((p) => `- ${thumbnailUrl(p.id)}  (${p.label})`).join("\n");
}
