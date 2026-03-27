# AI & Intelligence Layer (Chief of Staff)

## Overview
The AI module has been upgraded from a simple asset generator to a fully integrated **AI Chief of Staff**. It powers the **AI Studio** frontend, allowing club leaders to chat with an AI that is completely context-aware of their college's specific real-time metrics, including Treasury spend requests, Governance proposals, Attendance (PoP) rates, and Token mints.

## Features

### 1. Data-Driven Context Engine
The `InsightsService` builds a large JSON context payload strictly scoped to the user's `collegeId`. It includes:
- **TreasuryContext**: Recent spend requests, amounts, and statuses.
- **AttendanceContext**: Events with their respective verified PoP counts.
- **General Metrics**: Total clubs, events, sponsors, and blockchain indexer transactions.

### 2. Smart Event Actions & Triggers
The AI doesn't just talk; it acts. The backend prompts `llama3` via Ollama to output strict JSON payloads when an action is strongly recommended. The supported actions:
- `CREATE_PROPOSAL`: Automatically drafts a DAO Governance proposal (e.g., "Fund a 500 ALGO prize pool based on last hackathon's high attendance").
- `MINT_TOKEN`: Suggests minting a Participation Entry Token or Soulbound NFT for outstanding members.

### 3. Execution Pipeline (`POST /ai/execute-action`)
When the frontend receives a `suggestedAction`, it renders an interactive **Action Card**. Upon clicking "Execute", the backend routes the execution strictly through the existing guarded services (`GovernanceService`, `AlgorandService`).

### 4. Full Action Logging
Every chat interaction and executed suggestion is logged via `InsightsService.recordSyncEvent()` back to Supabase, keeping a complete audit trail of the AI's influence over the college's DAO.

## API Endpoints

- `GET /ai/assistant-context` - Returns the real-time context JSON (Clubs, Events, Sponsors, Treasury).
- `POST /ai/chat` - Submits a prompt + history; returns the AI's reply and any `suggestedAction` JSON block.
- `POST /ai/execute-action` - Receives an action payload, validates RBAC/Role, and executes it via the respective module.
- `GET /ai/generate-event-poster` - Leverages Stable Diffusion XL via Hugging Face for aesthetic asset generation.

## Frontend
Located at `/studio` -> `AIStudio.tsx`.
Dual-tab interface:
- **💬 Chief of Staff**: ChatGPT style interface for data-driven answers and action triggering.
- **🎨 Creative Suite**: Visual poster generation.
