# Technical Integration Specification - Veridian Identity Platform

## Document Overview
This comprehensive technical specification defines the **hybrid QR code linking integration** approach for the Veridian Identity platform within the Mendix architecture for the Landano land rights NFT verification system, incorporating KERI protocol compliance and enterprise-grade security while maintaining edge protection.

## ⚠️ **ARCHITECTURAL CORRECTION**
**This specification has been updated to reflect a hybrid approach where private keys NEVER leave the Veridian mobile app.** The original server-side key management approach has been replaced with QR code challenge-response linking that maintains KERI edge protection principles.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [API Integration Specifications](#api-integration-specifications)
3. [Authentication and Security](#authentication-and-security)
4. [Data Formats and Protocols](#data-formats-and-protocols)
5. [Implementation Components](#implementation-components)
6. [Integration Patterns](#integration-patterns)
7. [Security Implementation](#security-implementation)
8. [Testing and Validation](#testing-and-validation)
9. [Deployment Guidelines](#deployment-guidelines)
10. [Maintenance and Operations](#maintenance-and-operations)

## 1. Architecture Overview

### 1.1 Hybrid System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Veridian Mobile App (Edge)     ↔     Mendix Web App (Cloud)   │
│  ├── Private keys stored               ├── Business logic       │
│  ├── All signing operations            ├── User interface       │
│  ├── KERI AID management               ├── Data management      │
│  ├── QR code scanning                  ├── QR code generation   │
│  └── Credential presentation           └── Signature verification│
│                                                                 │
│           Connection: QR Code Challenge-Response               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    Integration Layers                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mendix Application Layer                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Account   │  │    QR Code  │  │ Verification│  │  Audit  │ │
│  │   Linking   │  │  Challenge  │  │   Engine    │  │ Service │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│                                                                 │
│  Veridian Integration Layer (Public Operations Only)           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   KERIA     │  │  Signature  │  │   Public    │  │  KERI   │ │
│  │Query Agent  │  │Verification │  │Verification │  │Protocol │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│                                                                 │
│  Cardano Integration Layer                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │     NFT     │  │   Policy    │  │   Metadata  │  │ Balance │ │
│  │   Querying  │  │   Engine    │  │  Extraction │  │Verification│
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Responsibilities

#### Veridian Mobile App (Edge Layer) - **PRIVATE KEY OPERATIONS**
- **Private Key Storage**: Secure storage and management of KERI private keys
- **Cryptographic Signing**: All signature operations using Signify library
- **KERI AID Management**: Identifier creation, rotation, and recovery
- **QR Code Scanning**: Challenge-response authentication with Mendix
- **Credential Presentation**: ACDC credential presentation workflows

#### Mendix Application Layer - **PUBLIC OPERATIONS ONLY**
- **Account Linking**: QR code generation and verification workflows
- **Business Logic**: User interface and workflow management
- **Data Management**: Storage of public identifiers and verification results
- **NFT Verification**: Ownership validation logic (using linked accounts)
- **Audit Service**: Security event logging and compliance monitoring

#### Veridian Integration Layer - **PUBLIC VERIFICATION ONLY**
- **KERIA Query Agent**: Public key retrieval and AID state verification
- **Signature Verification**: Validate signatures using public keys only
- **Public Verification**: Witness receipt validation and AID status checks
- **KERI Protocol**: Public protocol operations (NO private key access)

#### Cardano Integration Layer
- **NFT Querying**: Query NFT metadata and ownership from blockchain
- **Policy Engine**: Landano-specific policy ID verification
- **Metadata Extraction**: Extract KERI AID from NFT metadata
- **Balance Verification**: Verify wallet balance claims

## 2. API Integration Specifications

### 2.1 Veridian API Endpoints

#### Base Configuration
```yaml
# Production Configuration
veridian_api:
  base_url: "https://api.veridian.id"
  keria_url: "https://keria.veridian.id"
  admin_port: 3901
  protocol_port: 3902
  boot_port: 3903
  timeout: 30000
  retry_attempts: 3

# Sandbox Configuration (for development and testing)
veridian_sandbox:
  boot_url: "https://keria-boot.demo.idw-sandboxes.cf-deployments.org"
  keria_url: "https://keria.demo.idw-sandboxes.cf-deployments.org"
  credential_ui_url: "https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org"
  timeout: 30000
  retry_attempts: 3
  environment: "sandbox"
```

#### Core API Endpoints

##### Identifier Management
```http
POST /identifiers
Content-Type: application/json
Authorization: Signify-AID {aid}

{
  "name": "landano-chief-001",
  "witnesses": ["witness1.veridian.id", "witness2.veridian.id"],
  "threshold": 2,
  "next_keys": ["BKxy..."],
  "delegation": null
}
```

##### Credential Operations
```http
POST /credentials/issue
Content-Type: application/json
Authorization: Signify-AID {issuer_aid}

{
  "issuer": "EAbcd...",
  "holder": "EBcde...",
  "schema": "ESchema123...",
  "registry": "ERegistry456...",
  "attributes": {
    "land_parcel_id": "LP-001",
    "rights_type": "ownership",
    "location": "coordinates",
    "issued_date": "2025-07-14T00:00:00Z"
  }
}
```

##### Verification Operations
```http
POST /credentials/verify
Content-Type: application/json

{
  "credential": "credential_data",
  "holder_aid": "EHolder789...",
  "presentation_signature": "signature_data"
}
```

### 2.2 Authentication Protocol

#### Request Signing Process
```javascript
function signRequest(method, path, body, privateKey, aid) {
    const timestamp = Date.now().toString();
    const resource = path;
    
    // Create signature input
    const signatureInput = `${method}\n${resource}\n${timestamp}\n${JSON.stringify(body)}`;
    
    // Sign with private key
    const signature = sodium.crypto_sign_detached(
        new TextEncoder().encode(signatureInput),
        privateKey
    );
    
    return {
        headers: {
            'Signify-Resource': resource,
            'Signify-Timestamp': timestamp,
            'Signify-AID': aid,
            'Signature-Input': base64url.encode(signature),
            'Content-Type': 'application/json'
        },
        body: body
    };
}
```

#### Response Validation
```javascript
function validateResponse(response, expectedAID) {
    const timestamp = response.headers['Signify-Timestamp'];
    const resource = response.headers['Signify-Resource'];
    const signature = response.headers['Signature'];
    
    // Verify timestamp freshness (30 second window)
    const responseTime = parseInt(timestamp);
    const now = Date.now();
    if (now - responseTime > 30000) {
        throw new Error('Response timestamp too old');
    }
    
    // Verify signature
    const signatureInput = `POST\n${resource}\n${timestamp}\n${response.body}`;
    const agentPublicKey = getAgentPublicKey(expectedAID);
    
    return sodium.crypto_sign_verify_detached(
        base64url.decode(signature),
        new TextEncoder().encode(signatureInput),
        agentPublicKey
    );
}
```

### 2.3 Error Handling and Retry Logic

#### Error Response Format
```json
{
  "error": {
    "code": "INVALID_SIGNATURE",
    "message": "Request signature validation failed",
    "details": {
      "aid": "EAbcd...",
      "timestamp": "1721001234567",
      "expected_signer": "EBcde..."
    },
    "retry_after": 5000
  }
}
```

#### Retry Strategy
```java
public class APIRetryManager {
    private static final int MAX_RETRIES = 3;
    private static final int BASE_DELAY = 1000;
    
    public <T> T executeWithRetry(Callable<T> operation) throws Exception {
        Exception lastException = null;
        
        for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                return operation.call();
            } catch (Exception e) {
                lastException = e;
                
                if (attempt < MAX_RETRIES - 1) {
                    int delay = BASE_DELAY * (int) Math.pow(2, attempt);
                    Thread.sleep(delay);
                }
            }
        }
        
        throw lastException;
    }
}
```

## 3. Authentication and Security

### 3.1 KERI-Based Authentication

#### AID Authentication Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant M as Mendix
    participant K as KERIA
    participant W as Witness
    
    C->>M: Authentication Request
    M->>C: Challenge String
    C->>C: Sign Challenge with Private Key
    C->>M: Signed Challenge + AID
    M->>K: Verify AID State
    K->>W: Request Witness Receipts
    W->>K: Witness Receipts
    K->>M: AID Verification Result
    M->>C: Authentication Success/Failure
```

#### Implementation
```java
public class KERIAuthenticationService {
    
    public AuthenticationResult authenticate(String aid, String signedChallenge) {
        // Step 1: Validate AID format
        if (!isValidAID(aid)) {
            return AuthenticationResult.failure("Invalid AID format");
        }
        
        // Step 2: Retrieve current public key from KERIA
        PublicKey currentKey = keriClient.getCurrentPublicKey(aid);
        
        // Step 3: Verify challenge signature
        boolean signatureValid = verifySignature(signedChallenge, currentKey);
        
        // Step 4: Check witness receipts
        boolean witnessesValid = validateWitnessReceipts(aid);
        
        // Step 5: Verify key rotation status
        boolean keysCurrent = checkKeyRotationStatus(aid);
        
        if (signatureValid && witnessesValid && keysCurrent) {
            return AuthenticationResult.success(aid);
        } else {
            return AuthenticationResult.failure("Authentication failed");
        }
    }
}
```

### 3.2 Transport Security

#### TLS 1.3 Configuration
```yaml
transport_security:
  tls_version: "1.3"
  cipher_suites:
    - "TLS_AES_256_GCM_SHA384"
    - "TLS_CHACHA20_POLY1305_SHA256"
  certificate_pinning:
    enabled: true
    pins:
      - "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
  mutual_tls:
    enabled: true
    client_cert_path: "/certs/client.p12"
    client_cert_password: "${CLIENT_CERT_PASSWORD}"
```

#### Certificate Pinning
```java
public class CertificatePinningInterceptor implements Interceptor {
    private static final String VERIDIAN_PIN = "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    
    @Override
    public Response intercept(Chain chain) throws IOException {
        Request request = chain.request();
        
        // Only apply pinning to Veridian API calls
        if (request.url().host().contains("veridian.id")) {
            return chain.proceed(request);
        }
        
        Response response = chain.proceed(request);
        
        // Validate certificate pin
        validateCertificatePin(response);
        
        return response;
    }
}
```

## 4. Data Formats and Protocols

### 4.1 KERI Data Structures

#### Identifier Format
```json
{
  "v": "KERI10JSON00011c_",
  "t": "icp",
  "d": "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
  "i": "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
  "s": "0",
  "kt": "1",
  "k": ["DAbHjobANVR_TRNJpfYEVGpFN-lAXKYmLmzFOiI="],
  "nt": "1",
  "n": ["EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao"],
  "bt": "2",
  "b": ["BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha"],
  "c": [],
  "a": []
}
```

#### Credential Format (ACDC)
```json
{
  "v": "ACDC10JSON00197_",
  "d": "EBdXt3gIXOf2BBWNHdHXt3gIXOf2BBWNHdHXt3gIXOf2",
  "i": "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
  "ri": "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
  "s": "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
  "a": {
    "d": "EBdXt3gIXOf2BBWNHdHXt3gIXOf2BBWNHdHXt3gIXOf2",
    "i": "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
    "land_parcel_id": "LP-001",
    "rights_type": "ownership",
    "location": {
      "coordinates": [40.7128, -74.0060],
      "description": "New York City"
    },
    "issued_date": "2025-07-14T00:00:00Z",
    "expiration_date": "2026-07-14T00:00:00Z"
  }
}
```

### 4.2 NFT Metadata Integration

#### Cardano NFT Metadata with KERI
```json
{
  "721": {
    "policy_id": "502ba55acd82a8e5ac58b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5",
    "asset_name": "LandRights001": {
      "name": "Landano Land Rights #001",
      "description": "Verifiable land rights NFT for parcel LP-001",
      "image": "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
      "keri_integration": {
        "holder_aid": "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
        "credential_said": "EBdXt3gIXOf2BBWNHdHXt3gIXOf2BBWNHdHXt3gIXOf2",
        "witnesses": [
          "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
          "BCilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Hb"
        ],
        "verification_endpoint": "https://verify.landano.io/nft"
      },
      "properties": {
        "land_parcel_id": "LP-001",
        "rights_type": "ownership",
        "location": "40.7128,-74.0060",
        "jurisdiction": "New York, USA",
        "area_sqm": 1000,
        "zoning": "residential"
      }
    }
  }
}
```

## 5. Implementation Components

### 5.1 Mendix Java Actions

#### KERI Identity Manager
```java
@UserAction
public class CreateKERIIdentity extends CoreJavaAction<String> {
    
    @JavaActionParameter
    private String identifierName;
    
    @JavaActionParameter
    private String witnessUrls;
    
    @Override
    public String executeAction() throws Exception {
        try {
            // Initialize Signify client
            SignifyClient client = initializeSignifyClient();
            
            // Parse witness URLs
            List<String> witnesses = parseWitnessUrls(witnessUrls);
            
            // Create identifier
            CreateIdentifierRequest request = CreateIdentifierRequest.builder()
                .name(identifierName)
                .witnesses(witnesses)
                .threshold(calculateThreshold(witnesses.size()))
                .build();
            
            CreateIdentifierResponse response = client.identifiers().create(request);
            
            // Store in Mendix database
            storeIdentifierInDatabase(response);
            
            return response.getPrefix();
            
        } catch (Exception e) {
            logger.error("Failed to create KERI identity", e);
            throw new UserException("Failed to create identity: " + e.getMessage());
        }
    }
}
```

#### Credential Issuer
```java
@UserAction
public class IssueACDCCredential extends CoreJavaAction<String> {
    
    @JavaActionParameter
    private String issuerAID;
    
    @JavaActionParameter
    private String holderAID;
    
    @JavaActionParameter
    private String credentialData;
    
    @Override
    public String executeAction() throws Exception {
        try {
            SignifyClient client = getSignifyClient(issuerAID);
            
            // Create credential
            IssueCredentialRequest request = IssueCredentialRequest.builder()
                .issuer(issuerAID)
                .holder(holderAID)
                .schema(getLandRightsSchema())
                .attributes(parseCredentialData(credentialData))
                .build();
            
            IssueCredentialResponse response = client.credentials().issue(request);
            
            // Store credential
            storeCredentialInDatabase(response);
            
            return response.getCredentialId();
            
        } catch (Exception e) {
            logger.error("Failed to issue credential", e);
            throw new UserException("Failed to issue credential: " + e.getMessage());
        }
    }
}
```

### 5.2 JavaScript Integration

#### Signify Client Initialization
```javascript
// signify-integration.js
class LandanoSignifyClient {
    constructor() {
        this.client = null;
        this.initialized = false;
    }
    
    async initialize(keriaUrl, bootUrl, passcode) {
        try {
            await ready();
            
            this.client = new SignifyClient(
                keriaUrl,
                passcode,
                Tier.low,
                bootUrl
            );
            
            // Boot or connect based on existing state
            if (await this.hasExistingState()) {
                await this.client.connect();
            } else {
                await this.client.boot();
            }
            
            this.initialized = true;
            return true;
            
        } catch (error) {
            console.error('Failed to initialize Signify client:', error);
            throw error;
        }
    }
    
    async createIdentifier(name, witnesses, threshold) {
        if (!this.initialized) {
            throw new Error('Client not initialized');
        }
        
        try {
            const result = await this.client.identifiers().create({
                name: name,
                witnesses: witnesses,
                thold: threshold
            });
            
            return {
                success: true,
                aid: result.prefix,
                state: result.state
            };
            
        } catch (error) {
            console.error('Failed to create identifier:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
```

#### Cardano Wallet Integration
```javascript
// cardano-integration.js
class CardanoWalletConnector {
    constructor() {
        this.wallet = null;
        this.connected = false;
    }
    
    async connectWallet(walletName = 'nami') {
        try {
            if (!window.cardano || !window.cardano[walletName]) {
                throw new Error(`${walletName} wallet not found`);
            }
            
            this.wallet = await window.cardano[walletName].enable();
            this.connected = true;
            
            return {
                success: true,
                addresses: await this.wallet.getUsedAddresses(),
                balance: await this.wallet.getBalance()
            };
            
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async queryNFTsByPolicyId(policyId) {
        if (!this.connected) {
            throw new Error('Wallet not connected');
        }
        
        try {
            const utxos = await this.wallet.getUtxos();
            const nfts = [];
            
            for (const utxo of utxos) {
                const assets = utxo.output.amount.multiasset;
                
                if (assets && assets[policyId]) {
                    for (const assetName in assets[policyId]) {
                        nfts.push({
                            policyId: policyId,
                            assetName: assetName,
                            quantity: assets[policyId][assetName],
                            utxo: utxo
                        });
                    }
                }
            }
            
            return nfts;
            
        } catch (error) {
            console.error('Failed to query NFTs:', error);
            throw error;
        }
    }
}
```

### 5.3 Microflow Implementation

#### Identity Creation Workflow
```
MicroFlow: CreateChiefIdentity
├── Input Parameters:
│   ├── UserName (String)
│   ├── OrganizationName (String)
│   └── WitnessConfiguration (String)
├── Activities:
│   ├── 1. ValidateUserPermissions
│   ├── 2. CheckExistingIdentity
│   ├── 3. GenerateIdentifierName
│   ├── 4. CallJavaAction: CreateKERIIdentity
│   ├── 5. StoreIdentityMetadata
│   ├── 6. LogSecurityEvent
│   └── 7. SendNotification
└── Output: KERIIdentifier (Entity)
```

#### Credential Verification Workflow
```
MicroFlow: VerifyCredentialPresentation
├── Input Parameters:
│   ├── CredentialData (String)
│   ├── HolderAID (String)
│   └── PresentationSignature (String)
├── Activities:
│   ├── 1. ValidateCredentialFormat
│   ├── 2. VerifyCredentialSignature
│   ├── 3. CheckCredentialStatus
│   ├── 4. ValidateHolderIdentity
│   ├── 5. VerifyWitnessReceipts
│   ├── 6. LogVerificationResult
│   └── 7. GenerateVerificationReport
└── Output: VerificationResult (Entity)
```

## 6. Integration Patterns

### 6.1 Request-Response Pattern

#### Synchronous Integration
```java
public class SynchronousVeridianClient {
    
    public IdentifierResponse createIdentifier(CreateIdentifierRequest request) {
        HttpRequest httpRequest = buildHttpRequest("POST", "/identifiers", request);
        signRequest(httpRequest, request.getIssuerAID());
        
        HttpResponse response = httpClient.send(httpRequest);
        validateResponse(response);
        
        return parseResponse(response, IdentifierResponse.class);
    }
}
```

#### Asynchronous Integration
```java
public class AsynchronousVeridianClient {
    
    public CompletableFuture<IdentifierResponse> createIdentifierAsync(CreateIdentifierRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return createIdentifier(request);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }
}
```

### 6.2 Event-Driven Pattern

#### Event Publisher
```java
@Component
public class KERIEventPublisher {
    
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    
    public void publishIdentityCreated(String aid, String createdBy) {
        IdentityCreatedEvent event = new IdentityCreatedEvent(aid, createdBy);
        eventPublisher.publishEvent(event);
    }
    
    public void publishCredentialIssued(String credentialId, String issuerAID, String holderAID) {
        CredentialIssuedEvent event = new CredentialIssuedEvent(credentialId, issuerAID, holderAID);
        eventPublisher.publishEvent(event);
    }
}
```

#### Event Handlers
```java
@Component
public class KERIEventHandler {
    
    @EventListener
    public void handleIdentityCreated(IdentityCreatedEvent event) {
        // Log the event
        auditLogger.logIdentityCreation(event.getAid(), event.getCreatedBy());
        
        // Send notifications
        notificationService.sendIdentityCreatedNotification(event.getAid());
        
        // Update analytics
        analyticsService.recordIdentityCreation(event.getAid());
    }
    
    @EventListener
    public void handleCredentialIssued(CredentialIssuedEvent event) {
        // Log the event
        auditLogger.logCredentialIssuance(event.getCredentialId(), event.getIssuerAID());
        
        // Update holder's credential list
        credentialService.updateHolderCredentials(event.getHolderAID(), event.getCredentialId());
    }
}
```

### 6.3 Circuit Breaker Pattern

#### Implementation
```java
@Component
public class VeridianCircuitBreaker {
    
    private final CircuitBreaker circuitBreaker;
    
    public VeridianCircuitBreaker() {
        this.circuitBreaker = CircuitBreaker.ofDefaults("veridian-api");
        this.circuitBreaker.getEventPublisher()
            .onStateTransition(event -> 
                logger.info("Circuit breaker state transition: {}", event));
    }
    
    public <T> T executeWithCircuitBreaker(Supplier<T> operation) {
        Supplier<T> decoratedOperation = CircuitBreaker.decorateSupplier(circuitBreaker, operation);
        return Try.ofSupplier(decoratedOperation)
            .recover(throwable -> {
                logger.error("Circuit breaker operation failed", throwable);
                throw new ServiceUnavailableException("Veridian API unavailable");
            })
            .get();
    }
}
```

## 7. Security Implementation

### 7.1 Key Management

#### Secure Key Storage
```java
@Component
public class SecureKeyManager {
    
    @Autowired
    private EncryptionService encryptionService;
    
    public void storePrivateKey(String aid, PrivateKey privateKey) {
        try {
            // Encrypt private key
            byte[] encryptedKey = encryptionService.encrypt(privateKey.getEncoded());
            
            // Store in database with AID as key
            KeyStorageEntity entity = new KeyStorageEntity();
            entity.setAID(aid);
            entity.setEncryptedPrivateKey(Base64.getEncoder().encodeToString(encryptedKey));
            entity.setKeyType("Ed25519");
            entity.setCreatedAt(Instant.now());
            
            keyStorageRepository.save(entity);
            
        } catch (Exception e) {
            logger.error("Failed to store private key for AID: {}", aid, e);
            throw new SecurityException("Key storage failed");
        }
    }
    
    public PrivateKey retrievePrivateKey(String aid) {
        try {
            KeyStorageEntity entity = keyStorageRepository.findByAID(aid)
                .orElseThrow(() -> new KeyNotFoundException("Key not found for AID: " + aid));
            
            // Decrypt private key
            byte[] encryptedKey = Base64.getDecoder().decode(entity.getEncryptedPrivateKey());
            byte[] decryptedKey = encryptionService.decrypt(encryptedKey);
            
            // Reconstruct private key
            KeyFactory keyFactory = KeyFactory.getInstance("Ed25519");
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(decryptedKey);
            
            return keyFactory.generatePrivate(keySpec);
            
        } catch (Exception e) {
            logger.error("Failed to retrieve private key for AID: {}", aid, e);
            throw new SecurityException("Key retrieval failed");
        }
    }
}
```

### 7.2 Access Control

#### Role-Based Access Control
```java
@Component
public class KERIAccessControl {
    
    public boolean hasPermission(String aid, String resource, String action) {
        // Get user roles from ACDC credentials
        List<ACDCCredential> roleCredentials = credentialService.getRoleCredentials(aid);
        
        for (ACDCCredential credential : roleCredentials) {
            if (checkPermission(credential, resource, action)) {
                return true;
            }
        }
        
        return false;
    }
    
    private boolean checkPermission(ACDCCredential credential, String resource, String action) {
        // Extract role from credential
        String role = credential.getAttributes().get("role").toString();
        
        // Check permissions based on role
        switch (role) {
            case "chief":
                return hasChiefPermission(resource, action);
            case "representative":
                return hasRepresentativePermission(resource, action);
            case "verifier":
                return hasVerifierPermission(resource, action);
            default:
                return false;
        }
    }
}
```

### 7.3 Audit Logging

#### Security Audit Implementation
```java
@Component
public class SecurityAuditLogger {
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    public void logSecurityEvent(String eventType, String aid, String details) {
        SecurityAuditEvent event = new SecurityAuditEvent();
        event.setEventType(eventType);
        event.setAID(aid);
        event.setTimestamp(Instant.now());
        event.setDetails(details);
        event.setSourceIP(getClientIP());
        event.setUserAgent(getUserAgent());
        event.setSeverity(determineSeverity(eventType));
        
        auditLogRepository.save(event);
        
        // Send to SIEM for critical events
        if (event.getSeverity() == SecuritySeverity.CRITICAL) {
            siemService.sendAlert(event);
        }
    }
    
    private SecuritySeverity determineSeverity(String eventType) {
        switch (eventType) {
            case "KEY_COMPROMISE":
            case "AUTHENTICATION_FAILURE":
                return SecuritySeverity.CRITICAL;
            case "KEY_ROTATION":
            case "CREDENTIAL_ISSUED":
                return SecuritySeverity.HIGH;
            default:
                return SecuritySeverity.MEDIUM;
        }
    }
}
```

## 8. Testing and Validation

### 8.1 Unit Testing

#### KERI Integration Tests
```java
@ExtendWith(MockitoExtension.class)
class KERIIdentityManagerTest {
    
    @Mock
    private SignifyClient signifyClient;
    
    @Mock
    private IdentifierOperations identifierOperations;
    
    @InjectMocks
    private KERIIdentityManager identityManager;
    
    @Test
    void testCreateIdentifier() {
        // Given
        CreateIdentifierRequest request = CreateIdentifierRequest.builder()
            .name("test-identity")
            .witnesses(Arrays.asList("witness1", "witness2"))
            .threshold(2)
            .build();
        
        CreateIdentifierResponse expectedResponse = new CreateIdentifierResponse();
        expectedResponse.setPrefix("EAbcd1234...");
        
        when(signifyClient.identifiers()).thenReturn(identifierOperations);
        when(identifierOperations.create(any())).thenReturn(expectedResponse);
        
        // When
        String result = identityManager.createIdentifier(request);
        
        // Then
        assertEquals("EAbcd1234...", result);
        verify(identifierOperations).create(request);
    }
}
```

### 8.2 Integration Testing

#### API Integration Tests
```java
@SpringBootTest
@TestPropertySource(properties = {
    "veridian.api.url=http://localhost:8080",
    "veridian.api.timeout=5000"
})
class VeridianAPIIntegrationTest {
    
    @Autowired
    private VeridianClient veridianClient;
    
    @Test
    void testCreateAndVerifyIdentifier() {
        // Create identifier
        CreateIdentifierRequest createRequest = CreateIdentifierRequest.builder()
            .name("integration-test")
            .witnesses(Arrays.asList("witness1", "witness2"))
            .build();
        
        String aid = veridianClient.createIdentifier(createRequest);
        assertNotNull(aid);
        
        // Verify identifier
        IdentifierResponse identifier = veridianClient.getIdentifier(aid);
        assertEquals(aid, identifier.getPrefix());
        assertEquals("integration-test", identifier.getName());
    }
}
```

### 8.3 Security Testing

#### Security Validation Tests
```java
@TestMethodOrder(OrderAnnotation.class)
class SecurityValidationTest {
    
    @Test
    @Order(1)
    void testKeyStorageEncryption() {
        // Test that private keys are properly encrypted
        KeyPair keyPair = keyGenerator.generateKeyPair();
        String aid = "ETest123...";
        
        secureKeyManager.storePrivateKey(aid, keyPair.getPrivate());
        
        // Verify key is encrypted in storage
        KeyStorageEntity stored = keyStorageRepository.findByAID(aid).orElseThrow();
        assertNotEquals(keyPair.getPrivate().getEncoded(), stored.getEncryptedPrivateKey());
        
        // Verify key can be retrieved and decrypted
        PrivateKey retrieved = secureKeyManager.retrievePrivateKey(aid);
        assertEquals(keyPair.getPrivate(), retrieved);
    }
    
    @Test
    @Order(2)
    void testAccessControl() {
        String aid = "ETest123...";
        
        // Test that unauthorized access is denied
        assertFalse(accessControl.hasPermission(aid, "credentials", "issue"));
        
        // Grant role credential
        issueRoleCredential(aid, "chief");
        
        // Test that authorized access is granted
        assertTrue(accessControl.hasPermission(aid, "credentials", "issue"));
    }
}
```

## 9. Deployment Guidelines

### 9.1 Environment Configuration

#### Production Configuration
```yaml
# application-production.yml
veridian:
  api:
    url: "https://api.veridian.id"
    timeout: 30000
    retry_attempts: 3
  keria:
    url: "https://keria.veridian.id"
    admin_port: 3901
    protocol_port: 3902
    boot_port: 3903
  security:
    tls_version: "1.3"
    certificate_pinning: true
    mutual_tls: true
  witnesses:
    - "https://witness1.veridian.id"
    - "https://witness2.veridian.id"
    - "https://witness3.veridian.id"
```

#### Sandbox Configuration (Development/Testing)
```yaml
# application-sandbox.yml
veridian:
  api:
    boot_url: "https://keria-boot.demo.idw-sandboxes.cf-deployments.org"
    keria_url: "https://keria.demo.idw-sandboxes.cf-deployments.org"
    credential_ui_url: "https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org"
    timeout: 30000
    retry_attempts: 3
  security:
    tls_version: "1.3"
    certificate_pinning: true
    mutual_tls: false
  environment: "sandbox"
  testing: true

# Local Development Configuration
# application-development.yml
veridian:
  api:
    url: "http://localhost:8080"
    timeout: 5000
    retry_attempts: 1
  keria:
    url: "http://localhost:3901"
    admin_port: 3901
    protocol_port: 3902
    boot_port: 3903
  security:
    tls_version: "1.2"
    certificate_pinning: false
    mutual_tls: false
  witnesses:
    - "http://localhost:5621"
    - "http://localhost:5622"
```

### 9.2 Docker Deployment

#### Dockerfile
```dockerfile
FROM registry.mendix.com/mendix/runtime:9.24.0.13049

# Install additional dependencies
RUN apt-get update && apt-get install -y \
    libsodium23 \
    && rm -rf /var/lib/apt/lists/*

# Copy application files
COPY --from=build /app/build/distributions/app.mda /opt/mendix/app.mda

# Set environment variables
ENV VERIDIAN_API_URL=https://api.veridian.id
ENV KERIA_URL=https://keria.veridian.id
ENV TLS_VERSION=1.3

# Expose ports
EXPOSE 8080 8083

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start application
CMD ["/opt/mendix/start.sh"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  landano-veridian:
    build: .
    ports:
      - "8080:8080"
      - "8083:8083"
    environment:
      - VERIDIAN_API_URL=https://api.veridian.id
      - KERIA_URL=https://keria.veridian.id
      - DATABASE_URL=postgresql://postgres:password@db:5432/landano
    depends_on:
      - db
    networks:
      - landano-network
    volumes:
      - ./certs:/certs:ro
      - ./logs:/logs

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=landano
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - landano-network

volumes:
  postgres_data:

networks:
  landano-network:
    driver: bridge
```

### 9.3 Monitoring and Observability

#### Prometheus Metrics
```java
@Component
public class KERIMetrics {
    
    private final Counter identityCreations = Counter.build()
        .name("keri_identity_creations_total")
        .help("Total number of KERI identities created")
        .register();
    
    private final Counter credentialIssuances = Counter.build()
        .name("keri_credential_issuances_total")
        .help("Total number of ACDC credentials issued")
        .register();
    
    private final Histogram apiRequestDuration = Histogram.build()
        .name("veridian_api_request_duration_seconds")
        .help("Duration of Veridian API requests")
        .register();
    
    public void recordIdentityCreation() {
        identityCreations.inc();
    }
    
    public void recordCredentialIssuance() {
        credentialIssuances.inc();
    }
    
    public void recordAPIRequestDuration(double duration) {
        apiRequestDuration.observe(duration);
    }
}
```

#### Health Check Endpoint
```java
@RestController
@RequestMapping("/health")
public class HealthController {
    
    @Autowired
    private VeridianClient veridianClient;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", Instant.now());
        
        // Check Veridian API connectivity
        try {
            veridianClient.ping();
            health.put("veridian_api", "UP");
        } catch (Exception e) {
            health.put("veridian_api", "DOWN");
            health.put("veridian_error", e.getMessage());
        }
        
        // Check database connectivity
        try {
            databaseHealthCheck();
            health.put("database", "UP");
        } catch (Exception e) {
            health.put("database", "DOWN");
            health.put("database_error", e.getMessage());
        }
        
        return ResponseEntity.ok(health);
    }
}
```

## 10. Maintenance and Operations

### 10.1 Backup and Recovery

#### Key Backup Strategy
```java
@Component
public class KeyBackupManager {
    
    @Scheduled(cron = "0 0 2 * * *") // Daily at 2 AM
    public void backupKeys() {
        try {
            List<KeyStorageEntity> keys = keyStorageRepository.findAll();
            
            for (KeyStorageEntity key : keys) {
                // Create encrypted backup
                BackupEntry backup = new BackupEntry();
                backup.setAID(key.getAID());
                backup.setEncryptedKey(key.getEncryptedPrivateKey());
                backup.setBackupDate(Instant.now());
                
                // Store in secure backup location
                backupService.storeBackup(backup);
            }
            
            logger.info("Successfully backed up {} keys", keys.size());
            
        } catch (Exception e) {
            logger.error("Key backup failed", e);
            alertService.sendAlert("Key backup failure", e.getMessage());
        }
    }
}
```

### 10.2 Performance Optimization

#### Connection Pool Configuration
```java
@Configuration
public class HttpClientConfiguration {
    
    @Bean
    public HttpClient httpClient() {
        return HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .executor(Executors.newFixedThreadPool(20))
            .build();
    }
    
    @Bean
    public ConnectionPoolManager connectionPoolManager() {
        return ConnectionPoolManager.builder()
            .maxConnections(100)
            .maxConnectionsPerRoute(20)
            .connectionTimeToLive(Duration.ofMinutes(5))
            .build();
    }
}
```

#### Caching Strategy
```java
@Service
public class CachedVeridianService {
    
    @Cacheable(value = "identifiers", key = "#aid")
    public IdentifierResponse getIdentifier(String aid) {
        return veridianClient.getIdentifier(aid);
    }
    
    @Cacheable(value = "credentials", key = "#credentialId")
    public CredentialResponse getCredential(String credentialId) {
        return veridianClient.getCredential(credentialId);
    }
    
    @CacheEvict(value = "identifiers", key = "#aid")
    public void evictIdentifier(String aid) {
        // Cache eviction handled by annotation
    }
}
```

### 10.3 Error Recovery Procedures

#### Automatic Recovery
```java
@Component
public class ErrorRecoveryManager {
    
    @EventListener
    public void handleAPIError(APIErrorEvent event) {
        if (event.getErrorType() == APIErrorType.NETWORK_TIMEOUT) {
            // Retry with exponential backoff
            retryWithBackoff(event.getOperation());
        } else if (event.getErrorType() == APIErrorType.AUTHENTICATION_FAILURE) {
            // Refresh authentication credentials
            refreshAuthCredentials(event.getAID());
        }
    }
    
    private void retryWithBackoff(Runnable operation) {
        CompletableFuture.runAsync(() -> {
            int attempt = 0;
            int maxAttempts = 3;
            
            while (attempt < maxAttempts) {
                try {
                    operation.run();
                    break;
                } catch (Exception e) {
                    attempt++;
                    if (attempt < maxAttempts) {
                        try {
                            Thread.sleep(1000 * (long) Math.pow(2, attempt));
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }
            }
        });
    }
}
```

## Conclusion

This comprehensive technical integration specification provides a complete blueprint for implementing the Veridian Identity platform within the Mendix architecture. The specification covers all aspects from API integration to security implementation, ensuring a robust, scalable, and secure solution for land rights NFT verification using KERI protocol and decentralized identity management.

The implementation follows enterprise-grade security practices, incorporates proper error handling and monitoring, and provides clear deployment and maintenance guidelines. This specification should serve as the authoritative technical reference for the development team throughout the implementation process.