# CreedaVA Website

Modern marketing website for Creeda Virtual Assistants built with React, Vite, and Tailwind. Includes a clean component library, multi-page routing, and optional Spark-powered features used during development.

## Tech stack
- React 19 + Vite 6
- TypeScript 5
- Tailwind CSS 4
- Radix UI + custom components

## Getting started

Prereqs: Node 18+ and pnpm or npm.

Local development:
```bash
npm install
npm run dev
```

Production build:
```bash
npm run build
npm run preview
```

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
# Output will include dist/creedava-widget.iife.js and dist/spark-template.css
```

Embed snippet (replace the src URLs with where you host the files — a CDN, your WordPress media CDN, or site assets):

```html
<link rel="stylesheet" href="https://cdn.example.com/spark-template.css">
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
