# Testing Guide: Token Gating & AI Chief of Staff

This guide explains how to verify the new **Entry Token** system and the **AI Studio** feature, including the cryptographic PoP attendance and automated action triggers.

---

## 1. Prerequisites
- **Database**: Ensure you have run `npx prisma migrate dev` to include the `EntryToken` model.
- **Ollama**: Ensure Ollama is running (`ollama serve`) and `llama3` is pulled.
- **Pera Wallet**: Needed for signing PoP challenges and receiving on-chain ASAs.

---

## 2. Test Scenario 1: Earning Tokens via Attendance (PoP)
*Goal: Verify that verified attendance mints an Entry Token and Soulbound NFT.*

1. **Login** as a Member.
2. Navigate to **Attendance Scanner** (`/attendance`).
3. Enter an Event ID (must be an event you are registered for).
4. Click **Connect Pera Wallet**.
5. Once connected, click **Sign & Verify Attendance**.
6. **Backend Check**:
   - `algosdk.verifyBytes()` verifies your signature against the challenge.
   - `TokenService` is triggered with `actionType: ATTEND`.
   - On Algorand Testnet, two assets are minted (look for `entryTokenTxId` and `soulboundTxId` in logs).
7. **Frontend Check**:
   - Navigate to **My Tokens** (`/my-tokens`).
   - You should see a new token entry for that event with a "Verified Attendance" badge.

---

## 3. Test Scenario 2: Earning Tokens via Governance (Voting)
*Goal: Verify that participation in DAO voting earns you an Entry Token.*

1. **Login** as a Club Member.
2. Navigate to **Governance** (`/governance`).
3. Vote **FOR** or **AGAINST** an active proposal.
4. **Backend Check**:
   - `GovernanceService.castVote()` now calls `tokenService.mintEntryToken({ actionType: 'VOTE' })`.
5. **Frontend Check**:
   - Check **My Tokens** (`/my-tokens`). You should see a token earned for voting.

---

## 4. Test Scenario 3: AI Gating (Token Verification)
*Goal: Verify that accessing high-value AI features requires a specific token.*

1. **Restriction**: The `AiController` is marked with `@TokenGate(BlockchainActionType.MINT)`.
2. **Login** as a user **WITHOUT** any tokens.
3. Try to access **AI Studio** (`/studio`) and send a chat message.
4. **Expected**: You should receive a `403 Forbidden` with a message like `"Insufficient Token Balance: Accessing AI Intelligence requires verified participation entry tokens (MINT)."`.
5. **Login** as the user from Scenario 1 or 2 (who has tokens).
6. Try to chat in **AI Studio**.
7. **Expected**: The AI should respond, utilizing the refreshed context (including the tokens you just earned).

---

## 5. Test Scenario 4: AI Suggested Actions
*Goal: Verify that the AI can suggest on-chain actions based on data.*

1. **Login** as a President/VP with at least one Entry Token.
2. Open **AI Studio** -> **Chief of Staff**.
3. Ask: `"Analyze our latest hackathon engagement and suggest a reward proposal."`
4. **AI Behavior**:
   - AI observes high attendance in the context.
   - It should return a `suggestedAction` of type `CREATE_PROPOSAL`.
5. **Action Card**:
   - An interactive card should appear in the chat with a "🚀 Execute Action" button.
6. Click **Execute Action**.
7. **Expected**:
   - A real proposal is created in the DB/On-chain.
   - The chat updates with a success message.
   - Verify the proposal appears in the **Treasury Explorer**.

---

## 6. Verification Tools
- **Prisma Studio**: `npx prisma studio` -> View `EntryToken` table.
- **Supabase Logs**: View `ActionLogs` or `Analytics` for `ai_chat` and `token_mint` events.
- **AlgoExplorer**: Search the `txId` from **My Tokens** to see the ASA asset configuration.

---

## 7. Token Analytics (Insights)
*Goal: Ensure aggregated token data is correctly being fed into the AI.*

1. **Dashboard Check**: Navigate to the **Admin Dashboard**.
2. **AI Studio Check**: Open the **Context Sidebar** in AI Studio.
3. **Verified Metrics**:
   - `totalActiveTokens`: Should increase with every attendance/vote.
   - `topHolders`: Should accurately reflect users with the most minted ASAs.
   - `distributionByAction`: Should show a breakdown (e.g., `ATTEND: 5, VOTE: 2`).
