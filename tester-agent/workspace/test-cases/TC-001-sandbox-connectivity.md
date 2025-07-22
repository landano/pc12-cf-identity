# Test Case: TC-001 - Sandbox Connectivity Validation

**Test Case ID:** TC-001
**Test Plan:** TP-001
**Issue:** ISSUE-001
**Priority:** Critical
**Type:** Integration Test
**Created:** 2025-07-18

## Test Description
Validate connectivity to all Veridian sandbox endpoints and verify basic HTTP/HTTPS functionality.

## Prerequisites
- Internet connectivity available
- curl or similar HTTP client installed
- No firewall blocking *.cf-deployments.org domains

## Test Data
- Boot URL: https://keria-boot.demo.idw-sandboxes.cf-deployments.org
- KERIA URL: https://keria.demo.idw-sandboxes.cf-deployments.org
- Credential UI URL: https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org

## Test Steps

### Step 1: Test Boot URL Connectivity
**Action:**
```bash
curl -I -X GET https://keria-boot.demo.idw-sandboxes.cf-deployments.org/health
```
**Expected Result:**
- HTTP status code 200 or 204
- Valid HTTPS certificate
- Response headers include proper CORS settings

### Step 2: Test KERIA URL Connectivity
**Action:**
```bash
curl -I -X GET https://keria.demo.idw-sandboxes.cf-deployments.org/health
```
**Expected Result:**
- HTTP status code 200 or 204
- Valid HTTPS certificate
- Response headers indicate API availability

### Step 3: Test Credential UI Connectivity
**Action:**
```bash
curl -I -X GET https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org/
```
**Expected Result:**
- HTTP status code 200
- Content-Type indicates HTML response
- Valid HTTPS certificate

### Step 4: Verify TLS Configuration
**Action:**
```bash
openssl s_client -connect keria.demo.idw-sandboxes.cf-deployments.org:443 -tls1_3
```
**Expected Result:**
- TLS 1.3 connection established
- Valid certificate chain
- No security warnings

### Step 5: Test API Response Format
**Action:**
```bash
curl -X GET https://keria.demo.idw-sandboxes.cf-deployments.org/v1/spec.yaml
```
**Expected Result:**
- Valid OpenAPI specification returned
- YAML or JSON format
- Contains endpoint definitions

## Pass Criteria
- All endpoints respond with expected status codes
- HTTPS certificates are valid and not expired
- TLS 1.3 is supported
- No connectivity errors or timeouts
- API specification is accessible

## Fail Criteria
- Any endpoint unreachable
- Certificate validation failures
- TLS version below 1.3
- Timeout errors (>30 seconds)
- HTTP status codes indicating server errors (5xx)

## Notes
- Document any intermittent connectivity issues
- Capture full error messages if failures occur
- Note response times for each endpoint
- Check for any rate limiting indicators