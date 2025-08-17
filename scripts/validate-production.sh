#!/bin/bash

# Production Deployment Validation Script
# This script validates that the production deployment is working correctly

set -e

echo "🔍 Starting production deployment validation..."

# Configuration
APP_URL=${1:-"https://your-domain.com"}
HEALTH_ENDPOINT="$APP_URL/api/webhooks/health"
TIMEOUT=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation functions
validate_url() {
    if [[ "$APP_URL" == "https://your-domain.com" ]]; then
        echo -e "${RED}❌ Please provide your production URL as the first argument${NC}"
        echo "Usage: $0 <production-url>"
        echo "Example: $0 https://myapp.example.com"
        exit 1
    fi
}

check_ssl_certificate() {
    echo -e "${BLUE}🔒 Checking SSL certificate...${NC}"
    
    if curl -s --connect-timeout $TIMEOUT "$APP_URL" > /dev/null; then
        echo -e "${GREEN}✅ SSL certificate is valid${NC}"
        
        # Get certificate details
        cert_info=$(echo | openssl s_client -servername $(echo $APP_URL | sed 's|https://||' | sed 's|/.*||') -connect $(echo $APP_URL | sed 's|https://||' | sed 's|/.*||'):443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [[ -n "$cert_info" ]]; then
            echo -e "${BLUE}📋 Certificate validity:${NC}"
            echo "$cert_info"
        fi
    else
        echo -e "${RED}❌ SSL certificate validation failed${NC}"
        return 1
    fi
}

check_health_endpoint() {
    echo -e "${BLUE}🏥 Checking health endpoint...${NC}"
    
    response=$(curl -s --connect-timeout $TIMEOUT "$HEALTH_ENDPOINT?type=system" || echo "ERROR")
    
    if [[ "$response" == "ERROR" ]]; then
        echo -e "${RED}❌ Health endpoint is not accessible${NC}"
        return 1
    fi
    
    # Parse JSON response
    status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
    
    if [[ "$status" == "healthy" ]]; then
        echo -e "${GREEN}✅ Health check passed${NC}"
        
        # Display health details
        echo -e "${BLUE}📊 Health check details:${NC}"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    else
        echo -e "${RED}❌ Health check failed - Status: $status${NC}"
        echo "$response"
        return 1
    fi
}

check_webhook_health() {
    echo -e "${BLUE}🔗 Checking webhook health...${NC}"
    
    response=$(curl -s --connect-timeout $TIMEOUT "$HEALTH_ENDPOINT" || echo "ERROR")
    
    if [[ "$response" == "ERROR" ]]; then
        echo -e "${RED}❌ Webhook health endpoint is not accessible${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Webhook health endpoint is accessible${NC}"
    echo -e "${BLUE}📊 Webhook health details:${NC}"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
}

check_api_endpoints() {
    echo -e "${BLUE}🔌 Checking API endpoints...${NC}"
    
    endpoints=(
        "/api/auth"
        "/api/orders"
        "/api/templates"
        "/api/settings"
    )
    
    for endpoint in "${endpoints[@]}"; do
        url="$APP_URL$endpoint"
        status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$url" || echo "000")
        
        if [[ "$status_code" =~ ^[23] ]]; then
            echo -e "${GREEN}✅ $endpoint - Status: $status_code${NC}"
        elif [[ "$status_code" == "401" || "$status_code" == "403" ]]; then
            echo -e "${YELLOW}⚠️  $endpoint - Status: $status_code (Authentication required - Expected)${NC}"
        else
            echo -e "${RED}❌ $endpoint - Status: $status_code${NC}"
        fi
    done
}

check_performance() {
    echo -e "${BLUE}⚡ Checking performance...${NC}"
    
    # Measure response time
    response_time=$(curl -s -o /dev/null -w "%{time_total}" --connect-timeout $TIMEOUT "$APP_URL" || echo "0")
    
    if (( $(echo "$response_time < 3.0" | bc -l) )); then
        echo -e "${GREEN}✅ Response time: ${response_time}s (Good)${NC}"
    elif (( $(echo "$response_time < 5.0" | bc -l) )); then
        echo -e "${YELLOW}⚠️  Response time: ${response_time}s (Acceptable)${NC}"
    else
        echo -e "${RED}❌ Response time: ${response_time}s (Too slow)${NC}"
    fi
    
    # Check if gzip compression is enabled
    compression=$(curl -s -H "Accept-Encoding: gzip" -I "$APP_URL" | grep -i "content-encoding: gzip" || echo "")
    
    if [[ -n "$compression" ]]; then
        echo -e "${GREEN}✅ Gzip compression is enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  Gzip compression is not detected${NC}"
    fi
}

check_security_headers() {
    echo -e "${BLUE}🛡️  Checking security headers...${NC}"
    
    headers=$(curl -s -I "$APP_URL")
    
    # Check for important security headers
    security_headers=(
        "Strict-Transport-Security"
        "X-Content-Type-Options"
        "X-XSS-Protection"
        "Referrer-Policy"
        "Content-Security-Policy"
    )
    
    for header in "${security_headers[@]}"; do
        if echo "$headers" | grep -qi "$header"; then
            echo -e "${GREEN}✅ $header header is present${NC}"
        else
            echo -e "${YELLOW}⚠️  $header header is missing${NC}"
        fi
    done
}

check_shopify_compatibility() {
    echo -e "${BLUE}🛍️  Checking Shopify compatibility...${NC}"
    
    # Check X-Frame-Options for embedded app
    frame_options=$(curl -s -I "$APP_URL" | grep -i "x-frame-options" || echo "")
    
    if echo "$frame_options" | grep -qi "allowall"; then
        echo -e "${GREEN}✅ X-Frame-Options configured for Shopify embedding${NC}"
    else
        echo -e "${RED}❌ X-Frame-Options not configured for Shopify embedding${NC}"
    fi
    
    # Check Content-Security-Policy for Shopify
    csp=$(curl -s -I "$APP_URL" | grep -i "content-security-policy" || echo "")
    
    if echo "$csp" | grep -qi "myshopify.com"; then
        echo -e "${GREEN}✅ Content-Security-Policy configured for Shopify${NC}"
    else
        echo -e "${YELLOW}⚠️  Content-Security-Policy may not be configured for Shopify${NC}"
    fi
}

check_database_connectivity() {
    echo -e "${BLUE}🗄️  Checking database connectivity...${NC}"
    
    # This checks if the health endpoint can connect to the database
    response=$(curl -s "$HEALTH_ENDPOINT?type=system" | grep -o '"database":[^,}]*' || echo "")
    
    if echo "$response" | grep -q "true"; then
        echo -e "${GREEN}✅ Database connectivity is healthy${NC}"
    else
        echo -e "${RED}❌ Database connectivity issues detected${NC}"
    fi
}

run_load_test() {
    echo -e "${BLUE}🔥 Running basic load test...${NC}"
    
    if command -v ab &> /dev/null; then
        echo "Running Apache Bench test (10 requests, concurrency 2)..."
        ab -n 10 -c 2 "$APP_URL/" > /tmp/load_test.txt 2>&1
        
        # Extract key metrics
        requests_per_second=$(grep "Requests per second" /tmp/load_test.txt | awk '{print $4}' || echo "N/A")
        time_per_request=$(grep "Time per request" /tmp/load_test.txt | head -1 | awk '{print $4}' || echo "N/A")
        
        echo -e "${GREEN}✅ Load test completed${NC}"
        echo "Requests per second: $requests_per_second"
        echo "Time per request: ${time_per_request}ms"
        
        rm -f /tmp/load_test.txt
    else
        echo -e "${YELLOW}⚠️  Apache Bench (ab) not installed, skipping load test${NC}"
    fi
}

generate_report() {
    echo ""
    echo -e "${BLUE}📋 Validation Summary${NC}"
    echo "=================================="
    echo "App URL: $APP_URL"
    echo "Validation Time: $(date)"
    echo ""
    
    if [[ $validation_errors -eq 0 ]]; then
        echo -e "${GREEN}🎉 All validations passed! Your app is ready for production.${NC}"
    else
        echo -e "${RED}❌ $validation_errors validation(s) failed. Please address the issues above.${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Address any failed validations"
    echo "2. Test app installation in a development store"
    echo "3. Submit for Shopify app review"
    echo "4. Monitor app performance and errors"
}

# Main validation process
main() {
    validation_errors=0
    
    validate_url
    
    echo "Validating production deployment at: $APP_URL"
    echo ""
    
    # Run all validation checks
    check_ssl_certificate || ((validation_errors++))
    echo ""
    
    check_health_endpoint || ((validation_errors++))
    echo ""
    
    check_webhook_health || ((validation_errors++))
    echo ""
    
    check_api_endpoints || ((validation_errors++))
    echo ""
    
    check_performance || ((validation_errors++))
    echo ""
    
    check_security_headers || ((validation_errors++))
    echo ""
    
    check_shopify_compatibility || ((validation_errors++))
    echo ""
    
    check_database_connectivity || ((validation_errors++))
    echo ""
    
    if command -v ab &> /dev/null; then
        run_load_test || ((validation_errors++))
        echo ""
    fi
    
    generate_report
    
    exit $validation_errors
}

# Check for required tools
check_dependencies() {
    missing_tools=()
    
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi
    
    if ! command -v openssl &> /dev/null; then
        missing_tools+=("openssl")
    fi
    
    if ! command -v python3 &> /dev/null; then
        missing_tools+=("python3")
    fi
    
    if ! command -v bc &> /dev/null; then
        missing_tools+=("bc")
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Missing required tools: ${missing_tools[*]}${NC}"
        echo "Please install the missing tools and try again."
        exit 1
    fi
}

# Run dependency check and main validation
check_dependencies
main "$@"