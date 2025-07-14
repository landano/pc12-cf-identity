**Design specification: Landano Veridian Identity Module**

The Landano project is using Cardano NFTs to notarize land rights in jurisdictions that need better land registry solutions.

Landano is prototyping the use of the Veridian Identity Wallet (formerly Cardano Foundation ID Wallet) with its platform. The Veridian Identity Wallet implements the KERI (Key Event Receipt Infrastructure) protocol. This is a decentralized identity system built around the concept of self-certifying identifiers (Autonomic Identifiers known as AIDs) that are cryptographically bound to controlling keys.

This document specifies the design of the prototype system including the Mendix module architecture and Veridian integration specifications. We are testing three basic use cases as a proof of concept:   
	1\. Verify Landano user identity  
2\. Verify user ownership of Landano NFT  
3\. Verify ADA wallet balance belongs to a ID wallet holder

## Table of Contents

1. [Use Case Specifications](#use-case-specifications)
2. [Mendix Module Architecture](#mendix-module-architecture)
3. [Veridian Integration Architecture](#veridian-integration-architecture)
4. [Technical Architecture and API Specifications](#technical-architecture-and-api-specifications)
5. [Security Architecture](#security-architecture)
6. [Implementation Guidelines](#implementation-guidelines)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Specifications](#deployment-specifications)
9. [Appendix - Sequence Diagrams](#appendix---sequence-diagrams)

## Use Case Specifications

1. **Verify Landano User identity**

In the jurisdictions where we are piloting our solution, a village chief and their representatives have the right to approve land administration transactions for their community. This use case represents this scenario. 

We want to demonstrate that a particular user has the credentials to act as a representative for their chief. The chief has the constitutional authority to approve land transactions and is considered to be the root of trust.

1. **Chief has an AID and is an issuer as the root of trust** 

The Chief generates an Autonomic Identifier (AID)

We use the Cardano Foundation’s KERIA instance in this use case. KERIA is a multi-tenant cloud agent for KERI that handles core functions including AID creation and management, event generation and processing, key state tracking and witness coordination.

The Chief (root of trust) uses KERIA to create and manage their Autonomic Identifier (AID)

2. **Chief representative creates AID**

The Chief Representative creates their AID using Signify through their Cardano Foundation ID Wallet on their device. Signify is a client-side library that manages identifiers and keys at the edge on user’s own devices.

![][image1]

3. **Chief issues an Authentic Chained Data Container (ACDC) credential to representative**

The Chief uses KERIA to issue the ACDC credential to enable its recipient to act as their representative.

The credential is created and signed using the Chief's keys

The Representative receives the ACDC in their Cardano Foundation ID Wallet (which uses Signify to manage their keys and credentials)

![][image2]

4. **Verifier has an AID and requests a presentation of the ACDC from chief representative**

ACDC (Authentic Chained Data Container) is a verifiable credential format designed for KERI. The ACDCs in this use case contains a signed claim about Representatives and is chained to the Chief’s AID as its issuer.

The chief has issued a credential in the form of an ACDC to their Representative. This credential can now be verified.

![][image3]

The Verifier initiates a presentation request. The Representative's wallet (using Signify) will create a presentation of the ACDC, sign it with their keys (which never leave their device), and send the signed presentation

The Verifier can confirm both The Chief's original signature on the ACDC and the Representative's signature on the presentation.

This completes the first use case scenario for the prototype wherein we verify a Landano’s user identity and credentials.

2\. **Verify User Ownership of Landano NFT**

In the Landano system, users own Cardano NFTs that prove their rights in relation to specific plots of land. This use case represents a scenario where a third party verifies that the user is in control of a Landano NFT.

1. A Rightsholder has an ADA wallet that contains a Landano NFT.  
2. The NFT metadata contains a field with a value that is a KERI AID  
3. The Verifier uses a verification dApp to connect the ADA wallet and the ID wallet of the KERI AID holder  
4. The verification dApp retrieves the NFT by querying for the Landano NFT policy ID in the ADA wallet  
5. The Verifier searches the NFT metadata for a KERI AID  
6. The Verifier requests that the Rightsholder uses CIP-30 to sign a payload with the KERI AID on the ID wallet

![][image4]

3. **Verify ADA Wallet Balance Belongs to ID Wallet Holder**

This use case demonstrates the connection between traditional cryptocurrency wallets and decentralized identity systems. It ensures that the holder of a Veridian Identity Wallet is also the legitimate owner of an associated ADA wallet, enabling secure financial transactions within the Landano ecosystem.

**Process Flow:**

1. **ADA Wallet Holder has Veridian Identity Wallet**
   - The user has both an ADA wallet containing cryptocurrency and a Veridian Identity Wallet with a KERI AID
   - The AID is registered and linked to the user's identity profile

2. **Connection Request Initiated**
   - A verifier (e.g., Landano platform) requests proof that the ADA wallet belongs to the ID wallet holder
   - The user initiates the connection process through the Landano dApp interface

3. **Cryptographic Challenge Generation**
   - The verifier generates a unique cryptographic challenge containing:
     - Timestamp
     - Random nonce
     - Verifier's AID
     - Purpose statement (e.g., "Prove ADA wallet ownership")

4. **Dual Signature Process**
   - The user signs the challenge with their ADA wallet using CIP-30 standard
   - The user simultaneously signs the same challenge with their Veridian Identity Wallet using their KERI AID
   - Both signatures are cryptographically bound to the same challenge payload

5. **Verification and Binding**
   - The verifier validates both signatures against the challenge
   - The verifier confirms the ADA wallet address matches the expected balance requirements
   - The verifier creates a binding record linking the ADA wallet address to the KERI AID

6. **Secure Transaction Authorization**
   - Future transactions requiring both identity verification and financial capability can now be authorized
   - The binding enables secure land rights transactions that require both identity credentials and payment capability

**Technical Requirements:**
- CIP-30 wallet connector for ADA wallet integration
- Veridian SDK for identity wallet operations
- Secure challenge-response mechanism
- Cryptographic signature verification
- Binding record storage and management

![][image5]

## KERI Edge Protection Requirements

### Edge Security Principles

The Landano Veridian Identity Module implements comprehensive edge protection ensuring that private keys never leave user devices and all cryptographic operations maintain the highest security standards required by KERI protocol.

#### Core Edge Protection Features
- **Private Key Isolation**: Private keys generated and stored exclusively on user devices using hardware security modules
- **Local-Only Cryptographic Operations**: All signing operations performed locally without key material transmission
- **Hardware-Backed Security**: Integration with device secure enclaves (iOS Keychain, Android Keystore)
- **Biometric Authorization**: Hardware biometric authentication required for key usage
- **Secure Key Rotation**: KERI pre-rotation implemented with secure key commitment mechanisms
- **Offline Operation Support**: Critical identity operations available without network connectivity
- **Tamper Detection**: Comprehensive integrity checking for all identity-related operations

#### KERI Protocol Compliance
- **Complete Key Event Log (KEL) Management**: Full event lifecycle with cryptographic integrity
- **Witness Threshold Validation**: 3-of-5 witness signature requirements for all key events
- **Pre-Rotation Security**: Next key commitment for quantum-resistant key management
- **Duplicity Detection**: Protection against eclipse attacks and malicious witness coordination
- **CESR Encoding**: Efficient and secure event representation using CESR standards
- **Event Sequence Integrity**: Cryptographic chaining of all KERI events

### Cardano Plugin Integration Architecture

#### Secure Cross-Chain Integration
The module integrates with the existing Cardano Mendix plugin while maintaining strict security boundaries between KERI identity operations and Cardano blockchain operations.

**Integration Components:**
- **Isolated Execution Contexts**: Separate security domains for KERI and Cardano operations
- **Cryptographic Binding Protocol**: Secure association between KERI AIDs and Cardano addresses
- **Cross-Chain Verification**: Multi-signature validation across both identity and blockchain systems
- **NFT Metadata Security**: Tamper-evident binding of KERI identities to NFT metadata
- **Wallet Interoperability**: Seamless integration with existing wallet management capabilities

**Existing Plugin Utilization:**
- **Wallet Management**: Leverage existing wallet creation, restoration, and transaction capabilities
- **NFT Operations**: Use existing NFT creation and metadata management features
- **Multi-Signature Support**: Integrate with existing multi-sig transaction capabilities
- **Smart Contract Integration**: Utilize existing smart contract interaction features
- **Transaction Management**: Build upon existing transaction creation and signing infrastructure

## Mendix Module Architecture

The Landano Veridian Identity Module provides a comprehensive set of Mendix components for identity management operations within Mendix applications. This module abstracts the complexity of KERI protocol operations while maintaining security and interoperability, allowing Mendix developers to easily integrate decentralized identity capabilities into their applications.

### Architecture Overview

The Mendix module follows a modular architecture pattern with clear separation of concerns:

#### Layer 1: Domain Model Layer
- **Identity Entities**: Mendix entities for AID, credentials, verifications, and trust relationships
- **Enumerations**: Status values, identity types, credential types, and verification states
- **Associations**: Relationships between identities, credentials, and verifications
- **Validation Rules**: Domain-level validation for identity and credential data

#### Layer 2: Business Logic Layer
- **Identity Microflows**: Core business logic for identity lifecycle management
- **Credential Microflows**: Business processes for credential issuance and verification
- **Verification Microflows**: Workflows for credential presentation and validation
- **Event Handling**: Asynchronous processing and notification microflows

#### Layer 3: Integration Layer
- **Edge Protection Layer**: Signify client integration for secure key operations at the edge
- **KERI Protocol Layer**: Complete KERI event management (KEL, witness coordination, CESR)
- **Veridian Service Layer**: Integration with KERIA cloud agents and witness networks
- **Cardano Integration Layer**: Secure integration with existing Cardano Mendix plugin

#### Layer 4: User Interface Layer
- **Identity Management Pages**: UI for creating and managing identities
- **Credential Administration**: Pages for issuing and managing credentials
- **Verification Dashboard**: Interface for credential verification and presentation
- **Custom Widgets**: Reusable UI components for identity operations

#### Layer 5: Configuration Layer
- **Module Constants**: Configuration values for Veridian endpoints and security settings
- **Security Policies**: Access control and authentication configurations
- **Deployment Settings**: Environment-specific configuration options
- **Marketplace Documentation**: Installation and configuration guides

### Core Components

#### Domain Model Entities

**LandanoIdentity**
```
Attributes:
- AID (String, unique identifier)
- Name (String)
- IdentityType (Enumeration: Chief, Representative, Verifier)
- Status (Enumeration: Active, Revoked, Suspended)
- PublicKey (String)
- CreatedDate (DateTime)
- UpdatedDate (DateTime)
- Metadata (String, JSON format)

Associations:
- LandanoIdentity_IssuedCredentials (1 to many with LandanoCredential)
- LandanoIdentity_ReceivedCredentials (1 to many with LandanoCredential)
- LandanoIdentity_Delegations (many to many with LandanoIdentity)
```

**LandanoCredential**
```
Attributes:
- CredentialID (String, SAID)
- CredentialType (Enumeration: Representative, NFTOwnership, WalletBinding)
- Schema (String)
- Claims (String, JSON format)
- Signature (String)
- Status (Enumeration: Active, Revoked, Expired)
- ValidFrom (DateTime)
- ValidUntil (DateTime)
- RevocationReason (String)

Associations:
- LandanoCredential_Issuer (many to 1 with LandanoIdentity)
- LandanoCredential_Holder (many to 1 with LandanoIdentity)
- LandanoCredential_Verifications (1 to many with LandanoVerification)
```

**LandanoVerification**
```
Attributes:
- VerificationID (String, unique)
- VerificationStatus (Enumeration: Pending, Successful, Failed)
- VerificationDate (DateTime)
- VerifierAID (String)
- ChallengeHash (String)
- ProofSignature (String)
- ErrorMessage (String)

Associations:
- LandanoVerification_Credential (many to 1 with LandanoCredential)
- LandanoVerification_Verifier (many to 1 with LandanoIdentity)
```

#### Key Microflows

**ACT_CreateIdentity**
```
Parameters:
- Name (String)
- IdentityType (Enumeration)
- Metadata (String)

Logic:
1. Generate new AID using Veridian API
2. Create LandanoIdentity entity
3. Store public key and metadata
4. Initialize trust relationships
5. Return identity object

Return: LandanoIdentity object
```

**ACT_IssueCredential**
```
Parameters:
- Issuer (LandanoIdentity)
- Holder (LandanoIdentity)
- CredentialType (Enumeration)
- Claims (String)

Logic:
1. Validate issuer permissions
2. Generate credential schema
3. Create ACDC credential via Veridian
4. Store credential in domain model
5. Notify holder of new credential

Return: LandanoCredential object
```

**ACT_VerifyCredential**
```
Parameters:
- Credential (LandanoCredential)
- Verifier (LandanoIdentity)
- Challenge (String)

Logic:
1. Validate credential status
2. Verify cryptographic signatures
3. Check trust chain
4. Create verification record
5. Return verification result

Return: LandanoVerification object
```

#### Java Actions (KERI Edge Protection Focus)

**JA_InitializeSignifyClient**
```
Purpose: Initialize Signify client for edge key operations
Parameters: WitnessPool, SecurityConfig
Returns: SignifyClient instance
Implementation: Establishes secure Signify client with hardware-backed key storage
Edge Protection: Private keys never leave the device, all operations local
```

**JA_GenerateAIDWithPreRotation**
```
Purpose: Generate AID with pre-rotation commitment for KERI security
Parameters: IdentityType, NextKeyCommitment, WitnessThreshold
Returns: AID, InceptionEvent, KeyEventLog
Implementation: Creates KERI inception event with proper pre-rotation
Edge Protection: Key generation uses hardware entropy, private keys stay local
```

**JA_RotateKeysWithWitnessValidation**
```
Purpose: Perform KERI key rotation with witness validation
Parameters: AID, NewKeyPair, WitnessSignatures
Returns: RotationEvent, UpdatedKEL
Implementation: Executes KERI rotation with witness threshold validation
Edge Protection: Old keys securely deleted, new keys never transmitted
```

**JA_SignWithAIDEdgeSecure**
```
Purpose: Sign data using AID private key with edge protection
Parameters: AID, DataToSign, BiometricAuth
Returns: EdDSA signature
Implementation: Hardware-backed signing with biometric authorization
Edge Protection: Private key never exposed, signing done in secure enclave
```

**JA_VerifyKERIEvent**
```
Purpose: Verify KERI event integrity and witness signatures
Parameters: KERIEvent, WitnessPool, KEL
Returns: ValidationResult, DuplicityCheck
Implementation: Complete KERI event validation with duplicity detection
Edge Protection: Verification done locally without exposing sensitive data
```

**JA_IntegrateWithCardanoPlugin**
```
Purpose: Secure integration with existing Cardano Mendix plugin
Parameters: CardanoWallet, AID, BindingChallenge
Returns: WalletBinding, CrossChainProof
Implementation: Creates cryptographic binding between Cardano wallet and KERI AID
Edge Protection: Uses isolated execution contexts for each blockchain system
```

**JA_ManageKELIntegrity**
```
Purpose: Manage Key Event Log integrity and synchronization
Parameters: AID, EventSequence, WitnessReceipts
Returns: VerifiedKEL, IntegrityProof
Implementation: CESR-encoded event management with cryptographic verification
Edge Protection: Local KEL validation prevents tampering
```

**JA_SecureNFTMetadataBinding**
```
Purpose: Create tamper-evident binding between NFT and KERI identity
Parameters: NFTMetadata, AID, PolicyID
Returns: CryptographicBinding, MetadataProof
Implementation: Uses existing Cardano plugin for NFT operations with KERI binding
Edge Protection: Metadata integrity protected by cryptographic commitment
```

### Module Interface Specifications

#### Public Microflows (Module API)

**Identity Operations**
```
ACT_CreateIdentity
ACT_GetIdentity
ACT_UpdateIdentity
ACT_DeleteIdentity
ACT_RotateIdentityKeys
ACT_DelegateIdentity
```

**Credential Operations**
```
ACT_IssueCredential
ACT_GetCredential
ACT_UpdateCredential
ACT_RevokeCredential
ACT_VerifyCredential
ACT_PresentCredential
```

**Verification Operations**
```
ACT_VerifySignature
ACT_ValidateCredentialChain
ACT_CheckTrustAnchor
ACT_GetVerificationStatus
```

### Data Models

#### Identity Entity
```
{
  "id": "string (AID)",
  "type": "enum (chief, representative, verifier)",
  "status": "enum (active, revoked, suspended)",
  "publicKeys": ["string"],
  "metadata": {
    "name": "string",
    "role": "string",
    "jurisdiction": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  },
  "delegations": ["string (AID)"],
  "certificates": ["string (credential_id)"]
}
```

#### Credential Entity
```
{
  "id": "string (SAID)",
  "type": "enum (targeted, untargeted)",
  "schema": "string (schema_id)",
  "issuer": "string (AID)",
  "holder": "string (AID)",
  "claims": "object",
  "signature": "string",
  "status": "enum (active, revoked, expired)",
  "validFrom": "timestamp",
  "validUntil": "timestamp",
  "revocationReason": "string"
}
```

## Veridian Integration Architecture

The Veridian Integration Architecture leverages maximum Cardano Foundation/Veridian components while ensuring edge protection and integrating with existing Cardano Mendix plugin capabilities.

### Integration Patterns

#### 1. Signify Client Integration (Primary Edge Protection)
- **Hardware-Backed Key Storage**: Integration with device secure enclaves (iOS Keychain, Android Keystore)
- **Local Cryptographic Operations**: All private key operations performed locally using Signify client
- **Biometric Authentication**: Hardware biometric authorization for key usage
- **Offline KERI Operations**: Support for offline key rotation and event generation
- **Secure Boot**: Trusted platform module (TPM) attestation for client integrity

#### 2. KERIA Cloud Agent Integration (Leveraging CF Infrastructure)
- **Witness Pool Management**: Utilizes Cardano Foundation's witness infrastructure
- **Event Log Synchronization**: Real-time KEL synchronization with KERIA cloud services
- **Multi-Tenant Architecture**: Secure isolation of different organizational identities
- **High Availability**: Redundant KERIA instances for fault tolerance
- **Standard KERI Protocol**: Full compliance with KERI specification

#### 3. Enhanced ACDC Credential System
- **Schema Registry**: Centralized schema management using Veridian infrastructure
- **Zero-Knowledge Presentations**: Privacy-preserving credential disclosure
- **Revocation Registry**: Distributed revocation checking without privacy leaks
- **Credential Chaining**: Support for complex trust hierarchies
- **Metadata Integrity**: Tamper-evident metadata using cryptographic commitments

#### 4. Witness Network Integration (CF Infrastructure)
- **Threshold Signatures**: 3-of-5 witness threshold for security
- **Witness Discovery**: Dynamic witness selection from CF network
- **Fault Tolerance**: Automatic failover for unavailable witnesses
- **Consensus Validation**: Byzantine fault tolerant consensus mechanisms
- **Performance Optimization**: Witness pool optimization for response times

#### 5. Cardano Blockchain Integration (Existing Plugin)
- **Cross-Chain Identity Binding**: Cryptographic binding between KERI AID and Cardano addresses
- **NFT Metadata Integration**: Secure metadata binding using existing NFT capabilities
- **Multi-Signature Coordination**: Integration with existing multi-sig functionality
- **Smart Contract Integration**: Use existing smart contract capabilities for on-chain verification
- **Wallet Interoperability**: Seamless integration with existing wallet management

### Module Components

#### Configuration Constants (Enhanced for Edge Protection)
```
KERI Edge Protection:
- Signify_Hardware_Security_Level (STRONG_BOX, TEE, SOFTWARE)
- Biometric_Auth_Required (true/false)
- Key_Rotation_Policy (PRE_ROTATION_REQUIRED, WITNESS_THRESHOLD)
- Offline_Operation_Timeout (milliseconds)
- KEL_Integrity_Check_Interval (seconds)

Veridian Infrastructure:
- VeridianAPI_BaseURL
- KERIA_CloudAgent_URL
- Witness_Pool_Endpoints (array of CF witness URLs)
- Witness_Threshold_Required (default: 3)
- CESR_Encoding_Version

Cardano Integration:
- Cardano_Plugin_Module_Name
- Cross_Chain_Binding_Policy
- NFT_Metadata_Schema_Version
- Multi_Sig_Coordination_Mode
- Smart_Contract_Verification_Address

Security Settings:
- Hardware_Attestation_Required (true/false)
- Secure_Enclave_Usage (REQUIRED, PREFERRED, DISABLED)
- Network_Security_Policy (TLS_1_3_ONLY, MUTUAL_TLS)
- Event_Log_Backup_Frequency (hours)
```

#### Security Settings
```
Module Roles:
- IdentityAdministrator
- CredentialIssuer
- CredentialVerifier
- IdentityUser

Module Security:
- Entity access rules for identity data
- Microflow access restrictions
- Page-level security configurations
```

#### External Dependencies (KERI Edge Protection Focus)
```
KERI Protocol Libraries:
- Signify Java Client (CF official library)
- KERIA API Client (CF infrastructure)
- CESR Encoding/Decoding Library
- Key Event Log Management Library

Edge Security Libraries:
- Hardware Security Module Interface (PKCS#11)
- Biometric Authentication SDK (platform-specific)
- Secure Enclave Integration (iOS/Android)
- Hardware Attestation Library

Cryptographic Libraries:
- EdDSA with Ed25519 (audited implementation)
- Blake3 Hashing (KERI standard)
- Argon2 Key Derivation (secure key derivation)
- libsodium (secure cryptographic operations)

Cardano Integration:
- Existing Cardano Mendix Plugin
- CIP-30 Wallet Connector
- Cardano Serialization Library
- Multi-Signature Coordination Library

Networking & Serialization:
- TLS 1.3 Client Library
- CBOR Encoding/Decoding
- JSON-LD Processing
- WebSocket Client (for real-time events)
```

### Integration Flow

#### Module Initialization (Edge Protection Focus)
1. Mendix application starts and loads the Landano Veridian Identity Module
2. Hardware security module availability is verified (secure enclave, TPM)
3. Signify client is initialized with hardware-backed key storage
4. Biometric authentication capabilities are verified and configured
5. Connection to Cardano Foundation witness pool is established
6. KERIA cloud agent connections are initialized with mutual TLS
7. Existing Cardano plugin integration is verified and linked
8. Trust anchors and security policies are loaded from secure storage
9. Key Event Log integrity is verified for existing identities
10. Domain model entities are available for use in the consuming application

#### Runtime Operations (Secure Cross-Chain Flow)
1. User requests identity operation through Mendix application UI
2. Biometric authentication is performed for sensitive operations
3. Application microflow calls module's public microflow (e.g., ACT_CreateIdentityWithCardanoBinding)
4. Module microflow validates security context and user permissions
5. Java actions perform local cryptographic operations using Signify client
6. Key events are created and signed locally, never transmitting private keys
7. KERI events are submitted to witness pool for threshold validation
8. Cardano plugin integration is invoked for cross-chain operations
9. Results are cryptographically verified and stored in domain model entities
10. Key Event Log is updated with new events and integrity verified
11. Response is returned to the calling application microflow
12. Application UI is updated with operation result and audit trail

## Technical Architecture and API Specifications

### System Architecture

The technical architecture follows a modular pattern with the Mendix module providing integration capabilities between Mendix applications and the Veridian platform.

#### Module Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Mendix Application                                    │
│                                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────────────────────┐  │
│  │   UI Pages    │  │   Business    │  │      Landano Veridian Identity      │  │
│  │               │  │   Logic       │  │               Module                │  │
│  └───────────────┘  └───────────────┘  │                                     │  │
│                                        │  ┌─────────────┐  ┌─────────────┐  │  │
│  ┌─────────────────────────────────────┤  │   Domain    │  │  Business   │  │  │
│  │        Application Database         │  │    Model    │  │   Logic     │  │  │
│  └─────────────────────────────────────┘  └─────────────┘  └─────────────┘  │  │
│                                        │  ┌─────────────┐  ┌─────────────┐  │  │
│                                        │  │    Java     │  │     REST    │  │  │
│                                        │  │   Actions   │  │  Connectors │  │  │
│                                        │  └─────────────┘  └─────────────┘  │  │
│                                        └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Veridian Platform                                   │
│                                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │    KERIA      │  │    Signify    │  │   Witnesses   │  │  Credentials  │  │
│  │ Cloud Agent   │  │    Client     │  │   Network     │  │   Storage     │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Module Configuration
- **Constants**: Configuration values for Veridian endpoints and security settings
- **Dependencies**: Required Java libraries for KERI protocol and cryptographic operations
- **Security**: Module roles and entity access rules for identity data
- **Documentation**: Installation and configuration guides for implementers

### Data Flow Architecture

#### Identity Creation Flow
```
1. User Request → Mendix Application UI
2. Application UI → Application Microflow
3. Application Microflow → ACT_CreateIdentity (Module)
4. Module Microflow → JA_GenerateAID (Java Action)
5. Java Action → Veridian KERIA API
6. KERIA → Generate AID and Keys
7. Response → Java Action → Module Microflow
8. Module Microflow → Create LandanoIdentity Entity
9. Response → Application Microflow → UI Update
```

#### Credential Verification Flow
```
1. Verification Request → Mendix Application UI
2. Application UI → Application Microflow
3. Application Microflow → ACT_VerifyCredential (Module)
4. Module Microflow → Retrieve LandanoCredential Entity
5. Module Microflow → JA_VerifySignature (Java Action)
6. Java Action → Cryptographic Validation
7. Validation Result → Module Microflow
8. Module Microflow → Create LandanoVerification Entity
9. Response → Application Microflow → UI Update
```

### Mendix Marketplace Specifications

#### Module Package Structure
```
LandanoVeridianIdentity.mpk
├── Domain Model
│   ├── LandanoIdentity
│   ├── LandanoCredential
│   └── LandanoVerification
├── Microflows
│   ├── ACT_CreateIdentity
│   ├── ACT_IssueCredential
│   └── ACT_VerifyCredential
├── Java Actions
│   ├── JA_GenerateAID
│   ├── JA_SignWithAID
│   └── JA_VerifySignature
├── Pages
│   ├── IdentityManagement
│   ├── CredentialIssuance
│   └── VerificationDashboard
├── Resources
│   ├── Java Libraries
│   └── Documentation
└── Module Settings
    ├── Constants
    ├── Security
    └── Dependencies
```

#### Marketplace Listing Requirements
- **Module Name**: Landano Veridian Identity
- **Category**: Integration
- **Mendix Version**: 10.24.1+
- **Dependencies**: Community Commons, Encryption
- **Documentation**: Installation guide, API reference, examples
- **Support**: Community support via GitHub issues
- **License**: Apache 2.0
- **Pricing**: Free (open source)

### Performance Specifications

#### Response Time Requirements
- Identity creation: < 2 seconds
- Credential verification: < 500ms
- Credential presentation: < 1 second
- Key rotation: < 5 seconds

#### Scalability Targets
- Concurrent users: 1,000
- Transactions per second: 100
- Storage capacity: 10GB per deployment
- Network bandwidth: 10 Mbps

#### Availability Requirements
- Uptime: 99.9%
- Recovery time: < 30 seconds
- Backup frequency: Every 4 hours
- Disaster recovery: < 2 hours

## Security Architecture

### Security Framework

The security architecture implements defense-in-depth principles with multiple layers of protection.

#### Security Layers

1. **Transport Security**
   - TLS 1.3 for all communications
   - Certificate pinning for API endpoints
   - Mutual TLS for service-to-service communication

2. **Authentication & Authorization**
   - Multi-factor authentication support
   - Role-based access control (RBAC)
   - Attribute-based access control (ABAC)
   - OAuth 2.0 / OpenID Connect integration

3. **Data Protection**
   - Encryption at rest (AES-256)
   - Encryption in transit (TLS 1.3)
   - Key management through hardware security modules (HSM)
   - Regular key rotation policies

4. **Application Security**
   - Input validation and sanitization
   - SQL injection prevention
   - Cross-site scripting (XSS) protection
   - Cross-site request forgery (CSRF) protection

### Cryptographic Implementation

#### Key Management
- **Key Generation**: Secure random number generation using hardware entropy
- **Key Storage**: Hardware security modules (HSM) or secure key stores
- **Key Rotation**: Automated key rotation with configurable intervals
- **Key Recovery**: Secure key recovery procedures for business continuity

#### Digital Signatures
- **Signature Algorithm**: EdDSA with Ed25519 curves
- **Hash Function**: SHA-256 for integrity verification
- **Signature Verification**: Multi-signature support for enhanced security
- **Non-repudiation**: Cryptographic proof of identity for legal compliance

### Threat Model

#### Identified Threats
1. **Identity Theft**: Unauthorized access to user identities
2. **Credential Forgery**: Creation of fake credentials
3. **Man-in-the-Middle Attacks**: Interception of communications
4. **Replay Attacks**: Reuse of valid credentials
5. **Key Compromise**: Unauthorized access to cryptographic keys

#### Mitigation Strategies
1. **Multi-factor Authentication**: Required for all sensitive operations
2. **Cryptographic Binding**: Strong cryptographic links between identities and credentials
3. **Certificate Pinning**: Prevents man-in-the-middle attacks
4. **Timestamp Validation**: Prevents replay attacks
5. **Key Rotation**: Regular key rotation limits impact of key compromise

## Implementation Guidelines

### Development Standards

#### Code Quality
- **Language**: Java 11+ for Java actions implementation
- **Platform**: Mendix Studio Pro 10.24.1+
- **Testing**: JUnit 5 for Java actions with 90% code coverage requirement
- **Documentation**: Comprehensive module documentation with examples

#### Development Process
- **Version Control**: Git with feature branch workflow
- **Code Reviews**: Mandatory peer reviews for all code changes
- **Continuous Integration**: Automated testing and deployment pipeline
- **Security Scanning**: Static and dynamic security analysis

### Deployment Architecture

#### Environment Configuration
- **Development**: Local development environment with mock services
- **Testing**: Automated testing environment with CI/CD integration
- **Staging**: Production-like environment for final testing
- **Production**: High-availability production deployment

#### Infrastructure Requirements
- **Compute**: 4 vCPUs, 8GB RAM per service instance
- **Storage**: 100GB SSD per instance
- **Network**: 1Gbps network connectivity
- **Monitoring**: Comprehensive monitoring and alerting

### Configuration Management

#### Application Configuration
```yaml
server:
  port: 8080
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-type: PKCS12

veridian:
  api:
    base-url: https://api.veridian.id
    timeout: 30000
  security:
    signing-algorithm: EdDSA
    encryption-algorithm: AES-256-GCM

mendix:
  integration:
    enabled: true
    connector-version: 2.0
    max-connections: 100
```

## Testing Strategy

### Testing Framework

#### Unit Testing
- **Framework**: JUnit 5 with Mockito
- **Coverage**: Minimum 90% code coverage
- **Mock Strategy**: Mock external dependencies
- **Test Data**: Synthetic test data generation

#### Integration Testing
- **Scope**: End-to-end workflow testing
- **Environment**: Dedicated testing environment
- **Data**: Realistic test data sets
- **Automation**: Automated test execution

#### Security Testing
- **Penetration Testing**: Regular security assessments
- **Vulnerability Scanning**: Automated vulnerability detection
- **Compliance Testing**: Regulatory compliance validation
- **Cryptographic Testing**: Cryptographic implementation validation

### Test Scenarios

#### Identity Management Tests
1. **Create Identity**: Test identity creation with various configurations
2. **Key Rotation**: Test key rotation procedures and validation
3. **Identity Delegation**: Test delegation relationships and permissions
4. **Identity Revocation**: Test revocation procedures and cleanup

#### Credential Management Tests
1. **Credential Issuance**: Test credential creation and signing
2. **Credential Verification**: Test verification procedures and validation
3. **Credential Presentation**: Test presentation generation and validation
4. **Credential Revocation**: Test revocation procedures and status updates

#### Integration Tests
1. **Mendix Integration**: Test Mendix connector functionality
2. **Veridian Integration**: Test Veridian API integration
3. **End-to-End Workflows**: Test complete business processes
4. **Error Handling**: Test error scenarios and recovery procedures

## Deployment Specifications

### Deployment Architecture

#### Container Strategy
- **Containerization**: Docker containers for all services
- **Orchestration**: Kubernetes for container management
- **Service Mesh**: Istio for service communication
- **Monitoring**: Prometheus and Grafana for observability

#### Scaling Strategy
- **Horizontal Scaling**: Auto-scaling based on CPU and memory usage
- **Load Balancing**: Round-robin load balancing with health checks
- **Database Scaling**: Read replicas for improved performance
- **Caching**: Redis clustering for distributed caching

### Operational Procedures

#### Deployment Process
1. **Code Commit**: Developer commits code to feature branch
2. **CI Pipeline**: Automated testing and building
3. **Security Scan**: Security vulnerability assessment
4. **Staging Deploy**: Deployment to staging environment
5. **Integration Tests**: Automated integration testing
6. **Production Deploy**: Blue-green deployment to production
7. **Monitoring**: Post-deployment monitoring and validation

#### Monitoring and Alerting
- **Application Metrics**: Response time, error rate, throughput
- **Infrastructure Metrics**: CPU, memory, disk, network usage
- **Security Metrics**: Failed authentication attempts, security violations
- **Business Metrics**: Identity creation rate, credential verification rate

#### Backup and Recovery
- **Backup Strategy**: Automated daily backups with point-in-time recovery
- **Recovery Procedures**: Documented recovery procedures with RTO/RPO targets
- **Disaster Recovery**: Multi-region deployment with failover capabilities
- **Business Continuity**: Comprehensive business continuity planning

## Appendix - Sequence Diagrams

Use case 1 \- Verify Landano user

**sequenceDiagram**  
    participant C **as** Chief  
    participant K **as** Veridian (KERIA)  
    participant R **as** Chief Representative  
    participant W **as** Veridian ID Wallet (Signify)  
    participant V **as** Verifier

*%% Use Case 1: Chief AID Creation*  
    rect rgb(240, 240, 240\)  
        Note over C,K: Use Case 1: Chief AID Creation  
        C\-\>\>K: Create AID request  
        K\-\>\>K: Generate inception event  
        K\--\>\>C: Return AID  
    end

    *%% Use Case 2: Representative AID Creation*  
    rect rgb(230, 240, 250\)  
        Note over R,W: Use Case 2: Representative AID Creation  
        R\-\>\>W: Initialize wallet  
        W\-\>\>W: Generate keys  
        W\-\>\>W: Create AID  
        W\--\>\>R: Return AID control  
    end

    *%% Use Case 3: ACDC Issuance*  
    rect rgb(240, 230, 240\)  
        Note over C,R: Use Case 3: ACDC Credential Issuance  
        C\-\>\>K: Request issue ACDC  
        K\-\>\>K: Create ACDC  
        K\-\>\>K: Sign with Chief's keys  
        K\-\>\>W: Send ACDC to Representative  
        W\-\>\>W: Store ACDC  
        W\--\>\>R: Notify receipt  
    end

    *%% Use Case 4: Verification*  
    rect rgb(230, 240, 230\)  
        Note over V,R: Use Case 4: Credential Verification  
        V\-\>\>W: Request presentation  
        W\-\>\>W: Create presentation  
        W\-\>\>W: Sign with Rep's keys  
        W\-\>\>V: Send signed presentation  
        V\-\>\>V: Verify Chief's signature  
        V\-\>\>V: Verify Rep's signature  
        V\--\>\>R: Confirm verification  
    end

Use case 2 \- Verify User Ownshership of Landano NFT

sequenceDiagram  
    participant R as Rightsholder  
    participant AW as ADA Wallet  
    participant VD as Verification dApp  
    participant IW as ID Wallet  
      
    R\-\>\>VD: Initiate verification  
    VD\-\>\>AW: Connect wallet  
    VD\-\>\>IW: Connect wallet  
      
    VD\-\>\>AW: Query Landano NFT by policy ID  
    AW\--\>\>VD: Return NFT data  
      
    VD\-\>\>VD: Search NFT metadata for KERI AID  
      
    VD\-\>\>R: Request CIP-30 signature  
    R\-\>\>IW: Sign payload with KERI AID  
    IW\--\>\>VD: Return signed payload

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,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>

[image3]: <data:image/png;base64,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>

[image4]: <data:image/png;base64,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>