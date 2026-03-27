# Governance-Gated Treasury Module

## Overview
The Governance-Gated Treasury module is the cornerstone of the College Club Management platform's financial system. It securely integrates the on-chain treasury logic (Algorand) with the DAO governance module, ensuring that no funds can be moved without explicit approval through a decentralized, weighted voting process.

This acts as a "killer feature" by enforcing transparency, preventing fund mismanagement, and offering real-time on-chain audits of all financial activities.

## Core Capabilities

1. **Spend Request Lifecycle**: 
   - Club Leadership (President/VP) can initiate a `TreasurySpendRequest`.
   - This automatically triggers the creation of a linked `GovernanceProposal` behind the scenes.
   - The proposal goes through the standard DAO voting process where members cast weighted votes using their Entry Tokens + Soulbound Tokens.

2. **Automated Status Synchronization**:
   - Once a governance proposal is finalized, its outcome is synced back to the `TreasurySpendRequest`.
   - An `APPROVED` proposal pushes the spend request to `READY_FOR_RELEASE`.

3. **Timelock Restrictions**:
   - Approved spend requests have a built-in timelock (default 24 hours), ensuring there is a buffer period before funds are actually released.

4. **Atomic Group Transactions**:
   - Releasing funds triggers an **atomic two-transaction group** on the Algorand blockchain:
     - **Tx1**: The actual fund transfer/release note.
     - **Tx2**: A receipt hash note, proving the cryptographic integrity of the uploaded proof-of-payment.
   - Using an atomic group ensures that either both transactions succeed together, or neither do.

5. **Token-Gated Authorization**:
   - **Creation**: Requester must hold the category 7 Entry Token.
   - **Release**: Executor (Admin/Coordinator) must hold the requisite Soulbound token and Entry Token to execute the on-chain release.

6. **Receipt and Proof-of-Payment Validation**:
   - Once funds are released and a receipt is received, leadership uploads the receipt.
   - The file is hashed via SHA-256 and stored eternally on-chain.

7. **Rich Analytics Explorer**:
   - Comprehensive `/treasury` dashboard powered by Recharts.
   - Tracks incoming credits, outgoing debits, balance timelines, and category-wise spending using multi-series area, bar, and pie charts.

## File Structure

- `treasury.controller.ts`: Exposes RBAC-protected endpoints for spend-request generation, execution, receipt uploads, and club overview analytics.
- `treasury.service.ts`: Houses the complete orchestration logic, interacting with the Prisma DB, AlgorandService, TokenGateService, and GovernanceService.
- `dto/treasury.dto.ts`: Data transfer objects for strongly typing incoming requests.
- `treasury.module.ts`: Wires together the finance, governance, and insights dependencies.

## Key Relationships (Prisma DB)
- **`TreasurySpendRequest`**: Links `1:1` to `GovernanceProposal` (via `proposalId`) and `1:1` to `Transaction` (via `releaseTransaction`).

## Workflow Summary
1. President calls `POST /treasury/spend-request` -> Proposal built.
2. Members call `POST /governance/proposals/:id/vote` -> Weighted votes cast.
3. President calls `POST /governance/proposals/:id/finalize` -> SpendRequest moves to `READY_FOR_RELEASE`.
4. Admin waits for timelock to expire, then calls `POST /treasury/spend-request/:id/release` -> Atomic Tx executes on Algorand.
5. President calls `POST /treasury/spend-request/:id/receipt` -> SHA-256 hash pushed on-chain.
