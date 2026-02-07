#!/usr/bin/env bash
set -euo pipefail

# verify-deploy.sh
# Usage:
#   ./scripts/verify-deploy.sh            # local-only checks
#   ./scripts/verify-deploy.sh --remote https://creedava.com
# Exits with codes:
#   0 = success
#   1 = local build missing / usage error
#   2 = main index mismatch (local vs remote)
#   3 = fetch error (failed to retrieve remote asset)
#   4 = content-type mismatch for JS asset

ROOT_URL_DEFAULT="https://creedava.com"
MODE="local"
ROOT_URL="$ROOT_URL_DEFAULT"
RETRIES=3
RETRY_DELAY=2

if [ "${1:-}" = "--remote" ]; then
  MODE="remote"
  ROOT_URL="${2:-$ROOT_URL_DEFAULT}"
elif [ "${1:-}" = "--local" ]; then
  MODE="local"
fi

DIST_DIR="dist"
INDEX_FILE="$DIST_DIR/index.html"

if [ ! -f "$INDEX_FILE" ]; then
  echo "ERROR: $INDEX_FILE not found. Did the build succeed?"
  exit 1
fi

main_index=$(grep -oP 'script type="module" [^>]*src="\K/assets/js/index-[^" ]+' "$INDEX_FILE" | head -n1 || true)
if [ -z "$main_index" ]; then
  echo "ERROR: Could not find main index JS reference in $INDEX_FILE"
  exit 1
fi

echo "Local main index: $main_index"

assets=$(grep -oP 'link rel="modulepreload" [^>]*href="\K[^" ]+' "$INDEX_FILE" | sort -u || true)
# include main index in the list to verify
assets_list=( $assets "$main_index" )

# Verify local assets exist
for a in "${assets_list[@]}"; do
  # strip leading slash
  relpath="${a#/}"
  if [ ! -f "$DIST_DIR/$relpath" ]; then
    echo "ERROR: Missing local asset: $DIST_DIR/$relpath"
    exit 1
  fi
done

echo "All referenced assets exist locally." 

# helper: fetch with retries
_fetch_with_retries() {
  local url="$1"
  local i
  for i in $(seq 1 $RETRIES); do
    if curl -fsL "$url" -o /dev/stdout 2>/dev/null; then
      return 0
    fi
    echo "Warning: failed to fetch $url (attempt $i/$RETRIES); retrying in $RETRY_DELAY seconds..."
    sleep $RETRY_DELAY
    RETRY_DELAY=$((RETRY_DELAY * 2))
  done
  return 1
}

# helper: fetch headers with retries
_fetch_headers_with_retries() {
  local url="$1"
  local i
  for i in $(seq 1 $RETRIES); do
    if curl -fsI "$url" 2>/dev/null; then
      return 0
    fi
    echo "Warning: failed to fetch headers for $url (attempt $i/$RETRIES); retrying in $RETRY_DELAY seconds..."
    sleep $RETRY_DELAY
    RETRY_DELAY=$((RETRY_DELAY * 2))
  done
  return 1
}

if [ "$MODE" = "remote" ]; then
  echo "Checking remote site at $ROOT_URL"

  prod_html=""
  if ! prod_html=$(curl -fsL "$ROOT_URL" 2>/dev/null); then
    echo "ERROR: Failed to fetch $ROOT_URL after $RETRIES attempts"
    exit 3
  fi

  prod_main=$(echo "$prod_html" | grep -oP 'script type="module" [^>]*src="\K/assets/js/index-[^" ]+' | head -n1 || true)
  if [ -z "$prod_main" ]; then
    echo "ERROR: Production did not expose a main index JS"; exit 3
  fi
  echo "Prod main index: $prod_main"

  if [ "$prod_main" != "$main_index" ]; then
    echo "ERROR: main index mismatch: local=$main_index prod=$prod_main"
    echo "--- Local assets ---"
    for a in "${assets_list[@]}"; do echo "$a"; done
    echo "--- Production modulepreload / script refs ---"
    echo "$prod_html" | egrep -o 'script type="module" [^>]*src="[^"]+"|link rel="modulepreload" [^>]*href="[^"]+"' | sed -n '1,50p'
    echo "--- Sample header for prod main ---"
    curl -fsI "${ROOT_URL}${prod_main}" || true
    exit 2
  fi

  # Verify each asset on production
  for a in "${assets_list[@]}"; do
    url="$ROOT_URL$a"
    echo "Checking $url"
    if ! headers=$(curl -fsI "$url" 2>/dev/null); then
      echo "ERROR: Failed to fetch headers for $url"; exit 3
    fi
    status=$(echo "$headers" | head -n 1 | awk '{print $2}') || true
    if [ "$status" != "200" ]; then
      echo "ERROR: $url returned status $status"; echo "$headers"; exit 3
    fi
    ctype=$(echo "$headers" | grep -i '^content-type:' || true)
    if echo "$a" | grep -q '\.js$'; then
      if ! echo "$ctype" | grep -qi 'javascript'; then
        echo "ERROR: JS asset served with wrong content-type: $a -> $ctype"; echo "$headers"; exit 4
      fi
    fi
  done
  echo "Production verification passed."
else
  echo "Skipping production checks (local-only mode)."
fi

exit 0
