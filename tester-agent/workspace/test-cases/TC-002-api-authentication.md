# Test Case: TC-002 - API Authentication Testing

**Test Case ID:** TC-002
**Test Plan:** TP-001
**Issue:** ISSUE-001
**Priority:** High
**Type:** Security Test
**Created:** 2025-07-18

## Test Description
Verify API authentication mechanisms work correctly in the sandbox environment, including token generation, validation, and error handling.

## Prerequisites
- TC-001 passed (endpoints accessible)
- Node.js environment set up
- Signify client library available
- Test credentials prepared

## Test Data
```javascript
const testConfig = {
  bootUrl: 'https://keria-boot.demo.idw-sandboxes.cf-deployments.org',
  keriaUrl: 'https://keria.demo.idw-sandboxes.cf-deployments.org',
  passcode: 'sandbox-test-passcode-001',
  tier: 'low'
};
```

## Test Steps

### Step 1: Initialize Signify Client
**Action:**
```javascript
import { SignifyClient, Tier, ready } from 'signify-ts';

async function initClient() {
  await ready();
  const client = new SignifyClient(
    testConfig.keriaUrl,
    testConfig.passcode,
    Tier.low,
    testConfig.bootUrl
  );
  return client;
}
```
**Expected Result:**
- Client initializes without errors
- Connection established to sandbox
- No authentication errors

### Step 2: Test Valid Authentication
**Action:**
```javascript
async function testValidAuth() {
  const client = await initClient();
  const connected = await client.connect();
  return connected;
}
```
**Expected Result:**
- Authentication successful
- Valid session token received
- Client state indicates connected

### Step 3: Test Invalid Credentials
**Action:**
```javascript
async function testInvalidAuth() {
  await ready();
  try {
    const client = new SignifyClient(
      testConfig.keriaUrl,
      'invalid-passcode',
      Tier.low,
      testConfig.bootUrl
    );
    await client.connect();
    return 'unexpected-success';
  } catch (error) {
    return error;
  }
}
```
**Expected Result:**
- Authentication fails appropriately
- Clear error message returned
- No session token issued

### Step 4: Test Token Expiration
**Action:**
```javascript
async function testTokenExpiration() {
  const client = await initClient();
  await client.connect();
  
  // Simulate token expiration by waiting
  await new Promise(resolve => setTimeout(resolve, 3600000)); // 1 hour
  
  try {
    await client.identifiers().list();
    return 'token-still-valid';
  } catch (error) {
    return error;
  }
}
```
**Expected Result:**
- Token expiration detected
- Appropriate error returned
- Re-authentication required

### Step 5: Test Authorization Headers
**Action:**
```bash
# Direct API call with authorization
curl -X GET https://keria.demo.idw-sandboxes.cf-deployments.org/identifiers \
  -H "Authorization: Bearer ${TEST_TOKEN}" \
  -H "Content-Type: application/json"
```
**Expected Result:**
- Valid response with authorization
- 401 without valid token
- Proper error format

## Pass Criteria
- Valid credentials authenticate successfully
- Invalid credentials rejected appropriately
- Token management works correctly
- Authorization headers validated
- Error messages are clear and actionable

## Fail Criteria
- Authentication with valid credentials fails
- Invalid credentials accepted
- Token validation bypassed
- Unclear or missing error messages
- Security headers missing

## Security Considerations
- Never log actual credentials
- Use test-specific passcodes only
- Verify HTTPS for all requests
- Check for credential leakage in logs
- Validate token storage security

## Notes
- Document authentication flow details
- Note any rate limiting encountered
- Capture token format and expiration
- Test both success and failure paths
- Consider edge cases like network interruptions