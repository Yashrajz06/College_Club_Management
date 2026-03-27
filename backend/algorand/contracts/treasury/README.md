# Governance-Gated Treasury Contract

This folder contains the AlgoKit treasury scaffold for the CampusClubs
governance-gated treasury flow.

Access model:

- `PRESIDENT` / `VP`: create spend requests after RBAC and Entry Token checks.
- `MEMBER`, `PRESIDENT`, `VP`: vote on active spend requests.
- `ADMIN` / assigned `COORDINATOR`: release approved requests after timelock expiry.
- Public users: read-only explorer access through the app backend.

Contract goals:

- Persist `collegeId` in deployment metadata and all action notes.
- Track spend requests in boxes keyed by request id.
- Track vote receipts in boxes keyed by request id + voter address.
- Enforce a timelock before release.
- Store the receipt hash in the release note so off-chain proof stays linked.

Suggested box layout:

- `req:<spendRequestId>`: encoded spend request summary.
- `tally:<spendRequestId>`: for/against totals and release state.
- `vote:<spendRequestId>:<address>`: one vote receipt per wallet.

Suggested flow:

1. Compile and deploy with AlgoKit for LocalNet or TestNet.
2. Register the deployed app through `POST /finance/algorand/contracts`.
3. Create spend requests through the NestJS treasury module.
4. Use the governance module for vote closing and approval state.
5. Release through the treasury module, which writes the receipt hash on-chain and
   syncs Prisma analytics/AI hooks immediately after confirmation.

Notes:

- The Python contract is intentionally a scaffold rather than a production-ready
  compiled artifact. It captures the state model and call surface the backend now
  expects.
- LocalNet remains the fastest path for end-to-end testing: `algokit localnet start`.
