#!/bin/bash

# Local CSP Testing Script
# Tests the built site for Content Security Policy issues

echo "🧪 CreedaVA Local Security Testing"
echo "==================================="
echo ""

DIST_DIR="/home/wicked/Projects/CreedaVA/dist"

if [ ! -d "$DIST_DIR" ]; then
    echo "❌ Build directory not found. Run 'npm run build' first."
    exit 1
fi

echo "✅ Build directory found"
echo ""

# Check if staticwebapp.config.json has CSP
echo "📋 Checking configuration files..."
echo ""

CSP_IN_CONFIG=$(grep -o "Content-Security-Policy" /home/wicked/Projects/CreedaVA/public/staticwebapp.config.json)
if [ -n "$CSP_IN_CONFIG" ]; then
    echo "✅ Content-Security-Policy found in staticwebapp.config.json"
else
    echo "❌ Content-Security-Policy NOT found in staticwebapp.config.json"
fi

HSTS_IN_CONFIG=$(grep -o "Strict-Transport-Security" /home/wicked/Projects/CreedaVA/public/staticwebapp.config.json)
if [ -n "$HSTS_IN_CONFIG" ]; then
    echo "✅ Strict-Transport-Security found in staticwebapp.config.json"
else
    echo "❌ Strict-Transport-Security NOT found in staticwebapp.config.json"
fi

PERMISSIONS_IN_CONFIG=$(grep -o "Permissions-Policy" /home/wicked/Projects/CreedaVA/public/staticwebapp.config.json)
if [ -n "$PERMISSIONS_IN_CONFIG" ]; then
    echo "✅ Permissions-Policy found in staticwebapp.config.json"
else
    echo "❌ Permissions-Policy NOT found in staticwebapp.config.json"
fi

echo ""
echo "📊 Security Headers Summary:"
echo "----------------------------"

# Extract and display the actual CSP
echo ""
echo "Content-Security-Policy:"
grep -A 1 "Content-Security-Policy" /home/wicked/Projects/CreedaVA/public/staticwebapp.config.json | tail -1 | sed 's/^[[:space:]]*/  /'

echo ""
echo "Permissions-Policy:"
grep -A 1 "Permissions-Policy" /home/wicked/Projects/CreedaVA/public/staticwebapp.config.json | tail -1 | sed 's/^[[:space:]]*/  /'

echo ""
echo ""
echo "🚀 Next Steps:"
echo "-------------"
echo "1. Start dev server: npm run dev"
echo "2. Open http://localhost:5173 in browser"
echo "3. Open DevTools (F12) → Console tab"
echo "4. Look for any CSP violation warnings"
echo "5. Navigate through the site:"
echo "   - Homepage"
echo "   - About page"
echo "   - Contact page"
echo "   - Admin login (if configured)"
echo ""
echo "⚠️  Common CSP Warnings to Expect:"
echo "   - 'unsafe-inline' warnings (expected for Tailwind/React)"
echo "   - 'unsafe-eval' warnings in dev mode (expected for Vite HMR)"
echo ""
echo "❌ Warnings to Fix:"
echo "   - 'Refused to load script from...' for legitimate scripts"
echo "   - 'Refused to connect to...' for legitimate API calls"
echo "   - 'Refused to load font from...' for legitimate fonts"
echo ""
echo "📖 For deployment checklist, see:"
echo "   docs/DEPLOYMENT-SECURITY-CHECKLIST.md"
echo ""
echo "✅ Configuration check complete!"
