# ISSUE-017: ADA Wallet Connection via CIP-30

**Status:** Open
**Created:** 2025-07-14
**Assignee:** Unassigned
**Priority:** High
**Labels:** wallet, cip-30, cardano, connection, integration, sprint-1, sprint-ready
**Sprint:** Sprint 1 (2025-07-14)
**Sprint Priority:** 5 (Enables wallet track)

## Description
Implement CIP-30 wallet connector integration using the **hybrid QR code linking approach** to enable secure connection between ADA wallets and linked Veridian accounts. This provides the foundation for wallet balance verification through account linkage rather than direct wallet access.

**🔧 Updated based on ISSUE-001 research**: Wallet connection works through hybrid architecture where Veridian mobile app handles wallet operations, with Mendix coordinating through secure account linking.

## Tasks
- [ ] Implement CIP-30 wallet discovery and connection
- [ ] Add wallet provider compatibility layer
- [ ] Create wallet connection UI components
- [ ] Add wallet state management
- [ ] Implement wallet disconnection handling
- [ ] Add wallet switching capabilities

## Subtasks
- [ ] [[ISSUE-017-ada-wallet-connection-cip30-a]] - Implement CIP-30 wallet discovery
- [ ] [[ISSUE-017-ada-wallet-connection-cip30-b]] - Add wallet provider compatibility
- [ ] [[ISSUE-017-ada-wallet-connection-cip30-c]] - Create wallet connection UI
- [ ] [[ISSUE-017-ada-wallet-connection-cip30-d]] - Add wallet state management

## Related Issues
- Implements: Epic 5 - ADA Wallet Connection and Balance Verification

## Relationships
- ✅ Unblocked by: [[ISSUE-001-veridian-platform-integration-research]] (Research complete - hybrid QR approach confirmed)
- Blocks: [[ISSUE-018-wallet-balance-verification]]
- Blocks: [[ISSUE-019-dual-signature-challenge-response]]
- Implements: [[Epic5-ADA-Wallet-Connection-Balance-Verification]]

## Comments
### 2025-07-14 - Dorus van der Kroft
CIP-30 integration is foundation for wallet connectivity. Must ensure compatibility with major Cardano wallet providers.

## Acceptance Criteria
- [ ] CIP-30 wallet discovery works through Veridian mobile app integration
- [ ] Wallet provider compatibility layer supports major Cardano wallets via hybrid approach
- [ ] Wallet connection UI components guide users through QR code linking process
- [ ] Account linking state management persists wallet-to-Veridian connections
- [ ] Wallet disconnection handling gracefully manages hybrid state cleanup
- [ ] Wallet switching capabilities work through re-linking QR code process
- [ ] Error handling provides clear feedback for QR linking and wallet connection failures
- [ ] Security implementation follows CIP-30 best practices within hybrid architecture
- [ ] Performance is optimized for QR code generation and account linking
- [ ] Documentation includes hybrid wallet integration guide
- [ ] Wallet balance queries work through linked account relationships
- [ ] Connection verification validates both wallet and Veridian account ownership

## Implementation Log
<!-- Auto-generated log of actual development work performed by the LLM -->