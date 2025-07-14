# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Landano Veridian Identity Module project - a 3-month Cardano Foundation funded initiative to develop a Mendix module that integrates with the Veridian Identity Wallet for verification and transfer of Landano land right NFTs using KERI protocol. The deliverable is a Mendix module that will be shared with the Cardano community via the Mendix Marketplace.

**Note**: The Cardano Foundation Identity Wallet has been rebranded to Veridian (https://docs.veridian.id/). All references to CF ID Wallet in project documentation refer to what is now the Veridian platform.

## Project Goals

The project addresses the critical need in the Cardano ecosystem for a reliable and comprehensive decentralized identifier (DID) tool and protocol. This is essential for Real World Asset (RWA) tokenization projects and RealFi implementations.

### Core Solution
- Create a Mendix module that integrates with the Veridian Identity Wallet
- Implement KERI protocol for decentralized identity management
- Demonstrate practical real-world implementation for land rights management
- Provide reusable components for other Cardano and Mendix developers

## Project Team

- **Aaron Moguin** - Project Manager & COO Landano
- **Dorus van der Kroft** - Lead Developer & CTO Landano (Mendix expert, 20+ years experience)
- **Peter van Garderen** - Systems Analyst & CEO Landano (Digital records management expert)
- **Dan Amankona** - Community Liaison & CMO Landano

## Technical Architecture

### Identity Management System
- **KERI Protocol**: Self-certifying identifiers (AIDs) with key compromise recovery and quantum attack protection
- **KERIA**: Multi-tenant cloud agent for KERI handling AID creation, event processing, witness coordination
- **Signify**: Client-side library managing identifiers and keys on user devices within Veridian Wallet
- **ACDC (Authentic Chained Data Container)**: Verifiable credential format with two types:
  - Targeted ACDCs: Have an issuee (holder) field representing verifiable credentials
  - Untargeted ACDCs: Verifiable statements without a specific holder
- **Veridian Platform**: Open-source, modular identity platform with enterprise-grade security

### Core Use Cases
1. **Verify Landano User Identity**: Chief-representative credential verification using ACDC
2. **Verify NFT Ownership**: Connect ADA wallet ownership with KERI AID holder through verification dApp
3. **Verify ADA Wallet Balance**: Confirm wallet balance belongs to ID wallet holder

### Key Components
- **Chief (Root of Trust)**: Creates AID using KERIA and issues ACDC credentials
- **Representative**: Creates AID using Signify, receives and presents ACDC credentials
- **Verifier**: Requests and validates credential presentations
- **Rightsholder**: Owns Landano NFTs with KERI AID metadata
- **Verification dApp**: Connects ADA wallet and ID wallet for NFT ownership verification

## Project Milestones

### Milestone 1: Design and Prototype (₳42,400)
- **Outputs**: Design specifications document, functional Mendix prototype
- **Deliverables**: Published design document, video demonstration
- **Timeline**: 30 days

### Milestone 2: Testing and Refinement (₳42,400)
- **Outputs**: Comprehensive testing, updated prototype meeting functional requirements
- **Deliverables**: Test reports, demonstration video of refined functionalities
- **Timeline**: 30 days

### Milestone 3: Final Validation and Documentation (₳15,200)
- **Outputs**: Finalized plugin, comprehensive documentation and user guides
- **Deliverables**: Mendix plugin published in Marketplace, documentation on website
- **Timeline**: 30 days

## Development Context

### Technology Stack
- **Mendix Platform**: Low-code development architecture (see https://docs.landano.io/d/technical-architecture)
- **Veridian Identity Wallet**: Implementing KERI protocol with modular credential management
- **CIP-30**: Cardano wallet standard for signing operations
- **Apache 2.0 License**: Open source licensing for all project outputs
- **Veridian APIs**: Core APIs for Identifiers, Credentials, Groups, and Delegation

### Integration Points
- Veridian Identity Wallet integration with high-availability cloud agents
- ADA wallet functionality for NFT ownership verification
- KERI protocol implementation with key rotation capabilities
- Mendix plugin development and marketplace deployment
- Cardano blockchain integration for discovery and disaster recovery mechanisms

## Project Structure

- `proposal.txt`: Complete project proposal with team, budget, and deliverables
- `milestone1.txt`: Milestone 1 specifications (Design and Prototype)
- `milestone2.txt`: Milestone 2 specifications (Testing and Refinement)
- `milestone3.txt`: Milestone 3 specifications (Final Validation and Documentation)
- `Milestone1 - Design Specification.md`: Detailed technical specification with use cases, sequence diagrams, and architecture
- `notion_notes.pdf`: Additional project documentation

## Key Technical Concepts

- **CIP-30**: Cardano wallet standard used for signing operations
- **NFT Metadata**: Contains KERI AID values linking NFTs to identity wallets
- **Policy ID**: Used to query for specific Landano NFTs in ADA wallets
- **Credential Presentation**: Process where representatives present signed ACDC credentials for verification
- **Real World Asset (RWA) Tokenization**: Using blockchain for physical asset representation
- **RealFi**: Real-world finance applications on blockchain
- **SAID (Self-Addressing Identifier)**: Secure schema referencing used in Veridian
- **Key Rotation**: KERI feature allowing identifier consistency despite key changes
- **Weighted Threshold Multi-sig**: Advanced security feature in Veridian for enterprise use