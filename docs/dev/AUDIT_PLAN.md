# CreedaVA — Full Audit Plan & Implementation Tracker

> **Audited:** February 20, 2026  
> **Auditor:** GitHub Copilot  
> **Stack:** Next.js 14 · Firebase App Hosting · Firestore · Cloud Functions v2 · Tailwind CSS v4 · TypeScript  
> **Firebase Plan:** Blaze (low traffic, <1k MAU)  
> **Domain:** creedava.com

---

## Context Notes

- Admin auth: Google Sign-In restricted to `@creedava.com` Google Workspace domain.
- `proxy.ts` is intentional — it is the middleware implementation file. `middleware.ts` (created) re-exports from it. Do NOT rename `proxy.ts`.
- No Figma source file — UI audited for internal consistency only.
- Firestore collections use auto-generated IDs. No legacy collection IDs in production — user confirmed.
- Cloud Functions region: `us-east4`. Functions URL: `https://us-east4-creeda-va.cloudfunctions.net`
- New webhook URL needed (updating to creedava.com domain triggers) — in progress.

---

## Severity Key

| Symbol | Severity | Definition |
|--------|----------|------------|
| 🔴 | **Critical** | Security hole or broken functionality — fix before any production traffic |
| 🟠 | **High** | Data integrity, cost, or significant UX risk |
| 🟡 | **Medium** | Quality, consistency, or performance improvement |
| 🟢 | **Low** | Polish, cleanup, minor UX refinement |

---

## Implemented Fixes ✅

| # | Severity | File(s) | Description |
|---|----------|---------|-------------|
| 1 | 🔴 | `middleware.ts` *(new)* | Created Next.js middleware shim — admin routes were completely unprotected at the edge because `proxy.ts` alone is not recognized by Next.js |
| 2 | 🔴 | `app/api/session/route.ts` | Added Firebase Admin JWT verification + domain enforcement server-side before setting session cookie; upgraded to Firebase session cookies (`createSessionCookie`) |
| 3 | 🟠 | `firestore.rules` | Added field validation to `bookings` (required: name, email, service with size limits) — was `allow create: if true` |
| 4 | 🟡 | `firestore.rules` | Tightened `analytics` create rule (string type checks, max 15 fields) |
| 5 | 🟡 | `firestore.rules` | Added TODO comment on `campaigns` vs `email-campaigns` duplication |
| 6 | 🔴 | `app/(marketing)/contact/page.tsx` | Replaced hardcoded `https://us-east4-creeda-va.cloudfunctions.net` URL with `NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL` env var |
| 7 | 🟠 | `app/(marketing)/layout.tsx` | Fixed GA Measurement ID mismatch — was hardcoded stale fallback `G-5DC2T0DSDW`; now uses `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` from apphosting.yaml |
| 8 | 🟠 | `apphosting.yaml` | Added `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL` env vars |
| 9 | 🟠 | `next.config.mjs` | Added HTTP security headers: `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Permissions-Policy`, `Referrer-Policy`, no-cache API routes; also added `firebasestorage.googleapis.com` to image domains |
| 10 | 🟡 | `components/layout/footer.tsx` | Fixed social links — bare domains → actual company pages (linkedin.com/company/creedava, etc.) |
| 11 | 🟡 | `app/layout.tsx` | Removed empty `<head></head>` tag (Next.js manages this automatically) |
| 12 | 🟡 | `app/globals.css` | Fixed `--info` color token collision with `--primary` — changed to IBM Blue 70 `#0043CE` |
| 13 | 🟢 | `lib/firebase/app-check.ts` | Removed pointless dev/prod conditional that used the same provider in both branches |
| 14 | 🟢 | `app/robots.ts` | Removed `/env-check` from disallow list (page doesn't exist) || 18 | 🔴 | `firestore.rules` | Fixed `'service'` reserved keyword causing compile error — switched to bracket notation `data['service']` |
| 19 | 🔴 | `firestore.indexes.json` | Removed illegal single-field composite entries; added existing `ai-conversations` index; deployed successfully |
| 20 | 🔴 | — | **C1 resolved as N/A** — `NEXT_PUBLIC_*` vars cannot be Firebase Secrets (baked into client bundle at build time). Firebase web config values are intentionally public; security comes from rules + App Check. |
| 21 | 🔴 | `proxy.ts` | **C2 resolved** — Installed `jose`; added `decodeJwt()` expiry check at the Edge. Malformed or expired session cookies are now rejected before any admin page code runs. || 15 | 🟡 | `firestore.indexes.json` | Added 18 missing composite indexes for all admin table queries and scheduled function queries (leads, bookings, tasks, contacts, analytics, forum, etc.) |
| 16 | 🟡 | `lib/types/schema.ts` *(new)* | Created formal Firestore data schema — typed all missing collections (ContactSubmission, AnalyticsEventDoc, SatisfactionToken, Note, SettingsDoc, IntegrationDoc) + COLLECTION_MAP constant |
| 17 | 🟢 | `lib/firebase-admin.ts` *(new)* | Created server-side Firebase Admin singleton (used by session route) |
| 18 | ✅ | C1 | N/A — `NEXT_PUBLIC_*` vars cannot be Firebase Secrets; intentionally in `env:` plain text |
| 19 | ✅ | C2 — `proxy.ts` | Added `jose` `decodeJwt` expiry check at the edge; malformed token → redirect |
| 20 | ✅ | H1 — `campaigns` vs `email-campaigns` | **Confirmed distinct**: `campaigns` = Google Ads (synced via Cloud Function); `email-campaigns` = email newsletters. No migration needed. |
| 21 | ✅ | H2 — `getTransport()` dedup | Extracted `getEmailTransport(): Promise<Transporter \| null>` into `functions/src/admin.ts`; removed duplicate from `email.ts` (thin throwing wrapper kept) and `triggers.ts` (now imports alias directly). |
| 22 | ✅ | H5 — i18n hydration mismatch | `LanguageProvider` now initializes `useState("en")` always; `useEffect` applies stored locale after mount — eliminates SSR/CSR text-content mismatch. |
| 23 | ✅ | H3 — syncSessionCookie on every token refresh | Added `prevUidRef` in `auth-context.tsx`; `syncSessionCookie` now only fires when UID changes (sign-in/sign-out), not on hourly token refreshes. |
| 24 | ✅ | H4/M2 — getPageSEO caching | Wrapped `getPageSEO` with `unstable_cache` (60 s TTL per path) in `lib/firebase/seo.ts` — eliminates per-render Firestore reads for marketing pages. |
| 25 | ✅ | M1 — webhook CORS + transport | `handleFormWebhook` CORS restricted to `creedava.com`, localhost, and `*.hosted.app`. Inline `nodemailer.createTransport` replaced with shared `getEmailTransport()`. Hardcoded URLs in `join/page.tsx` and `lp-contact-form.tsx` replaced with `NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL` env var. |
| 26 | ✅ | M3+L3 — scheduled partial digest + Timestamp | All `Promise.all` stat queries in `dailyDigest`, `weeklyReport`, `monthlyReport` now wrap individual promises with `safeCount()` / `.catch(emptySafe)`. All raw `Date` comparisons replaced with `admin.firestore.Timestamp.fromDate()` via `TS()` alias. |
| 27 | ✅ | M5 — aria-hidden SVGs | Added `aria-hidden="true"` to all decorative inline SVGs in `home-content.tsx` (step icons, hero arrow, checkmark). |
| 28 | ✅ | M6 — analytics TTL cleanup | Added `cleanupAnalytics` scheduled function (2 AM daily) to `functions/src/scheduled.ts`; deletes `analytics` docs older than 90 days in 500-doc batches. Exported from `index.ts`. |
| 29 | ✅ | M7 — stats from Firestore | `app/(marketing)/page.tsx` is now an async server component that reads `settings/homepage-stats` via Admin SDK; passes `statValues` as prop to `HomeContent`. Falls back to hardcoded defaults if document missing or Firestore fails. |
| 30 | ✅ | L1 — remove `es` language alternate | Removed `languages: { "en": "/", "es": "/" }` from `app/layout.tsx` `alternates`; Spanish canonical will be re-added if `/es/` routes are implemented. |
| 31 | ✅ | L5 — `/join` in navbar | Navbar "Get Started" CTA (desktop + mobile) now links to `/join` (booking form) instead of `/contact`. |
| 32 | ✅ | L6 — world-map duplicate check | **Confirmed distinct**: `components/ui/world-map.tsx` = static SVG world map (about page); `components/admin/world-map.tsx` = data-point overlay with country codes (CRM dashboard). Both intentional. |
| 33 | ✅ | L7 — firebase.json emulators | Added `firestore` (8080), `functions` (5001), `auth` (9099), and `ui` emulator entries to `firebase.json`. |
| 34 | ✅ | L4 — firebase.json comment | N/A — JSON does not support comments; App Hosting vs classic Hosting context is documented in this AUDIT_PLAN and `docs/dev/FIREBASE.md`. |
| 35 | ✅ | L2 — "Belize-based" content | **Confirmed intentional**: `addressCountry: "BZ"` in JSON-LD, `America/Belize` timezone throughout Cloud Functions, BZ coordinates in world-map. No change needed. |
| 36 | ✅ | L8 — App Check on booking form | Imported `getToken` from `firebase/app-check` + `initializeAppCheck` from `@/lib/firebase/app-check` in `join/page.tsx`. `handleSubmit` now calls `getToken` and attaches `X-Firebase-AppCheck` header to the webhook fetch (graceful fallback if token unavailable). |
| 37 | ✅ | M5 — `aria-hidden` about-content | Added `aria-hidden="true"` to all 4 decorative `valueIcons` SVGs in `app/(marketing)/about/about-content.tsx`. |
| 38 | ✅ | M8 — E2E Playwright tests | Installed `@playwright/test`; created `playwright.config.ts` (Chromium, baseURL `http://localhost:3000`); `e2e/contact-form.spec.ts` (form render + submit + success state with mocked webhook); `e2e/login.spec.ts` (Google button visible, title, auth notice). Added `test:e2e` and `test:e2e:ui` scripts to `package.json`. |
| 39 | ✅ | M4 — Hero illustration | Created `components/ui/hero-illustration.tsx` — pure SVG orthographic globe (lon₀ = −60°, Atlantic-centred) with Belize as the animated teal origin node and arcs to New York, London, Buenos Aires, Madrid. Replaced `<Image src="/logo.webp">` in `home-content.tsx`. Exported via `components/ui/index.ts`. |

---

## Remaining Work Items

### All 39 audit items fully resolved ✅

---

## Architecture Decisions (Pinned)

| Decision | Rationale |
|----------|-----------|
| `proxy.ts` not `middleware.ts` | `middleware.ts` re-exports from `proxy.ts`. Edit route logic in `proxy.ts` only. |
| Firebase App Hosting (not Vercel) | Tighter Firebase integration, automatic credentials, App Check. |
| Client-side i18n | `/es` routes not yet implemented; locale stored in `localStorage`. Revisit when Spanish routes go live. |
| Firestore for analytics | Low-cost alternative to GA4 Data API for custom dashboards. GA4 still runs in parallel via GTM tag. |
| `email-campaigns` vs `campaigns` | **Confirmed distinct** (see fix #20). `campaigns` = Google Ads synced data; `email-campaigns` = email newsletter drafts/sends. Both intentional. |
| Admin auth | Google Workspace `@creedava.com` only. `hd` OAuth param + server-side email domain check + Admin SDK cookie verification. |

---

## Pre-Deployment Checklist (Production)

- [x] **C1** — N/A: `NEXT_PUBLIC_*` cannot be secrets; Firebase web config is intentionally public ✅
- [x] **C2** — JWT `exp` expiry check added in `proxy.ts` via `jose` ✅
- [x] **H1** — `campaigns` vs `email-campaigns` confirmed distinct — N/A ✅
- [x] **H2** — `getEmailTransport()` extracted to `admin.ts`; `email.ts` + `triggers.ts` deduped ✅
- [x] **H3** — `syncSessionCookie` UID-tracking; fires only on identity change ✅
- [x] **H4/M2** — `getPageSEO` wrapped with `unstable_cache` (60 s TTL) ✅
- [x] **H5** — i18n hydration mismatch fixed via `useEffect` locale init ✅
- [x] **M1** — `handleFormWebhook` CORS restricted to `creedava.com`; transport deduped; hardcoded URLs → env var ✅
- [x] **M3/L3** — scheduled `Promise.all` queries wrapped with `safeCount`/`emptySafe`; dates use `Timestamp.fromDate` ✅
- [x] **M5** — `aria-hidden="true"` added to decorative SVGs in `home-content.tsx` ✅
- [x] **M6** — `cleanupAnalytics` function deletes `analytics` docs > 90 days nightly ✅
- [x] **M7** — Homepage stats fetched from `settings/homepage-stats` via Admin SDK; hardcoded fallback if missing ✅
- [x] **L1** — `es` language alternate removed from `app/layout.tsx` ✅
- [x] **L5** — Navbar "Get Started" CTA now links to `/join` ✅
- [x] **L6** — Both world-map components confirmed distinct and in use — N/A ✅
- [x] **L7** — Firestore/Functions/Auth emulators added to `firebase.json` ✅
- [x] Deploy Firestore rules: `firebase deploy --only firestore:rules` ✅
- [x] Deploy Firestore indexes: `firebase deploy --only firestore:indexes` ✅
- [x] Set `NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL` in apphosting.yaml ✅
- [ ] Confirm GA4 measurement ID is correct (`G-GSYB90RLF2`)
- [ ] Register `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` in apphosting.yaml and enable App Check
- [ ] Test contact form end-to-end on staging
- [ ] Test admin login flow (popup → cookie → middleware → admin page)
- [ ] Verify social links resolve (LinkedIn, Facebook, Instagram)
