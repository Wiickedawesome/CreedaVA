#!/bin/bash

# CreedaVA Security Verification Script
# Run this to verify your security headers are properly configured

echo "🔒 CreedaVA Security Header Verification"
echo "=========================================="
echo ""

# Check if URL is provided
URL="${1:-https://creedava.com}"

echo "Testing URL: $URL"
echo ""

# Function to check header
check_header() {
    local header_name="$1"
    local expected_pattern="$2"
    
    echo -n "Checking $header_name... "
    
    response=$(curl -sI "$URL" 2>/dev/null | grep -i "^$header_name:" | cut -d' ' -f2-)
    
    if [ -z "$response" ]; then
        echo "❌ MISSING"
        return 1
    else
        if [[ -n "$expected_pattern" ]] && ! echo "$response" | grep -q "$expected_pattern"; then
            echo "⚠️  PRESENT but unexpected value"
            echo "   Got: $response"
            return 2
        else
            echo "✅ PRESENT"
            echo "   Value: $response"
            return 0
        fi
    fi
}

echo "📋 Critical Security Headers:"
echo "----------------------------"
check_header "Strict-Transport-Security" "max-age=31536000"
check_header "Content-Security-Policy" "default-src"
check_header "X-Content-Type-Options" "nosniff"
check_header "X-Frame-Options" "SAMEORIGIN"
check_header "Referrer-Policy" "strict-origin"
check_header "Permissions-Policy" ""
check_header "X-XSS-Protection" "1"

echo ""
echo "🌐 HTTPS Check:"
echo "---------------"

if [[ "$URL" == https://* ]]; then
    echo "✅ URL uses HTTPS"
    
    # Check if HTTP redirects to HTTPS
    http_url="${URL/https:/http:}"
    http_code=$(curl -sI -o /dev/null -w "%{http_code}" "$http_url" 2>/dev/null)
    
    if [ "$http_code" -eq 301 ] || [ "$http_code" -eq 302 ] || [ "$http_code" -eq 307 ] || [ "$http_code" -eq 308 ]; then
        echo "✅ HTTP redirects to HTTPS (code: $http_code)"
    else
        echo "⚠️  HTTP does not redirect (code: $http_code)"
    fi
else
    echo "❌ URL is not HTTPS!"
fi

echo ""
echo "🔍 Additional Checks:"
echo "--------------------"

# Check if API endpoint has CORS
api_url="${URL}/api/health"
echo -n "Testing CORS on API... "
cors_origin=$(curl -sI -H "Origin: https://example.com" "$api_url" 2>/dev/null | grep -i "Access-Control-Allow-Origin")
if [ -n "$cors_origin" ]; then
    echo "✅ CORS configured"
    echo "   $cors_origin"
else
    echo "⚠️  No CORS headers (may be expected for this endpoint)"
fi

echo ""
echo "📊 Summary:"
echo "----------"
echo "Run this command for detailed SSL analysis:"
echo "  curl https://www.ssllabs.com/ssltest/analyze.html?d=${URL#https://}"
echo ""
echo "Or use online tools:"
echo "  • SSL Labs: https://www.ssllabs.com/ssltest/"
echo "  • Security Headers: https://securityheaders.com/?q=${URL}"
echo "  • Mozilla Observatory: https://observatory.mozilla.org/analyze/${URL#https://}"
echo ""
echo "✅ Verification complete!"
