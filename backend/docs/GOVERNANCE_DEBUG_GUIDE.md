# Governance & DAO Voting Debugging Guide

This guide provides instructions for testing and debugging the Governance & DAO Voting system.

## Prerequisites

1. **User Role**: Ensure you are logged in as a **PRESIDENT** or **VP** to create proposals, or a **MEMBER** to vote.
2. **Participation Tokens**: To have a voting weight > 1, the user's wallet must hold Participation/Entry Tokens (capped at 5× weight).
3. **Pera Wallet**: Most voting actions require a connected wallet for on-chain logging (though the system fallbacks gracefully).

---

## 🛠️ Testing Workflow

### 1. Create a Proposal
- **Role**: PRESIDENT or VP
- **Path**: Navigate to an **Approved Event**.
- **Action**: Click "Create Governance Proposal".
- **Fields**: Enter Title, Description, and (optionally) a **Spend Amount** (to request treasury release).

### 2. Cast a Weighted Vote
- **Role**: Any Club Member
- **Path**: `/governance`
- **Action**: Select the proposal and click "Vote FOR" or "Vote AGAINST".
- **Debug Check**: 
  - Verify the weight calculation in the `GovernanceService.castVote` method.
  - Check the `GovernanceVote` table in Supabase to see the `weight` and `txId`.
  - Check the frontend bar chart for live distribution updates.

### 3. Finalize Tally
- **Role**: PRESIDENT or VP
- **Action**: Click "Finalize Tally & Close Voting".
- **Result**: Proposal status changes to `APPROVED` or `REJECTED` based on weighted totals.

### 4. Execute approved Proposal (Treasury Release)
- **Role**: ADMIN or COORDINATOR
- **Action**: Click "Execute Proposal".
- **Logic**: If a `spendAmount` was set, verify that the club's `prizePoolBalance` in the `Club` table is decremented.
- **On-chain**: Verify a new transaction of type `DEBIT` appears in the `LedgerPage`.

---

## 🔍 Database Debugging (SQL)

Check for active proposals and their weights:
```sql
SELECT title, status, "forWeight", "againstWeight", "spendAmount" 
FROM "GovernanceProposal" 
WHERE "collegeId" = 'YOUR_COLLEGE_ID';
```

Check voter weights:
```sql
SELECT u.name, v."voteFor", v.weight, v."txId"
FROM "GovernanceVote" v
JOIN "User" u ON v."voterId" = u.id
WHERE v."proposalId" = 'PROPOSAL_ID';
```

---

## 📡 API Endpoints

- `GET /governance/proposals` - List all proposals (college-scoped)
- `POST /governance/proposals/:id/vote` - Cast vote `{ "voteFor": boolean }`
- `POST /governance/proposals/:id/finalize` - Close voting
- `POST /governance/proposals/:id/execute` - Execute & trigger Treasury release

---

## 💡 Troubleshooting AI Feed

The `InsightsService` pushes every governance action to the AI feed. If you don't see suggestions:
1. Check the `ai_context_feed` table in Supabase.
2. Ensure `InsightsService.recordSyncEvent` is being called with `entityType: 'governance'`.
