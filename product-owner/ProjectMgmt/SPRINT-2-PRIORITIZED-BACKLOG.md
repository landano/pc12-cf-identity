# Sprint 2 - Prioritized Backlog

**Date:** 2025-07-15
**Sprint Goal:** Implement foundational security and core identity creation workflows

## Priority Order for Implementation

### 🔴 CRITICAL Priority - Must Complete First

1. **ISSUE-021: KERI Edge Protection Implementation**
   - **Why First:** Foundational security layer - all other features depend on this
   - **Status:** Ready for implementation
   - **Dependencies:** None (unblocked by ISSUE-001 research)
   - **Blocks:** Identity creation features

### 🟠 HIGH Priority - Core Features

2. **ISSUE-002: Chief Identity Creation UI** 
   - **Why Second:** Root of trust - no credentials without chiefs
   - **Status:** Sprint-ready with clear acceptance criteria
   - **Dependencies:** ISSUE-021 (edge protection)
   - **Blocks:** Credential issuance

3. **ISSUE-022: Transport Security Implementation**
   - **Why Parallel:** Can be developed alongside identity features
   - **Status:** Sprint-ready
   - **Dependencies:** None
   - **Blocks:** None (but needed for secure communications)

4. **ISSUE-003: Representative Identity Creation UI**
   - **Why Fourth:** Follows chief creation pattern
   - **Status:** Sprint-ready with clear acceptance criteria  
   - **Dependencies:** ISSUE-002 (for UI patterns)
   - **Blocks:** Credential reception

5. **ISSUE-015: Cardano Plugin Integration**
   - **Why Early:** Already sprint-ready, foundational for NFT features
   - **Status:** Sprint-ready with excellent acceptance criteria
   - **Dependencies:** None (analysis can start immediately)
   - **Blocks:** NFT verification features

6. **ISSUE-005: Credential Issuance by Chief**
   - **Why After Identity:** Requires both chief and representative identities
   - **Status:** Sprint-ready (acceptance criteria just added)
   - **Dependencies:** ISSUE-002, ISSUE-003
   - **Blocks:** Credential presentation/verification

7. **ISSUE-017: ADA Wallet Connection via CIP-30**
   - **Why Later:** Makes sense after identity/credential basics work
   - **Status:** Sprint-ready
   - **Dependencies:** None technically (but better after credentials)
   - **Blocks:** Wallet verification features

## Sprint Capacity Planning

### Recommended Parallel Tracks

**Track 1 - Security Foundation:**
- Developer 1: ISSUE-021 (KERI Edge Protection)
- Developer 1: ISSUE-022 (Transport Security) - after ISSUE-021

**Track 2 - Identity Creation:**
- Developer 2: ISSUE-002 (Chief Identity) 
- Developer 2: ISSUE-003 (Representative Identity) - after ISSUE-002
- Developer 2: ISSUE-005 (Credential Issuance) - after ISSUE-003

**Track 3 - Cardano Integration:**
- Developer 3: ISSUE-015 (Plugin Analysis/Integration)
- Developer 3: ISSUE-017 (Wallet Connection) - if time permits

## Definition of Done for Sprint 2

- [ ] KERI edge protection fully implemented and tested
- [ ] Chief identity creation workflow complete with QR linking
- [ ] Representative identity creation workflow complete
- [ ] Transport security (TLS 1.3) configured and tested
- [ ] Basic credential issuance from chief to representative working
- [ ] Cardano plugin integration analysis complete
- [ ] All implementations tested in Veridian sandbox
- [ ] Documentation updated for completed features

## Risk Mitigation

1. **Dependency Risk:** ISSUE-021 blocks multiple features
   - Mitigation: Prioritize and assign best developer
   - Backup: Other developers can start on non-dependent work

2. **Integration Risk:** Veridian sandbox integration unknowns
   - Mitigation: Early sandbox testing for each feature
   - Backup: Mock implementations if sandbox issues arise

3. **Complexity Risk:** KERI edge protection is complex
   - Mitigation: Break into smaller subtasks, frequent reviews
   - Backup: Seek Veridian team support if needed

## Success Metrics

- All CRITICAL and at least 4 HIGH priority issues completed
- Successful end-to-end identity creation in Veridian sandbox
- Zero security vulnerabilities in implemented features
- All acceptance criteria met for completed issues

## Notes

- Research phase (ISSUE-001) successfully completed with hybrid QR approach
- All priority issues now have clear acceptance criteria
- Veridian sandbox access confirmed and ready for testing
- Team should check Veridian docs for any API updates