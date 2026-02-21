# Testing Guide

## Overview

CreedaVA uses [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/) for unit and component testing. Tests live in the `__tests__/` directory, mirroring the source structure.

---

## Quick Start

```bash
# Run all tests once
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Interactive UI
npm run test:ui

# Coverage report
npm run test:coverage

# End-to-end workflow smoke against local emulators
npm run smoke:emulator:e2e

# Fast check that Functions emulator loaded routes correctly
npm run smoke:emulator:functions-load

# Webhook validation + method security baseline checks
npm run smoke:emulator:security

# Full local release gate
npm run check:preflight
```

This command starts Firestore + Functions emulators on temporary non-default ports, submits sample `contact` / `lead` / `booking` payloads to `handleFormWebhook`, verifies Firestore writes, and checks booking calendar-sync metadata side effects.

- `smoke:emulator:functions-load` verifies the webhook route is mounted and correctly returns `405` for disallowed methods.
- `smoke:emulator:security` verifies request validation/method restrictions (`400`/`405`) for malformed webhook inputs.
- App Check `401` enforcement is not asserted in emulator mode because Functions emulator bypasses strict App Check token verification.

---

## Test Configuration

| Setting         | Value                                      |
| --------------- | ------------------------------------------ |
| Config file     | `vitest.config.ts`                         |
| Environment     | `jsdom`                                    |
| Setup file      | `__tests__/setup.ts`                       |
| Test pattern    | `__tests__/**/*.test.{ts,tsx}`             |
| Globals         | `true` (describe/it/expect available)      |
| CSS             | Disabled (not needed for unit tests)       |
| Path aliases    | `@` → project root (matches `tsconfig`)   |

---

## Test Structure

```
__tests__/
├── setup.ts                            # jest-dom matchers
├── components/
│   └── ui/
│       └── button.test.tsx             # Button component tests
└── lib/
    ├── firebase/
    │   └── translate.test.ts           # Translation display helpers
    ├── i18n/
    │   └── dictionaries.test.ts        # Dictionary structure validation
    └── utils/
        ├── csv.test.ts                 # CSV export tests
        └── ltv.test.ts                 # Customer LTV computation tests
```

---

## Writing Tests

### Pure Function Tests

For utility functions with no side effects:

```typescript
import { describe, it, expect } from "vitest";
import { computeLTV } from "@/lib/utils/ltv";

describe("computeLTV", () => {
  it("returns 0 when there are no projects", () => {
    expect(computeLTV([], [])).toBe(0);
  });
});
```

### Component Tests

For React components using Testing Library:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });
});
```

### Mocking Firebase

Modules that import Firebase SDK will trigger initialization. Mock the Firebase modules to prevent this:

```typescript
import { describe, it, expect, vi } from "vitest";

// Mock BEFORE importing the module under test
vi.mock("@/lib/firebase/ai", () => ({ generateJSON: vi.fn() }));
vi.mock("@/lib/firebase/firestore", () => ({ update: vi.fn() }));
vi.mock("@/lib/firebase/config", () => ({
  app: {},
  auth: {},
  db: {},
}));

import { getTranslatedTitle } from "@/lib/firebase/translate";
```

---

## What to Test

### Good candidates for testing

- **Pure utilities** (`lib/utils/`) — deterministic, no side effects
- **Type/structure validation** — dictionary parity, exported types
- **Display helpers** — translation getters, formatting functions
- **UI components** — render, props, variants, accessibility
- **Custom hooks** (with `renderHook`) — state logic

### Avoid testing directly

- **Firebase SDK calls** — mock at the boundary
- **Next.js routing** — handled by framework
- **CSS visual rendering** — use visual regression tools instead
- **Third-party library internals** — trust their tests

---

## CI Integration

Tests run via `npm test` which exits with code 0 on success, 1 on failure. Add to your CI pipeline:

```yaml
- name: Run tests
  run: npm test
```

For coverage thresholds, configure in `vitest.config.ts`:

```typescript
test: {
  coverage: {
    thresholds: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
}
```
