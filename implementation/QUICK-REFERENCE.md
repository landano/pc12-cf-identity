# Quick Reference Guide for Implementation Team

## Essential Commands

### Getting Started
- `/start` - Initialize as Implementation Team Member
- `/currentSprint` - View current sprint details and sprint-ready issues
- `/sprintStatus` - Check sprint progress and your active issues

### Working with Issues
- `/startWork ISSUE-XXX` - Begin work on a sprint issue
- `/viewIssue ISSUE-XXX` - View detailed issue information
- `/updateProgress ISSUE-XXX` - Log work progress and update status
- `/logWork ISSUE-XXX` - Add detailed implementation log entry
- `/completeIssue ISSUE-XXX` - Mark issue as complete

### Documentation Access
- `/accessDocs` - Quick access to all project documentation
- `/research` - Access research materials and technical specifications
- `/dependencies` - View issue dependencies and critical path

### Quality Assurance
- `/checkSecurity ISSUE-XXX` - Validate security requirements
- `/runTests [ISSUE-XXX]` - Execute test suites
- `/quality` - Check code quality metrics

### Team Coordination
- `/myIssues` - View all your assigned issues
- `/blocked ISSUE-XXX "reason"` - Report blocking issues
- `/sprintBacklog` - View available sprint issues

## Sprint 1 Issues (Ready for Implementation)

### Priority 1: ISSUE-001 - Veridian Platform Integration Research
**Status**: sprint-ready  
**Goal**: Complete foundational research for Veridian integration  
**Blocks**: 12 other issues  
**Key Deliverables**: API documentation, KERI requirements, integration patterns

### Priority 2: ISSUE-021 - KERI Edge Protection Implementation
**Status**: sprint-ready  
**Goal**: Implement private key protection on user devices  
**Blocks**: Identity creation features  
**Key Deliverables**: HSM integration, secure key management, edge protection

### Priority 3: ISSUE-022 - Transport Security Implementation
**Status**: sprint-ready  
**Goal**: Implement TLS 1.3 and certificate management  
**Blocks**: Secure communications  
**Key Deliverables**: TLS configuration, certificate pinning, mutual TLS

### Priority 4: ISSUE-015 - Cardano Plugin Integration
**Status**: sprint-ready  
**Goal**: Integrate with existing Cardano plugin  
**Blocks**: NFT-related features  
**Key Deliverables**: Plugin analysis, integration architecture, NFT operations

### Priority 5: ISSUE-017 - ADA Wallet Connection via CIP-30
**Status**: sprint-ready  
**Goal**: Implement wallet connectivity  
**Blocks**: Wallet verification features  
**Key Deliverables**: CIP-30 integration, wallet UI, state management

## Key File Locations

### Project Context
- `../CLAUDE.md` - Complete project overview and context
- `./HowToImplementThisProject.md` - Your role and responsibilities
- `../product-owner/ProjectMgmt/SPRINT-1-SUMMARY.md` - Current sprint details

### Issue Management
- `../product-owner/ProjectMgmt/open/` - Available issues
- `../product-owner/ProjectMgmt/wip/` - Issues in progress
- `../product-owner/ProjectMgmt/closed/` - Completed issues

### Technical Documentation
- `../Milestone1 - Design Specification.md` - Technical architecture
- `../shared/research/` - Research materials and findings
- `../product-owner/ProjectMgmt/Milestone 1/Epic*.md` - Epic specifications

### Project Management
- `../product-owner/ProjectMgmt/HowToManageThisProject.md` - PM system guide
- `./COMMANDS.md` - Detailed command implementations

## Security Requirements (Critical)

### KERI Edge Protection
- **Never**: Allow private keys to leave user devices
- **Always**: Use hardware security modules when available
- **Required**: Implement secure key generation and rotation

### Transport Security
- **Minimum**: TLS 1.3 for all communications
- **Required**: Certificate pinning for API endpoints
- **Essential**: Mutual TLS for service-to-service communication

### Audit Logging
- **Log**: All security events and operations
- **Monitor**: Transport security and cryptographic operations
- **Report**: Any security vulnerabilities immediately

## Quality Standards

### Definition of Done
- [ ] All acceptance criteria met
- [ ] Security requirements implemented
- [ ] Tests written and passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Implementation logged

### Code Quality
- Follow Mendix platform conventions
- Implement comprehensive error handling
- Optimize for production performance
- Write maintainable, documented code
- Ensure seamless integration with existing systems

## Workflow Best Practices

### Starting Work
1. Use `/currentSprint` to view available issues
2. Select highest priority unblocked issue
3. Use `/startWork ISSUE-XXX` to begin
4. Review acceptance criteria carefully
5. Plan implementation approach

### During Implementation
1. Use `/updateProgress ISSUE-XXX` regularly
2. Log all work with `/logWork ISSUE-XXX`
3. Run tests frequently with `/runTests`
4. Check security requirements with `/checkSecurity`
5. Report blockers immediately with `/blocked`

### Completing Work
1. Verify all acceptance criteria met
2. Run complete test suite
3. Check security compliance
4. Update documentation
5. Use `/completeIssue ISSUE-XXX` to finish

## Emergency Procedures

### If Blocked
1. Use `/blocked ISSUE-XXX "reason"` immediately
2. Consider alternative sprint issues
3. Notify team through proper channels
4. Document blocking details clearly

### Security Concerns
1. Stop work immediately if security issue found
2. Use `/emergency` command for urgent issues
3. Report to project management
4. Document security concerns thoroughly

### Technical Issues
1. Use `/mentor` for implementation guidance
2. Access project documentation for reference
3. Check dependencies with `/dependencies`
4. Consider alternative approaches

## Communication Guidelines

### Implementation Logging
- Log all development work in issue files
- Use detailed, specific descriptions
- Include files modified and commands run
- Document results and next steps

### Team Updates
- Update issue status regularly
- Report progress in daily standups
- Share blockers and concerns promptly
- Coordinate with other team members

### Documentation
- Keep all documentation current
- Update technical specifications as needed
- Maintain security documentation
- Share knowledge with team

---

**Remember**: You're building critical infrastructure for land rights management. Every implementation contributes to secure, decentralized identity management for real-world assets. Focus on security, quality, and user experience.

*Quick Reference Version: 1.0*  
*Last Updated: 2025-07-14*