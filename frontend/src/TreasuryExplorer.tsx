import React, { useState } from 'react';
import { apiFetch } from './lib/api';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface SpendRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  timelockUntil: string;
  requestTxId?: string;
  releaseTxId?: string;
  receiptUrl?: string;
  receiptHash?: string;
  createdAt: string;
  requester: { id: string; name: string };
  event?: { id: string; title: string };
  proposal: {
    id: string;
    status: string;
    forWeight: number;
    againstWeight: number;
    _count: { votes: number };
  };
}

interface TreasuryOverview {
  club: { id: string; name: string; prizePoolBalance: number };
  currentBalance: number;
  totalSpent: number;
  totalApproved: number;
  pendingCount: number;
  releasedCount: number;
  balanceTimeline: { date: string; balance: number; amount: number; type: string }[];
  monthlyFlow: { month: string; income: number; spending: number }[];
  spendBreakdown: { name: string; value: number }[];
  recentRequests: { id: string; title: string; amount: number; status: string; createdAt: string }[];
}

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#6366f1'];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING_VOTE: { color: 'bg-amber-500', label: 'Voting' },
  APPROVED: { color: 'bg-green-500', label: 'Approved' },
  REJECTED: { color: 'bg-red-500', label: 'Rejected' },
  READY_FOR_RELEASE: { color: 'bg-blue-500', label: 'Ready' },
  RELEASED: { color: 'bg-purple-500', label: 'Released' },
  CANCELLED: { color: 'bg-gray-500', label: 'Cancelled' },
};

const TreasuryExplorer: React.FC = () => {
  const [clubId, setClubId] = useState('');
  const [overview, setOverview] = useState<TreasuryOverview | null>(null);
  const [spendRequests, setSpendRequests] = useState<SpendRequest[]>([]);
  const [selectedSr, setSelectedSr] = useState<SpendRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    beneficiaryName: '',
    timelockHours: '24',
    receiptUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [receiptUrlDraft, setReceiptUrlDraft] = useState('');

  const user = useSelector((state: RootState) => state.auth.user);

  const loadTreasury = async () => {
    if (!clubId) return;
    setLoading(true);
    setError(null);
    try {
      const [ov, srs] = await Promise.all([
        apiFetch(`/treasury/club/${clubId}/overview`),
        apiFetch(`/treasury/club/${clubId}`),
      ]);
      setOverview(ov);
      setSpendRequests(srs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await apiFetch('/treasury/spend-request', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          amount: Number(formData.amount),
          clubId,
          beneficiaryName: formData.beneficiaryName || undefined,
          timelockHours: Number(formData.timelockHours) || 24,
        }),
      });
      if (formData.receiptUrl) {
        await apiFetch(`/treasury/spend-request/${created.id}/receipt`, {
          method: 'POST',
          body: JSON.stringify({
            url: formData.receiptUrl,
            fileName: formData.receiptUrl.split('/').pop() || 'receipt-link',
          }),
        });
      }
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        amount: '',
        beneficiaryName: '',
        timelockHours: '24',
        receiptUrl: '',
      });
      await loadTreasury();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async (srId: string) => {
    try {
      await apiFetch(`/treasury/${srId}/release`, { method: 'POST' });
      await loadTreasury();
      if (selectedSr?.id === srId) {
        const updated = await apiFetch(`/treasury/spend-request/${srId}`);
        setSelectedSr(updated);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVote = async (srId: string, voteFor: boolean) => {
    try {
      await apiFetch(`/treasury/${srId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ voteFor }),
      });
      await loadTreasury();
      if (selectedSr?.id === srId) {
        const updated = await apiFetch(`/treasury/spend-request/${srId}`);
        setSelectedSr(updated);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUploadReceipt = async (srId: string) => {
    if (!receiptUrlDraft) return;
    try {
      await apiFetch(`/treasury/spend-request/${srId}/receipt`, {
        method: 'POST',
        body: JSON.stringify({
          url: receiptUrlDraft,
          fileName: receiptUrlDraft.split('/').pop() || 'receipt-link',
        }),
      });
      const updated = await apiFetch(`/treasury/spend-request/${srId}`);
      setSelectedSr(updated);
      setReceiptUrlDraft('');
      await loadTreasury();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getTimelockStatus = (timelockUntil: string) => {
    const remaining = new Date(timelockUntil).getTime() - Date.now();
    if (remaining <= 0) return { text: 'Unlocked', expired: true };
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return { text: `${hours}h ${mins}m`, expired: false };
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Treasury Explorer</h1>
        <p className="text-gray-400 mt-1">Governance-gated financial operations with on-chain audit trail</p>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mt-3">
          Public explorer. Presidents/VPs request. Members vote. Admins/coordinators release.
        </p>
      </header>

      {/* Club Selector */}
      <div className="flex items-center gap-4 mb-8">
        <input
          type="text"
          placeholder="Enter Club ID..."
          value={clubId}
          onChange={(e) => setClubId(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button onClick={loadTreasury} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl">
          Load
        </button>
        {(user?.role === 'PRESIDENT' || user?.role === 'VP') && clubId && (
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl">
            + Spend Request
          </button>
        )}
      </div>

      {error && <div className="bg-red-500/20 text-red-300 p-4 rounded-xl mb-6">{error}</div>}

      {/* Create Form */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 space-y-4">
          <h3 className="text-lg font-semibold text-white">New Spend Request</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500" required />
            <input placeholder="Amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500" required />
            <input placeholder="Beneficiary Name (optional)" value={formData.beneficiaryName} onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500" />
            <input placeholder="Timelock (hours)" type="number" value={formData.timelockHours} onChange={(e) => setFormData({ ...formData, timelockHours: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500" />
            <input placeholder="Receipt URL (optional)" value={formData.receiptUrl} onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
              className="md:col-span-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500" />
          </div>
          <textarea placeholder="Description (min 10 chars)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 h-24" required />
          <button type="submit" disabled={submitting} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Spend Request'}
          </button>
        </form>
      )}

      {overview && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Balance', value: `$${overview.currentBalance.toLocaleString()}`, color: 'from-green-600 to-emerald-600' },
              { label: 'Total Spent', value: `$${overview.totalSpent.toLocaleString()}`, color: 'from-red-600 to-rose-600' },
              { label: 'Pending', value: overview.pendingCount.toString(), color: 'from-amber-600 to-orange-600' },
              { label: 'Released', value: overview.releasedCount.toString(), color: 'from-purple-600 to-indigo-600' },
            ].map((s) => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 shadow-lg`}>
                <p className="text-white/70 text-sm">{s.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Balance Timeline */}
            {overview.balanceTimeline.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Balance Timeline</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={overview.balanceTimeline}>
                    <defs>
                      <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 10 }} tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                    <YAxis tick={{ fill: '#999', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }} />
                    <Area type="monotone" dataKey="balance" stroke="#8b5cf6" fill="url(#balFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Monthly Flow */}
            {overview.monthlyFlow.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Monthly Cash Flow</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={overview.monthlyFlow}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" tick={{ fill: '#999', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#999', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spending" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Spend Breakdown */}
            {overview.spendBreakdown.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Spend Breakdown</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={overview.spendBreakdown} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {overview.spendBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Spend Requests List */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Spend Requests</h3>
            {spendRequests.length === 0 ? (
              <p className="text-gray-500 italic">No spend requests found for this club.</p>
            ) : (
              <div className="space-y-3">
                {spendRequests.map((sr) => {
                  const timelock = getTimelockStatus(sr.timelockUntil);
                  const cfg = STATUS_CONFIG[sr.status] ?? { color: 'bg-gray-500', label: sr.status };
                  return (
                    <div key={sr.id} onClick={() => setSelectedSr(sr)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedSr?.id === sr.id ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10 hover:border-white/30'
                      }`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${cfg.color}`}>{cfg.label}</span>
                          <h4 className="font-medium text-white">{sr.title}</h4>
                        </div>
                        <p className="text-xs text-gray-400">
                          by {sr.requester.name} · {sr.event?.title ?? 'No event'} · Votes: {sr.proposal._count.votes}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-mono font-bold text-green-400">${sr.amount.toLocaleString()}</p>
                        <p className={`text-[10px] ${timelock.expired ? 'text-green-400' : 'text-amber-400'}`}>
                          🔒 {timelock.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected SR Detail */}
            {selectedSr && (
              <div className="mt-6 p-6 bg-white/5 border border-white/10 rounded-2xl">
                <h4 className="text-xl font-bold text-white mb-2">{selectedSr.title}</h4>
                <p className="text-gray-400 text-sm mb-4">{selectedSr.description}</p>

                {/* Vote bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-green-400">FOR: {selectedSr.proposal.forWeight.toFixed(1)}</span>
                    <span className="text-red-400">AGAINST: {selectedSr.proposal.againstWeight.toFixed(1)}</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden flex">
                    <div className="bg-green-500" style={{ width: `${(selectedSr.proposal.forWeight / (selectedSr.proposal.forWeight + selectedSr.proposal.againstWeight || 1)) * 100}%` }} />
                    <div className="bg-red-500" style={{ width: `${(selectedSr.proposal.againstWeight / (selectedSr.proposal.forWeight + selectedSr.proposal.againstWeight || 1)) * 100}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {(user?.role === 'MEMBER' || user?.role === 'PRESIDENT' || user?.role === 'VP') &&
                    selectedSr.proposal.status === 'SUBMITTED' && (
                    <>
                      <button onClick={() => handleVote(selectedSr.id, true)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl">
                        Vote FOR
                      </button>
                      <button onClick={() => handleVote(selectedSr.id, false)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl">
                        Vote AGAINST
                      </button>
                    </>
                  )}
                  {selectedSr.requestTxId && (
                    <a href={`https://testnet.explorer.perawallet.app/tx/${selectedSr.requestTxId}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline">📝 Request Tx</a>
                  )}
                  {selectedSr.releaseTxId && (
                    <a href={`https://testnet.explorer.perawallet.app/tx/${selectedSr.releaseTxId}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:underline">💸 Release Tx</a>
                  )}
                  {selectedSr.receiptUrl && (
                    <a href={selectedSr.receiptUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:underline">🧾 Receipt</a>
                  )}
                  {selectedSr.receiptHash && (
                    <span className="text-[9px] text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded">
                      SHA-256: {selectedSr.receiptHash.slice(0, 16)}…
                    </span>
                  )}
                </div>

                {(user?.role === 'PRESIDENT' || user?.role === 'VP') && (
                  <div className="mt-4 flex gap-3">
                    <input
                      value={receiptUrlDraft}
                      onChange={(e) => setReceiptUrlDraft(e.target.value)}
                      placeholder="Add receipt/proof URL"
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
                    />
                    <button
                      onClick={() => handleUploadReceipt(selectedSr.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                    >
                      Hash Proof
                    </button>
                  </div>
                )}

                {/* Release button */}
                {(user?.role === 'ADMIN' || user?.role === 'COORDINATOR') &&
                  (selectedSr.status === 'APPROVED' || selectedSr.status === 'READY_FOR_RELEASE') &&
                  getTimelockStatus(selectedSr.timelockUntil).expired && (
                  <button onClick={() => handleRelease(selectedSr.id)}
                    className="mt-4 w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/20">
                    Release ${selectedSr.amount.toLocaleString()} (Atomic Group Tx)
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {!overview && !loading && (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500">
          <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Enter a Club ID to explore its treasury</p>
        </div>
      )}

      {loading && <div className="text-center text-gray-400 py-12">Loading treasury data...</div>}
    </div>
  );
};

export default TreasuryExplorer;
