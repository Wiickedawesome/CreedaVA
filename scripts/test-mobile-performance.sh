#!/bin/bash
# Performance Testing Script for CreedaVA Mobile Optimization
# Usage: bash scripts/test-mobile-performance.sh

set -e

echo "🚀 CreedaVA Mobile Performance Testing"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if preview server is running
check_preview_server() {
    if ! curl -s http://localhost:4173 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Preview server not running${NC}"
        echo "Starting preview server..."
        npm run preview > /tmp/preview-server.log 2>&1 &
        PREVIEW_PID=$!
        echo "Waiting for server to start..."
        sleep 5
        return 1
    fi
    return 0
}

# Cleanup function
cleanup() {
    if [ ! -z "$PREVIEW_PID" ]; then
        echo -e "\n${YELLOW}Stopping preview server...${NC}"
        kill $PREVIEW_PID 2>/dev/null || true
    fi
}

trap cleanup EXIT

echo "Step 1: Building production bundle..."
echo "--------------------------------------"
npm run build:production

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}\n"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo "Step 2: Analyzing bundle size..."
echo "--------------------------------"

# Get dist folder size
DIST_SIZE=$(du -sh dist | cut -f1)
echo "Total dist size: $DIST_SIZE"

# Find largest chunks
echo -e "\nTop 5 largest JavaScript chunks:"
find dist/assets/js -name "*.js" -exec ls -lh {} \; | sort -k5 -hr | head -5 | awk '{print "  - " $9 " (" $5 ")"}'

# Find images
echo -e "\nImages in bundle:"
if [ -d "dist/assets/images" ]; then
    find dist/assets/images -type f | wc -l | xargs echo "  Total images:"
    find dist/assets/images -type f -exec ls -lh {} \; | awk '{sum+=$5} END {print "  Total size: ~" sum/1024/1024 " MB"}'
else
    echo "  No images found"
fi

echo ""

echo "Step 3: Starting preview server..."
echo "-----------------------------------"
SERVER_ALREADY_RUNNING=0
check_preview_server
SERVER_ALREADY_RUNNING=$?

if [ $SERVER_ALREADY_RUNNING -eq 0 ]; then
    echo -e "${GREEN}✓ Preview server already running${NC}\n"
else
    echo -e "${GREEN}✓ Preview server started${NC}\n"
fi

echo "Step 4: Performance Checks..."
echo "-----------------------------"

# Check if critical files exist
echo "Checking critical optimizations:"

if grep -q "preconnect" index.html; then
    echo -e "  ${GREEN}✓${NC} Resource hints (preconnect) present"
else
    echo -e "  ${RED}✗${NC} Resource hints missing"
fi

if [ -f "src/utils/lazyImage.tsx" ]; then
    echo -e "  ${GREEN}✓${NC} Lazy loading component exists"
else
    echo -e "  ${RED}✗${NC} Lazy loading component missing"
fi

if [ -f "src/hooks/useOptimizedMotion.ts" ]; then
    echo -e "  ${GREEN}✓${NC} Optimized motion hooks exist"
else
    echo -e "  ${RED}✗${NC} Optimized motion hooks missing"
fi

if [ -f "src/styles/mobile-performance.css" ]; then
    echo -e "  ${GREEN}✓${NC} Mobile performance CSS exists"
else
    echo -e "  ${RED}✗${NC} Mobile performance CSS missing"
fi

if grep -q "CACHE_VERSION = 'v5'" public/sw.js; then
    echo -e "  ${GREEN}✓${NC} Service worker v5 active"
else
    echo -e "  ${YELLOW}⚠${NC}  Service worker version mismatch"
fi

echo ""

# Check bundle sizes
echo "Checking bundle size budget:"

# Main entry bundle
MAIN_BUNDLE_SIZE=$(find dist/assets/js -name "index-*.js" -exec stat -f%z {} \; 2>/dev/null || find dist/assets/js -name "index-*.js" -exec stat -c%s {} \; 2>/dev/null)
if [ ! -z "$MAIN_BUNDLE_SIZE" ]; then
    MAIN_KB=$((MAIN_BUNDLE_SIZE / 1024))
    if [ $MAIN_KB -lt 120 ]; then
        echo -e "  ${GREEN}✓${NC} Main bundle: ${MAIN_KB}KB (budget: 120KB)"
    else
        echo -e "  ${RED}✗${NC} Main bundle: ${MAIN_KB}KB (exceeds 120KB budget)"
    fi
fi

# CSS bundle
CSS_SIZE=$(find dist/assets/css -name "*.css" -exec stat -f%z {} \; 2>/dev/null || find dist/assets/css -name "*.css" -exec stat -c%s {} \; 2>/dev/null | awk '{s+=$1} END {print s}')
if [ ! -z "$CSS_SIZE" ]; then
    CSS_KB=$((CSS_SIZE / 1024))
    if [ $CSS_KB -lt 25 ]; then
        echo -e "  ${GREEN}✓${NC} CSS bundle: ${CSS_KB}KB (budget: 25KB)"
    else
        echo -e "  ${YELLOW}⚠${NC}  CSS bundle: ${CSS_KB}KB (budget: 25KB)"
    fi
fi

echo ""
echo "Step 5: Manual Testing Instructions"
echo "-----------------------------------"
echo "Preview server is running at: http://localhost:4173"
echo ""
echo "To test mobile performance:"
echo "1. Open Chrome DevTools (F12)"
echo "2. Go to Lighthouse tab"
echo "3. Select these options:"
echo "   - Device: Mobile"
echo "   - Categories: Performance, Accessibility"
echo "   - Throttling: Simulated throttling (4G)"
echo "4. Click 'Analyze page load'"
echo ""
echo "Target scores:"
echo "  - Performance: > 90"
echo "  - FCP: < 1.8s"
echo "  - LCP: < 2.5s"
echo "  - TBT: < 300ms"
echo "  - CLS: < 0.1"
echo ""
echo -e "${GREEN}Performance testing setup complete!${NC}"
echo ""

if [ $SERVER_ALREADY_RUNNING -eq 1 ]; then
    echo "Press Ctrl+C to stop the preview server and exit."
    wait $PREVIEW_PID
fi
