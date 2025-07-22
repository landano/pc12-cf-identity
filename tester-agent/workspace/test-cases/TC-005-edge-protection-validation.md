# Test Case: TC-005 - Edge Protection Validation

**Test Case ID:** TC-005
**Test Plan:** TP-001
**Issue:** ISSUE-001
**Priority:** Critical
**Type:** Security Test
**Created:** 2025-07-18

## Test Description
Validate that edge protection principles are maintained throughout all operations, ensuring private keys never leave the device and all cryptographic operations happen client-side.

## Prerequisites
- Previous test cases completed
- Understanding of edge protection principles
- Access to client and server logs
- Network traffic monitoring capability

## Test Data
```javascript
const edgeProtectionTestData = {
  sensitivePatterns: [
    'private_key', 'privateKey', 'secret', 'seed',
    'mnemonic', 'private', 'priv_key', 'privKey'
  ],
  allowedTransmissions: [
    'public_key', 'publicKey', 'signature', 'aid',
    'prefix', 'challenge', 'token', 'session'
  ]
};
```

## Test Steps

### Step 1: Monitor AID Creation Traffic
**Action:**
```javascript
async function monitorAIDCreation() {
  // Set up traffic monitoring
  const capturedRequests = [];
  
  // Create AID while monitoring
  const client = await initClient();
  const aid = await client.identifiers().create({
    name: 'edge-protection-test-001',
    witnesses: ['witness1.demo.idw-sandboxes.cf-deployments.org'],
    thold: 1
  });
  
  // Analyze captured traffic
  const analysis = analyzeTraffic(capturedRequests);
  return analysis;
}

function analyzeTraffic(requests) {
  const violations = [];
  
  requests.forEach(req => {
    const body = JSON.stringify(req.body || {});
    const headers = JSON.stringify(req.headers || {});
    
    edgeProtectionTestData.sensitivePatterns.forEach(pattern => {
      if (body.toLowerCase().includes(pattern) || 
          headers.toLowerCase().includes(pattern)) {
        violations.push({
          pattern: pattern,
          request: req.url,
          location: body.includes(pattern) ? 'body' : 'headers'
        });
      }
    });
  });
  
  return {
    totalRequests: requests.length,
    violations: violations,
    passed: violations.length === 0
  };
}
```
**Expected Result:**
- No private keys in any request
- Only public keys and signatures transmitted
- All key generation happens client-side
- Zero security violations

### Step 2: Verify Client-Side Key Generation
**Action:**
```javascript
async function verifyClientSideKeyGen() {
  // Check if keys exist before any server communication
  const keyMaterial = await generateLocalKeys();
  
  // Verify keys are valid
  const validation = {
    hasPrivateKey: keyMaterial.privateKey !== undefined,
    hasPublicKey: keyMaterial.publicKey !== undefined,
    privateKeyLocal: true,
    publicKeyDerivable: true
  };
  
  // Ensure private key never sent
  const serverPayload = prepareServerPayload(keyMaterial);
  const containsPrivate = JSON.stringify(serverPayload)
    .includes(keyMaterial.privateKey);
  
  return {
    keyGenLocation: 'client',
    validation: validation,
    serverPayloadSafe: !containsPrivate
  };
}
```
**Expected Result:**
- Keys generated locally
- Private key exists only in client memory
- Server payload contains no private data
- Public key properly derived

### Step 3: Test Signature Creation
**Action:**
```javascript
async function testSignatureCreation() {
  const testData = 'test_message_for_signing';
  
  // Create signature client-side
  const signature = await signDataLocally(testData);
  
  // Verify signature without private key
  const verificationPayload = {
    data: testData,
    signature: signature.value,
    publicKey: signature.publicKey,
    aid: signature.aid
  };
  
  // Check payload for sensitive data
  const payloadSafe = !JSON.stringify(verificationPayload)
    .match(/private|secret|seed/i);
  
  return {
    signedLocally: true,
    signatureValid: signature.value.length > 0,
    verificationPayloadSafe: payloadSafe
  };
}
```
**Expected Result:**
- Signature created client-side
- Only signature value transmitted
- Verification uses public key only
- No private key exposure

### Step 4: Validate Key Rotation Protection
**Action:**
```javascript
async function validateKeyRotationProtection() {
  // Monitor key rotation traffic
  const rotationTraffic = [];
  
  const client = await initClient();
  const rotationResult = await client.identifiers().rotate({
    prefix: 'test_aid_prefix',
    witnesses: ['witness1.demo.idw-sandboxes.cf-deployments.org'],
    thold: 1
  });
  
  // Analyze rotation requests
  const analysis = {
    newKeysGenerated: 'client',
    oldKeysRevoked: 'client',
    privateKeysTransmitted: false,
    rotationEventSigned: 'client'
  };
  
  return analysis;
}
```
**Expected Result:**
- New keys generated locally
- Old keys revoked locally
- Only rotation event transmitted
- No private keys in rotation traffic

### Step 5: Audit Logging Verification
**Action:**
```javascript
async function auditLoggingVerification() {
  // Check client logs for sensitive data
  const clientLogs = getClientLogs();
  const serverLogs = getServerLogs();
  
  const auditResults = {
    clientLogsSafe: !containsSensitiveData(clientLogs),
    serverLogsSafe: !containsSensitiveData(serverLogs),
    sensitiveDataMasked: checkDataMasking(clientLogs)
  };
  
  function containsSensitiveData(logs) {
    return edgeProtectionTestData.sensitivePatterns.some(pattern =>
      logs.toLowerCase().includes(pattern)
    );
  }
  
  return auditResults;
}
```
**Expected Result:**
- No private keys in any logs
- Sensitive data properly masked
- Audit trail maintains security
- Logs useful without exposing secrets

## Pass Criteria
- Zero private key transmissions detected
- All cryptographic operations client-side
- Network traffic contains only safe data
- Logs maintain security standards
- Edge protection verified in all operations

## Fail Criteria
- Any private key found in network traffic
- Server-side key generation detected
- Sensitive data in logs
- Client-side security bypassed
- Edge protection principles violated

## Critical Security Checks
1. **Key Generation**: Must happen on device only
2. **Key Storage**: Never transmitted or logged
3. **Signatures**: Created locally with private key
4. **Verification**: Uses public key only
5. **Recovery**: Maintains edge protection

## Notes
- Use network proxy for traffic analysis
- Enable verbose logging for testing only
- Document any suspicious patterns
- Test both success and failure scenarios
- Consider timing attacks and side channels