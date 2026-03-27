# Attendance & Proof-of-Presence (PoP) Module

## Overview
The Attendance & Proof-of-Presence module implements cryptographic attendance verification using Algorand blockchain signatures. Instead of simple QR scans, attendees must cryptographically prove their presence by signing a time-limited nonce challenge with their Pera Wallet, which is then verified server-side using `algosdk.verifyBytes()`.

## Core Capabilities

### 1. Nonce Challenge System
- Backend generates a unique, time-limited nonce (5-minute TTL) tied to a specific registration.
- Challenge message format: `PoP:{collegeId}:{eventId}:{registrationId}:{nonce}:{timestamp}`
- Expired nonces are automatically cleaned from the in-memory cache.

### 2. Cryptographic Verification
- Attendee signs the nonce message using their Pera Wallet.
- Backend verifies using `algosdk.verifyBytes(message, signature, walletAddress)`.
- Wallet address must match the registered user's wallet.

### 3. Token Minting on Verified Attendance
On successful verification, the system automatically:
- **Mints a Participation Entry Token** (Category 7) via `triggerLifecycleAction(MINT, ENTRY_TOKEN)`.
- **Mints a Soulbound NFT** via `triggerLifecycleAction(MINT, SOULBOUND)`.
- **Logs an on-chain attendance proof** note via `submitServerSignedNoteTransaction()`.

### 4. Token Gating
- Only users holding the Event Entry Token (minted at registration) can request a nonce challenge.
- Ensures the attendee was properly registered before attempting PoP.

### 5. Optional Geolocation
- Frontend captures `latitude`, `longitude`, and `accuracy` via the browser Geolocation API.
- Stored on-chain alongside the attendance proof note.

### 6. Cross-Module Sync
- All attendance events are synced to `InsightsService` (analytics + AI context feed).
- Treasury analytics, AI metrics, and leaderboard data are updated in real-time.

## API Reference

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/attendance/challenge` | POST | Any auth | Generate nonce challenge for a registration |
| `/attendance/verify` | POST | Any auth | Submit signed nonce for cryptographic verification |
| `/attendance/event/:eventId/stats` | GET | Leadership | Get attendance statistics |

## Testing Flow

```bash
# 1. Generate nonce challenge
curl -X POST http://localhost:3000/attendance/challenge \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-college-id: $COLLEGE_ID" \
  -H "Content-Type: application/json" \
  -d '{"registrationId":"REG_ID"}'

# 2. Sign nonce with Pera Wallet (frontend), then submit:
curl -X POST http://localhost:3000/attendance/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-college-id: $COLLEGE_ID" \
  -H "Content-Type: application/json" \
  -d '{"registrationId":"REG_ID","walletAddress":"WALLET","signedBytes":"BASE64_SIG","nonce":"NONCE"}'

# 3. Get attendance stats
curl http://localhost:3000/attendance/event/EVENT_ID/stats \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-college-id: $COLLEGE_ID"
```

## File Structure
- `attendance.service.ts` — Nonce challenge, `algosdk.verifyBytes()`, token minting, on-chain proof
- `attendance.controller.ts` — RBAC-protected endpoints
- `attendance.module.ts` — Imports FinanceModule + InsightsModule
- `AttendanceScanner.tsx` — Frontend 3-step PoP flow with Pera Wallet signing
