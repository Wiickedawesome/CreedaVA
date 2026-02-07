#!/bin/bash
# Cleanup Script: Remove unused dependencies and optimize codebase
# Run with: bash scripts/cleanup-dependencies.sh

set -e

echo "🧹 CreedaVA Dependency Cleanup Script"
echo "======================================"
echo ""

# Backup package.json
echo "📦 Backing up package.json..."
cp package.json package.json.backup
echo "✅ Backup created: package.json.backup"
echo ""

# Remove unused dependencies
echo "🗑️  Removing unused dependencies..."
echo ""

UNUSED_DEPS=(
  "@heroicons/react"
  "@octokit/core"
  "@radix-ui/colors"
  "@tanstack/react-query"
  "@tanstack/react-table"
  "d3"
  "jose"
  "marked"
  "octokit"
  "three"
  "tw-animate-css"
  "uuid"
)

UNUSED_DEV_DEPS=(
  "sharp"
)

for dep in "${UNUSED_DEPS[@]}"; do
  echo "  - Removing $dep..."
  npm uninstall "$dep" 2>/dev/null || echo "    (already removed or not found)"
done

for dep in "${UNUSED_DEV_DEPS[@]}"; do
  echo "  - Removing $dep (dev)..."
  npm uninstall --save-dev "$dep" 2>/dev/null || echo "    (already removed or not found)"
done

echo ""
echo "✅ Unused dependencies removed"
echo ""

# Install any missing dependencies
echo "📥 Installing any missing dependencies..."
npm install
echo ""

# Run build test
echo "🔨 Testing production build..."
npm run build
echo ""

# Show bundle size
if [ -d "dist" ]; then
  echo "📊 Build Output Size:"
  du -sh dist/
  echo ""
  echo "📁 Asset Breakdown:"
  du -sh dist/assets/*
  echo ""
fi

echo "✅ Cleanup complete!"
echo ""
echo "💾 To restore backup if needed: mv package.json.backup package.json"
echo ""
