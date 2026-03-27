import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useNavigate } from 'react-router-dom';
import {
  prepareLedgerWalletTransaction,
  signPreparedTransactions,
  submitLedgerWalletTransaction,
} from './lib/algorand';

interface Transaction {
  id: string; amount: number; type: 'CREDIT' | 'DEBIT'; description: string; date: string;
  sponsor?: { name: string };
  event?: { title: string };
  txnHash?: string;
}

const CATEGORIES = ['Venue', 'Decoration', 'Refreshments', 'Prizes', 'Marketing', 'Equipment', 'Printing', 'Miscellaneous'];
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const defaultExplorerBaseUrl =
  import.meta.env.VITE_ALGORAND_EXPLORER_URL ||
  'https://testnet.explorer.perawallet.app';

import { connectPeraWallet, disconnectPeraWallet } from './lib/pera';

export default function LedgerPage() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { address, isConnected } = useSelector((state: RootState) => state.wallet);
  const navigate = useNavigate();
  const [clubId, setClubId] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: 'DEBIT', amount: '', description: '', category: 'Venue', eventId: '' });
  const [addMode, setAddMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [explorerBaseUrl, setExplorerBaseUrl] = useState(defaultExplorerBaseUrl);

  useEffect(() => {
    if (!user || !['PRESIDENT', 'VP', 'COORDINATOR', 'ADMIN'].includes(user.role)) navigate('/login');
  }, [user, navigate]);

  const loadLedger = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const [txRes, balRes] = await Promise.all([
        fetch(`${backendUrl}/finance/club/${clubId}/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${backendUrl}/finance/club/${clubId}/balance`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (txRes.ok) setTransactions(await txRes.json());
      if (balRes.ok) { const b = await balRes.json(); setBalance(b.balance ?? b); }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      alert('Connect Pera Wallet before logging an on-chain transaction.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        clubId,
        type: form.type as 'CREDIT' | 'DEBIT',
        amount: parseFloat(form.amount),
        description:
          form.category !== 'Miscellaneous'
            ? `${form.category}: ${form.description}`
            : form.description,
        eventId: form.eventId || undefined,
        walletAddress: address,
      };

      const prepared = await prepareLedgerWalletTransaction(token!, payload);
      setExplorerBaseUrl(prepared.explorerBaseUrl || defaultExplorerBaseUrl);

      const signedTransactions = await signPreparedTransactions(address, prepared);
      const res = await submitLedgerWalletTransaction(token!, {
        ...payload,
        note: prepared.note,
        signedTransactions,
      });

      if (!res) {
        throw new Error('Failed to save transaction');
      }

      setAddMode(false);
      setForm({ type: 'DEBIT', amount: '', description: '', category: 'Venue', eventId: '' });
      loadLedger();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCredit = transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Club Finance Ledger</h1>
        <p className="text-slate-500 mt-1">Track credits, expenses, and prize pool balance.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Club ID</label>
        <div className="flex gap-3">
          <input type="text" value={clubId} onChange={e => setClubId(e.target.value)}
            className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="Paste the Club UUID here..." />
          <button onClick={loadLedger} disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
            {loading ? 'Loading...' : 'Load Ledger'}
          </button>
        </div>

        {/* Pera Wallet Connection */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
            <span className="text-sm font-medium text-slate-600">
              {isConnected ? `Connected: ${address?.substring(0, 6)}...${address?.substring(address.length - 4)}` : 'Pera Wallet Not Connected'}
            </span>
          </div>
          <button 
            onClick={isConnected ? disconnectPeraWallet : connectPeraWallet}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
              isConnected 
                ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' 
                : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            {isConnected ? 'Disconnect' : 'Connect Pera Wallet'}
          </button>
        </div>
      </div>

      {balance !== null && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-5">
            {[
              { label: 'Total Credits', value: totalCredit, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', prefix: '₹+' },
              { label: 'Total Expenses', value: totalDebit, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', prefix: '₹-' },
              { label: 'Prize Pool Balance', value: balance, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100', prefix: '₹' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} ${s.border} border rounded-2xl p-5 text-center`}>
                <div className={`text-3xl font-black ${s.color}`}>{s.prefix}{s.value.toLocaleString('en-IN')}</div>
                <div className="text-slate-500 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Add Transaction */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Transactions</h2>
              <button onClick={() => setAddMode(!addMode)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                {addMode ? 'Cancel' : '+ Log Expense / Credit'}
              </button>
            </div>

            {addMode && (
              <form onSubmit={handleAdd} className="bg-slate-50 rounded-xl p-6 mb-6 space-y-4 border border-slate-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20">
                      <option value="DEBIT">Debit (Expense)</option>
                      <option value="CREDIT">Credit (Income)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (₹)</label>
                    <input type="number" required min="1" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20"
                      placeholder="e.g. 1500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                    <input type="text" required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20"
                      placeholder="Brief note..." />
                  </div>
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Log Transaction'}
                </button>
              </form>
            )}

            {/* Transaction List */}
            {transactions.length === 0 ? (
              <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-xl">No transactions yet.</p>
            ) : (
              <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${tx.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {tx.type === 'CREDIT' ? '+' : '−'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{tx.description}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center flex-wrap gap-2">
                          <span>{new Date(tx.date).toLocaleDateString()}</span>
                          {tx.event && <span>· 📅 {tx.event.title}</span>}
                          {tx.sponsor && <span>· 🤝 {tx.sponsor.name}</span>}
                          {tx.txnHash && (
                            <a href={`${explorerBaseUrl}/tx/${tx.txnHash}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded transition-colors" title={`Txn Id: ${tx.txnHash}`}>
                              <span className="text-[10px]">🔗</span> AlgoExplorer
                            </a>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'CREDIT' ? '+' : '−'}₹{tx.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
