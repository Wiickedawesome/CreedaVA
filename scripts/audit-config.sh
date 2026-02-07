#!/bin/bash

# CreedaVA Configuration Audit Script
# Checks for common misconfigurations, filters, and issues

set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WORKSPACE_ROOT"

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0
PASSED=0

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║              CreedaVA Configuration Audit Report                      ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# Helper functions
error() {
    echo -e "${RED}✗ ERROR:${NC} $1"
    ((ERRORS++))
}

warning() {
    echo -e "${YELLOW}⚠ WARNING:${NC} $1"
    ((WARNINGS++))
}

pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

section() {
    echo ""
    echo -e "${BLUE}━━━ $1 ━━━${NC}"
}

# 1. Check for blocking filters in API endpoints
section "1. API Endpoint Filters & Blocking Logic"

echo "Checking for unwanted filters..."

# Check for page filters that block content
if grep -r "startsWith('/admin')" api/ --include="*.js" 2>/dev/null | grep -v "node_modules" | grep "return"; then
    error "Found admin page filters in API that might block tracking"
else
    pass "No blocking admin filters in API"
fi

# Check for hardcoded URL filters
if grep -rn "if.*page.*==.*'/'" api/ --include="*.js" 2>/dev/null | grep -v "node_modules"; then
    warning "Found hardcoded page path checks in API"
fi

# Check frontend tracking filters
if grep -rn "if.*startsWith('/admin')" src/lib/tracking.ts 2>/dev/null | grep "return"; then
    error "Found blocking filters in frontend tracking"
else
    pass "No blocking filters in frontend tracking"
fi

# 2. Environment Configuration Issues
section "2. Environment Configuration"

echo "Checking environment files..."

# Check if .env files exist
if [ ! -f "api/local.settings.json" ]; then
    error "api/local.settings.json missing"
else
    pass "api/local.settings.json exists"
fi

# Check for dev mode leaks
if grep -r "VITE_DEV_MODE.*true" .env 2>/dev/null; then
    warning "DEV_MODE enabled in .env - ensure this is not in production"
fi

# Check for localhost URLs in production configs
if grep -rn "localhost" .github/workflows/ --include="*.yml" 2>/dev/null; then
    warning "Found localhost references in CI/CD workflows"
fi

# Check CORS configuration
echo "Checking CORS settings..."
if grep -q "CORS_ORIGIN" api/local.settings.json; then
    pass "CORS_ORIGIN configured"
else
    warning "CORS_ORIGIN not found in local.settings.json"
fi

# 3. Hardcoded URLs and API endpoints
section "3. Hardcoded URLs & API Bases"

echo "Scanning for hardcoded URLs..."

# Check for hardcoded localhost URLs
HARDCODED_URLS=$(grep -rn "http://localhost:7071" src/ --include="*.{ts,tsx}" 2>/dev/null | grep -v "// " | grep -v node_modules || true)
if [ -n "$HARDCODED_URLS" ]; then
    error "Found hardcoded localhost URLs in frontend:"
    echo "$HARDCODED_URLS" | head -5
else
    pass "No hardcoded localhost URLs in frontend"
fi

# Check if API_BASE is used consistently
if grep -rn "fetch.*'/api/" src/ --include="*.{ts,tsx}" 2>/dev/null | grep -v "API_BASE" | grep -v "API_URL" | head -1 | grep -q .; then
    warning "Found direct /api/ calls without using API_BASE variable"
else
    pass "API calls use centralized API_BASE/API_URL"
fi

# 4. SEO Configuration
section "4. SEO Configuration"

echo "Checking SEO setup..."

# Check for missing meta tags
if [ -f "index.html" ]; then
    if ! grep -q "og:title" index.html && ! grep -q "twitter:title" index.html; then
        warning "Missing Open Graph tags in index.html"
    else
        pass "Social media meta tags present"
    fi
fi

# Check for robots.txt
if [ -f "public/robots.txt" ]; then
    pass "robots.txt exists"
else
    warning "robots.txt missing"
fi

# Check for sitemap
if [ -f "public/sitemap.xml" ]; then
    pass "sitemap.xml exists"
else
    warning "sitemap.xml missing"
fi

# Check SEO component usage
if ! grep -rq "<SEO" src/pages/*.tsx 2>/dev/null; then
    warning "Some pages might be missing <SEO> component"
else
    pass "Pages use SEO component"
fi

# 5. Analytics Configuration
section "5. Analytics & Tracking"

echo "Checking analytics setup..."

# Check if GA is initialized
if grep -q "initializeGA" src/main.tsx; then
    pass "Google Analytics initialized in main.tsx"
else
    warning "Google Analytics not initialized"
fi

# Check tracking on page views
if grep -q "trackPageView" src/App.tsx; then
    pass "Page view tracking implemented"
else
    warning "Page view tracking missing in App.tsx"
fi

# Check if trackEvent is exported
if grep -q "export.*trackEvent" src/lib/tracking.ts; then
    pass "trackEvent function exported"
else
    error "trackEvent not properly exported"
fi

# 6. Database Query Patterns
section "6. Database & Cosmos DB Queries"

echo "Checking database patterns..."

# Check for missing partition key in queries
if grep -rn "container.item(" api/ --include="*.js" 2>/dev/null | grep -v "node_modules" | head -1 | grep -q .; then
    MISSING_PARTITION=$(grep -rn "container.item([^,]*)" api/ --include="*.js" 2>/dev/null | grep -v "," | grep -v node_modules || true)
    if [ -n "$MISSING_PARTITION" ]; then
        error "Found container.item() calls missing partition key"
    else
        pass "All container.item() calls include partition key"
    fi
fi

# Check for type field in Cosmos writes
if grep -rn "container.items.create" api/ --include="*.js" 2>/dev/null | grep -v "node_modules" | head -1 | grep -q .; then
    pass "Cosmos DB writes found - verify 'type' field is included"
fi

# 7. Authentication & Security
section "7. Authentication & Security"

echo "Checking auth configuration..."

# Check for dev tokens in production code
if grep -rn "dev-token" src/ --include="*.{ts,tsx}" 2>/dev/null | grep -v "DevMode" | grep -v "// " | head -1 | grep -q .; then
    warning "Found dev-token references - ensure not used in production"
fi

# Check if GOOGLE_CLIENT_ID is configured
if grep -q "GOOGLE_CLIENT_ID" api/local.settings.json; then
    pass "GOOGLE_CLIENT_ID configured"
else
    error "GOOGLE_CLIENT_ID missing in api/local.settings.json"
fi

# Check for exposed secrets
if grep -rn "COSMOS_KEY.*=" .env* 2>/dev/null | grep -v ".example" | grep -v ".gitignore"; then
    error "Cosmos DB keys might be exposed in .env files"
fi

# 8. CRUD Endpoint Naming Consistency
section "8. Admin API Endpoint Naming"

echo "Checking endpoint naming patterns..."

# Check admin API function names
ADMIN_FUNCTIONS=$(grep -o "app.http('[^']*'" api/adminApi/index.js 2>/dev/null | cut -d"'" -f2 || true)
if [ -n "$ADMIN_FUNCTIONS" ]; then
    echo "Admin endpoints found:"
    echo "$ADMIN_FUNCTIONS" | head -10
    pass "Admin API endpoints defined"
else
    warning "Could not verify admin endpoints"
fi

# 9. Error Handling
section "9. Error Handling & Logging"

echo "Checking error handling..."

# Check for try-catch in API endpoints
ENDPOINTS_WITHOUT_TRY=$(grep -L "try {" api/*/index.js 2>/dev/null | grep -v node_modules || true)
if [ -n "$ENDPOINTS_WITHOUT_TRY" ]; then
    warning "Some endpoints missing try-catch blocks:"
    echo "$ENDPOINTS_WITHOUT_TRY" | head -5
else
    pass "API endpoints have error handling"
fi

# Check for proper error logging
if grep -rq "context.log" api/ --include="*.js" 2>/dev/null; then
    pass "Logging implemented in API"
else
    warning "Limited logging found in API"
fi

# 10. Build & Deployment
section "10. Build Configuration"

echo "Checking build setup..."

# Check if build scripts exist
if grep -q '"build"' package.json && grep -q '"build:app"' package.json; then
    pass "Build scripts configured"
else
    warning "Build scripts incomplete"
fi

# Check TypeScript config
if [ -f "tsconfig.json" ]; then
    pass "TypeScript configuration exists"
else
    error "tsconfig.json missing"
fi

# Check for workspace config
if [ -f "public/staticwebapp.config.json" ]; then
    pass "Azure Static Web App config exists"
else
    warning "staticwebapp.config.json missing"
fi

# 11. CORS Headers
section "11. CORS Configuration"

echo "Checking CORS headers..."

# Check if CORS is centralized
if [ -f "api/shared/cors.js" ]; then
    pass "Centralized CORS configuration found"
    
    # Check if all endpoints use it
    CORS_USAGE=$(grep -r "corsHeaders" api/ --include="*.js" 2>/dev/null | wc -l)
    if [ "$CORS_USAGE" -gt 5 ]; then
        pass "CORS headers used across endpoints ($CORS_USAGE usages)"
    else
        warning "Limited CORS header usage"
    fi
else
    error "Centralized CORS configuration missing"
fi

# Summary
echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                          Audit Summary                                ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ Passed:${NC}   $PASSED"
echo -e "${YELLOW}⚠ Warnings:${NC} $WARNINGS"
echo -e "${RED}✗ Errors:${NC}   $ERRORS"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Audit completed with errors. Please review and fix.${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Audit completed with warnings. Review recommended.${NC}"
    exit 0
else
    echo -e "${GREEN}All checks passed! ✨${NC}"
    exit 0
fi
