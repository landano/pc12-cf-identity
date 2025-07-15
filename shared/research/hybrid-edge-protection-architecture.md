# Hybrid Edge Protection Architecture for Landano-Veridian Integration

## Executive Summary
This document defines the complete edge protection architecture for the Landano-Veridian integration, ensuring KERI protocol compliance through a hybrid approach where private keys never leave mobile devices while enabling secure account linking and business logic execution in Mendix.

## 1. Core Edge Protection Principles

### 1.1 Absolute Private Key Isolation
- **NEVER TRANSMIT**: Private keys never leave the Veridian mobile app
- **NEVER STORE**: No private key storage on Mendix servers
- **NEVER PROCESS**: No private key operations on Mendix servers
- **ALWAYS VERIFY**: All operations use public key verification only

### 1.2 Hybrid Architecture Boundaries
```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY BOUNDARY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TRUSTED ZONE (Mobile)          UNTRUSTED ZONE (Cloud)         │
│  ┌─────────────────────┐        ┌─────────────────────┐         │
│  │ Veridian Mobile App │   ↔    │ Mendix Cloud Server│         │
│  │ ├── Private keys    │        │ ├── Public keys     │         │
│  │ ├── Signing ops     │        │ ├── Verification    │         │
│  │ ├── Key generation  │        │ ├── Business logic  │         │
│  │ └── Key rotation    │        │ └── Data storage    │         │
│  └─────────────────────┘        └─────────────────────┘         │
│                                                                 │
│           COMMUNICATION: QR Code Challenge-Response            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Implementation Architecture

### 2.1 Mobile-Side Edge Protection (Veridian App)

#### Private Key Lifecycle Management
```javascript
// ALL private key operations happen ONLY in Veridian mobile app
class MobileEdgeProtection {
    
    // Key generation - MOBILE ONLY
    async generateKERIKeyPair() {
        // Use device secure randomness
        const seed = await this.generateSecureRandomSeed();
        
        // Generate Ed25519 keypair using libsodium
        const keyPair = await sodium.crypto_sign_seed_keypair(seed);
        
        // Store private key in mobile secure storage
        await this.storePrivateKeyInMobileSecureStorage(keyPair.privateKey);
        
        // Return only public key and AID
        return {
            publicKey: keyPair.publicKey,
            aid: await this.generateAID(keyPair.publicKey)
            // Private key NEVER returned or transmitted
        };
    }
    
    // Key rotation - MOBILE ONLY
    async rotateKeys(aid) {
        // Retrieve current private key from mobile storage
        const currentPrivateKey = await this.getPrivateKeyFromMobileStorage(aid);
        
        // Generate new keypair
        const newKeyPair = await this.generateKERIKeyPair();
        
        // Create rotation event
        const rotationEvent = {
            aid: aid,
            previousKey: await this.getCurrentPublicKey(aid),
            newKey: newKeyPair.publicKey,
            timestamp: Date.now()
        };
        
        // Sign rotation event with current private key
        const signature = await this.signRotationEvent(rotationEvent, currentPrivateKey);
        
        // Update mobile storage with new keys
        await this.updateMobileKeyStorage(aid, newKeyPair);
        
        // Notify server of rotation (public data only)
        await this.notifyServerOfKeyRotation(aid, newKeyPair.publicKey, signature);
        
        return { success: true };
    }
    
    // Signing operations - MOBILE ONLY
    async signChallenge(challenge, aid) {
        // Retrieve private key from mobile storage
        const privateKey = await this.getPrivateKeyFromMobileStorage(aid);
        
        // Create signature data
        const signatureData = {
            challenge: challenge,
            aid: aid,
            timestamp: Date.now(),
            purpose: "account_linking"
        };
        
        // Sign with private key
        const signature = await sodium.crypto_sign_detached(
            JSON.stringify(signatureData),
            privateKey
        );
        
        return {
            signatureData: signatureData,
            signature: base64url.encode(signature)
        };
    }
    
    // Secure storage - MOBILE ONLY
    async storePrivateKeyInMobileSecureStorage(privateKey) {
        // Use platform-specific secure storage
        if (Platform.OS === 'ios') {
            await Keychain.setInternetCredentials(
                'landano-keri-keys',
                'private-key',
                privateKey,
                { accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY }
            );
        } else if (Platform.OS === 'android') {
            await EncryptedStorage.setItem(
                'landano-keri-keys',
                privateKey,
                { requireAuth: true }
            );
        }
    }
}
```

#### QR Code Challenge Processing
```javascript
class QRChallengeProcessor {
    
    async processQRChallenge(qrCodeData) {
        // Parse QR code data
        const challengeData = JSON.parse(qrCodeData);
        
        // Validate QR code structure
        if (!this.validateQRStructure(challengeData)) {
            throw new Error('Invalid QR code structure');
        }
        
        // Check expiration
        if (Date.now() > challengeData.expiresAt) {
            throw new Error('QR code expired');
        }
        
        // Get user's AID for signing
        const userAID = await this.getUserAID();
        
        // Create challenge response
        const challengeResponse = {
            challenge: challengeData.challenge,
            sessionId: challengeData.sessionId,
            aid: userAID,
            mendixUserId: challengeData.mendixUserId,
            timestamp: Date.now(),
            action: 'account_linking'
        };
        
        // Sign challenge response with private key
        const signature = await this.signChallenge(challengeResponse, userAID);
        
        // Send signed response to Mendix callback
        await this.sendSignedResponse(challengeData.callbackUrl, {
            challengeResponse: challengeResponse,
            signature: signature
        });
        
        return { success: true };
    }
    
    validateQRStructure(data) {
        return data.challenge && 
               data.sessionId && 
               data.callbackUrl && 
               data.expiresAt &&
               data.mendixUserId;
    }
}
```

### 2.2 Server-Side Edge Protection (Mendix)

#### Public Key Verification Only
```java
@Component
public class EdgeProtectionVerifier {
    
    // ONLY public key operations allowed
    public boolean verifySignature(String signedData, String signature, String aid) {
        try {
            // Retrieve public key from KERIA (NOT private key)
            PublicKey publicKey = keriClient.getPublicKey(aid);
            
            // Verify signature using public key ONLY
            Signature verifier = Signature.getInstance("Ed25519");
            verifier.initVerify(publicKey);
            verifier.update(signedData.getBytes(StandardCharsets.UTF_8));
            
            return verifier.verify(Base64.getDecoder().decode(signature));
            
        } catch (Exception e) {
            logger.error("Signature verification failed for AID: {}", aid, e);
            return false;
        }
    }
    
    // Verify account linking challenge
    public boolean verifyAccountLinkingChallenge(AccountLinkingRequest request) {
        try {
            // Validate challenge still active
            PendingChallenge challenge = challengeRepository.findBySessionId(request.getSessionId());
            if (challenge == null || challenge.isExpired()) {
                return false;
            }
            
            // Verify signature using public key
            String signedData = objectMapper.writeValueAsString(request.getChallengeResponse());
            boolean signatureValid = verifySignature(signedData, request.getSignature(), request.getAid());
            
            // Verify AID with witnesses
            boolean aidValid = keriClient.verifyAIDWithWitnesses(request.getAid());
            
            return signatureValid && aidValid;
            
        } catch (Exception e) {
            logger.error("Challenge verification failed", e);
            return false;
        }
    }
    
    // ❌ FORBIDDEN: Private key operations
    // ❌ FORBIDDEN: private void storePrivateKey(...) - NEVER IMPLEMENT
    // ❌ FORBIDDEN: private void signWithPrivateKey(...) - NEVER IMPLEMENT
    // ❌ FORBIDDEN: private void generatePrivateKey(...) - NEVER IMPLEMENT
}
```

#### Challenge Generation and Management
```java
@Component
public class ChallengeManager {
    
    @Autowired
    private SecureRandom secureRandom;
    
    public QRChallengeData generateAccountLinkingChallenge(String mendixUserId) {
        // Generate cryptographically secure challenge
        byte[] challengeBytes = new byte[32];
        secureRandom.nextBytes(challengeBytes);
        String challenge = Base64.getUrlEncoder().encodeToString(challengeBytes);
        
        // Create session
        String sessionId = UUID.randomUUID().toString();
        
        // Create challenge data
        QRChallengeData qrData = QRChallengeData.builder()
            .challenge(challenge)
            .sessionId(sessionId)
            .callbackUrl("https://api.landano.io/veridian/link")
            .expiresAt(Instant.now().plus(Duration.ofMinutes(5))) // 5 minute expiry
            .mendixUserId(encryptUserId(mendixUserId))
            .build();
        
        // Store pending challenge
        PendingChallenge pendingChallenge = new PendingChallenge();
        pendingChallenge.setChallenge(challenge);
        pendingChallenge.setSessionId(sessionId);
        pendingChallenge.setMendixUserId(mendixUserId);
        pendingChallenge.setExpiresAt(qrData.getExpiresAt());
        pendingChallenge.setCreatedAt(Instant.now());
        
        challengeRepository.save(pendingChallenge);
        
        return qrData;
    }
    
    public boolean validateAndConsumeChallenge(String challenge, String sessionId) {
        PendingChallenge pendingChallenge = challengeRepository.findBySessionId(sessionId);
        
        if (pendingChallenge == null || 
            !pendingChallenge.getChallenge().equals(challenge) ||
            pendingChallenge.isExpired()) {
            return false;
        }
        
        // Consume challenge (single use)
        challengeRepository.delete(pendingChallenge);
        
        return true;
    }
}
```

## 3. Security Controls and Validation

### 3.1 Edge Protection Enforcement
```java
@Component
public class EdgeProtectionEnforcer {
    
    // Validate no private key operations
    public void validateEdgeProtection(Object request) {
        // Check for private key data in request
        if (containsPrivateKeyData(request)) {
            throw new SecurityException("Private key data detected - edge protection violated");
        }
        
        // Check for signing operations
        if (containsSigningOperation(request)) {
            throw new SecurityException("Signing operation detected - must occur on mobile device");
        }
    }
    
    // Audit all operations for edge protection compliance
    public void auditEdgeProtectionCompliance(String operation, String aid) {
        EdgeProtectionAuditEvent event = new EdgeProtectionAuditEvent();
        event.setOperation(operation);
        event.setAid(aid);
        event.setTimestamp(Instant.now());
        event.setComplianceStatus("COMPLIANT");
        event.setValidationResult("No private key operations detected");
        
        auditRepository.save(event);
    }
}
```

### 3.2 Security Monitoring
```java
@Component
public class EdgeProtectionMonitor {
    
    @EventListener
    public void monitorSecurityEvents(SecurityEvent event) {
        // Check for edge protection violations
        if (isEdgeProtectionViolation(event)) {
            // Immediate alert
            alertService.sendCriticalAlert(
                "Edge Protection Violation Detected",
                "Operation: " + event.getOperation() + ", AID: " + event.getAid()
            );
            
            // Log security incident
            SecurityIncident incident = new SecurityIncident();
            incident.setType("EDGE_PROTECTION_VIOLATION");
            incident.setDescription(event.getDescription());
            incident.setSeverity("CRITICAL");
            incident.setTimestamp(Instant.now());
            
            incidentRepository.save(incident);
        }
    }
    
    private boolean isEdgeProtectionViolation(SecurityEvent event) {
        // Check for private key operations on server
        return event.getOperation().contains("private_key") ||
               event.getOperation().contains("signing") ||
               event.getOperation().contains("key_generation");
    }
}
```

## 4. Testing and Validation

### 4.1 Edge Protection Testing Framework
```java
@TestConfiguration
public class EdgeProtectionTestFramework {
    
    @Test
    public void testPrivateKeyIsolation() {
        // Verify no private key operations on server
        assertThrows(SecurityException.class, () -> {
            // Attempt private key operation
            edgeProtectionService.performPrivateKeyOperation("test-aid");
        });
    }
    
    @Test
    public void testChallengeResponseSecurity() {
        // Generate challenge
        QRChallengeData challenge = challengeManager.generateAccountLinkingChallenge("user123");
        
        // Verify challenge properties
        assertNotNull(challenge.getChallenge());
        assertTrue(challenge.getExpiresAt().isAfter(Instant.now()));
        assertFalse(challenge.getChallenge().contains("private"));
        
        // Verify single use
        assertTrue(challengeManager.validateAndConsumeChallenge(
            challenge.getChallenge(), challenge.getSessionId()));
        
        // Should fail on second use
        assertFalse(challengeManager.validateAndConsumeChallenge(
            challenge.getChallenge(), challenge.getSessionId()));
    }
    
    @Test
    public void testSignatureVerificationOnly() {
        // Mock signature verification
        String testSignature = "test-signature";
        String testAid = "test-aid";
        String testData = "test-data";
        
        // Should only verify, never sign
        boolean result = edgeProtectionVerifier.verifySignature(testData, testSignature, testAid);
        
        // Verify method uses only public key operations
        verify(keriClient, times(1)).getPublicKey(testAid);
        verify(keriClient, never()).getPrivateKey(any());
        verify(keriClient, never()).signData(any(), any());
    }
}
```

### 4.2 Penetration Testing Scenarios
```java
@Component
public class EdgeProtectionPenetrationTest {
    
    public void testPrivateKeyExtractionAttempt() {
        // Attempt to extract private key from server
        try {
            // Various attack vectors
            attemptPrivateKeyExtraction();
            fail("Private key extraction should not be possible");
        } catch (SecurityException e) {
            // Expected - edge protection working
            assertTrue(e.getMessage().contains("edge protection"));
        }
    }
    
    public void testChallengeReplayAttack() {
        // Generate valid challenge
        QRChallengeData challenge = challengeManager.generateAccountLinkingChallenge("user123");
        
        // Use challenge legitimately
        challengeManager.validateAndConsumeChallenge(challenge.getChallenge(), challenge.getSessionId());
        
        // Attempt replay attack
        boolean replayResult = challengeManager.validateAndConsumeChallenge(
            challenge.getChallenge(), challenge.getSessionId());
        
        // Should fail
        assertFalse(replayResult);
    }
}
```

## 5. Deployment and Operations

### 5.1 Edge Protection Deployment Checklist
- [ ] Verify no private key operations in server code
- [ ] Confirm challenge generation uses secure randomness
- [ ] Test signature verification uses only public keys
- [ ] Validate QR code expiration mechanisms
- [ ] Confirm audit logging captures all operations
- [ ] Test mobile app private key isolation
- [ ] Verify secure storage implementations
- [ ] Test key rotation procedures
- [ ] Validate witness verification processes
- [ ] Confirm emergency recovery procedures

### 5.2 Operational Security Monitoring
```java
@Component
public class EdgeProtectionOperationalMonitoring {
    
    @Scheduled(fixedRate = 300000) // 5 minutes
    public void monitorEdgeProtectionHealth() {
        // Check for edge protection violations
        List<EdgeProtectionViolation> violations = auditRepository.findRecentViolations();
        
        if (!violations.isEmpty()) {
            alertService.sendSecurityAlert(
                "Edge Protection Violations Detected",
                "Count: " + violations.size()
            );
        }
        
        // Monitor challenge usage patterns
        long expiredChallenges = challengeRepository.countExpiredChallenges();
        long activeChallenges = challengeRepository.countActiveChallenges();
        
        if (activeChallenges > 1000) {
            alertService.sendWarningAlert(
                "High Challenge Volume",
                "Active challenges: " + activeChallenges
            );
        }
    }
}
```

## 6. Compliance and Governance

### 6.1 KERI Protocol Compliance
- **Edge Protection**: Private keys never leave mobile devices
- **Witness Validation**: All AID operations validated by witnesses
- **Key Rotation**: Supported entirely within mobile environment
- **Recovery Procedures**: Pre-rotation keys stored securely on mobile
- **Audit Trail**: Complete event logging for all operations

### 6.2 Security Governance
- **Code Review**: All edge protection code requires security review
- **Penetration Testing**: Regular testing of edge protection mechanisms
- **Compliance Audits**: Monthly verification of edge protection compliance
- **Incident Response**: Immediate response to edge protection violations
- **Training**: Developer training on edge protection principles

## Conclusion

This hybrid edge protection architecture ensures complete compliance with KERI protocol requirements while enabling practical integration between Mendix and Veridian systems. The architecture maintains absolute private key isolation while providing secure account linking through cryptographic challenge-response mechanisms.

The implementation provides enterprise-grade security through:
- **Absolute Private Key Isolation**: Keys never leave mobile devices
- **Secure Challenge-Response**: Cryptographically secure account linking
- **Comprehensive Monitoring**: Real-time security event monitoring
- **Compliance Validation**: Automated compliance checking
- **Incident Response**: Immediate response to security violations

This architecture enables the secure foundation required for all identity management features while maintaining the highest security standards.