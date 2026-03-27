import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { apiFetch } from './lib/api';
import { peraWallet } from './lib/pera';
import algosdk from 'algosdk';

interface ChallengeResponse {
  nonce: string;
  message: string;
  registrationId: string;
  eventTitle: string;
  userName: string;
  walletAddress: string;
  expiresIn: number;
}

interface VerifyResult {
  success: boolean;
  registrationId: string;
  eventTitle: string;
  userName: string;
  walletAddress: string;
  verifiedAt: string;
  geolocation: { latitude: number; longitude: number } | null;
  tokens: {
    entryTokenTxId?: string;
    soulboundTxId?: string;
    proofTxId?: string;
  };
}

interface AttendanceStats {
  eventId: string;
  total: number;
  verified: number;
  pending: number;
  waitlisted: number;
  verificationRate: number;
}

const explorerBaseUrl = import.meta.env.VITE_ALGORAND_EXPLORER_URL || 'https://testnet.explorer.perawallet.app';

const AttendanceScanner: React.FC = () => {
  const { address, isConnected } = useSelector((s: RootState) => s.wallet);

  const [mode, setMode] = useState<'verify' | 'stats'>('verify');
  const [registrationId, setRegistrationId] = useState('');
  const [eventIdStats, setEventIdStats] = useState('');
  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useGeo, setUseGeo] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer for nonce expiry
  useEffect(() => {
    if (challenge && countdown > 0) {
      timerRef.current = setInterval(() => setCountdown((c) => c - 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
    if (countdown <= 0 && challenge) {
      setChallenge(null);
      setError('Nonce expired. Please request a new challenge.');
    }
  }, [challenge, countdown]);

  // ── Step 1: Request Nonce Challenge ───────────────────────
  const requestChallenge = async () => {
    if (!registrationId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setChallenge(null);
    try {
      const res = await apiFetch('/attendance/challenge', {
        method: 'POST',
        body: JSON.stringify({ registrationId }),
      });
      setChallenge(res);
      setCountdown(res.expiresIn);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Sign with Pera Wallet & Verify ────────────────
  const signAndVerify = async () => {
    if (!challenge || !address) return;
    setLoading(true);
    setError(null);
    try {
      // Sign the nonce message bytes using Pera Wallet
      const messageBytes = new TextEncoder().encode(challenge.message);

      // Use Pera to sign arbitrary data
      const signedTxns = await peraWallet.signTransaction(
        [[{
          txn: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            // @ts-ignore
            from: address,
            to: address,
            amount: 0,
            note: messageBytes,
            suggestedParams: {
              fee: 0,
              firstValid: 1,
              lastValid: 1000,
              minFee: 1000,
              genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=' as any,
              genesisID: 'testnet-v1.0',
              flatFee: true,
            },
          }),
          signers: [address],
          message: `Sign to prove your attendance at: ${challenge.eventTitle}`,
        }]],
        address,
      );

      const signedBytes = btoa(String.fromCharCode(...signedTxns[0]));

      // Get geolocation if enabled
      let geolocation: { latitude: number; longitude: number; accuracy?: number } | undefined;
      if (useGeo && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          geolocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
        } catch {
          // Geolocation optional; proceed without
        }
      }

      // Submit verification
      const verifyResult = await apiFetch('/attendance/verify', {
        method: 'POST',
        body: JSON.stringify({
          registrationId: challenge.registrationId,
          walletAddress: address,
          signedBytes,
          nonce: challenge.nonce,
          geolocation,
        }),
      });

      setResult(verifyResult);
      setChallenge(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Load Stats ────────────────────────────────────────────
  const loadStats = async () => {
    if (!eventIdStats.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setStats(await apiFetch(`/attendance/event/${eventIdStats}/stats`));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Attendance & Proof-of-Presence</h1>
        <p className="text-gray-400 mt-1">Cryptographic attendance verification with on-chain proof</p>
      </header>

      {/* Mode Toggle */}
      <div className="flex gap-3 mb-8">
        {(['verify', 'stats'] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(null); }}
            className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${
              mode === m ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
            }`}>
            {m === 'verify' ? '🔐 Verify Attendance' : '📊 Event Stats'}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-500/20 text-red-300 p-4 rounded-xl mb-6">{error}</div>}

      {/* ── Verify Mode ──────────────────────────────────────── */}
      {mode === 'verify' && (
        <div className="space-y-6">
          {!isConnected && (
            <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 p-4 rounded-xl">
              ⚠️ Please connect your Pera Wallet first to verify attendance.
            </div>
          )}

          {/* Step 1: Registration ID Input */}
          {!challenge && !result && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Step 1: Enter Registration ID</h3>
              <p className="text-sm text-gray-400 mb-4">Enter your event registration ID or scan the QR code to start the PoP verification.</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={registrationId}
                  onChange={(e) => setRegistrationId(e.target.value)}
                  placeholder="Registration ID..."
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button onClick={requestChallenge} disabled={loading || !registrationId.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl disabled:opacity-50">
                  {loading ? 'Loading...' : 'Get Challenge'}
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <input type="checkbox" checked={useGeo} onChange={(e) => setUseGeo(e.target.checked)} className="rounded" id="geo" />
                <label htmlFor="geo" className="text-sm text-gray-400">Include geolocation (optional)</label>
              </div>
            </div>
          )}

          {/* Step 2: Sign Challenge */}
          {challenge && !result && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Step 2: Sign Nonce Challenge</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Event</p>
                  <p className="text-white font-medium">{challenge.eventTitle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Attendee</p>
                  <p className="text-white font-medium">{challenge.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Wallet</p>
                  <p className="text-white font-mono text-xs">{challenge.walletAddress.slice(0, 8)}...{challenge.walletAddress.slice(-4)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expires In</p>
                  <p className={`font-mono font-bold ${countdown < 60 ? 'text-red-400' : 'text-green-400'}`}>
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Nonce Message</p>
                <p className="text-[10px] font-mono text-gray-300 break-all">{challenge.message}</p>
              </div>

              <button onClick={signAndVerify} disabled={loading || !isConnected}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50">
                {loading ? 'Signing & Verifying...' : '🔐 Sign with Pera Wallet & Verify'}
              </button>
            </div>
          )}

          {/* Step 3: Result */}
          {result && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">✅</span>
                <div>
                  <h3 className="text-xl font-bold text-green-400">Attendance Verified!</h3>
                  <p className="text-sm text-gray-400">Cryptographic proof recorded on-chain</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Event</p>
                  <p className="text-white font-medium">{result.eventTitle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Attendee</p>
                  <p className="text-white font-medium">{result.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Verified At</p>
                  <p className="text-white text-sm">{new Date(result.verifiedAt).toLocaleString()}</p>
                </div>
                {result.geolocation && (
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-white text-sm">{result.geolocation.latitude.toFixed(4)}, {result.geolocation.longitude.toFixed(4)}</p>
                  </div>
                )}
              </div>

              {/* Token Minting Results */}
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-semibold text-white">Tokens Minted</h4>
                {result.tokens.entryTokenTxId && (
                  <a href={`${explorerBaseUrl}/tx/${result.tokens.entryTokenTxId}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-400 hover:underline">
                    🪙 Participation Entry Token: {result.tokens.entryTokenTxId.slice(0, 12)}...
                  </a>
                )}
                {result.tokens.soulboundTxId && (
                  <a href={`${explorerBaseUrl}/tx/${result.tokens.soulboundTxId}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-purple-400 hover:underline">
                    💎 Soulbound NFT: {result.tokens.soulboundTxId.slice(0, 12)}...
                  </a>
                )}
                {result.tokens.proofTxId && (
                  <a href={`${explorerBaseUrl}/tx/${result.tokens.proofTxId}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-emerald-400 hover:underline">
                    📜 On-Chain Proof: {result.tokens.proofTxId.slice(0, 12)}...
                  </a>
                )}
              </div>

              <button onClick={() => { setResult(null); setRegistrationId(''); }}
                className="w-full bg-white/5 border border-white/10 text-white py-2 rounded-xl hover:border-white/30">
                Verify Another
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Stats Mode ───────────────────────────────────────── */}
      {mode === 'stats' && (
        <div className="space-y-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={eventIdStats}
              onChange={(e) => setEventIdStats(e.target.value)}
              placeholder="Event ID..."
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button onClick={loadStats} disabled={loading || !eventIdStats.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl disabled:opacity-50">
              Load Stats
            </button>
          </div>

          {stats && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Attendance Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total', value: stats.total, color: 'from-blue-600 to-blue-500' },
                  { label: 'Verified', value: stats.verified, color: 'from-green-600 to-emerald-500' },
                  { label: 'Pending', value: stats.pending, color: 'from-amber-600 to-orange-500' },
                  { label: 'Waitlisted', value: stats.waitlisted, color: 'from-gray-600 to-gray-500' },
                ].map((s) => (
                  <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4`}>
                    <p className="text-white/70 text-xs">{s.label}</p>
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Verification Rate Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Verification Rate</span>
                  <span className="text-white font-bold">{stats.verificationRate}%</span>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${stats.verificationRate}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceScanner;
