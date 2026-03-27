# Treasury & Financial Governance — Debugging Guide

## Prerequisites
- **Role**: PRESIDENT/VP to create spend requests, ADMIN/COORDINATOR to release
- **Entry Token**: Required for spend request creation (token gate check)
- **Soulbound Token**: Required for release authorization

---

## Testing Workflow

### 1. Create a Spend Request (PRESIDENT/VP)
```bash
curl -X POST http://localhost:3000/treasury/spend-request \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-college-id: $COLLEGE_ID" \
  -H "Content-Type: application/json" \
  -d '{"title":"Prize Pool","description":"Funding for hackathon prizes","amount":500,"clubId":"CLUB_ID","timelockHours":1}'
```
**Verify**: A `GovernanceProposal` (SUBMITTED) is auto-created and linked.

### 2. Vote on the Linked Proposal
Use the Governance endpoints to cast weighted votes on the auto-created proposal.

### 3. Finalize the Proposal (PRESIDENT/VP)
```bash
curl -X POST http://localhost:3000/governance/proposals/PROPOSAL_ID/finalize \
  -H "Authorization: Bearer $TOKEN" -H "x-college-id: $COLLEGE_ID"
```
**Verify**: SpendRequest status auto-syncs to `READY_FOR_RELEASE` or `REJECTED`.

### 4. Release (ADMIN/COORDINATOR, after timelock)
```bash
curl -X POST http://localhost:3000/treasury/spend-request/SR_ID/release \
  -H "Authorization: Bearer $TOKEN" -H "x-college-id: $COLLEGE_ID"
```
**Verify**: Atomic group tx on-chain, club balance debited, status = `RELEASED`.

### 5. Upload Receipt
```bash
curl -X POST http://localhost:3000/treasury/spend-request/SR_ID/receipt \
  -H "Authorization: Bearer $TOKEN" -H "x-college-id: $COLLEGE_ID" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://storage.example.com/receipt.pdf","fileName":"receipt.pdf"}'
```
**Verify**: SHA-256 hash stored on-chain.

---

## SQL Debugging

```sql
-- Check spend requests and their linked proposals
SELECT sr.title, sr.amount, sr.status, sr."timelockUntil",
       gp.status as proposal_status, gp."forWeight", gp."againstWeight"
FROM "TreasurySpendRequest" sr
JOIN "GovernanceProposal" gp ON sr."proposalId" = gp.id
WHERE sr."collegeId" = 'YOUR_COLLEGE_ID';

-- Check release transactions
SELECT t.amount, t.type, t."txnHash", sr.title
FROM "Transaction" t
JOIN "TreasurySpendRequest" sr ON t."treasurySpendRequestId" = sr.id
WHERE t."collegeId" = 'YOUR_COLLEGE_ID';
```

## API Quick Reference

| Endpoint | Role | Action |
|----------|------|--------|
| `POST /treasury/spend-request` | PRESIDENT, VP | Create spend request |
| `GET /treasury/spend-request/:id` | Any auth | Get request detail |
| `GET /treasury/club/:clubId` | Any auth | List club requests |
| `GET /treasury/club/:clubId/overview` | Any auth | Recharts data |
| `POST /treasury/spend-request/:id/release` | ADMIN, COORDINATOR | Execute release |
| `POST /treasury/spend-request/:id/receipt` | PRESIDENT, VP | Upload receipt |
