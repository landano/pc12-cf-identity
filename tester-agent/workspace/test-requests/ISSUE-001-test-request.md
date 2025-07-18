# Test Request: ISSUE-001 Veridian Platform Integration Research

**Issue ID:** ISSUE-001
**Status:** ready_for_testing
**Priority:** High
**Assigned From:** Dorus van der Kroft
**Test Assignment Date:** 2025-07-18

## Overview
The development team has completed the research and documentation phase for Veridian platform integration. All development deliverables have been completed, and the remaining acceptance criteria are sandbox testing items.

## Test Scope

### Sandbox Environment Details
- **Boot URL:** https://keria-boot.demo.idw-sandboxes.cf-deployments.org
- **Connect URL:** https://keria.demo.idw-sandboxes.cf-deployments.org
- **Credential UI:** https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org

### Required Testing

1. **Sandbox URL Validation**
   - Test all three sandbox URLs for accessibility
   - Verify proper response from each endpoint
   - Document any connectivity issues

2. **API Authentication Testing**
   - Verify authentication methods work in sandbox
   - Test token generation and management
   - Validate authorization headers

3. **KERI Protocol Operations**
   - Test AID creation in sandbox environment
   - Verify key rotation functionality
   - Test witness coordination
   - Validate event streaming

4. **Hybrid QR Code Linking**
   - Test QR code generation
   - Verify challenge-response flow
   - Confirm edge protection maintained
   - Test account linking process

5. **Edge Protection Validation**
   - Confirm private keys remain on device
   - Verify no server-side key operations
   - Test security boundaries

## Test Resources

### Documentation to Review
- `/shared/research/mendix-integration-patterns.md`
- `/shared/research/security-architecture-specification.md`
- `/shared/research/technical-integration-specification.md`
- `/shared/research/hybrid-qr-linking-analysis.md`
- `/shared/research/veridian-sandbox-environment.md`

### Test Data Requirements
- Test AIDs for various scenarios
- Sample credentials for testing
- Mock land rights data

## Expected Outcomes

All sandbox testing items should pass to confirm:
- Veridian sandbox environment is accessible and functional
- API authentication works as documented
- KERI protocol operations function correctly
- Hybrid QR linking maintains security requirements
- Edge protection principles are upheld

## Deliverables

1. Test execution report with results for each test case
2. Screenshots/evidence of successful operations
3. Any defects or issues discovered
4. Recommendations for production deployment
5. Updated acceptance criteria checklist

## Timeline
Please complete testing within 2-3 days to maintain sprint velocity.

## Notes
This is a critical path item blocking 12 other issues. Priority attention requested.