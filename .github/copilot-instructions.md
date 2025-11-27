# CreedaVA Codebase Guide

## Project Architecture

**Dual-Build System**: This React app builds both as a standalone SPA (`main.tsx`) and embeddable widget (`embed.tsx`):
- `npm run build:app` → Standard React SPA for deployment
- `npm run build:widget` → IIFE bundle for embedding in WordPress/Squarespace
- Widget entry point sets `window.__CREEDAVA_EMBEDDED__ = true` to disable Spark-specific features

**Tech Stack**: React 19 + Vite 6 + TypeScript + Tailwind CSS 4 + Radix UI + Supabase

## Key Patterns

### Route Structure
- **Public routes**: `/`, `/services`, `/about`, `/pricing`, `/contact`, `/news`
- **Auth routes**: `/login`, `/signup` 
- **Admin routes**: `/admin/*` - 16 protected admin pages (Dashboard, Leads, Analytics, etc.)
- Uses React Router with lazy loading for performance

### Admin System
All admin pages follow consistent patterns in `src/pages/admin/`:
- **Layout**: `AdminLayout.tsx` with dark sidebar (gray-900) + white content area
- **Styling**: Clean Hetzner-style design - no colored backgrounds, gray text hierarchy
- **Components**: Standard shadcn/ui Cards, Tables, Badges with consistent spacing
- **Navigation**: Sidebar with 16 admin sections (CRM, Marketing, Analytics, Settings)

### Authentication & Data
- **Supabase**: Primary backend (`src/lib/supabase.ts`)
- **Auth Context**: `src/contexts/AuthContext.tsx` wraps protected routes
- **Database types**: Auto-generated in `src/lib/database.types.ts`
- **Protected routes**: Use `<ProtectedRoute>` wrapper component

## Development Workflow

### Local Development
```bash
npm run dev        # Start dev server (Vite)
npm run build      # Build both app + widget
npm run preview    # Preview production build
```

### Environment Setup
Required `.env` variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `VITE_BASE_PATH` - Set to `/` for Azure, `/CreedaVA/` for GitHub Pages

### Deployment
- **Primary**: Azure Static Web Apps via GitHub Actions
- **Config**: `public/staticwebapp.config.json` handles SPA routing + security headers
- **Alternative**: Supports Vercel, Netlify, Cloudflare Pages

## Component Conventions

### UI Components
- **Base**: shadcn/ui components in `src/components/ui/` (Button, Card, Table, etc.)
- **Custom**: Application components in `src/components/` (Navbar, Footer, ChatBot)
- **Admin styling**: Always use white backgrounds, gray text colors, no colored tiles

### Page Structure
```tsx
// Standard admin page pattern
export function PageName() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Page Title</h1>
        <Button>Action</Button>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>...</Card>
      </div>
      
      {/* Main content */}
      <Card>...</Card>
    </div>
  )
}
```

## Critical Files

- `src/App.tsx` - Main routing + lazy loading setup
- `src/layouts/AdminLayout.tsx` - Admin shell with navigation
- `vite.config.ts` vs `vite.widget.config.ts` - Dual build configs
- `public/staticwebapp.config.json` - Azure deployment config
- `src/contexts/AuthContext.tsx` - Supabase authentication wrapper

## Spark Integration Note
Optional GitHub Spark plugins are gracefully handled - code runs with/without Spark runtime using try/catch in `vite.config.ts`.