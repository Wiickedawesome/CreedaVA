# CreedaVA — Architecture Guide

## Overview

CreedaVA is a virtual assistant services platform built with **Next.js 16** (App Router) + **Firebase** (Auth, Firestore, Cloud Functions, App Hosting, Storage) + **Tailwind CSS v4**. The app consists of a public marketing site, an admin CRM dashboard, and serverless cloud functions for integrations.

---

## Tech Stack

| Layer           | Technology                         |
| --------------- | ---------------------------------- |
| Framework       | Next.js 16 (App Router, Turbopack) |
| UI              | React 19, Tailwind CSS v4          |
| Language        | TypeScript 5.9                     |
| Auth            | Firebase Authentication (Google)   |
| Database        | Cloud Firestore                    |
| Storage         | Firebase Storage                   |
| Functions       | Firebase Cloud Functions (Node 24) |
| Hosting         | Firebase App Hosting (SSR/Node)    |
| AI              | Firebase AI (Gemini 2.0/2.5 Flash) |
| i18n            | Custom dictionary system (EN/ES)   |
| Testing         | Vitest + Testing Library           |

---

## Directory Layout

```
├── app/                        # Next.js App Router pages
│   ├── (marketing)/            # Public pages (wrapped in nav + footer layout)
│   │   ├── page.tsx            # Home page
│   │   ├── about/              # About page
│   │   ├── contact/            # Contact form
│   │   ├── faq/                # FAQ page
│   │   ├── forum/              # Community forum
│   │   ├── news/               # Blog / news
│   │   ├── services/           # Service catalog + packages
│   │   ├── privacy/            # Privacy policy
│   │   ├── terms/              # Terms of service
│   │   └── lp/                 # Landing pages
│   ├── (admin)/admin/          # Protected CRM dashboard
│   │   ├── analytics/          # Analytics dashboard
│   │   ├── blog/               # Blog content management
│   │   ├── bookings/           # Booking management
│   │   ├── contacts/           # Contact submissions
│   │   ├── customers/          # Customer management
│   │   ├── emails/             # Email templates & history
│   │   ├── forum/              # Forum moderation
│   │   ├── leads/              # Lead tracking
│   │   ├── marketing/          # Marketing campaigns
│   │   ├── seo/                # SEO management
│   │   ├── settings/           # App settings
│   │   └── studio/             # Image studio (images from free-form text)
│   ├── login/                  # Login page (no nav/footer)
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Tailwind + design tokens
│
├── components/
│   ├── ui/                     # Reusable primitives (Button, Container, Input, etc.)
│   ├── layout/                 # Navbar, Footer
│   └── admin/                  # Admin-specific components (DataTable, Sidebar, etc.)
│
├── lib/
│   ├── firebase/               # Firebase SDK wrappers
│   │   ├── config.ts           # App initialization
│   │   ├── auth.ts             # Auth helpers (Google sign-in, domain restriction)
│   │   ├── auth-context.tsx    # React auth context provider
│   │   ├── firestore.ts        # Generic typed CRUD (fetchAll, create, update, etc.)
│   │   ├── storage.ts          # Firebase Storage helpers
│   │   ├── analytics.ts        # Firebase Analytics
│   │   ├── ai.ts / ai-lazy.ts  # Gemini AI integration (lazy-loaded)
│   │   ├── translate.ts        # Auto-translation (fire-and-forget + on-demand)
│   │   ├── cloud-functions.ts  # Cloud function HTTP wrappers
│   │   ├── forum-auth.ts       # Forum authentication helpers
│   │   ├── seo.ts              # SEO data management
│   │   └── index.ts            # Barrel export
│   ├── i18n/                   # Internationalization
│   │   ├── en.ts               # English dictionary
│   │   ├── es.ts               # Spanish dictionary
│   │   ├── context.tsx         # i18n React context
│   │   └── index.ts            # Barrel export
│   ├── types/                  # TypeScript type definitions
│   │   ├── content.ts          # Blog, forum, translation types
│   │   ├── crm.ts              # CRM entity types (customers, leads, projects)
│   │   └── index.ts            # Barrel export
│   └── utils/                  # Pure utility functions
│       ├── csv.ts              # CSV export helper
│       ├── ltv.ts              # Customer lifetime value computation
│       └── ai-data-context.ts  # AI data context builder
│
├── hooks/                      # Custom React hooks
│   ├── useCollection.ts        # Firestore collection subscription hook
│   └── useScheduledReports.ts  # Report scheduling hook
│
├── functions/                  # Firebase Cloud Functions (Node.js 24)
│   └── src/
│       ├── index.ts            # Function barrel export
│       ├── admin.ts            # Admin API functions
│       ├── email.ts            # Email sending (Nodemailer)
│       ├── calendar.ts         # Google Calendar integration
│       ├── ads.ts              # Google Ads integration
│       ├── google-analytics.ts # GA data retrieval
│       ├── google-business.ts  # Google Business Profile
│       ├── google-drive.ts     # Google Drive integration
│       ├── google-sheets.ts    # Google Sheets integration
│       ├── search-console.ts   # Search Console data
│       ├── scheduled.ts        # Scheduled/cron functions
│       ├── triggers.ts         # Firestore triggers
│       └── webhooks.ts         # Webhook handlers
│
├── __tests__/                  # Test suite (Vitest)
│   ├── setup.ts                # Test setup (jest-dom matchers)
│   ├── components/ui/          # Component tests
│   └── lib/                    # Unit tests for lib modules
│
├── public/                     # Static assets
└── docs/                       # Project documentation
```

---

## Route Groups

### `(marketing)` — Public Pages

Server-rendered marketing pages. The group `layout.tsx` wraps all pages with `<Navbar />` + `<Footer />`. Each page exports `const metadata: Metadata` for SEO.

### `(admin)` — Protected Dashboard

Client-side CRM dashboard behind `ProtectedRoute`. The admin layout provides a sidebar, topbar, and breadcrumb navigation. All admin pages use `"use client"` for interactivity.

### `login/` — Auth Page

Standalone login page (no nav/footer). Supports Google sign-in restricted to `@creedava.com` domain.

---

## Firebase Architecture

### Authentication

- Provider: Google Sign-In only
- Domain restriction: `creedava.com` (enforced in `auth.ts`)
- React context: `AuthContext` in `lib/firebase/auth-context.tsx`

### Firestore

- Generic typed CRUD in `lib/firebase/firestore.ts`
- Functions: `fetchAll<T>()`, `fetchOne<T>()`, `create()`, `update()`, `remove()`, `subscribe()`
- Real-time subscriptions via `useCollection` hook

### Storage

- Used for blog images, customer attachments
- Helpers in `lib/firebase/storage.ts`

### Cloud Functions

- Runtime: Node.js 24
- Codebase: `functions/` directory with separate `package.json`
- Key integrations: Email (Nodemailer), Google Calendar, Ads, Search Console, Analytics, Business Profile, Drive, Sheets
- Triggers: Firestore document writes
- Scheduled: Cron-based background tasks

### AI (Gemini)

- Firebase AI SDK with Gemini 2.5 Flash
- Auto-translates forum/blog content to supported locales
- Lazy-loaded to reduce bundle size (`ai-lazy.ts`)
- Two modes: fire-and-forget (after create) and on-demand (first view)

---

## Internationalization (i18n)

Custom dictionary-based system (no external library):

- **Dictionaries**: `lib/i18n/en.ts` (English), `lib/i18n/es.ts` (Spanish)
- **Context**: `lib/i18n/context.tsx` provides `useDict()` hook
- **Type safety**: `Dictionary` type derived from English with `Widen<T>` utility for locale-safe string widening
- **Content translation**: Separate from UI dictionaries — uses Gemini AI for user-generated content in forum/blog

---

## Design System

### Brand Colors (defined via `@theme` in `globals.css`)

| Token             | Hex       | Tailwind Class     |
| ----------------- | --------- | ------------------ |
| Primary           | `#005148` | `bg-primary`       |
| Primary Light     | `#007A6D` | `text-primary-light` |
| Navy / Foreground | `#002D72` | `text-foreground`  |
| Gray 10           | `#F9FBFF` | `bg-gray-10`       |
| Gray 30           | `#C5CDE0` | `text-gray-30`     |
| Gray 50           | `#8892A8` | `text-gray-50`     |
| Gray 70           | `#4D5B7C` | `text-gray-70`     |
| Gray 100          | `#002D72` | `text-gray-100`    |

### Typography

- Font: **Roboto** (300/400/500/700) via `next/font/google`
- CSS variable: `--font-roboto`

### UI Components (`components/ui/`)

| Component   | Props                                    |
| ----------- | ---------------------------------------- |
| `Button`    | `variant`, `size`, `isLoading`, `fullWidth` |
| `Container` | `size` (sm / md / lg / xl / full)        |
| `Input`     | Standard input with styled wrapper       |
| `Textarea`  | Standard textarea with styled wrapper    |
| `WorldMap`  | Interactive SVG world map                |

All exported via barrel `components/ui/index.ts`.

---

## Key Conventions

1. **Server Components by default** — only add `"use client"` when using hooks, event handlers, or browser APIs
2. **Path alias** — `@/*` maps to project root. Always use `@/components/ui`, `@/lib/firebase`, etc.
3. **HTML entities** — use `&apos;` not `'` in JSX text (React/ESLint enforced)
4. **No shadcn/ui** — custom primitives only
5. **Server-side Firebase** — use `lib/firebase-admin.ts` (Admin SDK) in Server Components and API routes; never import `lib/firebase/config.ts` (client SDK) from server code
6. **Barrel exports** — all modules use `index.ts` re-exports
7. **Icons** — inline SVG with `stroke="currentColor"`, no icon library
