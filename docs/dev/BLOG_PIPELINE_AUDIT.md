# Blog Pipeline Audit — 2026-11-02

Scope: the full path from "AI writes a post" to "a visitor sees a correct, indexable
article". Every finding below is tagged with how it was verified:

- **live** — confirmed against `creedava.com`
- **code** — confirmed by reading the source
- **not verified** — could not be checked in this environment

---

## Defect register

| # | Severity | Defect | Status |
|---|----------|--------|--------|
| 1 | High | AI generators never set `featuredImage`, so no post could ever get a thumbnail | **Fixed** |
| 2 | High | Duplicate `<h1>` on every post (page title + AI-authored inline `<h1>`) | **Fixed** |
| 3 | High | JSON-LD logo pointed at `/images/logo.webp`, which **404s** | **Fixed** |
| 4 | Medium | `next/image` did not allow-list `images.unsplash.com` — an Unsplash thumbnail would throw at render | **Fixed** |
| 5 | Low | SEO agent's schema auto-injection gated on `/blog/` but posts live at `/news/` | **Fixed** |
| 6 | Low | SEO agent pinned to `gemini-2.0-flash` while the rest of the app uses `2.5-flash` | **Fixed** |
| 7 | Low | Template fallback in `content-writer.ts` emits filler prose ("This section covers what is x? in depth") | **Open** — mitigated by fix #6, not removed |

---

## 1. AI never produced a thumbnail (High) — Fixed

**Verified: code + live.**

Two independent generation paths, both omitting the field:

- `app/(admin)/admin/blog/page.tsx` — the Blog AI prompt requested
  `title, slug, excerpt, content, tags, metaDescription` only.
- `functions/src/seo/content-writer.ts` — the `BlogDraft` interface had no
  `featuredImage` at all, so the SEO agent's drafts could never carry one.

Live confirmation: `/news` rendered **0** article `<img>` tags for 2 published posts;
`creedava-right-choice` had **0** Unsplash images anywhere, `boost-growth-…` had 2
(inside the body only — never used as a thumbnail).

### Fix

New `lib/constants/blog-images.ts` — 12 curated Unsplash photo IDs, each with
scoring keywords. `pickFeaturedImage(text)` scores keywords against title/tags/excerpt,
so selection is deterministic and reviewable, with no image-search API or key.

- Blog AI prompt now requires **`featuredImage`**, copying exactly one URL from an
  injected allow-list (`thumbnailPromptList()`).
- `onResult` falls back to `pickFeaturedImage()` if the model omits or invents a URL.
- `content-writer.ts` validates the model's URL against `isApprovedThumbnail()` and
  falls back the same way — the model cannot inject an arbitrary remote image.

`functions/` is a separate TypeScript project (`rootDir: "src"`) and cannot import
from `lib/`, so `functions/src/seo/thumbnails.ts` holds a second copy of the list.
As of 2026-11-12 that copy is **generated**, not hand-maintained:

- **Source of truth:** `lib/constants/blog-images.ts` (edit photos here only).
- `npm run sync:thumbnails` regenerates `functions/src/seo/thumbnails.ts` from it.
- `npm run sync:thumbnails:check` exits `1` if the two differ, and is the first
  step of `check:preflight`, so drift fails the gate rather than reaching the agent.

The generator refuses to emit if an entry is missing an id/label/keywords, has a
**duplicate keyword** (that double-counts in `pickFeaturedImage` scoring and skews
which photo wins), or repeats a photo id. Verified 2026-11-12: artificial drift →
exit 1; restore → exit 0; both projects compile; 22 blog-content tests pass.

Found and fixed during the sync: the last photo listed `"assistant"` twice, which
was silently weighting that photo's score.

### Coverage — every write path sets `featuredImage`

Blog posts are produced by the **AI agent** (`functions/src/seo/content-writer.ts`).
That is the normal path. The manual `/admin/blog` form is a rarely used fallback,
mostly for editing an existing post. Both are covered, so no post can be written
without a thumbnail:

1. **SEO agent — `content-writer.ts` (primary path).** The prompt requires
   `featuredImage` from the injected allow-list; the code validates the model's
   URL with `isApprovedThumbnail()` and falls back to `pickFeaturedImage()`.
   The agent therefore always ships a thumbnail and can never inject an arbitrary
   remote image.
2. **Blog AI button in `/admin/blog`.** Same contract: the prompt requires
   `featuredImage` from `thumbnailPromptList()`, and `onResult` falls back to
   `pickFeaturedImage()` if the model omits or invents a URL.
3. **Manual `+ New Post` / edit.** `handleSave` applies `pickFeaturedImage()` when
   the form has no image, so the seldom-used manual path cannot save a bare post.

All existing posts carry a thumbnail. A one-off **"Add missing thumbnails"** button
used to sit in `/admin/blog` to backfill posts written before thumbnail support
existed. It was **removed on 2026-11-12**: with all three paths guaranteed, it could
only ever report "all posts already have a thumbnail", and the agent — not a manual
button — is what keeps the corpus correct.

`app/(marketing)/news/news-list.tsx` still renders a typographic `CoverImage`
fallback. That is a display safeguard only; it is not a substitute for the field
being set, and it should not be relied on.

## 2. Duplicate `<h1>` (High) — Fixed

**Verified: live.** Both published posts rendered 2 `<h1>` elements:

```
<h1 class="text-3xl lg:text-5xl ...">CreedaVA: The Right Choice for Your Business Growth
<h1 style="font-size:42px;...">Elevate Your Business: Why CreedaVA is the Smart Choice
```

The page renders the title as the `<h1>`; the AI body HTML contained its own.

### Fix

`lib/utils/blog-content.ts` → `demoteBodyH1()` rewrites `<h1>` to `<h2>` at render time
in `blog-post-content.tsx`. Normalising at render (not in the database) repairs already
published posts without a content migration. Both prompts now also say *never use `<h1>`*.

## 3. JSON-LD logo 404 (High) — Fixed

**Verified: live.**

`lib/utils/structured-data.ts` used `https://creedava.com/images/logo.webp`.
`public/images/` does not exist; the file is `public/logo.webp`.

```
https://creedava.com/logo.webp        → 200
https://creedava.com/images/logo.webp → 404
```

This fed `Organization.logo` **and** the `BlogPosting.image` fallback, so every
structured-data block advertised a broken image.

## 4. Unsplash not allow-listed (Medium) — Fixed

**Verified: code.** `next.config.mjs` `images.remotePatterns` contained only
`lh3.googleusercontent.com` and `firebasestorage.googleapis.com`. Adding an Unsplash
`featuredImage` without also adding the host would have thrown
`hostname "images.unsplash.com" is not configured` at render. Now allow-listed.

## 5. SEO agent schema injection never ran (Low) — Fixed

**Verified: code.**

```ts
if (!pathKey.startsWith("/blog/")) continue;          // posts are at /news/
"@id": `https://creedava.com/blog/${blogSlug}`         // also wrong
```

**Correction to an earlier claim:** this did *not* leave posts without schema.
`app/(marketing)/news/[slug]/page.tsx` already generates `BlogPosting` JSON-LD at
render via `blogPostingJsonLd()`, which was confirmed live:

```
"@type":"BlogPosting"  ×1
```

The real impact was narrower: the stored `blog.jsonLd` field was never populated by
the agent. Both the gate and the `@id` now use `/news/`.

## 6. Stale model (Low) — Fixed

`content-writer.ts` used `gemini-2.0-flash`; `app/api/ai/route.ts` and
`lib/firebase/remote-config.ts` use `gemini-2.5-flash`. Aligned.

## 7. Template fallback quality (Low) — Open

When the Gemini call fails, `templateDraft()` produces literal filler:

> "This section covers what is x? in depth, including how CreedaVA helps…"

These draft *junk posts* rather than failing. Fix #6 reduces the chance of hitting
this path. Proper fix: skip the brief and log an `ai-activity-log` entry instead of
writing a low-quality draft. **Not changed** — it alters agent behaviour on failure and
needs a decision.

---

## What was already correct

Verified before changing anything:

- `BlogPost.featuredImage` exists in the type and persists through `handleSave` (spread).
- Admin already had upload + Drive import + star-to-set-featured.
- `news-list.tsx` renders `featuredImage` when present.
- `[slug]/page.tsx` emits it as the OG image.
- Render-time `BlogPosting` JSON-LD, including `mainEntityOfPage` → `/news/{slug}`.
- Canonical + hreflang via `pageAlternates()`.
- Firestore `blog` writes gated on `isAdmin()`.
- `revalidate = 300` ISR — new/edited posts surface within 5 minutes.

## Environment notes

- `firebase` CLI authenticated as `john@creedava.com` has project access.
- `gcloud auth print-access-token` returns empty in this shell, so the App Hosting
  REST API is not reachable — verify rollouts by polling the live URL.
- firebase-tools 15.34.2 exposes `apphosting:backends` and `apphosting:rollouts:create`
  only — there is no build/rollout listing command.

## Verification

```bash
npm run lint && npx tsc --noEmit && npm test && npm run build
cd functions && npx tsc --noEmit
```

Live checks after deploy:

```bash
# exactly one h1 per post
curl -s https://creedava.com/news/<slug> | grep -oE "<h1[^>]*>" | wc -l   # → 1
# thumbnail present
curl -s https://creedava.com/news | grep -c "images.unsplash.com"          # → >0
# schema logo resolves
curl -s -o /dev/null -w "%{http_code}\n" https://creedava.com/logo.webp    # → 200
```
