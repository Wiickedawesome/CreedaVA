# CreedaVA - Elite Virtual Assistant Services

> **Empowering Leaders with Elite Virtual Assistant Support**

Professional marketing website for CreedaVA, showcasing our premium virtual assistant services from Belize.

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

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **Vite 7** - Lightning-fast build tool
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations

### Backend & Infrastructure
- **Azure Static Web Apps** - Hosting and CI/CD
- **Azure Functions** - Serverless API (Node.js)
- **Azure Cosmos DB** - Serverless database
- **Supabase** - Authentication & blog posts

### Integrations
- **LinkedIn API** - Organization post sync via Azure Functions
- **Google Analytics 4** - Optional analytics tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Azure account (for production deployment)
- LinkedIn Developer App (for LinkedIn integration)

### Environment Variables

Create `.env` file:
```bash
# Supabase (Auth & Blog)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_API_URL=/api
VITE_BASE_PATH=/
```

### Local Development

**Frontend:**
```bash
npm install
npm run dev
```

**Azure Functions API** (separate terminal):
```bash
cd api
npm install
func start
```

API will be available at `http://localhost:7071/api/*`

### Production Build
```bash
npm run build        # Build React app + widget
npm run preview      # Preview production build
```

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
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GA_MEASUREMENT_ID` (optional)

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
│   ├── lib/                # Utilities + Supabase client
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
- 📝 Blog management with Supabase
- 🔐 Protected routes with authentication
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
