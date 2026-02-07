# Deployment Monitor

This project includes an automated deployment monitor that runs on a schedule and performs these checks:

- Verifies that the production `index.html` references the same `index-<hash>.js` file as a local build of the `reapply/safe-chunk-minify` branch (or whichever branch you build locally).
- Confirms JS assets return a `Content-Type` including `javascript`.
- If verification fails, the monitor will create or comment on a GitHub issue with the verification output.

Workflows & scripts
- `.github/workflows/monitor-deploy.yml` runs every 15 minutes and on-demand via `workflow_dispatch`.
- `scripts/verify-deploy.sh` performs the verification. It supports `--remote <url>` to check a remote site.

Secrets
- `GITHUB_TOKEN` (provided automatically in Actions) is used to create issues/comments.

How to test locally
1. Build the site locally: `npm run build` (creates `dist/`).
2. Run: `./scripts/verify-deploy.sh --remote https://creedava.com`.

If the script exits with code `2`, it indicates a main index mismatch (local vs remote). Codes `3` and `4` indicate fetch or content-type problems respectively.
