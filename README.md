<p align="center">
  <strong>Marketing website &amp; admin CRM dashboard</strong><br>
  <sub>Built with Next.js 16 &bull; React 19 &bull; Firebase &bull; Tailwind CSS v4 &bull; Gemini AI</sub>
</p>

<p align="center">
  <a href="https://creedava.com"><img src="https://img.shields.io/badge/live-creedava.com-005148?style=flat-square&logo=google-chrome&logoColor=white" alt="Live Site"></a>
  <img src="https://img.shields.io/badge/TypeScript-99.6%25-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/tests-137%20passing-22C55E?style=flat-square&logo=vitest&logoColor=white" alt="Tests">
  <img src="https://img.shields.io/badge/lint-0%20issues-22C55E?style=flat-square&logo=eslint&logoColor=white" alt="Lint">
  <img src="https://img.shields.io/badge/license-proprietary-E8A317?style=flat-square" alt="License">
</p>

---

## Overview

CreedaVA is a full-stack platform for a Belize-based virtual assistant agency. It includes a public marketing website with multi-language support and an admin CRM dashboard for managing leads, customers, projects, and analytics.

<table>
<tr>
<td width="50%">

**Marketing Site**
- Multi-language (EN/ES) with AI auto-translation
- Forum with voting, replies, auth
- Blog CMS with rich text & SEO
- Per-page metadata, sitemap, Open Graph
- Mobile-first responsive design

</td>
<td width="50%">

**Admin Dashboard**
- CRM — Leads, Contacts, Customers, LTV
- Projects with SMART goals & task tracking
- AI-generated analytics reports
- Campaign management & social scheduling
- SEO audits & keyword tracking

</td>
</tr>
</table>

## Tech Stack

| Layer | Technology | Details |
|:--|:--|:--|
| **Framework** | Next.js 16 | App Router, React Compiler, Turbopack |
| **UI** | React 19 + TypeScript 5.9 | Server & Client Components |
| **Styling** | Tailwind CSS v4 | Design tokens via `@theme inline` |
| **Backend** | Firebase 12.9 | Auth, Firestore, Storage, Cloud Functions |
| **AI** | Gemini 2.5 Flash | Content gen, translation, SEO audits |
| **Testing** | Vitest + RTL | 137 tests across 17 test files |
| **Linting** | ESLint 9 | Flat config, 0 warnings/errors |

## Quick Start

```bash
# Clone
git clone https://github.com/Wiickedawesome/CreedaVA.git
cd CreedaVA

# Install
npm install

# Configure environment
cp .env.local.example .env.local
# Fill in Firebase values from Console → Project Settings

# Develop
npm run dev          # → http://localhost:3000
```

#### Prerequisites

- **Node.js** ≥ 20.19 (LTS)
- **npm** ≥ 10
- Firebase project with Auth, Firestore, and Storage enabled

## Scripts

| Command | Description |
|:--|:--|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build + type check |
| `npm run lint` | ESLint |
| `npm test` | Vitest test suite |
| `npm run test:coverage` | Tests with coverage report |

## Project Structure

```
app/
├─ (marketing)/        ← Public pages (Home, Services, About, Pricing, News, etc.)
│  └─ layout.tsx       ← Shared Navbar + Footer
├─ (admin)/admin/      ← Protected CRM (17 pages)
├─ login/              ← Google sign-in (domain-restricted)
└─ globals.css         ← Tailwind v4 theme tokens

components/
├─ ui/                 ← Button, Container, Input, Textarea
├─ layout/             ← Navbar, Footer
└─ admin/              ← DataTable, Modal, StatCard, PageHeader, etc.

lib/
├─ firebase/           ← SDK wrappers (auth, firestore, ai, translate, ...)
├─ i18n/               ← EN/ES dictionaries + LanguageProvider
├─ types/              ← TypeScript definitions (content, CRM)
└─ utils/              ← CSV export, LTV calculation

functions/             ← Cloud Functions (Node.js 22)
docs/dev/              ← Architecture, testing, Firebase & contributing guides
__tests__/             ← Vitest test suite
```

## Environment Variables

All client-side variables are prefixed `NEXT_PUBLIC_FIREBASE_*`. See [.env.local.example](.env.local.example) for the full list.

Firebase API keys are safe to expose — security is enforced by Firestore Rules, Auth domain restrictions, and API key restrictions in Google Cloud Console.

## Design System

| Token | Value | Usage |
|:--|:--|:--|
| `primary` | `#005148` | Brand teal — buttons, headings |
| `primary-light` | `#007A6D` | Hover states |
| `foreground` | `#002D72` | Navy — body text |
| `accent` | `#E8A317` | Gold — CTAs, badges |
| `gray-10`…`gray-100` | Scale | Backgrounds, borders, muted text |

Font: **Roboto** (300/400/500/700) via `next/font/google`. Design tokens defined in `globals.css` using Tailwind v4 `@theme inline`.

## Deployment

Production is deployed to **Firebase App Hosting** (SSR) at [creedava.com](https://creedava.com). Admin auth is restricted to the `@creedava.com` Google Workspace domain.

```bash
npm run build
firebase deploy
```

## Documentation

| Document | Description |
|:--|:--|
| [Architecture](docs/dev/ARCHITECTURE.md) | System design, Firebase architecture, design system |
| [Testing](docs/dev/TESTING.md) | Test setup, mocking Firebase, CI integration |
| [Firebase](docs/dev/FIREBASE.md) | Firebase setup, deployment, security rules |
| [Contributing](docs/dev/CONTRIBUTING.md) | Dev workflow, code style, adding pages/components |

## License

Proprietary. All rights reserved.
