# 🏢 College Club Management System (DAO Edition)

### The Ultimate Web3-Powered Campus Governance & AI Intelligence Platform
A high-performance, enterprise-grade platform for managing college clubs, events, and governance, enhanced with **Algorand Blockchain** for financial transparency and **Local LLMs (Ollama)** for data-driven intelligence.

---

## 🚀 One-Headline Overview
**"Transform your college clubs into decentralized organizations with cryptographic attendance, on-chain treasury audits, and an AI-powered Chief of Staff."**

---

## 🛠️ Technology Stack
- **Backend**: NestJS (Node.js), Prisma ORM, PostgreSQL (Supabase)
- **Blockchain**: Algorand Testnet (ASA, Smart Contracts), `algosdk`, Pera Wallet
- **Artificial Intelligence**: 
  - **Ollama**: Local `llama3` for context-aware chat and automated proposal generation.
  - **Hugging Face**: Stable Diffusion XL for creative event poster generation.
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Redux (RTK)
- **Storage**: Supabase Storage (for event posters, receipts, and photos)

---

## ✨ Core Features & Modules

### 1. 🛡️ Auth & RBAC (Role-Based Access Control)
- **Hierarchy**: `ADMIN` → `COORDINATOR` → `PRESIDENT`/`VP` → `MEMBER` → `GUEST`.
- **Multi-Tenancy**: Every resource (club, event, transaction) is strictly scoped by `collegeId`.

### 2. 🏛️ Governance & DAO
- **Proposals**: Create on-chain proposals for club rules or financial actions.
- **Voting**: Token-weighted voting system. Participation in votes earns users **Entry Tokens**.
- **Timelocks**: Governance-gated treasury releases with mandatory voting periods.

### 3. 💰 Treasury & Financial Transparency
- **Escrow System**: Every club has an associated prize pool managed on-chain.
- **Spend Requests**: Presidents create requests → Members vote → Coordinator releases funds.
- **Audits**: Public **Treasury Explorer** with real-time Algorand Indexer integration.
- **Receipt Proofs**: Receipt hashes stored on-chain for immutable financial tracking.

### 4. 🎓 Proof-of-Presence (Attendance PoP)
- **QR Nonce Challenge**: Secure 5-minute time-limited challenges.
- **Cryptographic Verification**: Backend verifies Pera Wallet signatures (`algosdk.verifyBytes`).
- **Rewards**: Verified attendance automatically mints **Participation Entry Tokens** and **Soulbound NFTs**.

### 5. 🪙 Entry Token Gating
- **Portfolio**: Users track their verified "immutable profile" at `/my-tokens`.
- **Gating**: Access to high-value features (like AI Intelligence) requires specific participation tokens.

### 6. ✨ AI Studio (The Intelligence Layer)
- **Chief of Staff**: Chat with an AI that knows your college's real-time treasury balances and attendance rates.
- **Action Triggers**: AI can suggest and draft actual DAO proposals based on data.
- **Creative Suite**: Generate stunning event posters with SDXL.

---

## ⚙️ Setup & Installation

### Backend Setup
1. **Prerequisites**: Node.js v18+, Postgres (Supabase), Ollama.
2. **Environment**: Copy `backend/.env.example` to `backend/.env` and fill:
   - `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
   - `ALGORAND_ALGOD_URL`, `ALGORAND_INDEXER_URL`.
   - `HUGGINGFACE_API_KEY`.
3. **Install**: `cd backend && npm install`.
4. **Database**: `npx prisma migrate dev && npx prisma generate`.
5. **Ollama**: `ollama pull llama3 && ollama serve`.

### Frontend Setup
1. **Install**: `cd frontend && npm install`.
2. **Environment**: Copy `frontend/.env.example` to `frontend/.env`.
3. **Run**: `npm run dev`.

---

## 🔍 Debugging & Feature Testing Guide

### 🏦 1. Testing Financials (Treasury)
- **Debug Tool**: `Treasury Explorer` page.
- **Flow**: Connect Pera → Submit Spend Request → Check logs for unsigned transaction return → Sign in Pera → Verify `txnHash` appears in Prisma.
- **Common Issue**: `400 Bad Request` on release. Check if the `timelockUntil` has passed.

### 🗳️ 2. Testing Governance (Voting)
- **Debug Tool**: `Governance` page.
- **Check**: Once a vote is cast, check the `EntryToken` table in Prisma to ensure the user earned a "VOTE" token.
- **Verification**: Ensure `forWeight` updates in real-time.

### 🎓 3. Testing Attendance (PoP)
- **Debug Tool**: `Attendance Scanner`.
- **Flow**: Register for an event → Open scanner → Sign challenge → Check backend console for `algosdk.verifyBytes` success.
- **Common Issue**: "Nonce expired". Challenges only last 5 minutes. Refresh the scanner.

### 🤖 4. Testing AI Studio
- **Gating Check**: Try accessing `/studio` without tokens. You should get a `403 Forbidden`.
- **Context Check**: Ask the AI `"What is our current treasury balance?"`. Verify it matches the data in the `InsightsService` context builder.
- **Action Check**: Ask `"Suggest a proposal to reward our most active members"`. Ensure an interactive **Action Card** appears.

### 🪙 5. Testing Tokens (ASAs)
- **Debug Tool**: `/my-tokens` page.
- **Verification**: Use **AlgoExplorer** (Testnet) to search the Asset ID minted. Ensure `clawback` and `freeze` addresses are set correctly (or cleared for soulbounds).

---

## 📂 Project Structure
- `/backend`: NestJS application logic, Algorand service layer, and AI context builders.
- `/frontend`: React dashboard, Pera Wallet integration, and interactive AI Studio.
- `/backend/prisma`: Database schema and migrations.
- `/backend/src/attendance`: PoP cryptographic logic.
- `/backend/src/token`: Entry token management and gating.

---

## 📜 Development Status
- **Phase 1-12**: Completed (Auth, Clubs, Finance, Attendance, AI, Gating).
- **Current Core**: Production-ready for Algorand Testnet.

---

**Developed with ❤️ for the Algorand Hackathon & Future Campus Governance.**
