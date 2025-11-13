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
- React 19 + Vite 6
- TypeScript 5
- Tailwind CSS 4
- Radix UI Components
- Framer Motion Animations
- Phosphor Icons

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## 📦 Deployment

This static site is deployed on **Azure Static Web Apps** and can also be deployed to:
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

## 🏗️ Project Structure

```
src/
├── pages/          # Main pages (Home, Services, About, Contact, etc.)
├── components/     # Reusable UI components
│   ├── ui/         # shadcn/ui components
│   └── ...         # Custom components (Navbar, Footer, ChatBot, etc.)
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
└── styles/         # Global styles and themes
```

## ✨ Features

- ⚡ Lightning-fast performance with Vite
- 🎨 Modern, responsive design with Tailwind CSS
- 🌓 Clean theme system
- 📱 Mobile-first approach
- ♿ Accessible components (Radix UI)
- 🎭 Smooth animations with Framer Motion
- 💬 Interactive AI chatbot integration
- 🔗 LinkedIn widget integration

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
