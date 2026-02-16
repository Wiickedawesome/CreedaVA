# CreedaVA

Professional virtual assistant services — marketing website and admin CRM dashboard.

## Tech Stack

| Layer | Technology | Version |
| ----- | ---------- | ------- |
| Framework | [Next.js](https://nextjs.org) (App Router) | 16.1.6 |
| UI | [React](https://react.dev) + TypeScript | 19.2 / 5.9 |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 | 4.1 |
| Backend | [Firebase](https://firebase.google.com) — Auth, Firestore, Storage, AI | 12.9 |
| AI | Firebase AI (Gemini 2.5 Flash) — content gen & auto-translation | — |
| Testing | [Vitest](https://vitest.dev) + React Testing Library | — |
| Linting | ESLint (flat config) | 9.x |

> React Compiler is enabled (`reactCompiler: true`) — avoid manual `useMemo`/`useCallback`.

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Fill in Firebase values from Firebase Console → Project Settings

# 3. Start development server
npm run dev          # http://localhost:3000
```

### Prerequisites

- **Node.js** >= 20.19 (LTS) — check with `node -v`
- **npm** >= 10
- A **Firebase project** with Auth, Firestore, and Storage enabled

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build with type checking |
| `npm run start` | Serve production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest test suite |
| `npm run test:ui` | Vitest with browser UI |
| `npm run test:coverage` | Vitest with coverage report |

## Project Structure

```text
app/
  (marketing)/          # Public pages — Home, Services, About, Pricing, News,
                        #   Contact, FAQ, Forum, Privacy, Terms
    layout.tsx          #   Shared Navbar + Footer wrapper
  (admin)/              # Admin CRM dashboard (17 pages)
    admin/
      page.tsx          #   Dashboard overview
      leads/            #   Lead pipeline management
      contacts/         #   Contact directory
      customers/        #   Customer management + LTV
      tasks/            #   Task tracking
      projects/         #   Project management with SMART goals
      bookings/         #   Booking calendar
      blog/             #   Blog CMS
      forum/            #   Forum moderation
      emails/           #   Email drafts
      analytics/        #   Analytics dashboard + AI reports
      marketing/        #   Campaigns, Social, Landing Pages
      seo/              #   SEO content, keywords, audits
      settings/         #   Admin settings & integrations
  login/                # Auth page (Google sign-in)
  globals.css           # Tailwind v4 theme + design tokens

components/
  ui/                   # Primitives — Button, Container, Input, Textarea
  layout/               # Navbar, Footer
  admin/                # Admin — DataTable, Modal, StatCard, PageHeader, etc.

lib/
  firebase/             # SDK wrappers
    config.ts           #   App init + Analytics
    auth.ts / auth-context.tsx  # Auth helpers + AuthProvider
    firestore.ts        #   Generic typed CRUD
    storage.ts          #   File uploads
    ai.ts               #   Gemini AI — generateText, generateJSON
    translate.ts        #   Auto-translation (Gemini-powered)
    cloud-functions.ts  #   Cloud Function call wrappers
  i18n/                 # Internationalization (EN/ES)
    en.ts / es.ts       #   Dictionaries
    context.tsx         #   LanguageProvider + useTranslation
  types/                # TypeScript type definitions
    content.ts          #   Blog, Forum, SEO types
    crm.ts              #   Lead, Contact, Customer, Project, Task types
  utils/                # Utility functions
    csv.ts              #   CSV export
    ltv.ts              #   Customer Lifetime Value calculation

hooks/                  # Custom React hooks
__tests__/              # Test suite (Vitest)
```

## Environment Variables

All prefixed `NEXT_PUBLIC_` (client-side). Defined in `.env.local`:

| Variable | Description |
| -------- | ----------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Cloud Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | GA4 measurement ID |

See [.env.local.example](.env.local.example) for the template.

## Key Features

### Marketing Site

- **Multi-language** — English/Spanish with localStorage persistence
- **Auto-translation** — AI-powered content translation via Gemini 2.5 Flash
- **Forum** — Reddit-style threads with voting, replies, email/password auth
- **Blog** — CMS-managed with rich text, images, SEO metadata
- **SEO** — Per-page metadata, sitemap, robots.txt, Open Graph tags
- **Responsive** — Mobile-first design with Tailwind v4

### Admin Dashboard

- **CRM** — Leads, Contacts, Customers with pipeline management
- **Projects** — SMART goals, task tracking, Google Drive integration
- **Analytics** — Event tracking, AI-generated reports (daily/weekly/monthly)
- **Marketing** — Campaign management, social media scheduling, landing pages
- **SEO** — Content audits, keyword tracking, Search Console integration
- **AI** — Blog generation, keyword suggestions, SEO audits, social posts

## Design System

Colors defined via `@theme inline` in `globals.css`:

| Token | Value | Usage |
| ----- | ----- | ----- |
| `primary` | `#005148` | Brand teal — buttons, headings |
| `primary-light` | `#007A6D` | Hover states |
| `foreground` | `#002D72` | Navy — body text |
| `accent` | `#E8A317` | Gold — CTAs, badges |
| `gray-10` to `gray-100` | Scale | Backgrounds, borders, muted text |

Font: **Roboto** (300/400/500/700) via `next/font/google`.

## Deployment

```bash
npm run build
firebase deploy --only hosting
```

Deployed to Firebase Hosting. Admin auth restricted to `creedava.com` domain.

## Documentation

| Document | Description |
| -------- | ----------- |
| [Architecture](docs/ARCHITECTURE.md) | System design, directory layout, Firebase architecture, design system |
| [Testing](docs/TESTING.md) | Test setup, writing tests, mocking Firebase, CI integration |
| [Firebase](docs/FIREBASE.md) | Firebase setup, deployment, cloud functions, security rules |
| [Contributing](docs/CONTRIBUTING.md) | Dev workflow, code style, adding pages/components/tests |

## License

Proprietary. All rights reserved.
