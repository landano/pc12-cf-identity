#!/bin/bash

# Sandbox Connectivity Test Script
# Test Case: TC-001
# Date: 2025-07-18

echo "======================================"
echo "Veridian Sandbox Connectivity Testing"
echo "======================================"
echo ""

# Test results file
RESULTS_FILE="../test-results/TC-001-connectivity-results.md"

# Initialize results file
cat > $RESULTS_FILE << EOL
# Test Results: TC-001 - Sandbox Connectivity Validation

**Test Date:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Test Case:** TC-001
**Tester:** Automated Test Script

## Test Execution Results

EOL

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local endpoint=$3
    
    echo "Testing $name..."
    echo "### $name" >> $RESULTS_FILE
    echo "" >> $RESULTS_FILE
    echo "**URL:** $url$endpoint" >> $RESULTS_FILE
    echo "" >> $RESULTS_FILE
    
    # Test with curl
    response=$(curl -s -o /dev/null -w "%{http_code}" -I "$url$endpoint" 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "✓ $name responded with HTTP status: $response"
        echo "**Status:** PASS" >> $RESULTS_FILE
        echo "**HTTP Code:** $response" >> $RESULTS_FILE
        
        # Get response headers
        echo "" >> $RESULTS_FILE
        echo "**Response Headers:**" >> $RESULTS_FILE
        echo '```' >> $RESULTS_FILE
        curl -s -I "$url$endpoint" | head -20 >> $RESULTS_FILE
        echo '```' >> $RESULTS_FILE
    else
        echo "✗ $name failed to respond"
        echo "**Status:** FAIL" >> $RESULTS_FILE
        echo "**Error:** Connection failed" >> $RESULTS_FILE
    fi
    
    echo "" >> $RESULTS_FILE
    echo "---" >> $RESULTS_FILE
    echo "" >> $RESULTS_FILE
}

# Test Boot URL
test_endpoint "Boot URL" "https://keria-boot.demo.idw-sandboxes.cf-deployments.org" "/health"

# Test KERIA URL
test_endpoint "KERIA URL" "https://keria.demo.idw-sandboxes.cf-deployments.org" "/health"

# Test Credential UI
test_endpoint "Credential UI" "https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org" "/"

# Test TLS Configuration
echo ""
echo "Testing TLS Configuration..."
echo "### TLS Configuration Test" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo "Testing KERIA TLS 1.3 support..."
tls_test=$(echo | openssl s_client -connect keria.demo.idw-sandboxes.cf-deployments.org:443 -tls1_3 2>&1 | grep "Protocol" | head -1)

if [[ $tls_test == *"TLSv1.3"* ]]; then
    echo "✓ TLS 1.3 supported"
    echo "**TLS 1.3 Support:** PASS" >> $RESULTS_FILE
else
    echo "✗ TLS 1.3 not detected"
    echo "**TLS 1.3 Support:** FAIL" >> $RESULTS_FILE
fi

echo "" >> $RESULTS_FILE
echo "---" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Summary
echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"

echo "## Summary" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE
echo "**Test Completion Time:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Check if all tests passed
if grep -q "FAIL" $RESULTS_FILE; then
    echo "Some tests failed. Check $RESULTS_FILE for details."
    echo "**Overall Result:** FAILED - Some endpoints or checks failed" >> $RESULTS_FILE
else
    echo "All tests passed successfully!"
    echo "**Overall Result:** PASSED - All endpoints accessible and TLS 1.3 supported" >> $RESULTS_FILE
fi

echo ""
echo "Detailed results saved to: $RESULTS_FILE"