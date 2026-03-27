# Algorand Feature Testing Guide

This guide covers how to test the new college-scoped Algorand integration thoroughly on both LocalNet and TestNet.

## What this feature includes

- College-scoped Algorand note metadata
- Treasury, Entry Token, and Soulbound contract registry
- Backend wallet-prepare and wallet-submit flow
- Pera Wallet signing after RBAC and token-gate checks
- Immediate Prisma sync after successful on-chain submission
- College-filtered indexer queries for analytics and AI consumers

## Files to know

- Service: [backend/src/finance/algorand.service.ts](/Users/nirajrajendranaphade/Programming/College_Club_Management/backend/src/finance/algorand.service.ts)
- Finance sync flow: [backend/src/finance/finance.service.ts](/Users/nirajrajendranaphade/Programming/College_Club_Management/backend/src/finance/finance.service.ts)
- Guarded endpoints: [backend/src/finance/finance.controller.ts](/Users/nirajrajendranaphade/Programming/College_Club_Management/backend/src/finance/finance.controller.ts)
- Token gate: [backend/src/finance/token-gate.service.ts](/Users/nirajrajendranaphade/Programming/College_Club_Management/backend/src/finance/token-gate.service.ts)
- Frontend wallet flow: [frontend/src/LedgerPage.tsx](/Users/nirajrajendranaphade/Programming/College_Club_Management/frontend/src/LedgerPage.tsx)
- Contract templates: [backend/algorand/contracts/README.md](/Users/nirajrajendranaphade/Programming/College_Club_Management/backend/algorand/contracts/README.md)

## 1. Prerequisites

### Backend

1. Install dependencies:

```bash
cd /Users/nirajrajendranaphade/Programming/College_Club_Management/backend
npm install
```

2. Copy env values:

```bash
cp .env.example .env
```

3. Generate Prisma client:

```bash
npx prisma generate
```

4. Apply the migration:

```bash
npx prisma migrate dev
```

### Frontend

```bash
cd /Users/nirajrajendranaphade/Programming/College_Club_Management/frontend
npm install
cp .env.example .env
```

## 2. LocalNet setup

Use this when you want fast end-to-end testing without real TestNet funds.

1. Start AlgoKit LocalNet on the host:

```bash
cd /Users/nirajrajendranaphade/Programming/College_Club_Management/backend
npm run algorand:localnet:start
```

2. Set backend env values:

```env
ALGORAND_NETWORK=localnet
ALGORAND_ALGOD_URL=http://localhost
ALGORAND_ALGOD_PORT=4001
ALGORAND_ALGOD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
ALGORAND_INDEXER_URL=http://localhost
ALGORAND_INDEXER_PORT=8980
ALGORAND_INDEXER_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
ALGORAND_EXPLORER_URL=http://localhost:9392
```

3. Set frontend env values:

```env
VITE_ALGORAND_NETWORK=localnet
VITE_ALGORAND_EXPLORER_URL=http://localhost:9392
```

4. Start the app:

```bash
cd /Users/nirajrajendranaphade/Programming/College_Club_Management/backend
npm run start:dev
```

```bash
cd /Users/nirajrajendranaphade/Programming/College_Club_Management/frontend
npm run dev
```

Note:
- Pera Wallet usually works best on TestNet. For LocalNet, the backend and API tests are the most reliable checks unless your wallet setup supports the local network path you want to use.

## 3. TestNet setup

Use this when you want to verify the real Pera flow.

1. Set backend env values:

```env
ALGORAND_NETWORK=testnet
ALGORAND_ALGOD_URL=https://testnet-api.algonode.cloud
ALGORAND_ALGOD_PORT=
ALGORAND_ALGOD_TOKEN=
ALGORAND_INDEXER_URL=https://testnet-idx.4160.nodely.dev
ALGORAND_INDEXER_PORT=
ALGORAND_INDEXER_TOKEN=
ALGORAND_EXPLORER_URL=https://testnet.explorer.perawallet.app
```

2. Set frontend env values:

```env
VITE_ALGORAND_NETWORK=testnet
VITE_ALGORAND_EXPLORER_URL=https://testnet.explorer.perawallet.app
```

3. Make sure the wallet you connect in Pera has TestNet funds.

4. Start backend and frontend.

## 4. Register the college contracts

The backend expects college-scoped contract records for Treasury, Entry Token, and Soulbound contracts.

Use the contract templates in:

- [backend/algorand/contracts/treasury/contract.template.json](/Users/nirajrajendranaphade/Programming/College_Club_Management/backend/algorand/contracts/treasury/contract.template.json)
- [backend/algorand/contracts/entry-token/asset.template.json](/Users/nirajrajendranaphade/Programming/College_Club_Management/backend/algorand/contracts/entry-token/asset.template.json)
- [backend/algorand/contracts/soulbound/asset.template.json](/Users/nirajrajendranaphade/Programming/College_Club_Management/backend/algorand/contracts/soulbound/asset.template.json)

After deployment, register each contract through the API.

Example:

```bash
curl -X POST http://localhost:3000/finance/algorand/contracts \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TREASURY",
    "appId": "123456",
    "address": "TREASURY_ADDRESS",
    "deployedTxId": "DEPLOY_TX_ID",
    "metadata": {
      "collegeId": "CURRENT_COLLEGE_ID"
    }
  }'
```

Repeat for:

- `ENTRY_TOKEN` with `assetId`
- `SOULBOUND` with `assetId`

## 5. Happy-path API test

This confirms the backend gates first, then returns an unsigned transaction for wallet signing.

### Prepare transaction

```bash
curl -X POST http://localhost:3000/finance/algorand/prepare \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "clubId": "<CLUB_ID>",
    "type": "DEBIT",
    "amount": 100,
    "description": "Venue: Stage setup",
    "walletAddress": "<WALLET_ADDRESS>"
  }'
```

Expected:

- `200 OK`
- Response includes `txns`
- Response includes `note`
- Decoded note JSON contains the current `collegeId`

### Submit signed transaction

Sign the returned transaction in Pera or your test harness, then submit:

```bash
curl -X POST http://localhost:3000/finance/algorand/submit \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "clubId": "<CLUB_ID>",
    "type": "DEBIT",
    "amount": 100,
    "description": "Venue: Stage setup",
    "walletAddress": "<WALLET_ADDRESS>",
    "note": "<NOTE_JSON_FROM_PREPARE>",
    "signedTransactions": ["<SIGNED_TXN_BASE64>"]
  }'
```

Expected:

- `200 OK`
- Response contains the created transaction
- `txnHash` is present in Prisma
- Club balance is updated immediately
- A linked `BlockchainActivity` record exists

## 6. Happy-path UI test

1. Sign in as a `PRESIDENT` or `VP`.
2. Open the ledger page.
3. Connect Pera Wallet.
4. Load a valid club.
5. Add a credit or debit.
6. Approve the signing request in Pera.

Expected:

- The wallet prompt appears only after the backend authorizes the request
- The new transaction appears in the list after approval
- The balance card updates
- The explorer link opens the correct TestNet or LocalNet explorer base

## 7. Database checks

After a successful on-chain submission, verify all sync rules.

### Prisma / SQL checks

Check `Transaction`:

- `collegeId` matches the active college
- `txnHash` is set
- `walletAddress` is set
- `blockchainActivityId` is linked

Check `BlockchainActivity`:

- `action = TREASURY_LOG`
- `txId` matches `Transaction.txnHash`
- `note` contains the same note returned from prepare
- `metadata` includes the business fields

Check `CollegeContract`:

- one active record per `type + network + collegeId`

Check `CollegeConfig`:

- `algorandNetwork` is correct
- `treasuryAppId`, `entryTokenAssetId`, and `soulboundAssetId` are populated after registration

## 8. Indexer scope checks

Run:

```bash
curl -H "Authorization: Bearer <JWT>" \
  http://localhost:3000/finance/algorand/indexer/transactions
```

Expected:

- only transactions belonging to the current college appear
- cross-college transactions are excluded even if they are on the same network
- note payload must decode to the same `collegeId`

## 9. RBAC checks

### Should pass

- `PRESIDENT`
- `VP`

### Should fail

- `MEMBER`
- `GUEST`

Expected failure:

- `403 Forbidden`
- no Pera signing request should happen
- no blockchain transaction should be created

## 10. Token-gate checks

If `entryTokenAssetId` or `soulboundAssetId` is configured:

1. Try the request with a wallet that does not hold the required asset.
2. Try again with a wallet that does hold it.

Expected:

- missing token: request blocked before signing
- token present: prepare endpoint succeeds

## 11. Negative tests

### Invalid wallet address

Expected:

- `400 Bad Request`

### Invalid club for the current college

Expected:

- `404 Not Found`

### Debit larger than prize pool balance

Expected:

- `400 Bad Request`
- no `BlockchainActivity`
- no `Transaction`

### Tampered signed payload

Expected:

- Algod broadcast fails
- no Prisma sync occurs

### Missing contract registry

Expected:

- treasury logging can still broadcast if signing is valid
- analytics and token-gate behavior is reduced until contract records are registered

## 12. Thorough release checklist

Before calling this feature done, verify all of the following:

- migration applied successfully
- Prisma client regenerated
- Treasury contract registered for the active college
- Entry Token contract registered for the active college
- Soulbound contract registered for the active college
- prepare endpoint note includes `collegeId`
- wallet prompt only occurs after backend authorization
- successful submit creates both `Transaction` and `BlockchainActivity`
- indexer endpoint returns only college-scoped results
- TestNet explorer links work
- LocalNet explorer links work when local stack is running

## 13. Known project-wide caveat

The repository still has older Prisma create flows outside this feature that do not yet satisfy the required `collegeId` typing. That does not block reading this guide or manually testing the Algorand flow, but it does block a clean full-backend TypeScript pass until those older modules are updated.
