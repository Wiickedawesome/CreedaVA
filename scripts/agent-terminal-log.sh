#!/usr/bin/env bash
# Bounded command runner for coding agents.
#
# Guarantees a command cannot outlive the turn (so the agent never blocks with
# no output) and records every invocation so a hang can be identified after the
# fact instead of guessed at.
#
#   source scripts/agent-terminal-log.sh
#   agent_run npm test
#
# Exit code 124 means the command hit the timeout. Override the limit with
# AGENT_CMD_TIMEOUT (seconds), default 120.

AGENT_LOG="${AGENT_LOG:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)/.agent-terminal-log}"
AGENT_CMD_TIMEOUT="${AGENT_CMD_TIMEOUT:-120}"

agent_run() {
  local started ended status
  started=$(date +%s)
  timeout --kill-after=5 "${AGENT_CMD_TIMEOUT}s" "$@"
  status=$?
  ended=$(date +%s)

  printf '%s\t%ss\t%s\t%s\n' \
    "$(date -Iseconds)" "$((ended - started))" "$status" "$*" >> "$AGENT_LOG"

  return "$status"
}
