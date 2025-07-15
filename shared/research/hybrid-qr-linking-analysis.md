# Hybrid QR Code Linking Analysis - Veridian-Mendix Integration

**Related to:** ISSUE-021

## Executive Summary
The proposed QR code linking approach is **technically feasible and maintains KERI edge protection** while creating a secure bridge between Mendix user accounts and Veridian wallets. This analysis confirms the approach can work securely with proper implementation.

## 1. Technical Feasibility Analysis

### ✅ **FEASIBLE** - Strong Precedent in Industry
This approach follows established patterns used by:
- **Hardware wallet integrations** (Ledger, Trezor with web apps)
- **Mobile wallet connections** (WalletConnect protocol)
- **Banking mobile apps** (secure transaction signing)
- **2FA authentication** (TOTP, push notifications)

### Core Technical Flow
```
Mendix Web App                    Veridian Mobile App
├── Generate challenge           ├── Scan QR code
├── Create QR code               ├── Parse challenge data
├── Display QR code              ├── Sign with private key
├── Wait for signature           ├── Submit signed response
└── Verify & link account        └── Confirm linking
```

## 2. Security Analysis

### ✅ **SECURE** - Maintains KERI Edge Protection
- **Private keys never leave mobile device** ✓
- **No key material in QR code** ✓
- **Challenge-response prevents replay attacks** ✓
- **Cryptographic proof of ownership** ✓

### Security Properties
1. **Authentication**: User proves control of AID through signature
2. **Non-repudiation**: Signed linking cannot be denied
3. **Integrity**: Tamper-evident connection establishment
4. **Confidentiality**: No sensitive data exposed in QR code

## 3. KERI Protocol Compatibility

### ✅ **COMPATIBLE** - Aligns with KERI Principles
- **AID-based identity**: Uses existing KERI identifiers
- **Signature verification**: Standard KERI signature validation
- **Witness validation**: Can include witness receipt verification
- **Key rotation support**: Connection survives key rotations

## 4. QR Code Data Structure

### Recommended QR Code Content
```json
{
  "version": "1.0",
  "type": "landano_account_linking",
  "challenge": "base64url_encoded_random_challenge",
  "mendix_account_id": "encrypted_user_account_id",
  "callback_url": "https://api.landano.io/veridian/link",
  "expires_at": "2025-07-14T15:30:00Z",
  "nonce": "random_nonce_for_uniqueness"
}
```

### Security Considerations
- **Challenge**: Random, time-limited, single-use
- **Account ID**: Encrypted to prevent enumeration
- **Callback URL**: Authenticated endpoint with rate limiting
- **Expiration**: Short-lived (5-10 minutes)

## 5. Signature Challenge Design

### What Should Be Signed (Recommended)
```javascript
const signatureInput = {
  challenge: "base64url_challenge_from_qr",
  mendix_account_id: "encrypted_account_id",
  veridian_aid: "users_keri_aid",
  timestamp: "2025-07-14T15:25:00Z",
  purpose: "account_linking",
  app_context: "landano_nft_verification"
};

const signatureString = JSON.stringify(signatureInput);
const signature = await signWithKERIPrivateKey(signatureString);
```

### Signature Verification Process
1. **Parse signed data** and extract components
2. **Verify timestamp** is within acceptable window
3. **Validate challenge** matches generated challenge
4. **Verify signature** using AID's current public key
5. **Check witness receipts** for AID validity
6. **Confirm no replay** (challenge used only once)

## 6. Connection Persistence Strategy

### Database Schema for Linked Accounts
```sql
CREATE TABLE veridian_account_links (
    id UUID PRIMARY KEY,
    mendix_user_id UUID NOT NULL,
    veridian_aid VARCHAR(255) NOT NULL,
    link_signature TEXT NOT NULL,
    link_timestamp TIMESTAMP NOT NULL,
    last_verified TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    witness_receipts JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Connection Refresh Mechanism
- **Periodic re-verification** (monthly)
- **Key rotation handling** (automatic AID updates)
- **Witness receipt refresh** (maintain current state)
- **Challenge-response re-authentication** when needed

## 7. Implementation in Mendix

### Server-Side Components (Safe for Mendix)
```java
// Generate linking challenge
@UserAction
public class GenerateLinkingChallenge extends CoreJavaAction<String> {
    public String executeAction() throws Exception {
        String challenge = generateSecureChallenge();
        String encryptedAccountId = encryptAccountId(getCurrentUserId());
        
        QRCodeData qrData = new QRCodeData();
        qrData.setChallenge(challenge);
        qrData.setMendixAccountId(encryptedAccountId);
        qrData.setCallbackUrl("https://api.landano.io/veridian/link");
        qrData.setExpiresAt(Instant.now().plus(Duration.ofMinutes(10)));
        
        // Store challenge for later verification
        storePendingChallenge(challenge, getCurrentUserId());
        
        return generateQRCode(qrData);
    }
}
```

### Verification Endpoint
```java
@RestController
@RequestMapping("/veridian")
public class VeridianLinkingController {
    
    @PostMapping("/link")
    public ResponseEntity<LinkingResponse> linkAccount(@RequestBody LinkingRequest request) {
        try {
            // Verify signature
            boolean signatureValid = verifyKERISignature(request);
            
            // Validate challenge
            boolean challengeValid = validateChallenge(request.getChallenge());
            
            // Check AID status
            boolean aidValid = validateAIDWithWitnesses(request.getVeridianAid());
            
            if (signatureValid && challengeValid && aidValid) {
                // Create permanent link
                createAccountLink(request);
                return ResponseEntity.ok(new LinkingResponse(true, "Account linked successfully"));
            } else {
                return ResponseEntity.badRequest().body(new LinkingResponse(false, "Linking failed"));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new LinkingResponse(false, "Internal error"));
        }
    }
}
```

## 8. Comparison with Similar Systems

### WalletConnect Protocol Similarities
- **QR code initiation** ✓
- **Mobile app signing** ✓
- **Session persistence** ✓
- **Challenge-response** ✓

### Banking App Patterns
- **Mobile transaction signing** ✓
- **Account linking** ✓
- **Time-limited challenges** ✓
- **Audit trails** ✓

## 9. Potential Attack Vectors & Mitigations

### 🔒 **Attack Vector**: QR Code Interception
**Mitigation**: Challenge is useless without corresponding private key

### 🔒 **Attack Vector**: Replay Attacks
**Mitigation**: Single-use challenges with timestamp validation

### 🔒 **Attack Vector**: Account Enumeration
**Mitigation**: Encrypted account IDs in QR codes

### 🔒 **Attack Vector**: Man-in-the-Middle
**Mitigation**: TLS + signature verification + witness validation

### 🔒 **Attack Vector**: Social Engineering
**Mitigation**: Clear UI showing what's being linked + confirmation screens

## 10. Implementation Complexity Assessment

### **Low Complexity** ✅
- **Mendix side**: Standard QR generation, REST endpoints, database operations
- **No cryptographic operations** on Mendix server
- **Standard web technologies** (QR libraries, HTTP APIs)
- **Existing patterns** to follow

### Development Effort Estimate
- **QR code generation**: 1-2 days
- **Verification endpoint**: 2-3 days
- **Database schema**: 1 day
- **UI integration**: 2-3 days
- **Testing & security review**: 3-4 days
- **Total**: ~10-13 days

## 11. Alternative Approaches Considered

### ❌ **Deep Linking** (Less Secure)
- URL schemes vulnerable to interception
- No cryptographic proof of intent

### ❌ **NFC Pairing** (Too Complex)
- Requires NFC-enabled devices
- More complex implementation

### ❌ **Push Notifications** (Dependency Issues)
- Requires notification infrastructure
- Platform-specific implementations

## 12. Recommendations

### ✅ **RECOMMENDED APPROACH**
The QR code linking approach is **technically sound and secure** with these implementation guidelines:

1. **Short-lived challenges** (5-10 minutes expiration)
2. **Rate limiting** on verification endpoints
3. **Comprehensive logging** for security audits
4. **Clear user confirmation** flows
5. **Periodic re-verification** of links

### Security Checklist
- [ ] Challenge generation uses cryptographically secure random numbers
- [ ] QR codes expire quickly and are single-use
- [ ] Signature verification includes witness validation
- [ ] Account IDs are encrypted in QR codes
- [ ] All communications use TLS 1.3
- [ ] Rate limiting prevents brute force attacks
- [ ] Audit logging tracks all linking activities

## Conclusion

**The hybrid QR code linking approach WILL WORK** and maintains KERI edge protection while solving the Mendix integration challenge. It follows established security patterns, is technically feasible, and provides a secure bridge between web-based Mendix applications and mobile-based Veridian wallets.

This approach successfully solves the architectural challenge while maintaining the security properties required by the KERI protocol.