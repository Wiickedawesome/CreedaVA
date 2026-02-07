#!/usr/bin/env bash
set -euo pipefail

# verify-deploy.sh
# Usage:
#   ./scripts/verify-deploy.sh                              # local-only checks (requires dist/)
#   ./scripts/verify-deploy.sh --remote https://creedava.com  # local build + remote hash comparison
#   ./scripts/verify-deploy.sh --health https://creedava.com  # remote-only health check (no local build needed)
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
elif [ "${1:-}" = "--health" ]; then
  MODE="health"
  ROOT_URL="${2:-$ROOT_URL_DEFAULT}"
elif [ "${1:-}" = "--local" ]; then
  MODE="local"
fi

# helper: fetch with retries
_fetch_with_retries() {
  local url="$1"
  local delay=$RETRY_DELAY
  local i
  for i in $(seq 1 $RETRIES); do
    if curl -fsL "$url" -o /dev/stdout 2>/dev/null; then
      return 0
    fi
    echo "Warning: failed to fetch $url (attempt $i/$RETRIES); retrying in ${delay}s..."
    sleep $delay
    delay=$((delay * 2))
  done
  return 1
}

# helper: fetch headers with retries
_fetch_headers_with_retries() {
  local url="$1"
  local delay=$RETRY_DELAY
  local i
  for i in $(seq 1 $RETRIES); do
    if curl -fsI "$url" 2>/dev/null; then
      return 0
    fi
    echo "Warning: failed to fetch headers for $url (attempt $i/$RETRIES); retrying in ${delay}s..."
    sleep $delay
    delay=$((delay * 2))
  done
  return 1
}

# --- Verify production assets are reachable and have correct content-types ---
verify_remote_assets() {
  local root_url="$1"
  shift
  local assets=("$@")

  for a in "${assets[@]}"; do
    url="$root_url$a"
    echo "Checking $url"
    if ! headers=$(_fetch_headers_with_retries "$url"); then
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
    if echo "$a" | grep -q '\.css$'; then
      if ! echo "$ctype" | grep -qi 'css'; then
        echo "ERROR: CSS asset served with wrong content-type: $a -> $ctype"; echo "$headers"; exit 4
      fi
    fi
  done
}

# ============================================================
# MODE: health — remote-only, no local build required
# ============================================================
if [ "$MODE" = "health" ]; then
  echo "=== Health check: $ROOT_URL ==="

  # 1. Fetch the production index.html
  prod_html=""
  if ! prod_html=$(curl -fsL "$ROOT_URL" 2>/dev/null); then
    echo "ERROR: Site is DOWN — failed to fetch $ROOT_URL"
    exit 3
  fi
  echo "✓ Site is reachable"

  # 2. Verify it looks like our app (has a main index JS)
  prod_main=$(echo "$prod_html" | grep -oP 'script type="module" [^>]*src="\K/assets/js/index-[^" ]+' | head -n1 || true)
  if [ -z "$prod_main" ]; then
    echo "ERROR: Production HTML does not contain a main index JS bundle"
    exit 3
  fi
  echo "✓ Main JS bundle found: $prod_main"

  # 3. Collect all referenced assets from production HTML
  prod_assets=$(echo "$prod_html" | grep -oP 'link rel="modulepreload" [^>]*href="\K[^" ]+' | sort -u || true)
  prod_assets_list=( $prod_assets "$prod_main" )

  # 4. Verify each asset is accessible with correct content-type
  verify_remote_assets "$ROOT_URL" "${prod_assets_list[@]}"

  # 5. Quick API health check
  api_url="${ROOT_URL}/api/health"
  echo "Checking API: $api_url"
  if api_resp=$(curl -fsL "$api_url" 2>/dev/null); then
    echo "✓ API health endpoint responded"
  else
    echo "⚠ API health endpoint did not respond (non-fatal)"
  fi

  echo ""
  echo "=== Health check PASSED ==="
  exit 0
fi

# ============================================================
# MODE: local / remote — requires local dist/ build
# ============================================================
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
assets_list=( $assets "$main_index" )

# Verify local assets exist
for a in "${assets_list[@]}"; do
  relpath="${a#/}"
  if [ ! -f "$DIST_DIR/$relpath" ]; then
    echo "ERROR: Missing local asset: $DIST_DIR/$relpath"
    exit 1
  fi
done

echo "All referenced assets exist locally."

if [ "$MODE" = "remote" ]; then
  echo "Checking remote site at $ROOT_URL"

  prod_html=""
  if ! prod_html=$(curl -fsL "$ROOT_URL" 2>/dev/null); then
    echo "ERROR: Failed to fetch $ROOT_URL"
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
    echo "$prod_html" | grep -oE 'script type="module" [^>]*src="[^"]+"|link rel="modulepreload" [^>]*href="[^"]+"' | sed -n '1,50p'
    echo "--- Sample header for prod main ---"
    curl -fsI "${ROOT_URL}${prod_main}" || true
    exit 2
  fi

  verify_remote_assets "$ROOT_URL" "${assets_list[@]}"
  echo "Production verification passed."
else
  echo "Skipping production checks (local-only mode)."
fi

exit 0
