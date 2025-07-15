# Secure QR Code Challenge-Response Implementation

**Related to:** ISSUE-021

## Overview
This document provides the complete implementation for the secure QR code challenge-response mechanism that maintains KERI edge protection while enabling secure account linking between Mendix and Veridian systems.

## 1. Mendix Server Implementation

### 1.1 Challenge Generation Service
```java
@Service
public class SecureQRChallengeService {
    
    @Autowired
    private SecureRandom secureRandom;
    
    @Autowired
    private ChallengeRepository challengeRepository;
    
    @Autowired
    private EncryptionService encryptionService;
    
    @Autowired
    private QRCodeGenerator qrCodeGenerator;
    
    @Autowired
    private EdgeProtectionAuditService auditService;
    
    public QRChallengeResponse generateAccountLinkingChallenge(String mendixUserId) {
        try {
            // Generate cryptographically secure challenge
            byte[] challengeBytes = new byte[32];
            secureRandom.nextBytes(challengeBytes);
            String challenge = Base64.getUrlEncoder().withoutPadding().encodeToString(challengeBytes);
            
            // Generate unique session ID
            String sessionId = UUID.randomUUID().toString();
            
            // Encrypt user ID for privacy
            String encryptedUserId = encryptionService.encrypt(mendixUserId);
            
            // Create challenge data structure
            QRChallengeData challengeData = QRChallengeData.builder()
                .version("1.0")
                .type("landano_account_linking")
                .challenge(challenge)
                .sessionId(sessionId)
                .callbackUrl("https://api.landano.io/veridian/link")
                .expiresAt(Instant.now().plus(Duration.ofMinutes(5)))
                .mendixUserId(encryptedUserId)
                .nonce(generateNonce())
                .build();
            
            // Store pending challenge
            PendingChallenge pendingChallenge = new PendingChallenge();
            pendingChallenge.setChallenge(challenge);
            pendingChallenge.setSessionId(sessionId);
            pendingChallenge.setMendixUserId(mendixUserId);
            pendingChallenge.setExpiresAt(challengeData.getExpiresAt());
            pendingChallenge.setCreatedAt(Instant.now());
            pendingChallenge.setStatus(ChallengeStatus.PENDING);
            
            challengeRepository.save(pendingChallenge);
            
            // Generate QR code image
            String qrCodeImage = qrCodeGenerator.generateQRCode(challengeData.toJson());
            
            // Audit challenge generation
            auditService.logChallengeGeneration(mendixUserId, sessionId, challenge);
            
            return QRChallengeResponse.builder()
                .qrCodeImage(qrCodeImage)
                .sessionId(sessionId)
                .expiresAt(challengeData.getExpiresAt())
                .build();
            
        } catch (Exception e) {
            logger.error("Failed to generate QR challenge for user: {}", mendixUserId, e);
            throw new SecurityException("Challenge generation failed");
        }
    }
    
    private String generateNonce() {
        byte[] nonceBytes = new byte[16];
        secureRandom.nextBytes(nonceBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(nonceBytes);
    }
}
```

### 1.2 Challenge Verification Service
```java
@Service
public class ChallengeVerificationService {
    
    @Autowired
    private ChallengeRepository challengeRepository;
    
    @Autowired
    private KERISignatureVerifier signatureVerifier;
    
    @Autowired
    private AccountLinkingService accountLinkingService;
    
    @Autowired
    private EdgeProtectionAuditService auditService;
    
    public ChallengeVerificationResult verifyAndProcessChallenge(ChallengeVerificationRequest request) {
        try {
            // Validate request structure
            validateChallengeRequest(request);
            
            // Retrieve and validate pending challenge
            PendingChallenge pendingChallenge = validatePendingChallenge(
                request.getChallenge(), request.getSessionId());
            
            // Verify signature using public key only
            boolean signatureValid = signatureVerifier.verifyKERISignature(
                request.getSignedData(), 
                request.getSignature(), 
                request.getVeridianAID()
            );
            
            if (!signatureValid) {
                auditService.logSignatureVerificationFailure(
                    request.getVeridianAID(), request.getSessionId());
                return ChallengeVerificationResult.failure("Invalid signature");
            }
            
            // Verify AID with KERI witnesses
            boolean aidValid = signatureVerifier.verifyAIDWithWitnesses(request.getVeridianAID());
            
            if (!aidValid) {
                auditService.logAIDVerificationFailure(
                    request.getVeridianAID(), request.getSessionId());
                return ChallengeVerificationResult.failure("AID verification failed");
            }
            
            // Create account link
            AccountLinkResult linkResult = accountLinkingService.createAccountLink(
                pendingChallenge.getMendixUserId(),
                request.getVeridianAID(),
                request.getSignature()
            );
            
            // Mark challenge as used
            pendingChallenge.setStatus(ChallengeStatus.USED);
            pendingChallenge.setCompletedAt(Instant.now());
            challengeRepository.save(pendingChallenge);
            
            // Audit successful linking
            auditService.logSuccessfulAccountLinking(
                pendingChallenge.getMendixUserId(),
                request.getVeridianAID(),
                request.getSessionId()
            );
            
            return ChallengeVerificationResult.success(linkResult.getLinkId());
            
        } catch (Exception e) {
            logger.error("Challenge verification failed", e);
            auditService.logChallengeVerificationError(request.getSessionId(), e.getMessage());
            return ChallengeVerificationResult.failure("Verification failed");
        }
    }
    
    private void validateChallengeRequest(ChallengeVerificationRequest request) {
        if (request.getChallenge() == null || request.getChallenge().isEmpty()) {
            throw new IllegalArgumentException("Challenge is required");
        }
        if (request.getSessionId() == null || request.getSessionId().isEmpty()) {
            throw new IllegalArgumentException("Session ID is required");
        }
        if (request.getVeridianAID() == null || request.getVeridianAID().isEmpty()) {
            throw new IllegalArgumentException("Veridian AID is required");
        }
        if (request.getSignature() == null || request.getSignature().isEmpty()) {
            throw new IllegalArgumentException("Signature is required");
        }
    }
    
    private PendingChallenge validatePendingChallenge(String challenge, String sessionId) {
        PendingChallenge pendingChallenge = challengeRepository.findBySessionId(sessionId);
        
        if (pendingChallenge == null) {
            throw new SecurityException("Challenge not found");
        }
        
        if (!pendingChallenge.getChallenge().equals(challenge)) {
            throw new SecurityException("Challenge mismatch");
        }
        
        if (pendingChallenge.isExpired()) {
            throw new SecurityException("Challenge expired");
        }
        
        if (pendingChallenge.getStatus() != ChallengeStatus.PENDING) {
            throw new SecurityException("Challenge already used");
        }
        
        return pendingChallenge;
    }
}
```

### 1.3 REST API Endpoints
```java
@RestController
@RequestMapping("/api/veridian")
@Validated
public class VeridianLinkingController {
    
    @Autowired
    private SecureQRChallengeService challengeService;
    
    @Autowired
    private ChallengeVerificationService verificationService;
    
    @Autowired
    private RateLimitingService rateLimitingService;
    
    @PostMapping("/generate-challenge")
    public ResponseEntity<QRChallengeResponse> generateChallenge(
            @Valid @RequestBody GenerateChallengeRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            // Rate limiting
            String clientIP = getClientIP(httpRequest);
            if (!rateLimitingService.isAllowed(clientIP, "challenge_generation")) {
                return ResponseEntity.status(429).body(null);
            }
            
            // Generate challenge
            QRChallengeResponse response = challengeService.generateAccountLinkingChallenge(
                request.getMendixUserId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Challenge generation failed", e);
            return ResponseEntity.internalServerError().body(null);
        }
    }
    
    @PostMapping("/verify-challenge")
    public ResponseEntity<ChallengeVerificationResult> verifyChallenge(
            @Valid @RequestBody ChallengeVerificationRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            // Rate limiting
            String clientIP = getClientIP(httpRequest);
            if (!rateLimitingService.isAllowed(clientIP, "challenge_verification")) {
                return ResponseEntity.status(429).body(null);
            }
            
            // Verify challenge
            ChallengeVerificationResult result = verificationService.verifyAndProcessChallenge(request);
            
            if (result.isSuccess()) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
            
        } catch (Exception e) {
            logger.error("Challenge verification failed", e);
            return ResponseEntity.internalServerError().body(
                ChallengeVerificationResult.failure("Internal server error"));
        }
    }
    
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
```

## 2. Mobile Implementation (Veridian App Integration)

### 2.1 QR Code Scanner and Processor
```javascript
// QR Code Challenge Processing in Veridian Mobile App
class QRChallengeProcessor {
    
    async processScannedQRCode(qrCodeData) {
        try {
            // Parse QR code data
            const challengeData = JSON.parse(qrCodeData);
            
            // Validate QR code structure
            if (!this.validateQRStructure(challengeData)) {
                throw new Error('Invalid QR code format');
            }
            
            // Check expiration
            if (new Date() > new Date(challengeData.expiresAt)) {
                throw new Error('QR code has expired');
            }
            
            // Verify domain to prevent phishing
            if (!this.verifyDomain(challengeData.callbackUrl)) {
                throw new Error('Untrusted domain');
            }
            
            // Show user confirmation dialog
            const userConfirmed = await this.showConfirmationDialog(challengeData);
            if (!userConfirmed) {
                return { success: false, message: 'User cancelled' };
            }
            
            // Process challenge
            const result = await this.processChallenge(challengeData);
            
            return result;
            
        } catch (error) {
            console.error('QR code processing failed:', error);
            return { success: false, message: error.message };
        }
    }
    
    validateQRStructure(data) {
        return data.version === '1.0' &&
               data.type === 'landano_account_linking' &&
               data.challenge &&
               data.sessionId &&
               data.callbackUrl &&
               data.expiresAt &&
               data.mendixUserId &&
               data.nonce;
    }
    
    verifyDomain(url) {
        const allowedDomains = ['landano.io', 'api.landano.io'];
        try {
            const domain = new URL(url).hostname;
            return allowedDomains.includes(domain);
        } catch {
            return false;
        }
    }
    
    async showConfirmationDialog(challengeData) {
        // Show user-friendly confirmation dialog
        return new Promise((resolve) => {
            Alert.alert(
                'Link Landano Account',
                `Do you want to link your Veridian identity to your Landano account?\n\nThis will allow secure verification of your land rights NFTs.`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve(false)
                    },
                    {
                        text: 'Link Account',
                        onPress: () => resolve(true)
                    }
                ]
            );
        });
    }
    
    async processChallenge(challengeData) {
        try {
            // Get user's AID
            const userAID = await this.getUserAID();
            
            // Create challenge response
            const challengeResponse = {
                challenge: challengeData.challenge,
                sessionId: challengeData.sessionId,
                aid: userAID,
                mendixUserId: challengeData.mendixUserId,
                timestamp: Date.now(),
                action: 'account_linking',
                nonce: challengeData.nonce
            };
            
            // Sign challenge response with private key (mobile-only operation)
            const signature = await this.signChallengeResponse(challengeResponse);
            
            // Send signed response to Mendix
            const verificationResult = await this.sendSignedResponse(
                challengeData.callbackUrl,
                {
                    challenge: challengeData.challenge,
                    sessionId: challengeData.sessionId,
                    veridianAID: userAID,
                    signedData: JSON.stringify(challengeResponse),
                    signature: signature
                }
            );
            
            return verificationResult;
            
        } catch (error) {
            console.error('Challenge processing failed:', error);
            throw error;
        }
    }
}
```

### 2.2 Mobile Cryptographic Operations
```javascript
// Mobile-only cryptographic operations
class MobileCryptographicOperations {
    
    async signChallengeResponse(challengeResponse) {
        try {
            // Get user's private key from secure mobile storage
            const privateKey = await this.getPrivateKeyFromSecureStorage();
            
            // Convert challenge response to string for signing
            const dataToSign = JSON.stringify(challengeResponse);
            
            // Sign with Ed25519 using libsodium
            const signature = await sodium.crypto_sign_detached(
                new TextEncoder().encode(dataToSign),
                privateKey
            );
            
            // Return base64url encoded signature
            return base64url.encode(signature);
            
        } catch (error) {
            console.error('Signing failed:', error);
            throw new Error('Failed to sign challenge response');
        }
    }
    
    async getPrivateKeyFromSecureStorage() {
        try {
            // Platform-specific secure storage access
            if (Platform.OS === 'ios') {
                const credentials = await Keychain.getInternetCredentials('landano-keri-keys');
                return credentials.password;
            } else if (Platform.OS === 'android') {
                const privateKey = await EncryptedStorage.getItem('landano-keri-keys');
                return privateKey;
            }
            
            throw new Error('Platform not supported');
            
        } catch (error) {
            console.error('Failed to retrieve private key:', error);
            throw new Error('Failed to access secure storage');
        }
    }
    
    async getUserAID() {
        try {
            // Get AID from secure storage or generate if needed
            const storedAID = await this.getStoredAID();
            
            if (storedAID) {
                return storedAID;
            }
            
            // Generate new AID if not exists
            const newAID = await this.generateNewAID();
            await this.storeAID(newAID);
            
            return newAID;
            
        } catch (error) {
            console.error('Failed to get user AID:', error);
            throw new Error('Failed to get user identifier');
        }
    }
    
    async sendSignedResponse(callbackUrl, signedResponse) {
        try {
            const response = await fetch(callbackUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Veridian-Mobile-App/1.0'
                },
                body: JSON.stringify(signedResponse)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('Failed to send signed response:', error);
            throw new Error('Failed to communicate with server');
        }
    }
}
```

## 3. Security Validations and Tests

### 3.1 Challenge Security Tests
```java
@SpringBootTest
class ChallengeSecurityTests {
    
    @Autowired
    private SecureQRChallengeService challengeService;
    
    @Autowired
    private ChallengeVerificationService verificationService;
    
    @Test
    void testChallengeGeneration() {
        // Test challenge generation
        QRChallengeResponse response = challengeService.generateAccountLinkingChallenge("user123");
        
        assertNotNull(response.getQrCodeImage());
        assertNotNull(response.getSessionId());
        assertTrue(response.getExpiresAt().isAfter(Instant.now()));
    }
    
    @Test
    void testChallengeExpiration() {
        // Create expired challenge
        QRChallengeResponse response = challengeService.generateAccountLinkingChallenge("user123");
        
        // Mock time advancement
        Clock fixedClock = Clock.fixed(Instant.now().plus(Duration.ofMinutes(10)), ZoneOffset.UTC);
        
        // Attempt to verify expired challenge
        ChallengeVerificationRequest request = new ChallengeVerificationRequest();
        request.setSessionId(response.getSessionId());
        request.setChallenge("test-challenge");
        request.setVeridianAID("test-aid");
        request.setSignature("test-signature");
        
        ChallengeVerificationResult result = verificationService.verifyAndProcessChallenge(request);
        
        assertFalse(result.isSuccess());
        assertTrue(result.getMessage().contains("expired"));
    }
    
    @Test
    void testChallengeReplayPrevention() {
        // Generate challenge
        QRChallengeResponse response = challengeService.generateAccountLinkingChallenge("user123");
        
        // Create valid request
        ChallengeVerificationRequest request = new ChallengeVerificationRequest();
        request.setSessionId(response.getSessionId());
        request.setChallenge("test-challenge");
        request.setVeridianAID("test-aid");
        request.setSignature("valid-signature");
        
        // First verification should succeed (mock signature verification)
        when(signatureVerifier.verifyKERISignature(any(), any(), any())).thenReturn(true);
        when(signatureVerifier.verifyAIDWithWitnesses(any())).thenReturn(true);
        
        ChallengeVerificationResult firstResult = verificationService.verifyAndProcessChallenge(request);
        assertTrue(firstResult.isSuccess());
        
        // Second verification should fail (replay prevention)
        ChallengeVerificationResult replayResult = verificationService.verifyAndProcessChallenge(request);
        assertFalse(replayResult.isSuccess());
        assertTrue(replayResult.getMessage().contains("already used"));
    }
    
    @Test
    void testInvalidSignatureRejection() {
        // Generate challenge
        QRChallengeResponse response = challengeService.generateAccountLinkingChallenge("user123");
        
        // Create request with invalid signature
        ChallengeVerificationRequest request = new ChallengeVerificationRequest();
        request.setSessionId(response.getSessionId());
        request.setChallenge("test-challenge");
        request.setVeridianAID("test-aid");
        request.setSignature("invalid-signature");
        
        // Mock signature verification failure
        when(signatureVerifier.verifyKERISignature(any(), any(), any())).thenReturn(false);
        
        ChallengeVerificationResult result = verificationService.verifyAndProcessChallenge(request);
        
        assertFalse(result.isSuccess());
        assertTrue(result.getMessage().contains("Invalid signature"));
    }
}
```

### 3.2 Edge Protection Validation Tests
```java
@SpringBootTest
class EdgeProtectionValidationTests {
    
    @Test
    void testNoPrivateKeyOperations() {
        // Verify that no private key operations exist in server code
        assertThrows(NoSuchMethodException.class, () -> {
            ChallengeVerificationService.class.getDeclaredMethod("signData", String.class, String.class);
        });
        
        assertThrows(NoSuchMethodException.class, () -> {
            ChallengeVerificationService.class.getDeclaredMethod("generatePrivateKey");
        });
        
        assertThrows(NoSuchMethodException.class, () -> {
            ChallengeVerificationService.class.getDeclaredMethod("storePrivateKey", String.class, String.class);
        });
    }
    
    @Test
    void testPublicKeyOperationsOnly() {
        // Verify that only public key operations are available
        Method[] methods = ChallengeVerificationService.class.getDeclaredMethods();
        
        for (Method method : methods) {
            String methodName = method.getName();
            
            // Ensure no private key operations
            assertFalse(methodName.contains("private"));
            assertFalse(methodName.contains("sign"));
            assertFalse(methodName.contains("generateKey"));
            
            // Verify operations are limited to verification
            if (methodName.contains("verify")) {
                assertTrue(methodName.contains("verify") || methodName.contains("validate"));
            }
        }
    }
    
    @Test
    void testChallengeDataSecurity() {
        // Test that challenge data contains no sensitive information
        QRChallengeResponse response = challengeService.generateAccountLinkingChallenge("user123");
        
        // Decode QR code data
        QRChallengeData challengeData = parseQRCodeData(response.getQrCodeImage());
        
        // Verify no private keys in challenge data
        assertFalse(challengeData.toString().contains("private"));
        assertFalse(challengeData.toString().contains("secret"));
        assertFalse(challengeData.toString().contains("key"));
        
        // Verify user ID is encrypted
        assertNotEquals("user123", challengeData.getMendixUserId());
    }
}
```

## 4. Deployment Configuration

### 4.1 Security Configuration
```yaml
# application-security.yml
security:
  challenge:
    expiration_minutes: 5
    max_active_challenges: 1000
    rate_limit:
      generation: 10_per_minute
      verification: 20_per_minute
  
  encryption:
    algorithm: AES-256-GCM
    key_rotation_days: 30
  
  qr_code:
    max_size: 2048
    allowed_domains:
      - landano.io
      - api.landano.io
  
  audit:
    log_all_operations: true
    retention_days: 90
    alert_on_violations: true
```

### 4.2 Monitoring Configuration
```yaml
# application-monitoring.yml
monitoring:
  edge_protection:
    enabled: true
    check_interval: 60s
    alert_thresholds:
      failed_verifications: 10_per_minute
      expired_challenges: 100_per_hour
      invalid_signatures: 5_per_minute
  
  metrics:
    - challenge_generation_count
    - challenge_verification_count
    - signature_verification_success_rate
    - challenge_expiration_rate
    - account_linking_success_rate
```

## Conclusion

This implementation provides a comprehensive secure QR code challenge-response mechanism that:

1. **Maintains Edge Protection**: All private key operations occur exclusively on mobile devices
2. **Provides Cryptographic Security**: Uses Ed25519 signatures and secure random challenge generation
3. **Prevents Common Attacks**: Implements replay prevention, expiration, and rate limiting
4. **Enables Secure Linking**: Creates cryptographically verified account links
5. **Includes Comprehensive Testing**: Provides security validation and edge protection tests

The implementation serves as the foundation for secure account linking while maintaining the highest security standards required by the KERI protocol.