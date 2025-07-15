# ISSUE-005: Credential Issuance by Chief

**Status:** Open
**Created:** 2025-07-14
**Assignee:** Unassigned
**Priority:** High
**Labels:** credential, chief, issuance, acdc, keri, sprint-ready

## Description
Implement the functionality for village chiefs to issue ACDC (Authentic Chained Data Container) credentials to their representatives. This feature enables chiefs to delegate authority to representatives for land transaction activities.

## Tasks
- [ ] Design credential issuance form and workflow
- [ ] Implement ACDC credential creation
- [ ] Add credential schema validation
- [ ] Create credential signing process
- [ ] Add credential delivery mechanism
- [ ] Implement credential tracking and logging

## Subtasks
- [ ] [[ISSUE-005-credential-issuance-by-chief-a]] - Design ACDC credential schema
- [ ] [[ISSUE-005-credential-issuance-by-chief-b]] - Implement credential creation workflow
- [ ] [[ISSUE-005-credential-issuance-by-chief-c]] - Add credential signing with chief's keys
- [ ] [[ISSUE-005-credential-issuance-by-chief-d]] - Create credential delivery system

## Related Issues
- Implements: Epic 2 - Credential Issuance Management
- Related to: [[ISSUE-006-credential-reception-by-representative]]
- Related to: [[ISSUE-007-credential-status-management]]

## Relationships
- Depends on: [[ISSUE-002-chief-identity-creation-ui]]
- Depends on: [[ISSUE-003-representative-identity-creation-ui]]
- Blocks: [[ISSUE-006-credential-reception-by-representative]]
- Implements: [[Epic2-Credential-Issuance-Management]]

## Acceptance Criteria
- [ ] Chief can create ACDC credentials following Veridian schema standards
- [ ] Credential includes required fields: representative AID, permissions, validity period, jurisdiction
- [ ] Credential schema validation prevents invalid or incomplete credentials
- [ ] Signing process uses chief's private key via Veridian mobile app (hybrid approach)
- [ ] Credential delivery uses secure KERI-compliant messaging to representative
- [ ] All credential issuance activities are logged with timestamp and chief identity
- [ ] Error handling provides clear feedback for validation failures
- [ ] UI prevents duplicate credential issuance to same representative
- [ ] Credential format is interoperable with Veridian wallet presentation
- [ ] Performance: Credential creation completes within 5 seconds
- [ ] Security: Private key operations occur only in Veridian mobile app
- [ ] Audit trail captures complete credential lifecycle
- [ ] Integration with ISSUE-003 representative identity is seamless
- [ ] Documentation includes credential schema and issuance flow
- [ ] **Sandbox Testing**: Credential creation tested with Veridian sandbox
- [ ] **Sandbox Testing**: Schema validation verified against sandbox requirements
- [ ] **Sandbox Testing**: Delivery mechanism tested end-to-end in sandbox
- [ ] **Sandbox Testing**: Representative can receive and store credential in sandbox wallet

## Comments
### 2025-07-14 - Dorus van der Kroft
Core credential issuance functionality - critical for the representative authority use case. Must ensure proper ACDC format compliance.

## Implementation Log
<!-- Auto-generated log of actual development work performed by the LLM -->