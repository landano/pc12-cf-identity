# ISSUE-027: Veridian Sandbox Test Setup

**Status:** Open
**Created:** 2025-07-15
**Assignee:** Implementation Agent
**Priority:** High
**Labels:** testing, sandbox, veridian, mobile-testing, sprint-1
**Sprint:** Sprint 1 (2025-07-14)

## Description
Create comprehensive test setup instructions and procedures for Veridian sandbox environment testing. This includes multi-stakeholder testing scenarios that can work with available devices (2 phones) or alternative testing approaches to simulate chief, representative, and verifier interactions.

## Tasks
- [ ] Document Veridian sandbox environment setup procedures
- [ ] Create test scenarios for multi-stakeholder workflows
- [ ] Design phone-based testing procedures for 2-device setup
- [ ] Identify alternative testing methods (emulators, mock services)
- [ ] Create test data and credentials for sandbox
- [ ] Document troubleshooting guide for common issues

## Subtasks
- [ ] [[ISSUE-027-veridian-sandbox-test-setup-a]] - Document sandbox access and authentication
- [ ] [[ISSUE-027-veridian-sandbox-test-setup-b]] - Create chief-representative test workflows
- [ ] [[ISSUE-027-veridian-sandbox-test-setup-c]] - Design 2-phone testing procedures
- [ ] [[ISSUE-027-veridian-sandbox-test-setup-d]] - Explore emulator/simulation options

## Related Issues
- Supports: [[ISSUE-021-keri-edge-protection-implementation]]
- Related to: [[ISSUE-024-unit-testing-framework]]
- Related to: [[ISSUE-025-integration-testing-suite]]

## Relationships
- Supports testing for: All identity and credential issues

## Comments
### 2025-07-15 - Dorus van der Kroft
Need comprehensive test setup that works with 2 physical phones and explores alternatives for simulating multiple stakeholders (chief, representative, verifier).

## Acceptance Criteria
- [ ] Complete sandbox environment setup guide with URLs and credentials
- [ ] Test scenarios cover all three stakeholder types (chief, representative, verifier)
- [ ] 2-phone testing procedure documented with clear role assignments
- [ ] Alternative testing methods identified (emulators, browser sessions, mock services)
- [ ] Test data includes sample identities, credentials, and NFT metadata
- [ ] Troubleshooting covers common connectivity and authentication issues
- [ ] Scripts or tools provided for test automation where possible
- [ ] Security considerations documented for test environment
- [ ] Reset procedures documented for clean test runs
- [ ] Performance benchmarks established for sandbox operations

## Implementation Log
<!-- Auto-generated log of actual development work performed by the LLM -->