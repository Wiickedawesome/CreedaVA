<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Terminal rules — non-negotiable

A blocking terminal call hangs the entire session with no output. That has already cost hours here. These rules are not advisory.

**Never run these in blocking mode** (use an async/background call instead): `npm run dev`, `next dev`, `npm run test:watch`, `npm run test:ui`, `npm run test:e2e:ui`, `npm run smoke:emulator:*`, `firebase emulators:start`.

**Bound every blocking call.** Wrap it so it cannot outlive the turn:

```bash
source scripts/agent-terminal-log.sh
agent_run <command> [args...]
```

`agent_run` enforces a `timeout` (default 120s, override with `AGENT_CMD_TIMEOUT`) and appends one line — timestamp, duration, exit code, command — to `.agent-terminal-log` (gitignored). **Exit code `124` means the command hung**; read that file to identify exactly which command, instead of guessing.

**Pagers block forever.** Use `git --no-pager …`, and export `GIT_PAGER=cat` / `GH_PAGER=cat`.

**Never** run `git commit` without `-m`, never run `firebase deploy` / `firebase login` without a non-interactive flag, and never pipe an interactive command through `head` / `grep` / `tail`.

**Never** run `npx … @latest` in a blocking call — pin the version.
