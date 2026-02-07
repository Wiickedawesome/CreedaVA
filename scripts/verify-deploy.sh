#!/usr/bin/env bash
set -euo pipefail

ROOT_URL="${1:-"https://creedava.com"}"
MODE="local"
if [ "${1:-}" = "--remote" ]; then
  MODE="remote"
  ROOT_URL="${2:-https://creedava.com}"
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

if [ "$MODE" = "remote" ]; then
  echo "Checking production at $ROOT_URL"
  prod_html=$(curl -fsL "$ROOT_URL") || { echo "ERROR: Failed to fetch $ROOT_URL"; exit 1; }
  prod_main=$(echo "$prod_html" | grep -oP 'script type="module" [^>]*src="\K/assets/js/index-[^" ]+' | head -n1 || true)
  if [ -z "$prod_main" ]; then
    echo "ERROR: Production did not expose a main index JS"; exit 1
  fi
  echo "Prod main index: $prod_main"

  if [ "$prod_main" != "$main_index" ]; then
    echo "ERROR: main index mismatch: local=$main_index prod=$prod_main"; exit 2
  fi

  # Verify each asset on production
  for a in "${assets_list[@]}"; do
    url="$ROOT_URL$a"
    echo "Checking $url"
    headers=$(curl -fsI "$url" || true)
    if [ -z "$headers" ]; then
      echo "ERROR: Failed to fetch headers for $url"; exit 3
    fi
    status=$(echo "$headers" | head -n 1 | awk '{print $2}') || true
    if [ "$status" != "200" ]; then
      echo "ERROR: $url returned status $status"; echo "$headers"; exit 3
    fi
    ctype=$(echo "$headers" | grep -i '^content-type:' || true)
    if echo "$a" | grep -q '\.js$'; then
      if ! echo "$ctype" | grep -qi 'javascript'; then
        echo "ERROR: JS asset served with wrong content-type: $a -> $ctype"; exit 4
      fi
    fi
  done
  echo "Production verification passed."
else
  echo "Skipping production checks (local-only mode)."
fi

exit 0
