# CreedaVA - Elite Virtual Assistant Services

> **Empowering Leaders with Elite Virtual Assistant Support**

Professional marketing website and CRM platform for CreedaVA, showcasing premium virtual assistant services from Belize with a comprehensive admin dashboard.

🌐 **Live Site:** [www.creedava.com](https://www.creedava.com)

## 🚀 About CreedaVA

CreedaVA provides elite virtual assistant services with bilingual excellence, cultural adaptability, and perfect timezone alignment for North American businesses.

**Our Services:**
- 💼 Executive & Administrative Support
- 📞 Customer Service Excellence  
- 💻 Technology Support
- 🏘️ Real Estate Support
- 🎨 Marketing & Creative Services
- 📊 Financial & Data Management

## ✨ Features

### Public Website
- 🎨 Modern, responsive design with smooth animations
- 📱 Mobile-first approach with Tailwind CSS
- 🌐 SEO-optimized pages for services, about, pricing, and contact
- 📰 Blog section for news and insights
- 💬 Interactive chatbot for visitor engagement

### Admin Dashboard (16 Pages)
- 📊 **Dashboard** - Analytics overview and key metrics
- 👥 **CRM** - Leads, contacts, and customer management
- ✅ **Project Management** - Tasks and projects tracking
- 📧 **Email Management** - Campaign and template management
- 🎯 **Marketing** - SEO, keywords, social media, ad campaigns, landing pages
- 🛤️ **Customer Journey** - Journey mapping and analytics
- 📈 **Reports** - Comprehensive analytics and reporting
- ⚙️ **Settings** - System configuration

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **Vite 7** - Lightning-fast build tool
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Re-usable component library

### Backend & Database
- **Azure Functions (Node.js)** - Serverless API with comprehensive CRUD operations
- **Azure Cosmos DB** - NoSQL database with full admin API support
- **Docker Cosmos DB Emulator** - Local development environment

### Infrastructure
- **Azure Static Web Apps** - Production hosting and CI/CD
- **GitHub Actions** - Automated deployment pipeline

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop (for local database)
- Azure account (for production deployment)

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/Wiickedawesome/CreedaVA.git
cd CreedaVA
```

2. **Install dependencies**
```bash
npm install
cd api && npm install && cd ..
```

3. **Start Cosmos DB Emulator (Docker)**

Option A — quick (manual Docker):
```bash
docker run -d \
  --name cosmosdb-emulator \
  -p 8081:8081 \
  -p 10251-10254:10251-10254 \
  -e AZURE_COSMOS_EMULATOR_PARTITION_COUNT=10 \
  -e AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE=true \
  -v cosmos-data:/tmp/cosmos \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest
```

Option B — helper script (recommended):
```bash
# start the emulator (waits until ready)
npm run start:cosmos

# stop and remove it
npm run stop:cosmos
```

Notes:
- The helper script runs the official emulator container and polls for readiness on https://127.0.0.1:8081. It requires Docker.
- The emulator uses HTTPS and a self-signed cert; local functions often set NODE_TLS_REJECT_UNAUTHORIZED=0 when calling the emulator in scripts.
- The emulator can be slow to start (20–60s). If the helper script times out, check `docker logs cosmosdb-emulator` for details.

4. **Initialize database containers**
```bash
cd api
NODE_TLS_REJECT_UNAUTHORIZED=0 node create-containers.js
```

5. **Start Azure Functions backend**
```bash
cd api
npm start
# Functions will run on http://localhost:7071
```

6. **Start frontend dev server** (in a new terminal)
```bash
npm run dev
# Frontend will run on http://localhost:5173
```

7. **Access the application**
- Frontend: http://localhost:5173
- Admin Panel: http://localhost:5173/admin
- API: http://localhost:7071/api

### Environment Variables

**Frontend (.env.local)**
```bash
# Base path for routing
VITE_BASE_PATH=/

# API endpoint (optional)
# - If unset, the frontend uses `/api` and Vite proxies to the local Functions host.
# - Set this only when pointing the frontend at a non-default API base (e.g. a deployed Functions URL).
# VITE_API_BASE_URL=http://localhost:7071/api

# Entra ID auth
VITE_AAD_CLIENT_ID=77207644-cbca-4d8f-b6f0-a9b077ba0f46
VITE_AAD_TENANT_ID=9c5238b8-3203-42de-a5c6-d401fa735fd5
# Optional authority override (otherwise derived from tenant)
# VITE_AAD_AUTHORITY=https://login.microsoftonline.com/9c5238b8-3203-42de-a5c6-d401fa735fd5/v2.0

# Optional: Google OIDC (enable "Sign in with Google")
# Create a Google OAuth Client ID (Web application) and set this value for local testing
# VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
# (Functions host - api/local.settings.json)
# "GOOGLE_CLIENT_ID": "your-google-client-id.apps.googleusercontent.com",
# "GOOGLE_ALLOWED_DOMAIN": "creedava.com"  # optional - restrict sign-in to a domain

# Application URL (used by MSAL redirect)
VITE_APP_URL=http://localhost:5173

# Dev mode (local testing)
# Enable dev-mode on the frontend to bypass Entra during development and use a simple email-based login.
# - Frontend: set VITE_DEV_MODE=true
# - Functions (api/local.settings.json): set "ALLOW_DEV_TOKEN": "true"
# In dev mode you can sign in via the UI using any email, and the frontend will send a placeholder token ("dev-token") to the Functions host which will accept it when ALLOW_DEV_TOKEN=true.

# Optional analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Backend (api/local.settings.json)**
```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "",
    "COSMOS_ENDPOINT": "https://localhost:8081",
    "COSMOS_KEY": "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
    "COSMOS_DATABASE": "CreedaVA",
    "APP_ORIGIN": "http://localhost:5173",
    "CORS_ORIGIN": "http://localhost:5173",
    "ALLOW_INMEMORY_FALLBACK": "false"
  },
  "Host": {
    "CORS": "http://localhost:5173",
    "CORSCredentials": false
  }
}
```

## 📦 Build & Deploy

### Production Build
```bash
# Build both React app and embeddable widget
npm run build

# Preview production build
npm run preview
```

### Smoke Tests (pre-release)
- Sign in with Entra ID (popup) and load `/admin`
- Create/update a record via Admin (any entity) and see it persist
- Load Analytics (admin) to confirm `/api/getAnalytics` succeeds
- Submit the public contact form and verify a success response
- Run both builds: `npm run build:app` and `npm run build:widget` when applicable

### Observability
- Enable Application Insights on the Functions app for request/dep traces and failures
- Add Cosmos alerts for RU consumption, throttling (429), latency, and availability
- Review Functions diagnostic strings (RU charge, activityId) on slow/unexpected responses
- Honor `Retry-After` on 429s from Cosmos in clients/invocations

### Operations
- See the runbook at docs/OPERATIONS.md for deployments, backups, and incident response

### Deploy to Azure

The repository includes GitHub Actions workflow for automatic deployment to Azure Static Web Apps:

1. Create an Azure Static Web App
2. Add GitHub secrets:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Configure Cosmos DB connection strings in Azure
3. Push to `main` branch - automatic deployment via GitHub Actions

### Database Setup (Production)

1. Create Azure Cosmos DB account
2. Create database named `CreedaVA`
3. Run container creation script (partitions use `/type` to match the Functions):
```bash
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/ \
COSMOS_KEY=your-production-key \
node api/create-containers.js
```

## 🗂️ Project Structure

```
CreedaVA/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── ChatBot.tsx
│   ├── pages/            # Page components
│   │   ├── admin/        # 16 admin dashboard pages
│   │   ├── Home.tsx
│   │   ├── Services.tsx
│   │   ├── About.tsx
│   │   ├── Pricing.tsx
│   │   └── Contact.tsx
│   ├── contexts/         # React contexts (Auth)
│   ├── lib/              # Utilities and database types
│   └── layouts/          # Layout components
├── api/                  # Azure Functions backend
│   ├── adminApi/         # Comprehensive CRUD API
│   ├── submitContact/    # Contact form handler
│   ├── trackEvent/       # Analytics tracker
│   ├── getAnalytics/     # Analytics retrieval
│   └── shared/           # Shared utilities
├── public/               # Static assets
└── .github/workflows/    # CI/CD configuration
```

## 🔌 API Endpoints

### Admin API (CRUD operations)
All endpoints support full CRUD operations:

**GET Endpoints:**
- `/api/getLeads` - Get all leads
- `/api/getContacts` - Get all contacts
- `/api/getTasks` - Get all tasks
- `/api/getProjects` - Get all projects
- `/api/getEmails` - Get all emails
- `/api/getSeo` - Get SEO content
- `/api/getKeywords` - Get keywords
- `/api/getSocial` - Get social media posts
- `/api/getBlog` - Get blog posts
- `/api/getCampaigns` - Get ad campaigns
- `/api/getLandingPages` - Get landing pages
- `/api/getCustomerJourneys` - Get customer journeys

**POST Endpoints:**
- `/api/createLeads` - Create new lead
- `/api/createContacts` - Create new contact
- (Similar create endpoints for all entities)

**PUT Endpoints:**
- `/api/updateLeads/{id}` - Update lead
- `/api/updateContacts/{id}` - Update contact
- (Similar update endpoints for all entities)

**DELETE Endpoints:**
- `/api/deleteLeads/{id}` - Delete lead
- `/api/deleteContacts/{id}` - Delete contact
- (Similar delete endpoints for all entities)

### Public API
- `/api/submitContact` - Submit contact form
- `/api/trackEvent` - Track analytics events
- `/api/getAnalytics` - Get analytics data

## 🛡️ Features

### Security
- CORS protection
- Environment variable isolation
- Secure API key management
- SSL/TLS encryption

### Performance
- Code splitting and lazy loading
- Optimized bundle sizes
- CDN-served static assets
- Serverless auto-scaling

### SEO
- Server-side meta tags
- Semantic HTML structure
- Sitemap generation
- Structured data markup

## 📝 License

© 2026 CreedaVA. All rights reserved.

## 🤝 Support

For support and inquiries:
- 📧 Email: john@creedava.com
- 🌐 Website: www.creedava.com
- 📍 Location: Belize

---

**Built with ❤️ in Belize 🇧🇿**

## 📦 Deployment

### Azure Static Web Apps (Current)

Deployment is **fully automated** via GitHub Actions:
1. Push to `main` branch
2. Workflow builds and deploys automatically
3. Frontend: `https://www.creedava.com`
4. API: `https://www.creedava.com/api/*`

**Workflow:** `.github/workflows/azure-static-web-apps-wonderful-glacier-08b16321e.yml`

### Required Azure Resources
- Static Web App: `CreedaVA`
- Cosmos DB Account: `creedava-db` (serverless)
  - Database: `website-data`
  - Container: `linkedin-data` (partition key: `/id`)
- Resource Group: `CreedaVA`
- Region: West US 2

### GitHub Secrets
Configure in repository settings:
- `AZURE_STATIC_WEB_APPS_API_TOKEN_WONDERFUL_GLACIER_08B16321E`
- `VITE_GA_MEASUREMENT_ID` (optional)
- `COSMOS_ENDPOINT`
- `COSMOS_KEY`

### Azure App Settings
Configure in Azure Portal or CLI:
- `COSMOS_ENDPOINT`
- `COSMOS_KEY`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI`

## 🏗️ Project Structure

```
CreedaVA/
├── src/
│   ├── pages/              # Main pages + admin panel
│   │   ├── admin/          # 16 admin dashboard pages
│   │   └── ...             # Public pages (Home, Services, etc.)
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   └── ...             # Custom components
│   ├── contexts/           # React contexts (AuthContext)
│   ├── hooks/              # Custom React hooks
│   ├── layouts/            # Layout components (AdminLayout)
│   ├── lib/                # Utilities + auth/Cosmos API clients
│   └── styles/             # Global styles
├── api/                    # Azure Functions
│   ├── linkedin-auth/      # OAuth callback
│   ├── linkedin-connect/   # OAuth URL generator
│   ├── linkedin-posts/     # Posts endpoint with cache
│   └── shared/             # Cosmos DB + LinkedIn helpers
├── public/                 # Static assets
│   └── staticwebapp.config.json  # Azure SWA config
└── .github/workflows/      # CI/CD automation
```

## ✨ Key Features

### Performance Optimizations
- ⚡ Vite for lightning-fast dev/build
- 🎯 Lazy loading with IntersectionObserver
- 🖼️ Image lazy loading + async decoding
- 📦 Code splitting with React.lazy
- 💾 Cosmos DB caching (1-hour TTL)

### Admin Panel
- 🎛️ Complete CRM and marketing dashboard
- 📊 Analytics, leads, and customer journey tracking
- 📝 Blog management backed by Cosmos DB
- 🔐 Protected routes with Entra ID authentication
- 💼 LinkedIn integration for post sync

### LinkedIn Integration
- 🔗 OAuth 2.0 authentication flow
- 📰 Organization post fetching
- 💾 Token storage in Cosmos DB
- 🔄 Automatic token refresh
- ⚡ Post caching for performance

### Widget Build
- 🔌 Embeddable widget version (`vite.widget.config.ts`)
- 📦 IIFE bundle for WordPress/Squarespace
- 🎨 Self-contained styles

## 📚 Documentation

- [LinkedIn Integration Guide](./LINKEDIN_INTEGRATION.md) - Complete API setup and usage
- [Azure Deployment](https://learn.microsoft.com/azure/static-web-apps/) - Official Azure docs
- [Cosmos DB Best Practices](https://learn.microsoft.com/azure/cosmos-db/) - Database guidelines

## 🔧 Development Tips

### Running Locally with API
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Azure Functions
cd api && func start
```

### Testing LinkedIn OAuth Locally
1. Update `api/local.settings.json` with your credentials
2. Set `LINKEDIN_REDIRECT_URI` to `http://localhost:4280/api/linkedin-auth`
3. Configure same redirect URI in LinkedIn Developer Portal
4. Visit `http://localhost:5173/admin/linkedin-integration`

### Debugging
- Frontend errors: Check browser console
- API errors: Check Azure Functions terminal output
- Cosmos DB: Use Azure Data Explorer in portal
- Build errors: Check `npm run build` output

## 📄 License

Copyright © 2025 CreedaVA. All Rights Reserved.

This repository is publicly visible for showcase purposes. The code and content are proprietary and may not be copied, modified, or distributed without express written permission from CreedaVA.

For licensing inquiries: info@creedava.com

## 📞 Contact

**CreedaVA**  
🌐 Website: [www.creedava.com](https://www.creedava.com)  
📧 Email: info@creedava.com  
💼 LinkedIn: [linkedin.com/company/creedava](https://www.linkedin.com/company/creedava/)

---

*Built with ❤️ by the CreedaVA team*

## Deploying
This is a static SPA and can be deployed on Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any static host.

## Embedding on WordPress and Squarespace

You have two options. Recommendation: use the iframe method for maximum compatibility.

### Option A: iframe (recommended)
1) Deploy the site to a public URL (e.g., `https://app.creedava.com`).
2) Add this to a Custom HTML block (WordPress) or Code Block (Squarespace):

```html
<iframe
	src="https://app.creedava.com"
	style="width:100%;min-height:900px;border:0;"
	loading="lazy"
	allow="clipboard-write;"
></iframe>
```

You can deep-link to a specific page, e.g. `https://app.creedava.com/contact`.

Pros: Works everywhere, isolates styles/scripts. Cons: URL is separate from your main domain’s path.

### Option B: Inline widget script (experimental)
We publish a standalone widget bundle you can include on any page. It renders the same React app into a div you provide.

Build the widget bundle:
```bash
npm run build
# Output will include dist/creedava-widget.iife.js and dist/creedava-website.css
```

Embed snippet (replace the src URLs with where you host the files — a CDN, your WordPress media CDN, or site assets):

```html
<link rel="stylesheet" href="https://cdn.example.com/creedava-website.css">
<div id="creedava-app"></div>
<script src="https://cdn.example.com/creedava-widget.iife.js"></script>
<script>
	window.CreedaVAWidget.mount(document.getElementById('creedava-app'))
	// later: window.CreedaVAWidget.unmount(document.getElementById('creedava-app'))
	// Optional: Only embed on certain pages/templates in your CMS.
	// Prefer placing this in a Custom HTML block or global footer injection.
	// Note: Pages that require the Spark runtime (Admin, persisted Contact storage) won’t function outside of the Spark environment.
	// For forms, prefer your platform’s native forms or external form providers when embedding inline.
;</script>
```

Notes and limitations:
- The inline widget runs inside your page; ensure no conflicting global CSS resets from your theme break styles. The iframe method avoids this class of issues.
- Features that rely on the Spark runtime (e.g., Admin panel and KV persistence) require the Spark backend and won’t operate in a plain static embed.

## Project structure
- `src/pages`: Home, Services, About, Pricing, Contact, Admin
- `src/components`: UI components and layout (Navbar, Footer)
- `src/main.tsx`: App entry used for the standalone site
- `src/embed.ts`: Widget entry used for script-tag embedding (IIFE bundle)

## Housekeeping
- Node, dist, and other build artifacts are ignored in git.
- Template/Spark-specific scaffolding has been trimmed where safe; devcontainer files are kept for local/Cloud dev convenience.

## License
MIT © CreedaVA
