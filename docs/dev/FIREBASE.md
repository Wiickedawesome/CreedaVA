# Firebase Setup & Deployment

## Prerequisites

- Node.js 24.x
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)

---

## Firebase Services Used

| Service          | Purpose                                    |
| ---------------- | ------------------------------------------ |
| Authentication   | Google sign-in (restricted to creedava.com)|
| Cloud Firestore  | Primary database (CRM, blog, forum, etc.)  |
| Cloud Functions  | Server-side integrations (Node.js 24)      |
| App Hosting      | Next.js SSR & API deployment               |
| Firebase Storage | File uploads (blog images, attachments)    |
| Firebase AI      | Gemini 2.5 Flash for content translation   |

---

## Environment Setup

### 1. Frontend (.env.local)

```bash
cp .env.local.example .env.local
```

Fill in values from Firebase Console → Project Settings → Your apps → Web app:

| Variable                              | Description              |
| ------------------------------------- | ------------------------ |
| `NEXT_PUBLIC_FIREBASE_API_KEY`        | Web API key              |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`    | Auth domain              |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`     | Project ID               |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket URL       |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID`         | App ID                   |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Google Analytics ID      |

Production note: Use `creeda-va.firebaseapp.com` to ensure consistent auth behavior across local and production environments, avoiding complex custom domain rewrite issues.

### 2. Cloud Functions

Cloud functions use Firebase Admin SDK which auto-authenticates in the Firebase environment. For local development, set up a service account:

1. Firebase Console → Project Settings → Service accounts
2. Generate new private key
3. Set `GOOGLE_APPLICATION_CREDENTIALS` env var to the key path

---

## Firestore Security Rules

Rules are defined in `firestore.rules` at the project root. Deploy with:

```bash
firebase deploy --only firestore:rules
```

### Key access patterns:

- **Public read**: Blog posts, landing pages, forum threads
- **Authenticated write**: Forum posts (logged-in users)
- **Admin only**: CRM data, customer records, settings

---

## Cloud Functions

Functions live in `functions/` with a separate `package.json`.

### Build & Deploy

```bash
cd functions
npm install
npm run build        # Compile TypeScript
cd ..
firebase deploy --only functions
```

### Function Categories

| File                  | Functions                          |
| --------------------- | ---------------------------------- |
| `admin.ts`            | Admin API endpoints                |
| `email.ts`            | Email sending via Nodemailer       |
| `calendar.ts`         | Google Calendar read/write         |
| `ads.ts`              | Google Ads campaign management     |
| `google-analytics.ts` | GA4 data retrieval                 |
| `google-business.ts`  | Business Profile management        |
| `google-drive.ts`     | Drive file operations              |
| `google-sheets.ts`    | Sheets data sync                   |
| `search-console.ts`   | Search Console performance data    |
| `scheduled.ts`        | Cron-based background jobs         |
| `triggers.ts`         | Firestore document triggers        |
| `webhooks.ts`         | External webhook handlers          |

### Local Development

```bash
# From project root
firebase emulators:start --only functions,firestore
```

---

## Deployment

### Full Deployment

```bash
# Build the Next.js site
npm run build

# Deploy everything (hosting + functions + rules + indexes)
firebase deploy
```

### Selective Deployment

```bash
# Hosting only (frontend)
firebase deploy --only hosting

# Functions only
firebase deploy --only functions

# Firestore rules only
firebase deploy --only firestore:rules

# Firestore indexes only
firebase deploy --only firestore:indexes
```

### App Hosting Configuration

Configured in `apphosting.yaml` and `firebase.json`:

- **Runtime**: Node.js 24 (managed by App Hosting)
- **Environment**: Secrets managed via Cloud Secret Manager
- **Backend**: Cloud Run (Next.js SSR)

> **Legacy Note**: References to `hosting` in `firebase.json` are deprecated or minimal.

---

## Firestore Indexes

Custom indexes are defined in `firestore.indexes.json`. Deploy with:

```bash
firebase deploy --only firestore:indexes
```

If you see "index required" errors in the console, Firestore will provide a direct link to create the missing index.

---

## Authentication Setup

1. Firebase Console → Authentication → Sign-in method
2. Enable **Google** provider
3. Add authorized domain(s) under Settings → Authorized domains
4. Domain restriction (`creedava.com`) is enforced in application code (`lib/firebase/auth.ts`)

---

## Firebase AI (Gemini)

Used for auto-translating user-generated content (forum threads, blog posts) between EN/ES.

### Setup

1. Enable Firebase AI in the Firebase Console
2. The Gemini 2.5 Flash model is used by default
3. No additional API keys needed — uses Firebase project credentials

### Translation Modes

- **Fire-and-forget**: Translates content immediately after creation, saves to Firestore `translations` field
- **On-demand**: Translates on first view if `translations` field is missing, then caches in Firestore
