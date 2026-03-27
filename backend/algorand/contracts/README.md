# Algorand contract templates

These templates are intentionally college-scoped. Every deployment note and asset/app metadata payload must include the active `collegeId`.

Expected deployment order:

1. `treasury/contract.template.json`
2. `entry-token/asset.template.json`
3. `soulbound/asset.template.json`

Deployment rules:

- Resolve `collegeId` from request or deploy context, never from a hard-coded value.
- Reuse the note JSON shape from `AlgorandService`.
- Persist each deployment through `POST /finance/algorand/contracts` so Prisma stores the scoped contract registry used by wallet gates and indexer filters.
- For LocalNet, prefer `algokit localnet start` and fund the deployment account from the dispenser account before sending app/asset create transactions.
