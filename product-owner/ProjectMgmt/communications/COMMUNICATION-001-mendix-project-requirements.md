# COMMUNICATION-001: Mendix Project Requirements for Veridian Integration

**Date:** 2025-07-14  
**From:** Implementation Team (Dorus van der Kroft)  
**To:** Product Owner  
**Subject:** Critical: Mendix Project Setup and Specialist Resources Required  
**Priority:** HIGH  
**Related Issues:** ISSUE-021 (KERI Edge Protection Implementation)

## Executive Summary

During implementation of ISSUE-021 (KERI Edge Protection), a critical gap has been identified. While comprehensive architectural designs have been completed, **no functional Mendix project exists** to implement the Veridian Identity integration. This requires immediate Product Owner attention for project setup and resource allocation.

## Current Status

### ✅ **Completed Work**
- **Architectural Design**: Complete hybrid QR code linking architecture  
- **Technical Specifications**: Detailed implementation patterns and security controls  
- **Documentation**: Comprehensive threat model and security framework  
- **API Designs**: REST endpoint specifications and integration patterns  

### ❌ **Critical Gap Identified**
- **No Mendix Project**: No application structure exists to implement the integration
- **No Functional Code**: Only documentation and specifications created
- **No Database Schema**: No actual entities or tables implemented
- **No Test Framework**: No executable validation procedures

## Analysis: Veridian.id Implementation Assessment

### **What Veridian.id Already Provides** (~70% of functionality)
- **KERIA Multi-tenant Cloud Agent**: Fully operational with sandbox URLs
- **Signify Client Libraries**: TypeScript and Python implementations ready
- **Veridian Mobile App**: Open-source mobile app with full KERI implementation
- **ACDC Credential Management**: Complete issuance and verification capabilities
- **Cryptographic Security**: Ed25519 signatures, post-quantum security features

### **What We Need to Build for Landano** (~30% custom development)
- **Mendix-Specific Integration Components**: Java actions, microflows, REST services
- **QR Code Challenge-Response System**: Secure challenge creation and validation
- **NFT Verification Workflows**: Cardano integration and metadata validation
- **Audit & Logging Systems**: Comprehensive event tracking and compliance
- **Business Logic Layers**: User role management and verification workflows

## Critical Requirements

### **1. Mendix Project Setup Required**
- **Dedicated Mendix Module**: Create "LandanoVeridianIdentity" module
- **Custom Java Actions**: Implement KERI protocol operations
- **REST API Layer**: Build callback endpoints for mobile app integration
- **Database Schema**: Design entities for account linking and verification
- **UI Components**: Create pages for identity management workflows

### **2. Mendix Specialist Strongly Recommended**
- **Technical Complexity**: Custom cryptographic operations and API handling
- **Skills Required**: Java development, REST API design, Mendix runtime knowledge
- **Security Requirements**: Proper handling of signatures and sensitive data
- **Integration Complexity**: Hybrid architecture with mobile app callbacks

### **3. Development Effort Estimate**
- **QR Code Linking System**: 2-3 weeks
- **Mendix Integration Layer**: 3-4 weeks  
- **NFT Verification Logic**: 2-3 weeks
- **Audit & Logging**: 1-2 weeks
- **Testing & Security Review**: 2-3 weeks
- **Total Estimated Effort**: 10-15 weeks

## Recommendations

### **Immediate Actions Required**
1. **Create Mendix Project**: Set up dedicated Mendix application for Veridian integration
2. **Allocate Mendix Specialist**: Assign developer with Mendix expertise to project
3. **Establish Development Environment**: Configure Mendix Studio Pro and deployment pipeline
4. **Define Project Structure**: Create module architecture for integration components

### **Resource Allocation**
- **Primary Developer**: Mendix specialist with Java and REST API experience
- **Secondary Developer**: Implementation team member for KERI protocol expertise
- **Time Allocation**: 50% of specialist time for 10-15 weeks
- **Priority**: High - blocks all Sprint 1 identity creation features

### **Risk Mitigation**
- **Technical Risk**: Mendix specialist mitigates custom integration complexity
- **Timeline Risk**: Early project setup prevents Sprint 1 delays
- **Security Risk**: Proper Mendix implementation ensures edge protection compliance
- **Integration Risk**: Veridian's 70% existing functionality reduces development complexity

## Impact Assessment

### **Sprint 1 Impact**
- **Current Status**: ISSUE-021 blocked pending Mendix project setup
- **Dependent Issues**: All identity creation features blocked
- **Timeline Risk**: Sprint 1 completion at risk without immediate action
- **Mitigation**: Immediate project setup and resource allocation

### **Project Success Factors**
- **Leveraging Existing Components**: Veridian provides solid foundation
- **Focused Development**: 30% custom development is achievable
- **Proven Architecture**: Hybrid QR code linking is technically validated
- **Security Compliance**: KERI edge protection maintained

## Recommended Next Steps

1. **Immediate (This Week)**:
   - Create Mendix project structure
   - Allocate Mendix specialist to project
   - Set up development environment

2. **Short-term (Next 2 Weeks)**:
   - Implement core Java actions for KERI operations
   - Build QR code challenge-response system
   - Create basic account linking functionality

3. **Medium-term (Following 4-6 Weeks)**:
   - Implement NFT verification workflows
   - Build audit logging system
   - Create user interface components

## Decision Required

**Product Owner approval needed for**:
1. Mendix project creation and setup
2. Mendix specialist resource allocation
3. Development environment configuration
4. Sprint 1 timeline adjustment (if needed)

## Conclusion

The Veridian integration is **technically feasible and architecturally sound**. With proper Mendix project setup and specialist resources, the implementation can proceed successfully within the 3-month timeline. The hybrid QR code linking approach maintains KERI security principles while providing practical integration between Mendix and Veridian systems.

**Immediate action required** to unblock Sprint 1 and ensure project success.

---

**Contact**: Implementation Team  
**Next Review**: Upon Product Owner response  
**Escalation**: If no response within 24 hours, escalate to project stakeholders