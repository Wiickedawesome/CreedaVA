# Copilot Instructions (CreedaVA)

> **Last audited:** 2026-02-10 — All containers, endpoints, routes, and dependencies verified.

This repo is a single deployment unit (frontend + API) split into two codebases:
- `src/`: Vite + React + TypeScript — public marketing site + `/admin` CRM dashboard
- `api/`: Azure Functions v4 (Node.js) + Cosmos DB — admin CRUD, analytics, contact, booking, public blog

## Architecture & Data Flow

```
Public visitors → Vite SPA (/, /services, /about, /pricing, /news, /blog/:slug, /contact)
                  ├─ <Navbar/> + <Footer/> + deferred <ChatBot/> (keyword-matching, no AI)
                  ├─ POST /api/trackEvent (anonymous analytics → Cosmos analytics container)
                  ├─ POST /api/submitContact (contact form → Cosmos contacts container)
                  ├─ POST /api/submitBooking (booking form → Cosmos leads + contacts)
                  └─ GET  /api/public/blog (published blog posts for /news page)

Admin users   → /login (Google OAuth popup → ID token in localStorage)
              → /admin/* (ProtectedRoute → AdminLayout)
                  ├─ authorizedFetch() injects Bearer <google_id_token>
                  ├─ CRUD: GET/POST/PUT/DELETE /api/{get|create|update|delete}<EntityType>
                  ├─ GET /api/getAnalytics?days=N (dashboard metrics)
                  └─ GET /api/diagnose (auth-protected config check)
```

## Local Dev

```bash
npm install && cd api && npm install && cd ..
npm run dev          # Vite on http://localhost:5173
cd api && npm start  # Functions on http://localhost:7071
```

- Vite proxies `/api/*` → `http://localhost:7071` (see `vite.config.ts` `server.proxy`)
- Cosmos emulator: `npm run start:cosmos` then `npm run setup:db` to create containers
- Dev mode: set `VITE_DEV_MODE=true` to bypass Google OAuth on the frontend (backend still validates JWT unless `ALLOW_DEV_TOKEN=true`)

## Build

```bash
npm run build        # app + widget
npm run build:app    # tsc + vite build → dist/
npm run build:widget # vite build → creedava-widget.iife.js
```

- Router uses `basename={import.meta.env.BASE_URL}`
- `VITE_BASE_PATH` defaults to `/CreedaVA/` (GitHub Pages); use `/` for Azure/custom domain

## Auth Model

- **Frontend:** Google OAuth popup (`src/lib/auth.ts`) stores `google_id_token` in localStorage
- **Backend:** `api/shared/auth.js` validates via Google JWKS using `GOOGLE_CLIENT_ID` + `GOOGLE_ALLOWED_DOMAIN`
- **API client:** `src/lib/api-client.ts` exports `authorizedFetch()` and `API_BASE` — ALL admin pages use this exclusively
- Dev mode: `VITE_DEV_MODE=true` → localStorage `dev_user` → placeholder `dev-token`

## Cosmos DB Data Model

Partition key: **`/type`** on all containers. Every persisted item MUST include a `type` field.

**Containers** (defined in `api/create-containers.js`):
`contacts`, `leads`, `tasks`, `projects`, `emails`, `seo`, `keywords`, `socialmedia`, `adcampaigns`, `blog`, `landingpages`, `customerjourney`, `reports`, `analytics`

## API Endpoints (Complete List)

### Admin CRUD (all require Bearer token)
Generated in `api/adminApi/index.js`. Entity → container mapping:

| Entity Key | Container | GET | POST | PUT | DELETE |
|---|---|---|---|---|---|
| leads | leads | getLeads | createLeads | updateLeads/{id} | deleteLeads/{id} |
| contacts | contacts | getContacts | createContacts | updateContacts/{id} | deleteContacts/{id} |
| tasks | tasks | getTasks | createTasks | updateTasks/{id} | deleteTasks/{id} |
| projects | projects | getProjects | createProjects | updateProjects/{id} | deleteProjects/{id} |
| emails | emails | getEmails | createEmails | updateEmails/{id} | deleteEmails/{id} |
| seo | seo | getSeo | createSeo | updateSeo/{id} | deleteSeo/{id} |
| keywords | keywords | getKeywords | createKeywords | updateKeywords/{id} | deleteKeywords/{id} |
| social | socialmedia | getSocial | createSocial | updateSocial/{id} | deleteSocial/{id} |
| blog | blog | getBlog | createBlog | updateBlog/{id} | deleteBlog/{id} |
| campaigns | adcampaigns | getCampaigns | createCampaigns | updateCampaigns/{id} | deleteCampaigns/{id} |
| landingPages | landingpages | getLandingPages | createLandingPages | updateLandingPages/{id} | deleteLandingPages/{id} |
| customerJourneys | customerjourney | getCustomerJourneys | createCustomerJourneys | updateCustomerJourneys/{id} | deleteCustomerJourneys/{id} |
| reports | reports | getReports | createReports | updateReports/{id} | deleteReports/{id} |

### Other Endpoints
| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/getAnalytics` | Bearer | Query analytics + arbitrary containers. `?days=N` returns `{ data, summary }`, without `days` returns raw array |
| `POST /api/trackEvent` | None | Write analytics events. No-ops if Cosmos not configured |
| `POST /api/submitContact` | None | Public contact form → `contacts` container. Also bridge mode: `{ table, data }` |
| `POST /api/submitBooking` | None | Booking form → `leads` + `contacts` containers |
| `GET /api/public/blog` | None | Published blog posts for public News page |
| `GET /api/health` | None | Cosmos connectivity check |
| `GET /api/diagnose` | Bearer | Internal config diagnostic (auth-protected) |

### Functions Registration
`api/src/functions.js` is the v4 entry point (`main` in `api/package.json`). All function modules MUST be `require()`-ed there to register their `app.http()` handlers.

## Frontend Routes

**Public:** `/`, `/services`, `/about`, `/pricing`, `/news`, `/blog/:slug`, `/contact`
**Auth:** `/login`
**Admin:** `/admin`, `/admin/leads`, `/admin/contacts`, `/admin/tasks`, `/admin/projects`, `/admin/emails`, `/admin/seo`, `/admin/keywords`, `/admin/analytics`, `/admin/settings`, `/admin/social`, `/admin/blog`, `/admin/ad-campaigns`, `/admin/landing-pages`, `/admin/customer-journey`, `/admin/reports`
**Debug:** `/env-check` (gated, dev-mode only)

## CORS
Centralized in `api/shared/cors.js`. Uses `APP_ORIGIN` / `CORS_ORIGIN` env vars. All endpoints should use `corsHeaders()` or `corsHeadersForOrigin()` — no inline CORS headers.

## Deployments
- **Azure Static Web Apps:** `.github/workflows/azure-static-web-apps-*.yml` → builds `dist/` + deploys `api/`
- **Azure Function App:** `.github/workflows/main_creedava-api.yml` → deploys `api/` to `creedava-api`
- **SWA config:** `public/staticwebapp.config.json` (routing, caching, security headers)
- **SEO:** `public/sitemap.xml`, `public/robots.txt`

## Key Rules

1. **Endpoint naming:** Always match the generated pattern — `get<PascalEntityType>`, pluralized. E.g. `getLeads` not `getLead`, `getSeo` not `getSEO`.
2. **API base:** Always use `API_BASE` / `authorizedFetch()` from `src/lib/api-client.ts`. Never hard-code URLs.
3. **Cosmos `type` field:** Every item written to any container MUST include `type` matching the entity key or partition key value.
4. **Adding new entities:** Add to `CONTAINERS` map in `api/adminApi/index.js`, add container to `api/create-containers.js`, add admin page + route in `src/App.tsx`.
5. **Adding new Functions:** Create `api/<name>/index.js` with `app.http()`, then add `require('../<name>')` to `api/src/functions.js` AND `api/index.js`.
6. **Public endpoints:** No auth. Admin endpoints: validate with `validateBearer()`.
7. **orderBy parameter:** `getAnalytics` whitelists allowed sort columns to prevent injection.

## "Where Do I Change X?"

| Task | File(s) |
|---|---|
| Add/edit admin UI | `src/pages/admin/*` + `src/components/admin/*` |
| Add/edit admin entity | `api/adminApi/index.js` (CONTAINERS map) |
| Add new API function | `api/<name>/index.js` + register in `api/src/functions.js` + `api/index.js` |
| Auth logic | `src/lib/auth.ts` (frontend) + `api/shared/auth.js` (backend JWT) |
| CORS | `api/shared/cors.js` |
| Public pages | `src/pages/*.tsx` + routes in `src/App.tsx` |
| SEO metadata | `src/components/SEO.tsx` (per-page data at bottom of file) |
| Tracking | `src/lib/tracking.ts` (Cosmos) + `src/lib/analytics.ts` (GA4) |
| SWA routing/headers | `public/staticwebapp.config.json` |
| CI/CD | `.github/workflows/` |
