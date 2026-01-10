# Copilot instructions (CreedaVA)

This repo is a single deployment unit (frontend + API) but split into two codebases:
- `src/`: Vite + React + TypeScript (public marketing site + `/admin` dashboard)
- `api/`: Azure Functions v4 (Node.js) + Cosmos DB (admin CRUD + analytics + contact)

## Architecture & data flow
- Public site pages live under React Router `*` route and render `<Navbar/>` + `<Footer/>` + deferred `<ChatBot/>` (see `src/App.tsx`).
- Admin is a nested router under `/admin/*` behind `<ProtectedRoute/>` and `<AdminLayout/>`.
- Frontend ↔ API:
  - Local dev: Vite proxies `/api/*` to Functions at `http://localhost:7071` (see `vite.config.ts` `server.proxy`).
  - Prod: frontend typically points to a deployed Functions base via `VITE_API_BASE_URL` (see `.github/workflows/azure-static-web-apps-*.yml`).

## Local dev (known-good)
- Install deps:
  - `npm install`
  - `cd api && npm install`
- Run:
  - Frontend only: `npm run dev` (Vite on `http://localhost:5173`)
  - API only: `cd api && npm start` (Functions host on `http://localhost:7071`)
  - Both: `./start-dev.sh` (logs: `/tmp/vite.log`, `/tmp/azure-functions.log`)
- Cosmos emulator + containers:
  - Start emulator (Docker command in `README.md`).
  - Create containers: `npm run setup:db` (runs `api/create-containers.js`; uses `NODE_TLS_REJECT_UNAUTHORIZED=0`).
  - Reset containers (destructive): `NODE_TLS_REJECT_UNAUTHORIZED=0 node api/reset-containers.js`.

## Build outputs
- App build: `npm run build:app` (TypeScript build + Vite build).
- Widget build: `npm run build:widget` builds `src/embed.tsx` as an IIFE bundle named `creedava-widget.iife.js` (see `vite.widget.config.ts`).
- Combined: `npm run build` runs both.

## Routing & base paths
- Router uses `basename={import.meta.env.BASE_URL}` (see `src/App.tsx`).
- `vite.config.ts` sets `base` from `VITE_BASE_PATH` (defaults to `/CreedaVA/` for GitHub Pages, use `/` for Azure/custom domain).

## Auth model (admin)
- Frontend uses MSAL (`src/lib/auth.ts`) and sends an Entra ID **ID token** (not access token) as `Authorization: Bearer <id_token>`.
- Backend validates via JWKS in `api/shared/auth.js` using:
  - `AAD_TENANT_ID`, `AAD_CLIENT_ID`, optional `AAD_AUTHORITY`.
- Dev-mode UI: `VITE_DEV_MODE=true` uses localStorage `dev_user` and returns a placeholder token (`dev-token`).
  - Important: backend still enforces JWT verification; admin APIs will 401 unless Entra config is present.

## Cosmos DB data model (important)
- Cosmos DB is the system of record. Containers are created with partition key **`/type`** (see `api/create-containers.js`).
- Practical consequence: every persisted item must include a `type` field matching the partition key value used in reads/writes.
- Containers created locally include (non-exhaustive): `contacts`, `leads`, `tasks`, `projects`, `emails`, `seo`, `keywords`, `socialmedia`, `adcampaigns`, `blog`, `landingpages`, `customerjourney`, `reports`, `analytics`.

## Azure Functions structure & conventions
- Functions register via the v4 programming model: each `api/<functionName>/index.js` calls `app.http(...)`.
- Entry points:
  - `api/index.js` (exports all handlers)
  - `api/src/functions.js` (Functions v4 entry; functions auto-register)
- CORS headers are centralized in `api/shared/cors.js` using `APP_ORIGIN`/`CORS_ORIGIN`.
- Emulator TLS: several scripts/functions set `NODE_TLS_REJECT_UNAUTHORIZED=0` and/or `DisableSSLVerification` when connecting to localhost.

## Admin CRUD API (generated)
All admin CRUD endpoints are generated in `api/adminApi/index.js` and secured by `validateBearer()`.

Entity → container mapping is in `CONTAINERS`:
- `social` → `socialmedia`
- `campaigns` → `adcampaigns`
- `landingPages` → `landingpages`
- `customerJourneys` → `customerjourney`

Route naming pattern (this is the source of truth):
- `GET  /api/get<PascalEntityType>`
- `POST /api/create<PascalEntityType>`
- `PUT  /api/update<PascalEntityType>/{id}`
- `DELETE /api/delete<PascalEntityType>/{id}`

Example (leads):
- `GET /api/getLeads`
- `POST /api/createLeads`
- `PUT /api/updateLeads/{id}`
- `DELETE /api/deleteLeads/{id}`

Cosmos query/write pattern used by admin CRUD:
- Reads: `SELECT * FROM c WHERE c.type = @type` (so `type` must equal the entityType string, e.g. `"leads"`).
- Updates use `container.item(id, entityType).replace(updatedItem)` so the **partition key value is the entityType**.

Availability behavior:
- If Cosmos is unavailable and `ALLOW_INMEMORY_FALLBACK=true`, CRUD can use in-memory arrays.
- If fallback is disabled, endpoints return 503 when Cosmos is down.

## Public + “db-like” bridge endpoints
- `POST /api/trackEvent` (`api/trackEvent/index.js`)
  - No auth.
  - No-ops (returns success) if Cosmos is not configured.
  - Writes to `analytics` container with `type: 'event'` and `timestamp`.

- `GET /api/getAnalytics` (`api/getAnalytics/index.js`)
  - Requires bearer token.
  - Supports querying arbitrary containers via query params:
    - `table=<containerName>` (defaults to `analytics`)
    - `days=<n>` adds `c.timestamp >= @startDate` and returns `{ data, summary }`
    - `orderBy`, `orderDirection`, `limit`, plus `filterN=<json>` entries.
  - Gotcha: return shape differs:
    - with `days`: object with `data` and `summary`
    - without `days`: raw JSON array

- `POST|PUT|DELETE /api/submitContact` (`api/submitContact/index.js`)
  - Public contact-form handler AND a lightweight CRUD bridge.
  - Bridge mode uses `{ table, data, filter }`:
    - POST inserts into container `table` and sets `type: table`.
    - PUT/DELETE read/write using partition key value `table` (passed to `container.item(id, table)`).
  - Legacy contact-form mode stores to `contacts` container with `type: 'contact-form'`.

## Frontend API calling conventions
- Admin pages should use `authorizedFetch` (`src/lib/api-client.ts`) to inject `Authorization: Bearer <idToken>`.
- There are two “client styles” in the repo:
  1) Direct admin calls (preferred): `authorizedFetch(`${API_BASE}/getLeads`)`
  2) Supabase-like wrapper: `src/lib/database.ts` exposes `db.from(table)` but actually calls `GET /getAnalytics` and `POST/PUT/DELETE /submitContact`.
- Public site analytics + contact:
  - `src/lib/tracking.ts` calls `/trackEvent` and `/submitContact` (public).
  - Optional GA4 is loaded by `src/lib/analytics.ts` when `VITE_GA_MEASUREMENT_ID` exists.

## Known sharp edges (don’t get tricked)
- Admin endpoint naming is pluralized based on entityType keys in `CONTAINERS`.
  - Historically, some admin pages called singular endpoints like `/createLead` or `/deleteContact` and would 404.
  - Keep new/updated pages aligned to the generated routes (e.g. `/createLeads`, `/deleteContacts/{id}`) and casing (`/getSeo`, not `/getSEO`).
- Historically, some admin pages hard-coded `http://localhost:7071/api/...`.
  - Keep the API base centralized via `API_BASE`/`authorizedFetch` in `src/lib/api-client.ts` and do not reintroduce hard-coded URLs.
- Dev-mode (`VITE_DEV_MODE=true`) bypasses UI login but does not bypass backend JWT validation.

## Deployments & ops
- Static Web Apps CI/CD: `.github/workflows/azure-static-web-apps-*.yml` builds `dist/` and deploys `api/` as SWA Functions. It sets `VITE_BASE_PATH=/` and points `VITE_API_BASE_URL` at a deployed API URL.
- Azure Function App CI/CD: `.github/workflows/main_creedava-api.yml` zips and deploys the repo to the `creedava-api` function app.
- Static Web Apps runtime behavior (routing/caching) is configured in `public/staticwebapp.config.json`.
- Runbook: `docs/OPERATIONS.md` (env vars, deployments, monitoring, smoke checks).

## “Where do I change X?”
- Add/edit admin UI: `src/pages/admin/*` + dialogs in `src/components/admin/*`.
- Adjust admin entity/container mapping: `api/adminApi/index.js` (`CONTAINERS` + in-memory arrays).
- Adjust auth: `src/lib/auth.ts` (MSAL) and `api/shared/auth.js` (JWT validation).
- Adjust CORS: `api/shared/cors.js`.
