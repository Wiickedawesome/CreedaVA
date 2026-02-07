#!/bin/bash
# Verify build configuration for chunk loading

echo "🔍 Checking build configuration..."
echo ""

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "❌ No dist/ folder found. Run 'npm run build' first."
    exit 1
fi

# Check index.html for base path
echo "📄 Checking index.html asset paths:"
if grep -q 'src="/CreedaVA/' dist/index.html; then
    echo "⚠️  WARNING: Found /CreedaVA/ paths in index.html"
    echo "   This will cause chunk loading failures on creedava.com"
    echo "   Rebuild with: VITE_BASE_PATH=/ npm run build"
elif grep -q 'src="/assets' dist/index.html; then
    echo "✅ Correct: Using root paths (/assets/...)"
else
    echo "❓ Unexpected path format. Check manually:"
    grep -E '(href|src)=' dist/index.html | head -5
fi

echo ""
echo "📦 Chunk files in dist/assets/js/:"
ls -lh dist/assets/js/ 2>/dev/null | head -10 || echo "No JS chunks found"

echo ""
echo "🌐 Current environment variables:"
echo "   VITE_BASE_PATH=${VITE_BASE_PATH:-<not set, will use default>}"
echo "   BASE_URL from .env: $(grep VITE_BASE_PATH .env.production 2>/dev/null || echo '<none>')"

echo ""
echo "✨ To test build locally:"
echo "   npm run preview"
echo "   Then navigate to http://localhost:4173/services"
