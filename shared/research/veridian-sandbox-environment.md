# Veridian Sandbox Environment - Development and Testing Guide

## Overview
This document provides complete access details and guidance for using the Veridian hosted sandbox environment for the Landano Veridian Identity Module project. The sandbox enables testing of KERI protocol operations, credential issuance, and verification workflows without affecting production systems.

## 🔑 Sandbox Access Details

### Environment URLs

#### Boot URL (Agent Initialization)
```
https://keria-boot.demo.idw-sandboxes.cf-deployments.org
```
**Purpose**: Used to initialize the SSI (Self-Sovereign Identity) agent
**Usage**: Initial setup and agent bootstrapping operations

#### Connect URL (Backend Connectivity)
```
https://keria.demo.idw-sandboxes.cf-deployments.org
```
**Purpose**: Maintain wallet connectivity to the backend KERIA service
**Usage**: Ongoing operations, AID management, and protocol communications

#### Credential UI (Management Interface)
```
https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org
```
**Purpose**: Web interface for credential operations
**Features**: Issue, verify, and revoke ACDC credentials

### Environment Status
- **Environment**: Hosted Sandbox
- **Agreement**: Sandbox User Agreement in place
- **Access Level**: Development and testing
- **Documentation**: Available at https://docs.veridian.id

## 🛠️ Integration Configuration

### Development Environment Setup

#### JavaScript/Signify Integration
```javascript
// Sandbox configuration for Landano project
const sandboxConfig = {
    bootUrl: 'https://keria-boot.demo.idw-sandboxes.cf-deployments.org',
    keriaUrl: 'https://keria.demo.idw-sandboxes.cf-deployments.org',
    credentialUiUrl: 'https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org',
    environment: 'sandbox'
};

// Initialize Signify client with sandbox endpoints
async function initializeSandboxClient() {
    await ready();
    
    const client = new SignifyClient(
        sandboxConfig.keriaUrl,
        'sandbox-passcode',
        Tier.low,
        sandboxConfig.bootUrl
    );
    
    return client;
}
```

#### Java/Mendix Integration
```java
// Sandbox configuration for Mendix integration
@Configuration
public class VeridianSandboxConfig {
    
    @Value("${veridian.sandbox.boot.url:https://keria-boot.demo.idw-sandboxes.cf-deployments.org}")
    private String bootUrl;
    
    @Value("${veridian.sandbox.keria.url:https://keria.demo.idw-sandboxes.cf-deployments.org}")
    private String keriaUrl;
    
    @Value("${veridian.sandbox.credential.ui.url:https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org}")
    private String credentialUiUrl;
    
    @Bean
    @Profile("sandbox")
    public VeridianClient sandboxVeridianClient() {
        return VeridianClient.builder()
            .bootUrl(bootUrl)
            .keriaUrl(keriaUrl)
            .credentialUiUrl(credentialUiUrl)
            .environment("sandbox")
            .build();
    }
}
```

### Mendix Configuration Properties
```properties
# Sandbox environment configuration
veridian.sandbox.boot.url=https://keria-boot.demo.idw-sandboxes.cf-deployments.org
veridian.sandbox.keria.url=https://keria.demo.idw-sandboxes.cf-deployments.org
veridian.sandbox.credential.ui.url=https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org
veridian.sandbox.timeout=30000
veridian.sandbox.retry.attempts=3
```

## 🧪 Testing Workflows

### 1. Identity Creation Testing
```javascript
// Test chief identity creation in sandbox
async function testChiefIdentityCreation() {
    const client = await initializeSandboxClient();
    
    const result = await client.identifiers().create({
        name: 'landano-chief-sandbox-001',
        witnesses: ['witness1.demo.idw-sandboxes.cf-deployments.org'],
        thold: 1
    });
    
    console.log('Sandbox Chief AID:', result.prefix);
    return result;
}
```

### 2. Credential Issuance Testing
```javascript
// Test ACDC credential issuance
async function testCredentialIssuance(issuerAID, holderAID) {
    const client = await initializeSandboxClient();
    
    const credential = await client.credentials().issue({
        issuer: issuerAID,
        holder: holderAID,
        schema: 'landano-land-rights-schema',
        attributes: {
            land_parcel_id: 'SANDBOX-LP-001',
            rights_type: 'ownership',
            location: 'Test Location',
            issued_date: new Date().toISOString()
        }
    });
    
    return credential;
}
```

### 3. QR Code Linking Testing
```javascript
// Test hybrid QR code linking workflow
async function testQRCodeLinking() {
    // Generate sandbox challenge
    const challenge = generateSecureChallenge();
    const qrData = {
        version: '1.0',
        type: 'landano_account_linking',
        challenge: challenge,
        callbackUrl: 'https://api-sandbox.landano.io/veridian/link',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        environment: 'sandbox'
    };
    
    return qrData;
}
```

## 📋 Testing Checklist

### Sprint 1 Sandbox Testing Requirements

#### ISSUE-001: Veridian Platform Integration Research
- [ ] Test connection to all three sandbox URLs
- [ ] Verify API authentication and response formats
- [ ] Document API capabilities and limitations
- [ ] Test KERI protocol operations
- [ ] Validate witness operations

#### ISSUE-021: KERI Edge Protection Implementation
- [ ] Test private key operations stay in mobile app
- [ ] Verify sandbox supports edge protection patterns
- [ ] Test key rotation in sandbox environment
- [ ] Validate signature verification workflows
- [ ] Test HSM integration patterns

#### ISSUE-022: Transport Security Implementation
- [ ] Test TLS 1.3 connections to sandbox
- [ ] Verify certificate validation
- [ ] Test mutual TLS if supported
- [ ] Validate secure communication patterns
- [ ] Test error handling and recovery

#### ISSUE-015: Cardano Plugin Integration
- [ ] Test NFT metadata queries (simulated)
- [ ] Verify policy ID validation
- [ ] Test asset name extraction
- [ ] Validate integration patterns

#### ISSUE-017: ADA Wallet Connection via CIP-30
- [ ] Test wallet connection simulation
- [ ] Verify QR code linking workflow
- [ ] Test account linking validation
- [ ] Validate hybrid approach patterns

## 🔍 Sandbox Testing Best Practices

### 1. Environment Isolation
- Always use sandbox-specific configurations
- Never mix sandbox and production credentials
- Use clear naming conventions (e.g., 'sandbox-', 'test-')
- Maintain separate test data sets

### 2. Test Data Management
```javascript
// Sandbox test data conventions
const sandboxTestData = {
    chiefPrefix: 'landano-sandbox-chief-',
    representativePrefix: 'landano-sandbox-rep-',
    credentialPrefix: 'landano-sandbox-cred-',
    testLocation: 'Sandbox Test Location',
    testPolicyId: 'sandbox_policy_123',
    testAssetName: 'SandboxLandRights001'
};
```

### 3. Logging and Monitoring
```javascript
// Enhanced logging for sandbox testing
const sandboxLogger = {
    logTestOperation: function(operation, result, timing) {
        console.log(`[SANDBOX] ${operation}:`, {
            result: result,
            timing: timing,
            timestamp: new Date().toISOString(),
            environment: 'sandbox'
        });
    }
};
```

## 🚀 Development Workflow Integration

### 1. Local Development
- Use sandbox for all local testing
- Implement environment switching
- Maintain sandbox-specific test suites
- Document sandbox-specific configurations

### 2. CI/CD Integration
```yaml
# Example CI/CD configuration
test-sandbox:
  environment: sandbox
  variables:
    VERIDIAN_BOOT_URL: https://keria-boot.demo.idw-sandboxes.cf-deployments.org
    VERIDIAN_KERIA_URL: https://keria.demo.idw-sandboxes.cf-deployments.org
    VERIDIAN_CREDENTIAL_UI_URL: https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org
  script:
    - npm run test:sandbox
    - npm run test:integration:sandbox
```

### 3. Team Coordination
- Share sandbox test results in daily standups
- Document sandbox discoveries in issue implementation logs
- Coordinate sandbox usage to avoid conflicts
- Maintain shared sandbox test scenarios

## 📚 Additional Resources

### Documentation
- **Primary Documentation**: https://docs.veridian.id
- **KERI Protocol**: https://keri.one
- **Signify Library**: https://github.com/WebOfTrust/signify-ts
- **ACDC Specification**: https://trustoverip.github.io/tswg-acdc-specification/

### Support
- Document any sandbox issues or questions
- Share discoveries with the team
- Report bugs or limitations found
- Contribute to sandbox documentation improvements

## 🔄 Environment Updates

This document will be updated as:
- New sandbox features become available
- API endpoints change or are added
- Testing patterns are discovered
- Integration approaches are validated

**Last Updated**: 2025-07-14  
**Next Review**: After Sprint 1 completion  
**Contact**: Report sandbox issues through project channels