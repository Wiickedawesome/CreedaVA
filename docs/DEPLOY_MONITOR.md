# Deployment Monitor

This project includes an automated deployment monitor that runs on a schedule and performs these checks:

- Verifies that https://creedava.com is reachable and returns a valid SPA page.
- Confirms all JS/CSS asset bundles referenced in the production HTML return HTTP 200 with correct `Content-Type` headers.
- Optionally checks that `/api/health` responds.
- If verification fails, the monitor will attempt to create or comment on a GitHub issue (if Issues is enabled) and mark the workflow as failed.

Workflows & scripts
- `.github/workflows/monitor-deploy.yml` runs every 15 minutes and on-demand via `workflow_dispatch`.
- `scripts/verify-deploy.sh` performs the verification:
  - `--health <url>` — remote-only health check (no local build needed, used by the scheduled monitor).
  - `--remote <url>` — builds locally and compares hashes against production (for post-deploy validation).
  - `--local` (default) — checks that `dist/` exists and is well-formed.

Secrets
- `GITHUB_TOKEN` (provided automatically in Actions) is used to create issues/comments.

How to test locally
1. Build the site locally: `npm run build` (creates `dist/`).
2. Run: `./scripts/verify-deploy.sh --remote https://creedava.com`.

If the script exits with code `2`, it indicates a main index mismatch (local vs remote). Codes `3` and `4` indicate fetch or content-type problems respectively.
