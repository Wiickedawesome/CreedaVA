# Operations Runbook

## Environments & Secrets
- Required settings (Functions): `COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE`, `AAD_CLIENT_ID`, `AAD_TENANT_ID`, `APP_ORIGIN`, `CORS_ORIGIN`, `ALLOW_INMEMORY_FALLBACK=false`.
- Required settings (Frontend): `VITE_API_BASE_URL`, `VITE_AAD_CLIENT_ID`, `VITE_AAD_TENANT_ID`, `VITE_APP_URL`, `VITE_BASE_PATH`.
- Optional: `VITE_AAD_AUTHORITY`, analytics keys, LinkedIn client credentials.
- Optional: Google OIDC - set `GOOGLE_CLIENT_ID` in `api/local.settings.json` and `VITE_GOOGLE_CLIENT_ID` in frontend env to enable "Sign in with Google" (restrict domain with `GOOGLE_ALLOWED_DOMAIN`).

## Deployments
- Build both bundles: `npm run build` (runs app + widget) or `npm run build:app` / `npm run build:widget` separately.
- Static Web Apps: ensure `staticwebapp.config.json` is deployed with restricted CORS and caching headers.
- Functions: set app settings above; keep `ALLOW_INMEMORY_FALLBACK` disabled in prod; ensure `CORS_ORIGIN`/`APP_ORIGIN` match the frontend domain.

## Data & Backups
- Cosmos DB is the system of record. Use Azure portal or `az cosmosdb sql container` export/backup for periodic snapshots.
- Partition key is `/type`; recreating containers requires re-importing data with `type` populated.
- Local/emulator reset: `NODE_TLS_REJECT_UNAUTHORIZED=0 node api/reset-containers.js` (destructive) or `node api/create-containers.js` for fresh create.

## Incident Response
- Check Azure Functions logs and Cosmos diagnostics (activityId, RU charge). Investigate 429/503 and honor `Retry-After`.
- Verify CORS settings (`CORS_ORIGIN`, `APP_ORIGIN`) and Entra IDs if auth failures occur.
- If Cosmos unavailable, APIs return 503 when in-memory fallback is disabled; restore availability before retrying.
- Restart Functions app if connections are stuck; confirm Cosmos firewall/IP rules.

## Monitoring & Alerts
- Enable Application Insights for the Functions app (request/dep traces, failures, latency).
- Add Cosmos alerts: RU consumption, throttles (429s), availability, latency.
- Capture and review Functions diagnostic strings when latency spikes or unexpected status codes appear.

## Testing & Smoke
- Pre-release smoke: Entra login, admin CRUD save/load, analytics fetch, public contact submit, `npm run build` (and `npm run build:widget`).
- Use the helper scripts to start the Cosmos emulator when running smoke tests locally (recommended):
  - `npm run start:cosmos` (waits until the emulator is ready)
  - `npm run stop:cosmos` (stop/remove the container)
- Optional: add E2E covering admin auth + CRUD + contact + analytics.
