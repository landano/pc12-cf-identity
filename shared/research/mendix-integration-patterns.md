# Mendix Integration Patterns for Veridian Identity Platform

**Related to:** ISSUE-021

## Overview
This document defines integration patterns for implementing the Veridian Identity platform within the Mendix low-code architecture for the Landano land rights NFT verification system using a **hybrid QR code linking approach** that maintains KERI edge protection.

## ⚠️ **CRITICAL ARCHITECTURAL PRINCIPLE**
**Private keys NEVER leave the Veridian mobile app.** All cryptographic operations occur on the user's mobile device. Mendix serves only as a business logic layer and secure data coordinator.

## Core Integration Architecture - Hybrid QR Code Linking

### 1. Architectural Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Veridian Mobile App (Edge)     ↔     Mendix Web App (Cloud)   │
│  ├── Private keys stored                ├── Business logic      │
│  ├── All signing operations             ├── User interface      │
│  ├── KERI AID management                ├── Data management     │
│  └── QR code scanning                   └── QR code generation │
│                                                                 │
│           Connection via QR Code Challenge-Response            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Mendix Platform Integration Points

#### Module Structure (Revised for Hybrid Approach)
```
LandanoVeridianIdentity/
├── JavaActions/
│   ├── QRCodeGenerator.java              // Generate linking QR codes
│   ├── SignatureVerifier.java            // Verify KERI signatures
│   ├── ChallengeManager.java             // Manage auth challenges
│   └── CardanoNFTQuerier.java            // Query NFT ownership
├── Resources/
│   ├── qr-code-display.js                // QR code UI handling
│   └── signature-validation.js           // Client-side validation
├── Microflows/
│   ├── InitiateAccountLinking.mf         // Start QR linking process
│   ├── VerifyAccountConnection.mf        // Verify signed response
│   └── VerifyNFTOwnership.mf             // Validate NFT ownership
├── REST/
│   ├── VeridianLinkingService.published  // Callback endpoints
│   └── NFTVerificationService.published  // Verification APIs
└── Pages/
    ├── AccountLinking.page.xml           // QR code display
    └── NFTVerification.page.xml          // Verification UI
```

### 3. QR Code Linking Implementation

#### Challenge Generation (Mendix Server-Side)
```java
@UserAction
public class GenerateAccountLinkingChallenge extends CoreJavaAction<String> {
    
    @JavaActionParameter
    private IMendixObject currentUser;
    
    @Override
    public String executeAction() throws Exception {
        try {
            // Generate cryptographically secure challenge
            String challenge = generateSecureChallenge();
            String sessionId = UUID.randomUUID().toString();
            String encryptedUserId = encryptUserId(currentUser.getId());
            
            // Create QR code data
            QRCodeData qrData = QRCodeData.builder()
                .version("1.0")
                .type("landano_account_linking")
                .challenge(challenge)
                .sessionId(sessionId)
                .callbackUrl("https://api.landano.io/veridian/link")
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .mendixUserId(encryptedUserId)
                .build();
            
            // Store pending challenge for verification
            storePendingChallenge(challenge, sessionId, currentUser.getId());
            
            // Generate QR code image
            return generateQRCodeImage(qrData.toJson());
            
        } catch (Exception e) {
            logger.error("Failed to generate linking challenge", e);
            throw new UserException("Failed to generate QR code: " + e.getMessage());
        }
    }
}
```

#### Signature Verification (Mendix Server-Side)
```java
@RestController
@RequestMapping("/veridian")
public class VeridianLinkingController {
    
    @PostMapping("/link")
    public ResponseEntity<LinkingResponse> verifyAccountLink(@RequestBody LinkingRequest request) {
        try {
            // Extract signature components
            String challenge = request.getChallenge();
            String sessionId = request.getSessionId();
            String veridianAID = request.getVeridianAID();
            String signature = request.getSignature();
            String signedData = request.getSignedData();
            
            // Validate challenge exists and is not expired
            PendingChallenge pendingChallenge = validateAndRetrieveChallenge(challenge, sessionId);
            if (pendingChallenge == null || pendingChallenge.isExpired()) {
                return ResponseEntity.badRequest().body(
                    new LinkingResponse(false, "Invalid or expired challenge"));
            }
            
            // Verify KERI signature (NO PRIVATE KEY OPERATIONS ON SERVER)
            boolean signatureValid = verifyKERISignature(signedData, signature, veridianAID);
            
            // Validate AID with KERIA witnesses
            boolean aidValid = validateAIDWithWitnesses(veridianAID);
            
            if (signatureValid && aidValid) {
                // Create permanent account link
                createAccountLink(pendingChallenge.getMendixUserId(), veridianAID, signature);
                
                // Clean up pending challenge
                deletePendingChallenge(challenge, sessionId);
                
                return ResponseEntity.ok(new LinkingResponse(true, "Account linked successfully"));
            } else {
                return ResponseEntity.badRequest().body(
                    new LinkingResponse(false, "Signature verification failed"));
            }
            
        } catch (Exception e) {
            logger.error("Account linking failed", e);
            return ResponseEntity.internalServerError().body(
                new LinkingResponse(false, "Internal server error"));
        }
    }
}
```

### 4. Account Linking Workflow

#### Complete Linking Process
```
Mendix Web App                          Veridian Mobile App
├── 1. User clicks "Link Account"       ├── 8. User scans QR code
├── 2. Generate challenge + session     ├── 9. Parse QR code data
├── 3. Create QR code                   ├── 10. Display link confirmation
├── 4. Display QR code                  ├── 11. User confirms linking
├── 5. Wait for mobile response         ├── 12. Sign challenge with AID
├── 6. Receive signed response          ├── 13. POST to callback URL
├── 7. Verify signature                 ├── 14. Receive confirmation
└── 15. Account successfully linked     └── 15. Display success message
```

### 5. Data Management Patterns

#### Entity Model (Revised for Hybrid Approach)
```
Entity: VeridianAccountLink
- LinkID (String, Key)
- MendixUserID (String)
- VeridianAID (String) // KERI Identifier
- LinkSignature (String) // Proof of linking
- LinkTimestamp (DateTime)
- LastVerified (DateTime)
- Status (Enum: Active, Expired, Revoked)
- WitnessReceipts (String, JSON)

Entity: PendingChallenge
- ChallengeID (String, Key)
- SessionID (String)
- Challenge (String)
- MendixUserID (String)
- ExpiresAt (DateTime)
- CreatedAt (DateTime)

Entity: NFTVerificationResult
- VerificationID (String, Key)
- MendixUserID (String)
- VeridianAID (String)
- PolicyID (String)
- AssetName (String)
- VerificationResult (Boolean)
- VerificationTimestamp (DateTime)
- CardanoAddress (String)
```

### 6. NFT Verification Integration

#### NFT Ownership Verification (Leveraging Linked Account)
```java
@UserAction
public class VerifyNFTOwnership extends CoreJavaAction<Boolean> {
    
    @JavaActionParameter
    private String policyId;
    
    @JavaActionParameter
    private String assetName;
    
    @JavaActionParameter
    private IMendixObject currentUser;
    
    @Override
    public Boolean executeAction() throws Exception {
        try {
            // Get linked Veridian account
            VeridianAccountLink accountLink = getLinkedAccount(currentUser.getId());
            if (accountLink == null || !accountLink.isActive()) {
                throw new UserException("No active Veridian account linked");
            }
            
            // Query NFT metadata from Cardano
            NFTMetadata nftMetadata = queryNFTMetadata(policyId, assetName);
            if (nftMetadata == null) {
                return false;
            }
            
            // Extract KERI AID from NFT metadata
            String nftKeriAID = nftMetadata.getKeriAID();
            if (nftKeriAID == null) {
                return false;
            }
            
            // Verify AID matches linked account
            boolean aidMatches = accountLink.getVeridianAID().equals(nftKeriAID);
            
            // Additional verification: Query Cardano wallet for NFT ownership
            boolean walletOwnsNFT = verifyWalletOwnership(policyId, assetName, accountLink.getVeridianAID());
            
            // Store verification result
            storeVerificationResult(currentUser.getId(), accountLink.getVeridianAID(), 
                                 policyId, assetName, aidMatches && walletOwnsNFT);
            
            return aidMatches && walletOwnsNFT;
            
        } catch (Exception e) {
            logger.error("NFT ownership verification failed", e);
            throw new UserException("Verification failed: " + e.getMessage());
        }
    }
}
```

### 7. Security Implementation (Hybrid Approach)

#### ⚠️ **NO PRIVATE KEY OPERATIONS ON MENDIX SERVER**
```java
public class SecureSignatureVerifier {
    
    // ONLY public key operations allowed on server
    public boolean verifyKERISignature(String signedData, String signature, String aid) {
        try {
            // Retrieve public key from KERIA (NOT private key)
            PublicKey publicKey = retrievePublicKeyFromKERIA(aid);
            
            // Verify signature using public key only
            Signature verifier = Signature.getInstance("Ed25519");
            verifier.initVerify(publicKey);
            verifier.update(signedData.getBytes());
            
            return verifier.verify(Base64.getDecoder().decode(signature));
            
        } catch (Exception e) {
            logger.error("Signature verification failed for AID: {}", aid, e);
            return false;
        }
    }
    
    // NO PRIVATE KEY STORAGE - Only metadata storage
    public void storeAccountLinkMetadata(String mendixUserId, String veridianAID, String linkSignature) {
        AccountLinkEntity entity = new AccountLinkEntity();
        entity.setMendixUserId(mendixUserId);
        entity.setVeridianAID(veridianAID);  // Public identifier
        entity.setLinkSignature(linkSignature);  // Proof of linking
        entity.setTimestamp(Instant.now());
        
        // NO PRIVATE KEYS STORED - Only public identifiers and proofs
        accountLinkRepository.save(entity);
    }
}
```

#### Transport Security
```xml
<runtime-settings>
    <custom-settings>
        <setting name="keri.tls.version">TLSv1.3</setting>
        <setting name="keri.cert.pinning">true</setting>
        <setting name="keri.mutual.tls">true</setting>
    </custom-settings>
</runtime-settings>
```

### 5. Cardano Integration Patterns

#### CIP-30 Wallet Connection
```javascript
// JavaScript for wallet integration
async function connectCardanoWallet() {
    if (window.cardano) {
        const walletApi = await window.cardano.nami.enable();
        const addresses = await walletApi.getUsedAddresses();
        const balance = await walletApi.getBalance();
        
        return {
            connected: true,
            addresses: addresses,
            balance: balance
        };
    }
    throw new Error("No Cardano wallet found");
}
```

#### NFT Verification Microflow
```
VerifyNFTOwnership:
1. ConnectToCardanoWallet (JavaScript)
2. QueryNFTsByPolicyID (REST Call to Cardano)
3. ExtractKERIAIDFromMetadata (JavaAction)
4. VerifyKERIIdentityOwnership (REST Call to Veridian)
5. ValidateCredentialPresentation (JavaAction)
6. GenerateVerificationResult (Database)
7. ReturnVerificationStatus
```

### 6. Data Management Patterns

#### Entity Model
```
Entity: KERIIdentifier
- AID (String, Key)
- Name (String)
- PublicKeys (String, JSON)
- Witnesses (String, JSON)
- Status (Enum: Active, Rotated, Revoked)
- CreatedDate (DateTime)
- Owner (Association to User)

Entity: ACDCCredential
- CredentialID (String, Key)
- SchemaID (String)
- IssuerAID (String)
- HolderAID (String)
- CredentialData (String, JSON)
- ExpirationDate (DateTime)
- Status (Enum: Issued, Revoked, Expired)

Entity: NFTVerification
- VerificationID (String, Key)
- PolicyID (String)
- AssetName (String)
- KERIAID (String)
- CardanoAddress (String)
- VerificationResult (Boolean)
- VerificationDate (DateTime)
```

#### Database Security
```java
@Entity
@Table(name = "KERI_IDENTIFIER")
@EncryptedEntity
public class KERIIdentifierEntity {
    @Id
    private String aid;
    
    @Column(name = "private_keys")
    @Encrypted
    private String encryptedPrivateKeys;
    
    @Column(name = "public_keys")
    private String publicKeys;
}
```

### 7. User Interface Patterns

#### Identity Management Dashboard
```xml
<page name="IdentityManagement">
    <layout-grid>
        <row>
            <cell>
                <data-view entity="KERIIdentifier">
                    <microflow-button action="CreateNewIdentity"/>
                    <microflow-button action="RotateKeys"/>
                    <microflow-button action="RevokeIdentity"/>
                </data-view>
            </cell>
        </row>
    </layout-grid>
</page>
```

#### NFT Verification Interface
```xml
<page name="NFTVerification">
    <container>
        <text-box name="PolicyID" placeholder="Enter Policy ID"/>
        <text-box name="AssetName" placeholder="Enter Asset Name"/>
        <action-button action="ConnectWallet" caption="Connect Wallet"/>
        <action-button action="VerifyOwnership" caption="Verify Ownership"/>
        <data-view entity="VerificationResult"/>
    </container>
</page>
```

### 8. Error Handling and Logging

#### Error Management
```java
public class KERIExceptionHandler {
    public static void handleKERIException(Exception e) {
        switch (e.getClass().getSimpleName()) {
            case "KeyRotationException":
                logSecurityEvent("Key rotation failed", e);
                break;
            case "WitnessUnavailableException":
                logAvailabilityEvent("Witness unavailable", e);
                break;
            default:
                logGeneralException("KERI operation failed", e);
        }
    }
}
```

#### Audit Logging
```java
public class KERIAuditLogger {
    public static void logIdentityOperation(String operation, String aid, String user) {
        AuditLogEntry entry = new AuditLogEntry();
        entry.setOperation(operation);
        entry.setAID(aid);
        entry.setUser(user);
        entry.setTimestamp(new Date());
        entry.setSecurityLevel("HIGH");
        
        persistAuditLog(entry);
    }
}
```

## Implementation Recommendations

### 1. Development Phases
1. **Phase 1**: Basic KERI AID creation and management
2. **Phase 2**: Credential issuance and verification
3. **Phase 3**: Cardano wallet integration
4. **Phase 4**: NFT verification workflows
5. **Phase 5**: Advanced security features

### 2. Security Best Practices
- Use Mendix's built-in encryption for sensitive data
- Implement proper access controls and user roles
- Regular security audits of custom Java actions
- Secure key storage using hardware security modules
- Comprehensive audit logging for all identity operations

### 3. Performance Considerations
- Cache frequently accessed KERI data
- Use asynchronous operations for long-running tasks
- Implement proper connection pooling for API calls
- Optimize database queries for large-scale operations

### 4. Testing Strategy
- Unit tests for all Java actions
- Integration tests for API connectivity
- Security tests for key management
- End-to-end tests for complete workflows
- Performance tests for scalability validation

This integration pattern provides a comprehensive approach to implementing Veridian Identity platform capabilities within the Mendix architecture while maintaining security, scalability, and usability for land rights NFT verification.