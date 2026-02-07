#!/bin/bash
# Format & Lint Script: Clean up code formatting
# Run with: bash scripts/format-code.sh

set -e

echo "🎨 CreedaVA Code Formatting & Linting"
echo "====================================="
echo ""

# Check if Prettier is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Format TypeScript/React files
echo "✨ Formatting TypeScript/React files..."
npx prettier --write "src/**/*.{ts,tsx,js,jsx}" --log-level warn
echo ""

# Format JSON files
echo "📄 Formatting JSON files..."
npx prettier --write "*.json" "api/**/*.json" --log-level warn
echo ""

# Format CSS files
echo "🎨 Formatting CSS files..."
npx prettier --write "src/**/*.css" --log-level warn
echo ""

# Run ESLint
echo "🔍 Running ESLint..."
npm run lint 2>&1 | grep -v "warning" || true
echo ""

# Check for unused exports (optional - requires knip)
if command -v npx knip &> /dev/null; then
    echo "🔎 Checking for unused exports..."
    npx knip --no-exit-code 2>/dev/null | head -20 || echo "  (No unused exports found)"
    echo ""
fi

echo "✅ Code formatting complete!"
echo ""
echo "💡 Tip: Configure your editor to format on save for automatic formatting."
echo ""
