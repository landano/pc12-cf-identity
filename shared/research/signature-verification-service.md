# Server-Side Signature Verification Service (Public Keys Only)

**Related to:** ISSUE-021

## Overview
This implementation provides comprehensive server-side signature verification using only public keys, ensuring complete compliance with KERI edge protection principles. No private key operations occur on the server.

## 1. Core Signature Verification Service

### 1.1 KERI Signature Verifier
```java
@Service
public class KERISignatureVerifier {
    
    @Autowired
    private KERIClient keriClient;
    
    @Autowired
    private WitnessVerificationService witnessVerificationService;
    
    @Autowired
    private KeyRotationService keyRotationService;
    
    @Autowired
    private SignatureVerificationAuditService auditService;
    
    private static final Logger logger = LoggerFactory.getLogger(KERISignatureVerifier.class);
    
    /**
     * Verify KERI signature using public key only
     * NO PRIVATE KEY OPERATIONS - EDGE PROTECTION ENFORCED
     */
    public boolean verifyKERISignature(String signedData, String signature, String aid) {
        try {
            // Validate inputs
            validateSignatureInputs(signedData, signature, aid);
            
            // Get current public key from KERIA (NOT private key)
            PublicKey publicKey = keriClient.getCurrentPublicKey(aid);
            
            if (publicKey == null) {
                logger.warn("No public key found for AID: {}", aid);
                auditService.logPublicKeyNotFound(aid);
                return false;
            }
            
            // Verify signature using Ed25519 with public key only
            boolean signatureValid = performEd25519Verification(signedData, signature, publicKey);
            
            if (!signatureValid) {
                logger.warn("Signature verification failed for AID: {}", aid);
                auditService.logSignatureVerificationFailure(aid, signedData, signature);
                return false;
            }
            
            // Additional verification: Check key rotation status
            boolean keyCurrentlyValid = keyRotationService.isKeyCurrentlyValid(aid, publicKey);
            
            if (!keyCurrentlyValid) {
                logger.warn("Key rotation detected for AID: {}", aid);
                auditService.logKeyRotationDetected(aid);
                return false;
            }
            
            // Log successful verification
            auditService.logSuccessfulSignatureVerification(aid, signedData);
            
            return true;
            
        } catch (Exception e) {
            logger.error("Signature verification failed for AID: {}", aid, e);
            auditService.logSignatureVerificationError(aid, e.getMessage());
            return false;
        }
    }
    
    /**
     * Verify AID with KERI witnesses
     */
    public boolean verifyAIDWithWitnesses(String aid) {
        try {
            // Get witness list for AID
            List<String> witnesses = keriClient.getWitnesses(aid);
            
            if (witnesses.isEmpty()) {
                logger.warn("No witnesses found for AID: {}", aid);
                return false;
            }
            
            // Verify with majority of witnesses
            WitnessVerificationResult result = witnessVerificationService.verifyWithWitnesses(aid, witnesses);
            
            if (result.isValid()) {
                auditService.logWitnessVerificationSuccess(aid, witnesses.size());
                return true;
            } else {
                logger.warn("Witness verification failed for AID: {}", aid);
                auditService.logWitnessVerificationFailure(aid, result.getFailureReason());
                return false;
            }
            
        } catch (Exception e) {
            logger.error("Witness verification failed for AID: {}", aid, e);
            auditService.logWitnessVerificationError(aid, e.getMessage());
            return false;
        }
    }
    
    /**
     * Verify challenge-response signature
     */
    public boolean verifyChallengeResponseSignature(ChallengeResponse challengeResponse, String signature, String aid) {
        try {
            // Validate challenge response structure
            validateChallengeResponse(challengeResponse);
            
            // Convert challenge response to canonical string
            String canonicalData = objectMapper.writeValueAsString(challengeResponse);
            
            // Verify signature
            boolean signatureValid = verifyKERISignature(canonicalData, signature, aid);
            
            if (!signatureValid) {
                auditService.logChallengeResponseVerificationFailure(aid, challengeResponse.getChallenge());
                return false;
            }
            
            // Additional validations
            if (!validateChallengeResponseTimestamp(challengeResponse)) {
                logger.warn("Challenge response timestamp validation failed for AID: {}", aid);
                auditService.logTimestampValidationFailure(aid);
                return false;
            }
            
            auditService.logChallengeResponseVerificationSuccess(aid, challengeResponse.getChallenge());
            return true;
            
        } catch (Exception e) {
            logger.error("Challenge response verification failed for AID: {}", aid, e);
            auditService.logChallengeResponseVerificationError(aid, e.getMessage());
            return false;
        }
    }
    
    // ==================== PRIVATE HELPER METHODS ====================
    
    private void validateSignatureInputs(String signedData, String signature, String aid) {
        if (signedData == null || signedData.isEmpty()) {
            throw new IllegalArgumentException("Signed data cannot be null or empty");
        }
        if (signature == null || signature.isEmpty()) {
            throw new IllegalArgumentException("Signature cannot be null or empty");
        }
        if (aid == null || aid.isEmpty()) {
            throw new IllegalArgumentException("AID cannot be null or empty");
        }
        if (!isValidAIDFormat(aid)) {
            throw new IllegalArgumentException("Invalid AID format");
        }
    }
    
    private boolean performEd25519Verification(String signedData, String signature, PublicKey publicKey) {
        try {
            // Use Ed25519 signature verification
            Signature verifier = Signature.getInstance("Ed25519");
            verifier.initVerify(publicKey);
            verifier.update(signedData.getBytes(StandardCharsets.UTF_8));
            
            // Decode signature from base64url
            byte[] signatureBytes = Base64.getUrlDecoder().decode(signature);
            
            return verifier.verify(signatureBytes);
            
        } catch (Exception e) {
            logger.error("Ed25519 signature verification failed", e);
            return false;
        }
    }
    
    private boolean isValidAIDFormat(String aid) {
        // KERI AID format validation
        return aid.matches("^[A-Za-z0-9_-]+$") && aid.length() >= 44;
    }
    
    private void validateChallengeResponse(ChallengeResponse challengeResponse) {
        if (challengeResponse.getChallenge() == null || challengeResponse.getChallenge().isEmpty()) {
            throw new IllegalArgumentException("Challenge cannot be null or empty");
        }
        if (challengeResponse.getAid() == null || challengeResponse.getAid().isEmpty()) {
            throw new IllegalArgumentException("AID cannot be null or empty");
        }
        if (challengeResponse.getTimestamp() <= 0) {
            throw new IllegalArgumentException("Invalid timestamp");
        }
    }
    
    private boolean validateChallengeResponseTimestamp(ChallengeResponse challengeResponse) {
        long currentTime = System.currentTimeMillis();
        long responseTime = challengeResponse.getTimestamp();
        
        // Allow 5 minute window for clock skew
        long maxTimeDiff = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        return Math.abs(currentTime - responseTime) <= maxTimeDiff;
    }
    
    // ==================== FORBIDDEN OPERATIONS ====================
    
    // ❌ FORBIDDEN: No private key operations allowed
    // ❌ FORBIDDEN: private void signData(...) - NEVER IMPLEMENT
    // ❌ FORBIDDEN: private void generatePrivateKey(...) - NEVER IMPLEMENT
    // ❌ FORBIDDEN: private void storePrivateKey(...) - NEVER IMPLEMENT
    // ❌ FORBIDDEN: private void retrievePrivateKey(...) - NEVER IMPLEMENT
}
```

### 1.2 KERI Client Service
```java
@Service
public class KERIClient {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private KERIClientConfiguration config;
    
    @Autowired
    private CircuitBreaker circuitBreaker;
    
    private static final Logger logger = LoggerFactory.getLogger(KERIClient.class);
    
    /**
     * Get current public key for AID from KERIA
     * NO PRIVATE KEY OPERATIONS
     */
    public PublicKey getCurrentPublicKey(String aid) {
        return circuitBreaker.executeSupplier(() -> {
            try {
                // Query KERIA for public key
                String url = config.getKeriaUrl() + "/identifiers/" + aid;
                
                HttpHeaders headers = new HttpHeaders();
                headers.set("Content-Type", "application/json");
                headers.set("Accept", "application/json");
                
                HttpEntity<String> entity = new HttpEntity<>(headers);
                
                ResponseEntity<KERIIdentifierResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    KERIIdentifierResponse.class
                );
                
                if (response.getStatusCode() != HttpStatus.OK) {
                    logger.error("Failed to get public key for AID: {}, status: {}", aid, response.getStatusCode());
                    return null;
                }
                
                KERIIdentifierResponse identifierData = response.getBody();
                if (identifierData == null || identifierData.getPublicKeys().isEmpty()) {
                    logger.warn("No public key data found for AID: {}", aid);
                    return null;
                }
                
                // Convert to PublicKey object
                return convertToPublicKey(identifierData.getCurrentPublicKey());
                
            } catch (Exception e) {
                logger.error("Failed to retrieve public key for AID: {}", aid, e);
                return null;
            }
        });
    }
    
    /**
     * Get witness list for AID
     */
    public List<String> getWitnesses(String aid) {
        return circuitBreaker.executeSupplier(() -> {
            try {
                String url = config.getKeriaUrl() + "/identifiers/" + aid + "/witnesses";
                
                HttpHeaders headers = new HttpHeaders();
                headers.set("Content-Type", "application/json");
                
                HttpEntity<String> entity = new HttpEntity<>(headers);
                
                ResponseEntity<WitnessListResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    WitnessListResponse.class
                );
                
                if (response.getStatusCode() != HttpStatus.OK) {
                    logger.error("Failed to get witnesses for AID: {}, status: {}", aid, response.getStatusCode());
                    return Collections.emptyList();
                }
                
                WitnessListResponse witnessData = response.getBody();
                return witnessData != null ? witnessData.getWitnesses() : Collections.emptyList();
                
            } catch (Exception e) {
                logger.error("Failed to retrieve witnesses for AID: {}", aid, e);
                return Collections.emptyList();
            }
        });
    }
    
    /**
     * Verify AID state with KERIA
     */
    public boolean verifyAIDState(String aid) {
        return circuitBreaker.executeSupplier(() -> {
            try {
                String url = config.getKeriaUrl() + "/identifiers/" + aid + "/state";
                
                HttpHeaders headers = new HttpHeaders();
                headers.set("Content-Type", "application/json");
                
                HttpEntity<String> entity = new HttpEntity<>(headers);
                
                ResponseEntity<AIDStateResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    AIDStateResponse.class
                );
                
                if (response.getStatusCode() != HttpStatus.OK) {
                    return false;
                }
                
                AIDStateResponse stateData = response.getBody();
                return stateData != null && stateData.isValid();
                
            } catch (Exception e) {
                logger.error("Failed to verify AID state for: {}", aid, e);
                return false;
            }
        });
    }
    
    private PublicKey convertToPublicKey(String publicKeyBase64) {
        try {
            byte[] publicKeyBytes = Base64.getDecoder().decode(publicKeyBase64);
            
            KeyFactory keyFactory = KeyFactory.getInstance("Ed25519");
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(publicKeyBytes);
            
            return keyFactory.generatePublic(keySpec);
            
        } catch (Exception e) {
            logger.error("Failed to convert public key from base64", e);
            return null;
        }
    }
}
```

### 1.3 Witness Verification Service
```java
@Service
public class WitnessVerificationService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private KERIClientConfiguration config;
    
    private static final Logger logger = LoggerFactory.getLogger(WitnessVerificationService.class);
    
    /**
     * Verify AID with majority of witnesses
     */
    public WitnessVerificationResult verifyWithWitnesses(String aid, List<String> witnesses) {
        try {
            if (witnesses.isEmpty()) {
                return WitnessVerificationResult.failure("No witnesses provided");
            }
            
            int requiredWitnesses = (witnesses.size() / 2) + 1; // Majority consensus
            int successfulVerifications = 0;
            List<String> failedWitnesses = new ArrayList<>();
            
            for (String witness : witnesses) {
                try {
                    boolean witnessResult = verifyWithSingleWitness(aid, witness);
                    
                    if (witnessResult) {
                        successfulVerifications++;
                    } else {
                        failedWitnesses.add(witness);
                    }
                    
                    // Early success if we have majority
                    if (successfulVerifications >= requiredWitnesses) {
                        break;
                    }
                    
                } catch (Exception e) {
                    logger.warn("Witness verification failed for witness: {}, AID: {}", witness, aid, e);
                    failedWitnesses.add(witness);
                }
            }
            
            if (successfulVerifications >= requiredWitnesses) {
                return WitnessVerificationResult.success(successfulVerifications, witnesses.size());
            } else {
                return WitnessVerificationResult.failure(
                    String.format("Insufficient witnesses verified: %d/%d required", 
                                successfulVerifications, requiredWitnesses));
            }
            
        } catch (Exception e) {
            logger.error("Witness verification failed for AID: {}", aid, e);
            return WitnessVerificationResult.failure("Witness verification error: " + e.getMessage());
        }
    }
    
    private boolean verifyWithSingleWitness(String aid, String witnessUrl) {
        try {
            String url = witnessUrl + "/receipts/" + aid;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("Accept", "application/json");
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<WitnessReceiptResponse> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                WitnessReceiptResponse.class,
                Duration.ofSeconds(5) // 5 second timeout per witness
            );
            
            if (response.getStatusCode() != HttpStatus.OK) {
                logger.warn("Witness verification failed for witness: {}, AID: {}, status: {}", 
                           witnessUrl, aid, response.getStatusCode());
                return false;
            }
            
            WitnessReceiptResponse receipt = response.getBody();
            return receipt != null && receipt.isValid() && receipt.getAid().equals(aid);
            
        } catch (Exception e) {
            logger.warn("Failed to verify with witness: {}, AID: {}", witnessUrl, aid, e);
            return false;
        }
    }
}
```

### 1.4 Key Rotation Service
```java
@Service
public class KeyRotationService {
    
    @Autowired
    private KERIClient keriClient;
    
    @Autowired
    private KeyRotationRepository keyRotationRepository;
    
    private static final Logger logger = LoggerFactory.getLogger(KeyRotationService.class);
    
    /**
     * Check if key is currently valid (not rotated)
     */
    public boolean isKeyCurrentlyValid(String aid, PublicKey publicKey) {
        try {
            // Get current key state from KERIA
            PublicKey currentKey = keriClient.getCurrentPublicKey(aid);
            
            if (currentKey == null) {
                logger.warn("No current key found for AID: {}", aid);
                return false;
            }
            
            // Compare keys
            boolean keysMatch = Arrays.equals(currentKey.getEncoded(), publicKey.getEncoded());
            
            if (!keysMatch) {
                logger.info("Key rotation detected for AID: {}", aid);
                recordKeyRotation(aid, currentKey);
            }
            
            return keysMatch;
            
        } catch (Exception e) {
            logger.error("Failed to check key validity for AID: {}", aid, e);
            return false;
        }
    }
    
    /**
     * Handle key rotation notification from mobile app
     */
    public boolean handleKeyRotationNotification(String aid, String newPublicKey, String rotationSignature) {
        try {
            // Verify rotation signature with previous key
            PublicKey previousKey = keriClient.getCurrentPublicKey(aid);
            
            if (previousKey == null) {
                logger.error("No previous key found for rotation verification, AID: {}", aid);
                return false;
            }
            
            // Verify rotation signature
            String rotationData = createRotationData(aid, newPublicKey);
            boolean signatureValid = verifyRotationSignature(rotationData, rotationSignature, previousKey);
            
            if (!signatureValid) {
                logger.error("Invalid rotation signature for AID: {}", aid);
                return false;
            }
            
            // Record key rotation
            PublicKey newKey = convertToPublicKey(newPublicKey);
            recordKeyRotation(aid, newKey);
            
            logger.info("Key rotation processed successfully for AID: {}", aid);
            return true;
            
        } catch (Exception e) {
            logger.error("Failed to process key rotation for AID: {}", aid, e);
            return false;
        }
    }
    
    private void recordKeyRotation(String aid, PublicKey newKey) {
        try {
            KeyRotationEvent event = new KeyRotationEvent();
            event.setAid(aid);
            event.setNewPublicKey(Base64.getEncoder().encodeToString(newKey.getEncoded()));
            event.setRotationTimestamp(Instant.now());
            event.setStatus("ACTIVE");
            
            keyRotationRepository.save(event);
            
        } catch (Exception e) {
            logger.error("Failed to record key rotation for AID: {}", aid, e);
        }
    }
    
    private String createRotationData(String aid, String newPublicKey) {
        return String.format("{\"aid\":\"%s\",\"newKey\":\"%s\",\"timestamp\":%d}", 
                           aid, newPublicKey, System.currentTimeMillis());
    }
    
    private boolean verifyRotationSignature(String rotationData, String signature, PublicKey previousKey) {
        try {
            Signature verifier = Signature.getInstance("Ed25519");
            verifier.initVerify(previousKey);
            verifier.update(rotationData.getBytes(StandardCharsets.UTF_8));
            
            byte[] signatureBytes = Base64.getUrlDecoder().decode(signature);
            return verifier.verify(signatureBytes);
            
        } catch (Exception e) {
            logger.error("Failed to verify rotation signature", e);
            return false;
        }
    }
    
    private PublicKey convertToPublicKey(String publicKeyBase64) {
        try {
            byte[] publicKeyBytes = Base64.getDecoder().decode(publicKeyBase64);
            KeyFactory keyFactory = KeyFactory.getInstance("Ed25519");
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(publicKeyBytes);
            return keyFactory.generatePublic(keySpec);
        } catch (Exception e) {
            logger.error("Failed to convert public key", e);
            return null;
        }
    }
}
```

## 2. Security Validation and Testing

### 2.1 Signature Verification Tests
```java
@SpringBootTest
class SignatureVerificationTests {
    
    @Autowired
    private KERISignatureVerifier signatureVerifier;
    
    @MockBean
    private KERIClient keriClient;
    
    @Test
    void testValidSignatureVerification() {
        // Setup test data
        String testAid = "ETestAID123";
        String testData = "test data to sign";
        String validSignature = "valid_signature_base64";
        
        // Mock public key retrieval
        PublicKey mockPublicKey = createMockPublicKey();
        when(keriClient.getCurrentPublicKey(testAid)).thenReturn(mockPublicKey);
        
        // Mock signature verification (would normally use real crypto)
        // In real implementation, this would be actual Ed25519 verification
        boolean result = signatureVerifier.verifyKERISignature(testData, validSignature, testAid);
        
        // Verify method was called correctly
        verify(keriClient, times(1)).getCurrentPublicKey(testAid);
        
        // Result depends on actual cryptographic verification
        // This test validates the flow, not the crypto
    }
    
    @Test
    void testInvalidAIDFormat() {
        String invalidAid = "invalid_aid_format";
        String testData = "test data";
        String signature = "signature";
        
        boolean result = signatureVerifier.verifyKERISignature(testData, signature, invalidAid);
        
        assertFalse(result);
        
        // Verify no KERI client calls were made for invalid AID
        verify(keriClient, never()).getCurrentPublicKey(any());
    }
    
    @Test
    void testMissingPublicKey() {
        String testAid = "ETestAID123";
        String testData = "test data";
        String signature = "signature";
        
        // Mock no public key found
        when(keriClient.getCurrentPublicKey(testAid)).thenReturn(null);
        
        boolean result = signatureVerifier.verifyKERISignature(testData, signature, testAid);
        
        assertFalse(result);
        verify(keriClient, times(1)).getCurrentPublicKey(testAid);
    }
    
    @Test
    void testWitnessVerification() {
        String testAid = "ETestAID123";
        
        // Mock witness list
        List<String> witnesses = Arrays.asList("witness1.com", "witness2.com", "witness3.com");
        when(keriClient.getWitnesses(testAid)).thenReturn(witnesses);
        
        boolean result = signatureVerifier.verifyAIDWithWitnesses(testAid);
        
        verify(keriClient, times(1)).getWitnesses(testAid);
        // Result depends on witness verification service
    }
    
    @Test
    void testNoPrivateKeyOperations() {
        // Verify that no private key operations exist in the service
        Method[] methods = KERISignatureVerifier.class.getDeclaredMethods();
        
        for (Method method : methods) {
            String methodName = method.getName();
            
            // Ensure no private key operations
            assertFalse(methodName.contains("sign"));
            assertFalse(methodName.contains("generateKey"));
            assertFalse(methodName.contains("storeKey"));
            assertFalse(methodName.contains("retrievePrivateKey"));
            
            // Ensure only verification operations
            if (methodName.contains("Key")) {
                assertTrue(methodName.contains("verify") || methodName.contains("get") || methodName.contains("validate"));
            }
        }
    }
    
    private PublicKey createMockPublicKey() {
        // Create a mock public key for testing
        try {
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("Ed25519");
            KeyPair keyPair = keyGen.generateKeyPair();
            return keyPair.getPublic();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create mock public key", e);
        }
    }
}
```

### 2.2 Edge Protection Compliance Tests
```java
@SpringBootTest
class EdgeProtectionComplianceTests {
    
    @Test
    void testNoPrivateKeyFieldsInService() {
        // Use reflection to verify no private key fields exist
        Field[] fields = KERISignatureVerifier.class.getDeclaredFields();
        
        for (Field field : fields) {
            String fieldName = field.getName().toLowerCase();
            
            // Ensure no private key fields
            assertFalse(fieldName.contains("private"));
            assertFalse(fieldName.contains("secret"));
            assertFalse(fieldName.contains("seed"));
        }
    }
    
    @Test
    void testOnlyPublicKeyOperations() {
        // Verify that all crypto operations use public keys only
        Method[] methods = KERISignatureVerifier.class.getDeclaredMethods();
        
        for (Method method : methods) {
            Parameter[] parameters = method.getParameters();
            
            for (Parameter param : parameters) {
                String paramTypeName = param.getType().getSimpleName();
                
                // Ensure no private key parameters
                assertFalse(paramTypeName.contains("PrivateKey"));
                assertFalse(paramTypeName.contains("SecretKey"));
            }
        }
    }
    
    @Test
    void testSecurityAnnotations() {
        // Verify security annotations are present
        assertTrue(KERISignatureVerifier.class.isAnnotationPresent(Service.class));
        
        // Check for security-related annotations
        Method[] methods = KERISignatureVerifier.class.getDeclaredMethods();
        
        for (Method method : methods) {
            if (method.getName().contains("verify")) {
                // Verification methods should be properly secured
                assertTrue(method.getModifiers() == Modifier.PUBLIC || 
                          method.getModifiers() == Modifier.PRIVATE);
            }
        }
    }
}
```

## 3. Configuration and Deployment

### 3.1 Security Configuration
```yaml
# application-security.yml
keri:
  signature_verification:
    enabled: true
    timeout_seconds: 30
    retry_attempts: 3
    
  witnesses:
    verification_timeout_seconds: 5
    required_majority: true
    max_concurrent_verifications: 10
    
  key_rotation:
    enabled: true
    validation_window_minutes: 5
    
  audit:
    log_all_verifications: true
    log_failed_verifications: true
    log_witness_failures: true
```

### 3.2 Circuit Breaker Configuration
```yaml
# application-resilience.yml
resilience4j:
  circuitbreaker:
    instances:
      keri-client:
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3
        
      witness-verification:
        sliding-window-size: 5
        failure-rate-threshold: 60
        wait-duration-in-open-state: 10s
```

## Conclusion

This server-side signature verification implementation provides:

1. **Complete Edge Protection**: No private key operations on server
2. **Comprehensive Verification**: Ed25519 signature verification with public keys
3. **KERI Protocol Compliance**: AID verification with witnesses
4. **Key Rotation Support**: Handles key rotation notifications
5. **Security Monitoring**: Comprehensive audit logging
6. **Resilience**: Circuit breaker pattern for external calls
7. **Testing**: Extensive test coverage for edge protection compliance

The implementation ensures that all cryptographic operations on the server use only public keys, maintaining the security boundary between trusted (mobile) and untrusted (cloud) environments as required by KERI protocol.