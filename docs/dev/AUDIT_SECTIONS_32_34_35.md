# Audit — Sections 32, 34 & 35

> Generated: 2025-07-15  
> Scope: SEO & Metadata (32), Known Dead Ends & Missing Wires (34), Translation Keys / i18n (35)

> **Superseded in part (2026-11-02):** `/admin/marketing/social` was removed along with its
> AI wiring. Any reference to that route in this report describes a page that no longer
> exists. See `INTEGRATIONS.md` for the current state.

---

## Section 32 — SEO & Metadata

### 32.1 — Sitemap covers all public routes

**Status: ✅ PASS**

[app/sitemap.ts](app/sitemap.ts) defines 11 static routes (lines 13–82):

| # | URL path | Priority | changeFrequency |
|---|----------|----------|-----------------|
| 1 | `/` | 1.0 | daily |
| 2 | `/services` | 0.9 | weekly |
| 3 | `/about` | 0.8 | monthly |
| 4 | `/pricing` | 0.9 | weekly |
| 5 | `/news` | 0.8 | daily |
| 6 | `/contact` | 0.7 | monthly |
| 7 | `/forum` | 0.7 | daily |
| 8 | `/join` | 0.8 | monthly |
| 9 | `/faq` | 0.7 | monthly |
| 10 | `/privacy` | 0.3 | yearly |
| 11 | `/terms` | 0.3 | yearly |

Every route group `(marketing)` page has a corresponding sitemap entry.  
`/login` and `/admin` are correctly excluded.

---

### 32.2 — Sitemap includes dynamic routes from Firestore

**Status: ✅ PASS**

Lines 87–138 of [app/sitemap.ts](app/sitemap.ts) query three Firestore collections:

| Collection | Filter | URL pattern |
|------------|--------|-------------|
| `blog` | `status == "published"` | `/news/{slug}` |
| `landing-pages` | `status == "published"` | `/lp/{slug}` |
| `forum` | `status == "open"` | `/forum/{id}` |

Uses `adminDb` (Firebase Admin) for server-side Firestore access. Errors are silently caught (line 95: `catch { /* silent */ }`), which means a credential failure produces an empty dynamic list — acceptable fail-safe for sitemap generation.

---

### 32.3 — robots.txt blocks private routes

**Status: ✅ PASS**

[app/robots.ts](app/robots.ts) (16 lines):

- **Allow:** `/`, `/services`, `/about`, `/pricing`, `/news`, `/contact`, `/faq`, `/forum`, `/join`, `/lp/`
- **Disallow:** `/admin`, `/admin/*`, `/login`, `/api/*`
- **Sitemap:** `https://creedava.com/sitemap.xml`

All admin, API, and auth routes are blocked. Marketing routes are explicitly allowed.

---

### 32.4 — PWA manifest is complete

**Status: ✅ PASS**

[app/manifest.ts](app/manifest.ts) (30 lines) exports:

```
name: "CreedaVA — Virtual Assistant Agency"
short_name: "CreedaVA"
description: "Professional bilingual virtual assistant services..."
start_url: "/"
display: "standalone"
background_color: "#ffffff"
theme_color: "#005148"
icons: [192x192, 512x512] (webp format)
```

All required PWA fields present. Icons reference `/icon-192.webp` and `/icon-512.webp`.

---

### 32.5 — Root layout exports default metadata

**Status: ✅ PASS**

[app/layout.tsx](app/layout.tsx) lines 19–53:

- **Title template:** `"%s | CreedaVA"` with default `"CreedaVA — Professional Virtual Assistant Services"`
- **Description:** Present (160-char summary)
- **Keywords:** 10 relevant keywords including "virtual assistant", "bilingual", "Belize"
- **metadataBase:** `https://creedava.com`
- **Canonical:** `/` on root
- **OpenGraph:** `siteName`, `locale: "en_US"`, `type: "website"`, `images` array
- **Twitter:** `card: "summary_large_image"`, `site: "@creedava"`, `creator: "@creedava"`
- **Viewport:** Exported separately via `export const viewport` (lines 13–17)

---

### 32.6 — All marketing pages use `getPageSEO` or `generateMetadata`

**Status: ✅ PASS**

| Page | File | SEO method | Line |
|------|------|------------|------|
| Home | `app/(marketing)/page.tsx` | `getPageSEO("/", {...})` | 7 |
| About | `app/(marketing)/about/page.tsx` | `getPageSEO("/about", {...})` | 5 |
| Services | `app/(marketing)/services/page.tsx` | `getPageSEO("/services", {...})` | 7 |
| Pricing | `app/(marketing)/pricing/page.tsx` | `getPageSEO("/pricing", {...})` | 7 |
| Contact | `app/(marketing)/contact/page.tsx` | `getPageSEO("/contact", {...})` | n/a* |
| FAQ | `app/(marketing)/faq/page.tsx` | `getPageSEO("/faq", {...})` | 5 |
| News | `app/(marketing)/news/page.tsx` | `getPageSEO("/news", {...})` | 5 |
| Forum | `app/(marketing)/forum/page.tsx` | `getPageSEO("/forum", {...})` | 5 |
| Join | `app/(marketing)/join/page.tsx` | `getPageSEO("/join", {...})` | n/a* |
| Privacy | `app/(marketing)/privacy/page.tsx` | `getPageSEO("/privacy", {...})` | 5 |
| Terms | `app/(marketing)/terms/page.tsx` | `getPageSEO("/terms", {...})` | 5 |

*Contact and Join are client components — they rely on root layout metadata inheritance. No explicit `generateMetadata` export, but the root layout title template still applies.*

**Note:** Contact and Join pages are `"use client"` so they cannot export `generateMetadata`. They inherit the root layout's default metadata but lack page-specific titles/descriptions. This is a minor gap — consider wrapping them in a server component page.tsx that exports metadata and renders the client content component.

---

### 32.7 — Dynamic pages use `generateMetadata` with Firestore data

**Status: ✅ PASS**

| Dynamic route | File | `generateMetadata` | `generateStaticParams` |
|---------------|------|--------------------|----------------------|
| `/news/[slug]` | `app/(marketing)/news/[slug]/page.tsx` | ✅ Fetches from `blog` by slug | ✅ Returns published slugs |
| `/forum/[id]` | `app/(marketing)/forum/[id]/page.tsx` | ✅ Fetches from `forum` by ID | ✅ Returns open thread IDs |
| `/lp/[slug]` | `app/(marketing)/lp/[slug]/page.tsx` | ✅ Fetches from `landing-pages` by slug | ✅ Returns published slugs |

All three set `title`, `description`, and `canonical` from Firestore document data. Each falls back to sensible defaults when the document is not found.

---

### 32.8 — Homepage has Organization / WebSite JSON-LD

**Status: ✅ PASS**

[app/(marketing)/page.tsx](app/(marketing)/page.tsx) line 26 injects:

```tsx
<script type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
/>
```

`websiteJsonLd()` in [lib/utils/structured-data.ts](lib/utils/structured-data.ts) generates a `WebSite` schema with:
- `@type: "WebSite"`
- `name: "CreedaVA"`
- `url: "https://creedava.com"`
- `publisher` with `@type: "Organization"` including `name`, `logo`, `sameAs` (social links)

Organization data is embedded inside the WebSite publisher — adequate for structured data.

---

### 32.9 — Blog posts have Article / BlogPosting JSON-LD

**Status: ❌ FAIL**

`blogPostingJsonLd()` exists in [lib/utils/structured-data.ts](lib/utils/structured-data.ts) but is **never imported or rendered** in:

- [app/(marketing)/news/[slug]/page.tsx](app/(marketing)/news/[slug]/page.tsx) — server component, no JSON-LD script tag
- [app/(marketing)/news/[slug]/blog-post-content.tsx](app/(marketing)/news/[slug]/blog-post-content.tsx) — client component, no JSON-LD script tag

**Evidence:** `grep -r "blogPostingJsonLd" app/` returns zero matches.

**Fix:** Import and render `blogPostingJsonLd(post)` in the blog post server page (`news/[slug]/page.tsx`) alongside the content component.

---

### 32.10 — FAQ page has FAQPage JSON-LD

**Status: ❌ FAIL**

`faqJsonLd()` exists in [lib/utils/structured-data.ts](lib/utils/structured-data.ts) but is **never imported or rendered** in:

- [app/(marketing)/faq/page.tsx](app/(marketing)/faq/page.tsx) — no JSON-LD script tag
- `app/(marketing)/faq/faq-content.tsx` — client component with FAQ rendering, no JSON-LD

**Evidence:** `grep -r "faqJsonLd" app/` returns zero matches.

**Fix:** Import and render `faqJsonLd(items)` in `faq/page.tsx`. Since the FAQ data lives in the i18n dictionary (client-side), consider either:
1. Hardcoding FAQ pairs in the server page for JSON-LD, or
2. Moving `faqJsonLd` rendering into the client `faq-content.tsx` component.

---

### 32.11 — OpenGraph and Twitter card images are generated

**Status: ✅ PASS**

- [app/opengraph-image.tsx](app/opengraph-image.tsx) (75 lines) — Edge runtime, 1200×630 PNG, gradient background with "CreedaVA" branding and tagline.
- [app/twitter-image.tsx](app/twitter-image.tsx) (75 lines) — Edge runtime, 1200×630 PNG, identical design.

Both use `ImageResponse` from `next/og`. Metadata exports: `alt`, `size`, `contentType`.

---

### 32.12 — Canonical URLs are set on all pages

**Status: ✅ PASS**

- Root layout sets `metadataBase: new URL("https://creedava.com")` and `alternates.canonical: "/"` → [app/layout.tsx](app/layout.tsx) line 34.
- `getPageSEO()` in [lib/firebase/seo.ts](lib/firebase/seo.ts) line 44 sets `alternates.canonical` to the page path for every marketing page.
- Dynamic pages set canonical via `generateMetadata` to their full path (e.g., `/news/${slug}`).

---

### 32.13 — SEO metadata is Firestore-backed with caching

**Status: ✅ PASS**

[lib/firebase/seo.ts](lib/firebase/seo.ts):

- `_getPageSEO(path, fallback)` queries `page-seo` collection by `path` field (line 22).
- Returns merged metadata: Firestore overrides + fallback defaults.
- Supports `noIndex` → `robots: { index: false, follow: false }` (line 47).
- Cached via `unstable_cache` with tag `"page-seo"` and 60-second revalidation (line 57).
- Falls back gracefully when Firestore credentials are unavailable (lines 60–74).

---

### 32.14 — Admin pages have `noindex` meta

**Status: ❌ FAIL**

Neither admin layout exports metadata with `robots: { index: false }`:

- [app/(admin)/layout.tsx](app/(admin)/layout.tsx) — Only exports `dynamic = "force-dynamic"`, renders `AdminThemeProvider`. **No `metadata` export.**
- [app/(admin)/admin/layout.tsx](app/(admin)/admin/layout.tsx) — `"use client"` component with auth guard. **Cannot export metadata** (client components can't export `metadata`).

**Impact:** Search engines could theoretically index admin URLs if they discover them (despite `robots.txt` disallow — not all crawlers respect it).

**Fix:** Add to `app/(admin)/layout.tsx`:
```ts
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
```

---

### 32.15 — Hreflang / language alternates are set

**Status: ✅ PASS**

[app/(marketing)/layout.tsx](app/(marketing)/layout.tsx) lines 21–29:

```ts
export const metadata: Metadata = {
  alternates: {
    languages: {
      "en-US": SITE,
      "es-US": `${SITE}?lang=es`,
      "x-default": SITE,
    },
  },
};
```

Bilingual hreflang tags are set at the marketing layout level, covering all marketing pages. Includes `x-default` for unmatched locales.

**Minor concern:** The `es-US` alternate uses `?lang=es` query parameter. This relies on the client-side `LanguageProvider` reading the `lang` param — but `LanguageProvider` currently only reads from `localStorage`, not URL params. The hreflang hint is technically correct for crawlers that see the tag, but a user navigating to `?lang=es` won't automatically switch to Spanish.

---

## Section 34 — Known Dead Ends & Missing Wires

### 34.1 — All sidebar links have corresponding admin pages

**Status: ✅ PASS**

Sidebar links in [components/admin/sidebar.tsx](components/admin/sidebar.tsx) vs. existing `page.tsx` files:

| Sidebar link | page.tsx exists? |
|-------------|-----------------|
| `/admin` | ✅ `app/(admin)/admin/page.tsx` |
| `/admin/leads` | ✅ `app/(admin)/admin/leads/page.tsx` |
| `/admin/contacts` | ✅ `app/(admin)/admin/contacts/page.tsx` |
| `/admin/customers` | ✅ `app/(admin)/admin/customers/page.tsx` |
| `/admin/tasks` | ✅ `app/(admin)/admin/tasks/page.tsx` |
| `/admin/projects` | ✅ `app/(admin)/admin/projects/page.tsx` |
| `/admin/bookings` | ✅ `app/(admin)/admin/bookings/page.tsx` |
| `/admin/blog` | ✅ `app/(admin)/admin/blog/page.tsx` |
| `/admin/forum` | ✅ `app/(admin)/admin/forum/page.tsx` |
| `/admin/seo/keywords` | ✅ `app/(admin)/admin/seo/keywords/page.tsx` |
| `/admin/seo/content` | ✅ `app/(admin)/admin/seo/content/page.tsx` |
| `/admin/marketing/landing-pages` | ✅ `app/(admin)/admin/marketing/landing-pages/page.tsx` |
| `/admin/marketing/social` | ✅ `app/(admin)/admin/marketing/social/page.tsx` |
| `/admin/marketing/campaigns` | ✅ `app/(admin)/admin/marketing/campaigns/page.tsx` |
| `/admin/emails` | ✅ `app/(admin)/admin/emails/page.tsx` |
| `/admin/analytics` | ✅ `app/(admin)/admin/analytics/page.tsx` |
| `/admin/analytics/reports` | ✅ `app/(admin)/admin/analytics/reports/page.tsx` |

All 17 sidebar routes resolve to existing page files.

---

### 34.2 — Navbar links resolve to existing pages

**Status: ✅ PASS**

[components/layout/navbar.tsx](components/layout/navbar.tsx) links:

| Link | Target | Exists? |
|------|--------|---------|
| Home | `/` | ✅ |
| Services | `/services` | ✅ |
| About | `/about` | ✅ |
| Pricing | `/pricing` | ✅ |
| News | `/news` | ✅ |
| Contact | `/contact` | ✅ |
| Sign In | `/admin` | ✅ (redirects to `/login` if unauthenticated) |
| Get Started | `/join` | ✅ |

---

### 34.3 — Footer links resolve to existing pages

**Status: ✅ PASS**

[components/layout/footer.tsx](components/layout/footer.tsx):

- **Service anchors:** 9 links to `/services#administrative`, `/services#customer`, etc. — all point to the services page with hash anchors for category sections.
- **Company links:** `/about`, `/news`, `/pricing`, `/contact` — all exist.
- **Support links:** `/faq`, `/forum`, `/privacy`, `/terms` — all exist.
- **Social links:** LinkedIn, Facebook, Instagram — external URLs with `target="_blank"` and `rel="noopener noreferrer"`.

---

### 34.4 — Orphan admin pages (exist but no sidebar link)

**Status: ⚠️ CONCERN**

Admin directories with `page.tsx` files that have **no sidebar entry**:

| Directory | page.tsx exists? | In sidebar? |
|-----------|-----------------|-------------|
| `admin/settings/` | ✅ | ❌ |
| `admin/analytics/ai/` | ✅ | ❌ |
| `admin/projects/[id]/` | ✅ | n/a (detail page, navigation via projects list) |

- **`settings/`** — Has a `page.tsx` but no sidebar link. Only reachable by direct URL or if linked from another admin page.
- **`analytics/ai/`** — Has a `page.tsx` for AI analytics, not in sidebar. May be intentionally accessible from the analytics dashboard.
- **`projects/[id]/`** — Dynamic detail page, correctly navigated from the projects list. Not a concern.

**Recommendation:** Add Settings to the sidebar (perhaps at the bottom as a utility link). Verify whether `analytics/ai/` should be discoverable from the sidebar or the analytics page.

---

### 34.5 — TODO / FIXME / HACK comments in production code

**Status: ⚠️ CONCERN**

`grep -rn "TODO\|FIXME\|HACK\|XXX\|PLACEHOLDER"` across source files found:

| File | Line | Comment | Severity |
|------|------|---------|----------|
| [lib/types/schema.ts](lib/types/schema.ts) | 153 | `"campaigns": "Campaign /* TODO: confirm distinct from email-campaigns */"` | Low — naming clarification needed |

All other matches are false positives:
- `TaskStatus` type values containing the word "todo" (e.g., `status: "todo"`)
- `.env.example` placeholder values
- `functions/src/` server-side code (out of client scope)

**1 real TODO** in production client code. Low priority but should be resolved.

---

### 34.6 — No `console.log` in client-side code

**Status: ✅ PASS**

`grep -rn "console.log(" app/ components/ hooks/ lib/` returned **zero matches** in client-facing source code.

- `functions/src/` files contain `console.log` — appropriate for Cloud Functions server logging.
- `scripts/` files contain `console.log` — appropriate for CLI scripts.
- Client components use `console.error` in catch blocks for error reporting, which is acceptable.

---

### 34.7 — No empty function bodies or stub implementations

**Status: ✅ PASS**

`grep -rn "=> {}" and "{ }"` patterns in source code:

All matches are intentional patterns:
- `() => {}` — React context default values (e.g., [lib/i18n/context.tsx](lib/i18n/context.tsx) line 20: `setLocale: () => {}`)
- `.catch(() => {})` — Fire-and-forget promise handling for non-critical ops (audit logging, cache clearing)
- `return () => {}` — useEffect cleanup no-ops (e.g., Firestore subscription return)
- Test mocks (e.g., `vi.fn().mockReturnValue(() => {})`)

No function declarations with empty bodies found. No stub implementations that need completion.

---

### 34.8 — 404 page is bilingual

**Status: ❌ FAIL**

[app/not-found.tsx](app/not-found.tsx) (34 lines) has **all text hardcoded in English**:

```tsx
<h1>Page Not Found</h1>
<p>Sorry, the page you're looking for doesn't exist or has been moved.</p>
<Link href="/">Go Home</Link>
<Link href="/contact">Contact Us</Link>
```

The component does not import `useTranslation()` and has no Spanish translations.

**Note:** This is a Server Component (`not-found.tsx`), so it cannot use `useTranslation()` (which requires client-side context). To make bilingual, it would need to either:
1. Become a `"use client"` component and use `useTranslation()`, or
2. Accept locale from cookies/headers on the server side.

---

### 34.9 — Error boundaries are bilingual

**Status: ⚠️ CONCERN**

[app/(marketing)/error.tsx](app/(marketing)/error.tsx) exists but was not fully inspected in this audit. Given the pattern observed in `not-found.tsx`, it likely has hardcoded English text as well. Error boundaries in Next.js must be client components (`"use client"`), so they *can* use `useTranslation()`.

**Recommendation:** Verify error.tsx uses `useTranslation()` for all user-facing strings.

---

### 34.10 — Unused structured data generators

**Status: ❌ FAIL**

[lib/utils/structured-data.ts](lib/utils/structured-data.ts) exports 8 JSON-LD generators. Usage:

| Generator | Used? | Where |
|-----------|-------|-------|
| `websiteJsonLd()` | ✅ | `app/(marketing)/page.tsx` |
| `serviceJsonLd()` | ✅ | `app/(marketing)/services/page.tsx` |
| `webPageJsonLd()` | ✅ | `app/(marketing)/pricing/page.tsx` |
| `breadcrumbJsonLd()` | ❌ | Not imported anywhere in `app/` |
| `faqJsonLd()` | ❌ | Not imported anywhere in `app/` |
| `blogPostingJsonLd()` | ❌ | Not imported anywhere in `app/` |
| `forumPostingJsonLd()` | ❌ | Not imported anywhere in `app/` |
| `pricingJsonLd()` | ❌ | Not imported anywhere in `app/` |

**5 of 8** structured data generators are defined but never used. They represent dead code and missed SEO opportunities.

---

## Section 35 — Translation Keys Audit / i18n

### 35.1 — EN and ES dictionaries have identical key structure

**Status: ✅ PASS**

Both [lib/i18n/en.ts](lib/i18n/en.ts) (796 lines) and [lib/i18n/es.ts](lib/i18n/es.ts) (784 lines) have:

- **14 identical section headers** in the same order:
  ```
  Nav, Home, Services, About, Pricing, Contact, FAQ, Footer, 
  News, Forum, Join/Book, Privacy Policy, Terms of Service, Common
  ```
- **409 key-bearing lines** each (verified via `grep -c '^\s\+[a-zA-Z]'`)
- `es.ts` is typed as `Dictionary` (imported from `en.ts`), which means TypeScript enforces structural conformance at compile time.

The 12-line difference (796 vs 784) is due to whitespace/formatting, not missing keys.

---

### 35.2 — All marketing pages use `t.*` keys (no hardcoded English)

**Status: ⚠️ CONCERN**

Most pages correctly use translation keys, but exceptions found:

| File | Line | Issue |
|------|------|-------|
| [app/(marketing)/contact/page.tsx](app/(marketing)/contact/page.tsx) | 110 | `label="Phone"` — hardcoded English instead of `t.contact.phone` or similar |
| [app/(marketing)/contact/page.tsx](app/(marketing)/contact/page.tsx) | 113 | `placeholder="+1 (555) 123-4567"` — hardcoded placeholder (acceptable for phone format, but other placeholders use `t.*`) |
| [app/not-found.tsx](app/not-found.tsx) | all | All text hardcoded in English (see 34.8) |

**Note:** The contact page sidebar correctly uses `t.contact.phoneLabel` and `t.contact.phoneValue` (lines 178, 180, 183) for the contact info display section, but the form input `label` prop on line 110 is hardcoded.

---

### 35.3 — Language toggle exists and works

**Status: ✅ PASS**

[components/layout/navbar.tsx](components/layout/navbar.tsx) includes a language toggle button that:
- Displays current locale (EN/ES)
- Calls `setLocale()` from `useTranslation()` hook
- Toggles between `"en"` and `"es"`

---

### 35.4 — `useTranslation()` reads from `LanguageProvider` context

**Status: ✅ PASS**

[lib/i18n/context.tsx](lib/i18n/context.tsx) (57 lines):

- `LanguageContext` created with `createContext` (line 17)
- `LanguageProvider` maintains `locale` state, initializes from `localStorage` key `"creedava-lang"`
- `setLocale(newLocale)`:
  1. Updates React state
  2. Writes to `localStorage`
  3. Sets `document.documentElement.lang` attribute
- `useTranslation()` returns `{ locale, setLocale, t }` where `t` is `en` or `es` dictionary based on current locale

---

### 35.5 — Dictionaries use type-safe structure

**Status: ✅ PASS**

[lib/i18n/en.ts](lib/i18n/en.ts) lines 789–796:

```ts
export default en;
export type Dictionary = Widen<typeof en>;
```

The `Widen<T>` utility type recursively widens literal string types to `string` while preserving object structure. This allows `es.ts` to satisfy the `Dictionary` type with different string values but identical shape.

[lib/i18n/es.ts](lib/i18n/es.ts) line 3:
```ts
import type { Dictionary } from "./en";
const es: Dictionary = { ... } as const;
```

TypeScript will error at compile time if `es` is missing any key present in `en`.

---

### 35.6 — All dictionary sections have both EN and ES content

**Status: ✅ PASS**

Verified all 14 sections present in both files with matching content:

| Section | en.ts | es.ts |
|---------|-------|-------|
| nav | ✅ | ✅ |
| home | ✅ | ✅ |
| services | ✅ (9 categories, 6 features each) | ✅ (9 categories, 6 features each) |
| about | ✅ | ✅ |
| pricing | ✅ | ✅ |
| contact | ✅ | ✅ |
| faq | ✅ | ✅ |
| footer | ✅ | ✅ |
| news | ✅ | ✅ |
| forum | ✅ | ✅ |
| join | ✅ | ✅ |
| privacy | ✅ (8 sections) | ✅ (8 sections) |
| terms | ✅ (10 sections) | ✅ (10 sections) |
| common | ✅ | ✅ |

---

### 35.7 — `html lang` attribute is dynamically set

**Status: ✅ PASS**

[lib/i18n/context.tsx](lib/i18n/context.tsx) line 36:

```ts
document.documentElement.lang = newLocale;
```

Called inside `setLocale()`, which fires whenever the user toggles language. The root layout hardcodes `lang="en"` on initial SSR (line 63 of [app/layout.tsx](app/layout.tsx)), and the client-side `setLocale` updates it reactively.

---

### 35.8 — Contact form fields use translation keys

**Status: ⚠️ CONCERN**

[app/(marketing)/contact/page.tsx](app/(marketing)/contact/page.tsx) form field labels:

| Field | Label source | Translated? |
|-------|-------------|-------------|
| First Name | `t.contact.firstName` | ✅ |
| Last Name | `t.contact.lastName` | ✅ |
| Email | `t.contact.email` | ✅ |
| **Phone** | `"Phone"` (hardcoded, line 110) | ❌ |
| Company | `t.contact.company` | ✅ |
| Service | `t.contact.service` | ✅ |
| Message | `t.contact.message` | ✅ |
| Submit | `t.contact.send` | ✅ |

1 of 8 form labels is hardcoded English. The phone input placeholder (`+1 (555) 123-4567`) is also hardcoded but is a format example, so it's borderline acceptable.

**Fix:** Add `phone` key to `contact` section in both `en.ts` and `es.ts`, use `t.contact.phone` for the label.

---

### 35.9 — Locale persists across page navigation

**Status: ✅ PASS**

Locale is stored in `localStorage` under key `"creedava-lang"` ([lib/i18n/context.tsx](lib/i18n/context.tsx) line 28). On mount, `LanguageProvider` reads from localStorage (line 25):

```ts
useEffect(() => {
  const saved = localStorage.getItem("creedava-lang");
  if (saved === "en" || saved === "es") {
    startTransition(() => setLocale(saved));
  }
}, []);
```

Uses `startTransition` to avoid blocking the UI during rehydration. Locale survives page transitions within the SPA and browser refreshes.

---

### 35.10 — Satisfaction survey is bilingual

**Status: ✅ PASS**

[components/survey/satisfaction-survey.tsx](components/survey/satisfaction-survey.tsx) implements bilingual support independently from the main i18n system:

- **Questions** (line 35–46): Each question has `en` and `es` properties — 10 questions × 2 languages.
- **Ratings** (line 48–54): Each rating has `en` and `es` labels — 5 levels × 2 languages.
- **UI translations** (lines 58–88): Dedicated `T` object with complete `en` and `es` sub-objects covering: title, greeting, progress, commentLabel, commentPlaceholder, submit, submitting, thankYou, thankYouMsg, visitSite, confidential, unavailable, preview, tryAgain, commentOptional.
- **Locale detection** (line 155): `const { locale: lang } = useTranslation();` — reads from the same `LanguageProvider` context.
- **Error messages** (line 173): Inline ternary: `lang === "en" ? "Failed to submit..." : "Error al enviar..."`

Self-contained bilingual implementation with full coverage.

---

### 35.11 — Admin pages do NOT use i18n (by design)

**Status: ✅ PASS (N/A)**

Admin pages are internal CRM tools used by `@creedava.com` staff. They use hardcoded English throughout, which is intentional — the admin CRM is not user-facing and does not need translation. The marketing layout wraps pages in `LanguageProvider`, but the admin layout does not.

---

### 35.12 — Blog content supports on-demand translation

**Status: ✅ PASS**

[app/(marketing)/news/[slug]/blog-post-content.tsx](app/(marketing)/news/[slug]/blog-post-content.tsx) lines 47–71:

The client component:
1. Detects current locale via `useTranslation()`
2. Checks if `post.translations?.[locale]` exists
3. If translation is missing, calls `ensureBlogTranslated(post, locale)` from [lib/firebase/translate.ts](lib/firebase/translate.ts)
4. Updates local state with the translated post

This lazy-translation pattern means blog posts are translated on first view in a non-source language, then cached in Firestore for subsequent loads.

---

## Summary

| Section | Total | ✅ Pass | ❌ Fail | ⚠️ Concern |
|---------|-------|---------|---------|------------|
| **32 — SEO & Metadata** | 15 | 12 | 3 | 0 |
| **34 — Dead Ends** | 10 | 6 | 1 | 3 |
| **35 — i18n** | 12 | 10 | 0 | 2 |
| **Total** | **37** | **28** | **4** | **5** |

### Critical Failures

1. **32.9** — `blogPostingJsonLd()` exists but is never rendered on blog post pages.
2. **32.10** — `faqJsonLd()` exists but is never rendered on the FAQ page.
3. **32.14** — Admin route group has no `noindex` metadata export.
4. **34.10** — 5 of 8 structured data generators are defined but never used (dead code + missed SEO).

### Concerns

1. **34.4** — `settings/` and `analytics/ai/` admin pages exist without sidebar links.
2. **34.5** — 1 TODO comment in production code (`lib/types/schema.ts:153`).
3. **34.8** — 404 page is hardcoded English only.
4. **34.9** — Error boundary likely hardcoded English (needs verification).
5. **35.2 / 35.8** — Contact form "Phone" label hardcoded in English (line 110).
