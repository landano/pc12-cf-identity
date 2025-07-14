# Security Architecture Specification - Veridian Identity Integration

## Executive Summary
This document defines the comprehensive security architecture for integrating the Veridian Identity platform with the Mendix-based Landano land rights NFT verification system using a **hybrid QR code linking approach** that maintains KERI edge protection, transport security, and enterprise-grade cryptographic protection.

## ⚠️ **CRITICAL SECURITY PRINCIPLE**
**Private keys NEVER leave the Veridian mobile app.** All cryptographic signing operations occur exclusively on user's mobile devices. Mendix servers perform ONLY public key verification and business logic operations.

## 1. Core Security Principles

### 1.1 KERI Edge Protection (Hybrid Implementation)
**Principle**: Private keys never leave the Veridian mobile app and are never transmitted to or processed by Mendix servers.

**Implementation Requirements**:
- Private key generation and storage occurs exclusively in Veridian mobile app
- All cryptographic signing operations performed on mobile device using Signify library
- Mendix servers perform ONLY signature verification using public keys
- QR code challenge-response maintains edge protection while enabling account linking
- Zero server-side private key storage or cryptographic signing operations

### 1.2 Zero-Trust Architecture
**Principle**: Every request must be authenticated and authorized regardless of network location.

**Implementation Requirements**:
- All API requests signed by Client AID
- All responses validated using Agent AID signatures
- Mutual authentication for all communications
- Continuous verification of identity state

### 1.3 Post-Quantum Security
**Principle**: Cryptographic systems must be resistant to quantum computing attacks.

**Implementation Requirements**:
- Ed25519 signatures for current operations
- Migration path to post-quantum algorithms
- KERI's quantum-resistant key rotation mechanisms
- Future-proof cryptographic agility

## 2. Hybrid Key Management Architecture

### 2.1 Key Generation and Storage (Mobile-Only)

#### ⚠️ **MOBILE-ONLY KEY OPERATIONS**
```javascript
// ALL key operations happen ONLY in Veridian mobile app
// NO KEY OPERATIONS ON MENDIX SERVER

// Veridian Mobile App - Key Generation
async function generateKERIKeyPairInMobileApp() {
    const seed = randomPasscode(); // 21-character CESR seed
    const keyPair = await sodium.crypto_sign_seed_keypair(seed);
    
    // Store private key ONLY in mobile secure storage
    await storePrivateKeyInMobileSecureStorage(keyPair.privateKey);
    
    return {
        publicKey: keyPair.publicKey,
        aid: generateAID(keyPair.publicKey)
        // Private key NEVER returned or transmitted
    };
}
```

#### Mendix Server - Public Data Only
```java
public class PublicDataManager {
    // ONLY public information stored on Mendix server
    
    public void storeAccountLinkage(String mendixUserId, String veridianAID, String linkSignature) {
        AccountLinkEntity entity = new AccountLinkEntity();
        entity.setMendixUserId(mendixUserId);
        entity.setVeridianAID(veridianAID);  // Public KERI identifier
        entity.setLinkSignature(linkSignature);  // Proof of linking (not private key)
        entity.setTimestamp(Instant.now());
        
        // NO PRIVATE KEYS - Only public identifiers and proof signatures
        accountLinkRepository.save(entity);
    }
    
    // ❌ FORBIDDEN: No private key storage or operations
    // ❌ FORBIDDEN: private void storePrivateKey(...) - NEVER IMPLEMENT
}
```

### 2.2 Key Rotation (Mobile-Only Operations)

#### Mobile App - Key Rotation Implementation
```javascript
// Key rotation happens ONLY in Veridian mobile app
class MobileKeyRotationManager {
    
    async rotateKeysInMobile(aid, nextKeyCommitment) {
        // ALL operations happen on mobile device
        
        // Validate current key ownership (mobile-side)
        const currentPrivateKey = await getPrivateKeyFromMobileStorage(aid);
        
        // Generate new key pair (mobile-side)
        const newKeyPair = await generateSecureKeyPairInMobile();
        
        // Create rotation event
        const rotationEvent = {
            aid: aid,
            previousKeyCommitment: await getCurrentKeyCommitment(aid),
            newPublicKey: newKeyPair.publicKey,
            nextKeyCommitment: nextKeyCommitment
        };
        
        // Sign rotation event with current private key (mobile-side)
        const signature = await signRotationEventInMobile(rotationEvent, currentPrivateKey);
        
        // Update mobile key storage
        await updateMobileKeyStorage(aid, newKeyPair, nextKeyCommitment);
        
        // Notify Mendix server of public key change (public data only)
        await notifyServerOfKeyRotation(aid, newKeyPair.publicKey, signature);
        
        return { success: true, newPublicKey: newKeyPair.publicKey };
    }
}
```

#### Mendix Server - Key Rotation Notification Handler
```java
public class KeyRotationNotificationHandler {
    
    // ONLY handle public key updates - NO private key operations
    public void handleKeyRotationNotification(String aid, String newPublicKey, String rotationSignature) {
        
        // Verify rotation signature using previous public key
        boolean rotationValid = verifyRotationSignature(aid, newPublicKey, rotationSignature);
        
        if (rotationValid) {
            // Update account link with new public key (public data only)
            updateAccountLinkPublicKey(aid, newPublicKey);
            
            // Log key rotation event
            auditLogger.logKeyRotation(aid, newPublicKey);
        } else {
            // Reject invalid key rotation
            throw new SecurityException("Invalid key rotation signature");
        }
    }
    
    // ❌ FORBIDDEN: NO private key rotation operations on server
}
```

#### Key Recovery (Mobile-Only Operations)
```javascript
// Key recovery happens ONLY in Veridian mobile app
class MobileKeyRecoveryManager {
    
    async recoverFromCompromiseInMobile(aid, recoveryProof) {
        // ALL recovery operations happen on mobile device
        
        // Validate recovery authorization (mobile-side)
        const recoveryValid = await validateRecoveryAuthorizationInMobile(aid, recoveryProof);
        if (!recoveryValid) {
            throw new Error("Invalid recovery authorization");
        }
        
        // Retrieve pre-committed rotation keys (mobile-side)
        const recoveryKeys = await getPreCommittedKeysFromMobile(aid);
        
        // Create emergency rotation event
        const emergencyRotationEvent = {
            aid: aid,
            compromiseTimestamp: Date.now(),
            recoveryPublicKey: recoveryKeys.publicKey,
            eventType: "emergency_rotation"
        };
        
        // Sign with recovery keys (mobile-side)
        const signature = await signWithRecoveryKeysInMobile(emergencyRotationEvent, recoveryKeys.privateKey);
        
        // Update mobile key storage with recovery keys
        await updateMobileKeyStorageWithRecovery(aid, recoveryKeys);
        
        // Notify Mendix server of emergency rotation (public data only)
        await notifyServerOfEmergencyRotation(aid, recoveryKeys.publicKey, signature);
        
        return { success: true, newPublicKey: recoveryKeys.publicKey };
    }
}
```

#### Mendix Server - Emergency Rotation Handler
```java
public class EmergencyRotationHandler {
    
    // ONLY handle emergency rotation notifications - NO private key operations
    public void handleEmergencyRotation(String aid, String newPublicKey, String emergencySignature) {
        
        // Verify emergency rotation signature
        boolean rotationValid = verifyEmergencyRotationSignature(aid, newPublicKey, emergencySignature);
        
        if (rotationValid) {
            // Update account link with new public key
            updateAccountLinkAfterEmergencyRotation(aid, newPublicKey);
            
            // Log emergency rotation event
            auditLogger.logEmergencyRotation(aid, newPublicKey);
            
            // Alert security team
            securityAlertService.sendEmergencyRotationAlert(aid);
        } else {
            // Reject invalid emergency rotation
            throw new SecurityException("Invalid emergency rotation signature");
        }
    }
}
```

### 2.3 Hardware Security Module Integration

#### HSM Configuration
```xml
<hsm-configuration>
    <provider name="PKCS11">
        <library-path>/opt/safenet/lib/libCryptoki2_64.so</library-path>
        <slot-id>0</slot-id>
        <pin-source>environment:HSM_PIN</pin-source>
    </provider>
    
    <key-generation>
        <algorithm>Ed25519</algorithm>
        <extractable>false</extractable>
        <key-usage>sign</key-usage>
    </key-generation>
</hsm-configuration>
```

#### HSM Integration Code
```java
public class HSMKeyManager {
    private PKCS11Provider hsmProvider;
    
    public KeyPair generateHSMKeyPair(String aid) {
        // Configure HSM for non-extractable key generation
        KeyPairGenerator generator = KeyPairGenerator.getInstance("Ed25519", hsmProvider);
        generator.initialize(new KeyGenParameterSpec.Builder(aid)
            .setDigests(KeyProperties.DIGEST_SHA512)
            .setUserAuthenticationRequired(true)
            .setKeyValidityEnd(Date.from(Instant.now().plus(Duration.ofDays(365))))
            .build());
        
        return generator.generateKeyPair();
    }
}
```

## 3. Transport Security Implementation

### 3.1 TLS 1.3 Configuration

#### Server Configuration
```xml
<tls-configuration>
    <protocol>TLSv1.3</protocol>
    <cipher-suites>
        <cipher-suite>TLS_AES_256_GCM_SHA384</cipher-suite>
        <cipher-suite>TLS_CHACHA20_POLY1305_SHA256</cipher-suite>
    </cipher-suites>
    <certificate-validation>
        <pin-certificates>true</pin-certificates>
        <verify-hostname>true</verify-hostname>
        <check-revocation>true</check-revocation>
    </certificate-validation>
</tls-configuration>
```

#### Certificate Pinning Implementation
```java
public class CertificatePinningManager {
    private static final String VERIDIAN_API_PIN = "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    
    public void validateCertificatePin(X509Certificate certificate) throws CertificateException {
        byte[] publicKeyHash = sha256(certificate.getPublicKey().getEncoded());
        String actualPin = "sha256/" + Base64.encode(publicKeyHash);
        
        if (!VERIDIAN_API_PIN.equals(actualPin)) {
            throw new CertificateException("Certificate pin validation failed");
        }
    }
}
```

### 3.2 Mutual TLS (mTLS) Implementation

#### Client Certificate Configuration
```java
public class MutualTLSClient {
    private SSLContext createMutualTLSContext() throws Exception {
        // Load client certificate
        KeyStore clientKeyStore = KeyStore.getInstance("PKCS12");
        clientKeyStore.load(new FileInputStream("client-cert.p12"), "password".toCharArray());
        
        // Load trusted CA certificates
        KeyStore trustStore = KeyStore.getInstance("JKS");
        trustStore.load(new FileInputStream("ca-certificates.jks"), "password".toCharArray());
        
        // Configure key manager
        KeyManagerFactory keyManagerFactory = KeyManagerFactory.getInstance("SunX509");
        keyManagerFactory.init(clientKeyStore, "password".toCharArray());
        
        // Configure trust manager
        TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance("SunX509");
        trustManagerFactory.init(trustStore);
        
        // Create SSL context
        SSLContext sslContext = SSLContext.getInstance("TLSv1.3");
        sslContext.init(keyManagerFactory.getKeyManagers(), 
                       trustManagerFactory.getTrustManagers(), 
                       new SecureRandom());
        
        return sslContext;
    }
}
```

### 3.3 API Security Implementation

#### Request Signing
```java
public class APISecurityManager {
    public void signRequest(HttpRequest request, String aid, PrivateKey privateKey) {
        // Create signature input
        String timestamp = String.valueOf(System.currentTimeMillis());
        String resource = request.getURI().getPath();
        String method = request.getMethod();
        
        // Build signature string
        String signatureString = method + "\n" + resource + "\n" + timestamp;
        
        // Sign with private key
        byte[] signature = signWithPrivateKey(signatureString.getBytes(), privateKey);
        
        // Add headers
        request.setHeader("Signify-Resource", resource);
        request.setHeader("Signify-Timestamp", timestamp);
        request.setHeader("Signature-Input", Base64.encode(signature));
        request.setHeader("Signify-AID", aid);
    }
}
```

#### Response Validation
```java
public class ResponseValidator {
    public boolean validateResponse(HttpResponse response, String expectedAID) {
        // Extract signature headers
        String resource = response.getHeader("Signify-Resource");
        String timestamp = response.getHeader("Signify-Timestamp");
        String signature = response.getHeader("Signature");
        
        // Verify timestamp freshness
        long responseTime = Long.parseLong(timestamp);
        if (System.currentTimeMillis() - responseTime > 30000) { // 30 second window
            return false;
        }
        
        // Verify signature
        String signatureString = "POST\n" + resource + "\n" + timestamp;
        PublicKey agentPublicKey = getAgentPublicKey(expectedAID);
        
        return verifySignature(signatureString.getBytes(), 
                              Base64.decode(signature), 
                              agentPublicKey);
    }
}
```

## 4. Authentication and Authorization

### 4.1 KERI-Based Authentication

#### Identity Verification
```java
public class KERIAuthenticationManager {
    public AuthenticationResult authenticate(String aid, String signedChallenge) {
        // Verify AID exists and is valid
        KERIIdentifier identifier = validateAID(aid);
        
        // Verify signature against current public key
        boolean signatureValid = verifySignature(signedChallenge, identifier.getCurrentPublicKey());
        
        // Check key rotation status
        boolean keysCurrent = checkKeyRotationStatus(aid);
        
        // Validate witness receipts
        boolean witnessesValid = validateWitnessReceipts(aid);
        
        return new AuthenticationResult(signatureValid && keysCurrent && witnessesValid);
    }
}
```

#### Role-Based Access Control
```java
public class KERIAuthorizationManager {
    public boolean authorize(String aid, String resource, String action) {
        // Get user roles from ACDC credentials
        List<ACDCCredential> roleCredentials = getACDCCredentials(aid, "role");
        
        // Check resource permissions
        for (ACDCCredential credential : roleCredentials) {
            if (hasPermission(credential, resource, action)) {
                return true;
            }
        }
        
        return false;
    }
}
```

### 4.2 Multi-Factor Authentication

#### ACDC-Based MFA
```java
public class MFAManager {
    public MFAResult performMFA(String aid, String primarySignature, String secondaryFactor) {
        // Verify primary KERI signature
        boolean primaryValid = verifyKERISignature(aid, primarySignature);
        
        // Verify secondary factor (hardware token, biometric, etc.)
        boolean secondaryValid = verifySecondaryFactor(aid, secondaryFactor);
        
        // Issue short-lived authentication token
        String authToken = issueAuthenticationToken(aid, Duration.ofHours(1));
        
        return new MFAResult(primaryValid && secondaryValid, authToken);
    }
}
```

## 5. Audit and Monitoring

### 5.1 Security Event Logging

#### Audit Log Implementation
```java
public class SecurityAuditLogger {
    public void logSecurityEvent(String eventType, String aid, String details) {
        SecurityAuditEvent event = new SecurityAuditEvent();
        event.setEventType(eventType);
        event.setAID(aid);
        event.setTimestamp(System.currentTimeMillis());
        event.setDetails(details);
        event.setSourceIP(getCurrentClientIP());
        event.setUserAgent(getCurrentUserAgent());
        
        // Store in tamper-evident log
        persistToAuditLog(event);
        
        // Send to SIEM if critical
        if (isCriticalSecurityEvent(eventType)) {
            sendToSIEM(event);
        }
    }
}
```

#### Critical Security Events
- Key generation events
- Key rotation events
- Authentication failures
- Authorization violations
- Witness communication failures
- Certificate validation failures
- HSM operations

### 5.2 Threat Detection

#### Anomaly Detection
```java
public class ThreatDetectionManager {
    public void detectAnomalies(String aid, String operation) {
        // Check for unusual patterns
        if (isUnusualActivity(aid, operation)) {
            triggerSecurityAlert(aid, "Unusual activity detected");
        }
        
        // Check for brute force attempts
        if (isBruteForceAttempt(aid)) {
            lockAccount(aid, Duration.ofHours(1));
        }
        
        // Check for key compromise indicators
        if (isPossibleKeyCompromise(aid)) {
            triggerEmergencyRotation(aid);
        }
    }
}
```

## 6. Compliance and Governance

### 6.1 Data Protection Compliance

#### GDPR Compliance
```java
public class DataProtectionManager {
    public void processDataSubjectRequest(String aid, DataSubjectRequest request) {
        switch (request.getType()) {
            case ACCESS:
                generateDataExport(aid);
                break;
            case DELETION:
                anonymizePersonalData(aid);
                break;
            case PORTABILITY:
                exportDataInStructuredFormat(aid);
                break;
        }
    }
}
```

### 6.2 Security Governance

#### Security Policy Enforcement
```java
public class SecurityPolicyManager {
    public PolicyResult enforceSecurityPolicy(String aid, String operation) {
        // Check password policy
        if (!meetsPasswordPolicy(aid)) {
            return PolicyResult.VIOLATION("Password policy not met");
        }
        
        // Check session timeout
        if (isSessionExpired(aid)) {
            return PolicyResult.VIOLATION("Session expired");
        }
        
        // Check concurrent session limits
        if (exceedsConcurrentSessionLimit(aid)) {
            return PolicyResult.VIOLATION("Too many concurrent sessions");
        }
        
        return PolicyResult.COMPLIANT();
    }
}
```

## 7. Incident Response

### 7.1 Security Incident Handling

#### Incident Response Plan
```java
public class IncidentResponseManager {
    public void handleSecurityIncident(SecurityIncident incident) {
        // Classify incident severity
        IncidentSeverity severity = classifyIncident(incident);
        
        // Contain the incident
        containIncident(incident);
        
        // Notify stakeholders
        notifyStakeholders(incident, severity);
        
        // Collect evidence
        collectForensicEvidence(incident);
        
        // Remediate
        remediateIncident(incident);
        
        // Document lessons learned
        documentLessonsLearned(incident);
    }
}
```

### 7.2 Key Compromise Response

#### Emergency Key Rotation
```java
public class EmergencyResponseManager {
    public void handleKeyCompromise(String aid, String evidence) {
        // Immediately rotate keys
        performEmergencyKeyRotation(aid);
        
        // Revoke compromised credentials
        revokeAllCredentials(aid);
        
        // Notify witnesses
        notifyWitnesses(aid, "Key compromise detected");
        
        // Lock account
        lockAccount(aid, Duration.ofDays(1));
        
        // Generate incident report
        generateIncidentReport(aid, evidence);
    }
}
```

## 8. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- Implement basic key generation and storage
- Set up TLS 1.3 configuration
- Basic authentication mechanisms

### Phase 2: Core Security (Weeks 3-4)
- Implement edge protection
- Add certificate pinning
- Set up audit logging

### Phase 3: Advanced Features (Weeks 5-6)
- HSM integration
- Multi-factor authentication
- Threat detection

### Phase 4: Compliance (Weeks 7-8)
- GDPR compliance features
- Security policy enforcement
- Incident response procedures

This comprehensive security architecture ensures that the Veridian Identity integration meets enterprise-grade security requirements while maintaining the decentralized, edge-protected nature of the KERI protocol.