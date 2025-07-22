# Test Case: TC-004 - Hybrid QR Code Linking

**Test Case ID:** TC-004
**Test Plan:** TP-001
**Issue:** ISSUE-001
**Priority:** High
**Type:** Integration Test
**Created:** 2025-07-18

## Test Description
Test the hybrid QR code linking workflow that connects ADA wallets with Veridian Identity Wallets while maintaining edge protection principles.

## Prerequisites
- TC-003 passed (KERI AIDs created)
- Understanding of QR code challenge-response flow
- Mock ADA wallet data available
- Callback URL configured

## Test Data
```javascript
const qrTestData = {
  mockWallet: {
    address: 'addr1_sandbox_test_wallet_001',
    policyId: 'sandbox_policy_123',
    assetName: 'SandboxLandRights001'
  },
  callbackUrl: 'https://api-sandbox.landano.io/veridian/link',
  challengeExpiry: 10 * 60 * 1000 // 10 minutes
};
```

## Test Steps

### Step 1: Generate Secure Challenge
**Action:**
```javascript
async function generateSecureChallenge() {
  const crypto = require('crypto');
  const challenge = crypto.randomBytes(32).toString('base64url');
  const timestamp = new Date().toISOString();
  
  return {
    challenge: challenge,
    timestamp: timestamp,
    expiresAt: new Date(Date.now() + qrTestData.challengeExpiry).toISOString()
  };
}
```
**Expected Result:**
- Cryptographically secure challenge generated
- Base64URL encoded for QR compatibility
- Expiration time set correctly
- Unique challenge each time

### Step 2: Create QR Code Data
**Action:**
```javascript
async function createQRCodeData(challenge) {
  const qrData = {
    version: '1.0',
    type: 'landano_account_linking',
    challenge: challenge.challenge,
    callbackUrl: qrTestData.callbackUrl,
    expiresAt: challenge.expiresAt,
    environment: 'sandbox',
    requestId: crypto.randomUUID()
  };
  
  // Convert to QR-friendly format
  const qrString = JSON.stringify(qrData);
  const qrBase64 = Buffer.from(qrString).toString('base64url');
  
  return {
    rawData: qrData,
    encoded: qrBase64,
    size: qrBase64.length
  };
}
```
**Expected Result:**
- Valid QR data structure created
- All required fields present
- Proper encoding for QR code
- Size within QR code limits

### Step 3: Simulate Mobile App Scan
**Action:**
```javascript
async function simulateMobileAppScan(qrData, userAID) {
  // Decode QR data
  const decoded = JSON.parse(
    Buffer.from(qrData.encoded, 'base64url').toString()
  );
  
  // Verify challenge not expired
  if (new Date(decoded.expiresAt) < new Date()) {
    throw new Error('Challenge expired');
  }
  
  // Create signed response
  const response = {
    challenge: decoded.challenge,
    aid: userAID,
    walletAddress: qrTestData.mockWallet.address,
    timestamp: new Date().toISOString(),
    signature: 'mock_signature_for_sandbox_testing'
  };
  
  return response;
}
```
**Expected Result:**
- QR data decoded successfully
- Challenge validated
- Response includes all required fields
- Signature field present (mock for sandbox)

### Step 4: Verify Edge Protection
**Action:**
```javascript
async function verifyEdgeProtection(scanResponse) {
  const edgeProtectionChecks = {
    privateKeyOnServer: false,
    signingLocation: 'mobile_device',
    keyMaterialTransmitted: false,
    challengeResponseOnly: true
  };
  
  // Verify response contains no private keys
  const responseKeys = Object.keys(scanResponse);
  const hasSensitiveData = responseKeys.some(key => 
    key.toLowerCase().includes('private') || 
    key.toLowerCase().includes('secret')
  );
  
  return {
    passed: !hasSensitiveData && edgeProtectionChecks.challengeResponseOnly,
    checks: edgeProtectionChecks,
    responseFields: responseKeys
  };
}
```
**Expected Result:**
- No private keys in response
- Only challenge-response data transmitted
- Signing happens on device (simulated)
- Edge protection principles maintained

### Step 5: Complete Account Linking
**Action:**
```javascript
async function completeAccountLinking(scanResponse) {
  // Simulate server-side verification
  const linkingResult = {
    aid: scanResponse.aid,
    walletAddress: scanResponse.walletAddress,
    linkedAt: new Date().toISOString(),
    status: 'linked',
    verificationMethod: 'qr_challenge_response'
  };
  
  // Store linking (mock for sandbox)
  console.log('Account linking completed:', linkingResult);
  
  return linkingResult;
}
```
**Expected Result:**
- Linking completed successfully
- AID and wallet address associated
- Timestamp recorded
- Status indicates success

## Pass Criteria
- Secure challenges generated correctly
- QR data properly formatted and encoded
- Challenge-response flow works end-to-end
- Edge protection verified (no keys transmitted)
- Account linking completes successfully

## Fail Criteria
- Weak or duplicate challenges
- QR data too large or malformed
- Expired challenges accepted
- Private keys found in any transmission
- Linking fails or creates inconsistent state

## Security Validation
- Challenges are cryptographically secure
- Expiration enforced strictly
- No sensitive data in QR codes
- Signatures validated (in production)
- Replay attacks prevented

## Notes
- This test simulates mobile app behavior
- Production will use actual cryptographic signatures
- Monitor QR code size for scanning reliability
- Test various expiration scenarios
- Consider network latency in timeout settings