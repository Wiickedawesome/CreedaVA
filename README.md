# CreedaVA — Virtual Assistant Services & CRM

> **Empowering Leaders with Elite Virtual Assistant Support from Belize**

Professional marketing website and admin CRM for CreedaVA — bilingual virtual assistants fluent in English & Spanish, serving North American businesses.

🌐 **Live:** [www.creedava.com](https://www.creedava.com)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, TypeScript 5, Tailwind CSS 4, shadcn/ui |
| Backend | Azure Functions v4 (Node.js) |
| Database | Azure Cosmos DB (NoSQL, partition key `/type`) |
| Hosting | Azure Static Web Apps |
| Auth | Google OAuth (workspace-restricted) |
| CI/CD | GitHub Actions |

## Features

### Public Website
- Modern responsive design with Tailwind CSS and Framer Motion
- SEO-optimized pages: Home, Services, About, Pricing, News, Contact
- Public blog powered by Cosmos DB (`/news`, `/blog/:slug`)
- Interactive keyword-matching chatbot (no external AI)
- Google Analytics 4 + Cosmos DB event tracking
- Embeddable widget build (`creedava-widget.iife.js`)

### Admin Dashboard (16 pages)
- **CRM:** Leads, Contacts, Tasks, Projects
- **Communication:** Email management
- **Marketing:** SEO, Keywords, Social Media, Ad Campaigns, Landing Pages, Blog
- **Intelligence:** Customer Journey mapping, Reports, Analytics dashboard
- **System:** Settings, Diagnostics

All admin pages use `authorizedFetch()` with Google OAuth bearer tokens for API access.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop (for Cosmos DB emulator, optional)

### Install & Run

```bash
# Install dependencies
npm install && cd api && npm install && cd ..

# Start frontend (http://localhost:5173)
npm run dev

# In another terminal — start API (http://localhost:7071)
cd api && npm start
```

Vite proxies `/api/*` to the Functions host automatically.

### Local Database (optional)

```bash
npm run start:cosmos     # Start Cosmos emulator (Docker)
npm run setup:db         # Create all containers
npm run stop:cosmos      # Tear down emulator
```

### Dev Mode

Set `VITE_DEV_MODE=true` in `.env.local` to bypass Google OAuth on the frontend. Set `ALLOW_DEV_TOKEN=true` in `api/local.settings.json` so the backend accepts the placeholder token.

## Environment Variables

### Frontend (`.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_BASE_PATH` | No | `/CreedaVA/` | Router base path (use `/` for production) |
| `VITE_API_BASE_URL` | No | `/api` | API base URL (Vite proxy handles local dev) |
| `VITE_DEV_MODE` | No | `false` | Bypass OAuth on frontend |
| `VITE_ENABLE_GOOGLE_LOGIN` | No | `false` | Enable Google OAuth popup |
| `VITE_GOOGLE_CLIENT_ID` | Prod | — | Google OAuth client ID |
| `VITE_GA_MEASUREMENT_ID` | No | — | Google Analytics 4 measurement ID |

### Backend (`api/local.settings.json`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `COSMOS_ENDPOINT` | Yes | — | Cosmos DB endpoint |
| `COSMOS_KEY` | Yes | — | Cosmos DB key |
| `COSMOS_DATABASE` | No | `creedava` | Database name |
| `GOOGLE_CLIENT_ID` | Prod | — | For JWT validation |
| `GOOGLE_ALLOWED_DOMAIN` | Prod | `creedava.com` | Restrict login to this domain |
| `APP_ORIGIN` | Prod | `*` | CORS allowed origin |
| `ALLOW_DEV_TOKEN` | No | `false` | Accept placeholder dev tokens |
| `USE_COSMOS_EMULATOR` | No | `false` | Use local emulator settings |
| `ALLOW_INMEMORY_FALLBACK` | No | `false` | Fall back to in-memory if Cosmos unavailable |

## Build & Deploy

```bash
npm run build          # Build app + widget → dist/
npm run build:app      # App only
npm run build:widget   # Widget only (IIFE bundle)
npm run preview        # Preview production build
```

### Deployment

Automated via GitHub Actions:
- **Azure Static Web Apps:** `.github/workflows/azure-static-web-apps-*.yml` builds `dist/` and deploys `api/`
- **Azure Function App:** `.github/workflows/main_creedava-api.yml` deploys `api/` standalone

### Production Checklist

- [ ] `ALLOW_DEV_TOKEN=false`
- [ ] `VITE_DEV_MODE` unset or `false`
- [ ] Production Cosmos DB credentials configured
- [ ] `APP_ORIGIN` set to `https://creedava.com` (no wildcards)
- [ ] Google OAuth client ID configured on both frontend and backend
- [ ] Application Insights enabled on Functions app

## Project Structure

```
CreedaVA/
├── src/
│   ├── pages/              # Public pages + admin/
│   │   └── admin/          # 16 admin dashboard pages
│   ├── components/         # UI components
│   │   ├── ui/             # shadcn/ui primitives
│   │   ├── admin/          # Admin-specific components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── ChatBot.tsx
│   ├── contexts/           # AuthContext (Google OAuth)
│   ├── hooks/              # useInView, useMobile
│   ├── layouts/            # AdminLayout
│   ├── lib/                # auth, api-client, tracking, analytics
│   └── i18n/               # Internationalization
├── api/
│   ├── adminApi/           # Generated CRUD for all 13 entities
│   ├── getAnalytics/       # Analytics query endpoint
│   ├── getPublicBlog/      # Public blog endpoint
│   ├── submitContact/      # Contact form handler
│   ├── submitBooking/      # Booking form handler
│   ├── trackEvent/         # Anonymous event tracking
│   ├── health/             # Health check
│   ├── diagnose/           # Auth-protected diagnostics
│   ├── shared/             # auth.js, cors.js
│   └── src/functions.js    # v4 entry point (registers all handlers)
├── public/                 # Static assets, sitemap, robots.txt, SWA config
├── scripts/                # Dev utilities
└── .github/workflows/      # CI/CD
```

## API Reference

### Admin CRUD (Bearer token required)

All generated from `api/adminApi/index.js`:
- `GET /api/get<Entity>` — List all
- `POST /api/create<Entity>` — Create
- `PUT /api/update<Entity>/{id}` — Update
- `DELETE /api/delete<Entity>/{id}` — Delete

Entities: Leads, Contacts, Tasks, Projects, Emails, Seo, Keywords, Social, Blog, Campaigns, LandingPages, CustomerJourneys, Reports

### Public Endpoints (no auth)

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/trackEvent` | Write analytics event |
| POST | `/api/submitContact` | Contact form submission |
| POST | `/api/submitBooking` | Booking form submission |
| GET | `/api/public/blog` | Published blog posts |
| GET | `/api/health` | Cosmos connectivity check |

### Analytics (Bearer required)

`GET /api/getAnalytics?days=30` — Returns `{ data, summary }` with event counts and page stats.

## Widget Embedding

Build the standalone widget:
```bash
npm run build:widget
# Output: dist/creedava-widget.iife.js
```

Embed on any page:
```html
<div id="creedava-app"></div>
<script src="https://your-cdn.com/creedava-widget.iife.js"></script>
<script>
  window.CreedaVAWidget.mount(document.getElementById('creedava-app'));
</script>
```

> **Note:** Admin features require the Azure Functions backend and won't work in a standalone embed.

## License

Copyright © 2026 CreedaVA. All Rights Reserved.

This repository is publicly visible for showcase purposes. The code and content are proprietary and may not be copied, modified, or distributed without express written permission.

For inquiries: info@creedava.com

## Contact

**CreedaVA** — Belize-Based Virtual Assistant Services
- 🌐 [www.creedava.com](https://www.creedava.com)
- 📧 info@creedava.com
- 📞 +1 844-702-2202

---

*Built with care in Belize 🇧🇿*
