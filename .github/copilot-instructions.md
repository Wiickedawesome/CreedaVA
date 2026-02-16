# CreedaVA — Copilot Instructions

## Project Overview
CreedaVA is a **virtual assistant services** platform built with **Next.js 16** (App Router, React Compiler enabled) + **Firebase** (Auth, Firestore, Storage, Cloud Functions, AI) + **Tailwind CSS v4**. Deployed to Firebase Hosting. Branch: `firebase-migration`.

## Architecture

### Route Groups
- `app/(marketing)/` — Public pages (Home, Services, About, Pricing, News, Contact, FAQ, Forum, Privacy, Terms) wrapped in `layout.tsx` which provides `<Navbar />` + `<Footer />` + JSON-LD structured data
- `app/(admin)/admin/` — Protected CRM dashboard (17 pages: analytics, blog, bookings, contacts, customers, emails, forum, leads, marketing/campaigns, marketing/landing-pages, marketing/social, projects, seo/content, seo/keywords, settings, tasks)
- `app/login/` — Login page (outside marketing layout, no nav/footer)

### Component Organization
- `components/ui/` — Reusable primitives (`Button`, `Container`, `Input`, `Textarea`, `WorldMap`). **All exported via barrel `index.ts`** — always import from `@/components/ui`
- `components/layout/` — `Navbar`, `Footer` (exported via `index.ts`)
- `components/admin/` — Admin primitives (`DataTable`, `Modal`, `PageHeader`, `StatCard`, `Sidebar`, `Topbar`, `Tabs`, `Toast`, `RichTextEditor`, `Select`, `Skeleton`, `AIPrompt`)
- `lib/firebase/` — Firebase SDK wrappers (`config.ts`, `auth.ts`, `firestore.ts`, `storage.ts`, `ai.ts`, `translate.ts`, `analytics.ts`, `cloud-functions.ts`, `seo.ts`, `forum-auth.ts`). **Barrel export via `index.ts`**
- `lib/i18n/` — Internationalization dictionaries (EN/ES) + `LanguageProvider` context
- `lib/types/` — TypeScript type definitions (`content.ts`, `crm.ts`)
- `lib/utils/` — Pure utilities (`csv.ts`, `ltv.ts`, `ai-data-context.ts`)
- `hooks/` — Custom React hooks (`useCollection.ts`, `useScheduledReports.ts`)

### Path Alias
`@/*` maps to project root. Always use `@/components/ui`, `@/lib/firebase`, etc.

## Design System (from Figma)

### Brand Colors (defined in `app/globals.css`)
- **Primary**: `#005148` (teal green) — use `text-primary`, `bg-primary`
- **Primary Light**: `#007A6D` — use `text-primary-light`
- **Navy/Foreground**: `#002D72` — use `text-foreground`, `text-gray-100`
- **Footer Background**: `#1B2A4A` (manually applied in footer)
- **Gray scale**: `gray-10` (lightest `#F9FBFF`) through `gray-100` (darkest, navy)

### Tailwind v4
Colors are registered via `@theme inline` in `globals.css`. Use Tailwind classes like `bg-primary`, `text-gray-70`, `border-border`. **Do NOT use arbitrary color values** — use the design tokens.

### Typography
- Font: **Roboto** (300/400/500/700) loaded via `next/font/google`
- CSS var `--font-roboto` applied to body

### UI Patterns
- **Container**: `<Container size="xl">` (default). Sizes: `sm`, `md`, `lg`, `xl`, `full`
- **CTA sections**: Use `rounded-3xl bg-primary p-12 lg:p-16` card inside `<Container size="md">` with `py-20 lg:py-28` section spacing. White text, white/ghost buttons
- **Section spacing**: `py-16 lg:py-24` for standard sections, `py-20 lg:py-28` for CTA
- **Page hero**: `bg-linear-to-b from-gray-10 to-white py-20 lg:py-32`
- **Icons**: Inline SVG with `stroke="currentColor"`, not an icon library

## Firebase Integration

### Auth
Google sign-in restricted to `creedava.com` domain. Auth helpers in `lib/firebase/auth.ts`. Context provider in `lib/firebase/auth-context.tsx`.

### Firestore
Generic CRUD in `lib/firebase/firestore.ts` — `fetchAll<T>()`, `fetchOne<T>()`, `create()`, `update()`, `remove()`, `subscribe()`. Always pass typed generics.

### Cloud Functions
Located in `functions/` with separate `package.json`. Runtime: Node.js 22. Integrations: email (Nodemailer), Google Calendar, Ads, Search Console, Analytics, Business Profile, Drive, Sheets.

### AI (Gemini)
Firebase AI with Gemini 2.5 Flash in `lib/firebase/ai.ts`. Auto-translates forum/blog content via `lib/firebase/translate.ts`. Lazy-loaded variant in `ai-lazy.ts`.

### Storage
File uploads for blog images and attachments via `lib/firebase/storage.ts`.

### Environment Variables
All prefixed `NEXT_PUBLIC_FIREBASE_*` — see `lib/firebase/config.ts` for the full list.

## Testing

- **Framework**: Vitest + React Testing Library
- **Config**: `vitest.config.ts` (jsdom environment, `@` path alias)
- **Tests**: `__tests__/` directory mirroring source structure
- **Run**: `npm test` (once), `npm run test:watch` (watch mode), `npm run test:coverage` (coverage)
- **Mock Firebase**: Use `vi.mock("@/lib/firebase/config", ...)` to prevent SDK initialization in tests

## Key Conventions
- **Server Components by default** — only add `"use client"` when using hooks, event handlers, or browser APIs
- **Metadata exports**: Each marketing page uses `generateMetadata()` with `getPageSEO()` for dynamic SEO
- **HTML entities**: Use `&apos;` not `'` in JSX text — React/ESLint enforces this
- **No shadcn/ui** — custom UI primitives in `components/ui/`. Don't install or reference shadcn
- **React Compiler enabled** (`reactCompiler: true` in `next.config.ts`) — avoid manual `useMemo`/`useCallback`
- **Images**: Use `next/image` with `Image` component. Logo at `public/logo.webp`
- **Barrel exports**: All modules use `index.ts` re-exports
- **Error handling**: Marketing pages have `error.tsx` boundary, `not-found.tsx` at root, `loading.tsx` skeletons

## Commands
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run tests
npm run test:watch   # Tests in watch mode
npm run test:coverage # Tests with coverage
```
