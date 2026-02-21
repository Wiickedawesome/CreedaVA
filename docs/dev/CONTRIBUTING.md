# Contributing Guide

## Getting Started

```bash
# Clone and install
git clone https://github.com/Wiickedawesome/CreedaVA.git
cd CreedaVA
npm install

# Set up environment
cp .env.local.example .env.local
# Fill in Firebase credentials

# Start dev server
npm run dev
```

---

## Development Workflow

1. Create a feature branch from `main`
2. Make changes
3. Run lint: `npm run lint`
4. Run tests: `npm test`
5. Build check: `npm run build`
6. Commit and push
7. Open a pull request against `main`

---

## Code Style

### General

- **TypeScript strict mode** — all files must pass `tsc` with no errors
- **ESLint** — run `npm run lint` before committing
- **Path aliases** — always use `@/` imports, never relative paths like `../../`

### Components

- **Server Components by default** — only add `"use client"` when needed
- **Custom UI only** — do not install shadcn/ui or other component libraries
- **Barrel exports** — always export from the directory's `index.ts`
- **Icons** — use inline SVG with `stroke="currentColor"`

### Naming

- **Files**: `kebab-case.tsx` for components, `camelCase.ts` for utilities
- **Components**: `PascalCase`
- **Functions/variables**: `camelCase`
- **Types/interfaces**: `PascalCase`
- **CSS classes**: Tailwind utilities, use design tokens (not arbitrary values)

### Firebase

- **Typed generics** — always pass `<T>` to Firestore CRUD helpers
- **No raw SDK calls** — use wrappers in `lib/firebase/`
- **Error handling** — wrap Firebase calls in try/catch, log errors

---

## Project Structure Rules

### Adding a Marketing Page

1. Create `app/(marketing)/your-page/page.tsx`
2. Export `metadata: Metadata` for SEO
3. Use `<Container>` for content width
4. Keep as Server Component unless interactivity is needed

### Adding an Admin Page

1. Create `app/(admin)/admin/your-page/page.tsx`
2. Add `"use client"` directive
3. Use `<PageHeader>` for title + breadcrumbs
4. Use `<DataTable>` for data display
5. Add navigation link in `components/admin/sidebar.tsx`

### Adding a Cloud Function

1. Create/edit file in `functions/src/`
2. Export the function from `functions/src/index.ts`
3. Add CORS and auth middleware as needed
4. Build: `cd functions && npm run build`
5. Deploy: `firebase deploy --only functions`

### Adding a UI Component

1. Create `components/ui/your-component.tsx`
2. Use `forwardRef` for DOM-wrapping components
3. Support `className` prop for customization
4. Export from `components/ui/index.ts`

### Adding Tests

1. Mirror source path: `__tests__/lib/utils/your-util.test.ts`
2. Mock Firebase imports if the module touches Firebase SDK
3. Prefer pure function tests — extract logic out of components when possible
4. Run: `npm test`

---

## Internationalization

### Adding a Translation Key

1. Add the key to `lib/i18n/en.ts`
2. Add the corresponding key to `lib/i18n/es.ts`
3. Test: `npm test` (dictionary parity test will catch mismatches)
4. Use in components: `const { t } = useDict(); t.section.key`

### Adding a New Language

1. Create `lib/i18n/xx.ts` following the `Dictionary` type structure
2. Add the locale to `SUPPORTED_LOCALES` in `lib/firebase/translate.ts`
3. Add language name to `LANGUAGE_NAMES` map
4. Update the i18n context to include the new locale

---

## Commit Messages

Use conventional commits:

```
feat: add booking confirmation email
fix: resolve forum translation race condition
docs: update architecture guide
test: add CSV export tests
chore: update dependencies
```
