import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  prepareLedgerWalletTransaction,
  signPreparedTransactions,
  submitLedgerWalletTransaction,
} from './lib/algorand';
import { apiFetch } from './lib/api';
import { connectPeraWallet, disconnectPeraWallet } from './lib/pera';
import type { RootState } from './store';

interface Transaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  date: string;
  sponsor?: { name: string } | null;
  event?: { title: string } | null;
  walletAddress?: string | null;
  txnHash?: string | null;
}

interface ClubSummary {
  id: string;
  name: string;
  category: string;
  status: string;
}

interface SponsorOption {
  id: string;
  name: string;
  organization: string;
}

interface EventOption {
  id: string;
  title: string;
  date: string;
}

const CATEGORIES = [
  'Venue',
  'Decoration',
  'Refreshments',
  'Prizes',
  'Marketing',
  'Equipment',
  'Printing',
  'Miscellaneous',
];
const defaultExplorerBaseUrl =
  import.meta.env.VITE_ALGORAND_EXPLORER_URL ||
  'https://testnet.explorer.perawallet.app';

export default function LedgerPage() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { address, isConnected } = useSelector(
    (state: RootState) => state.wallet,
  );
  const navigate = useNavigate();
  const [club, setClub] = useState<ClubSummary | null>(null);
  const [clubIdInput, setClubIdInput] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [sponsors, setSponsors] = useState<SponsorOption[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: 'DEBIT',
    amount: '',
    description: '',
    category: 'Venue',
    eventId: '',
    sponsorId: '',
    submissionMode: 'SERVER',
  });
  const [addMode, setAddMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [explorerBaseUrl, setExplorerBaseUrl] = useState(
    defaultExplorerBaseUrl,
  );

  useEffect(() => {
    if (!user || !['PRESIDENT', 'VP', 'COORDINATOR', 'ADMIN'].includes(user.role)) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user || !['PRESIDENT', 'VP'].includes(user.role)) {
      return;
    }

    const loadMyClub = async () => {
      try {
        const myClub = await apiFetch('/club/my-club');
        if (myClub?.id) {
          setClubIdInput(myClub.id);
          await loadLedger(myClub.id);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadMyClub();
  }, [user]);

  const loadLedger = async (clubIdOverride?: string) => {
    const targetClubId = (clubIdOverride ?? clubIdInput).trim();
    if (!targetClubId) return;

    setLoading(true);
    try {
      const [clubData, txData, balanceData, sponsorData, eventData] =
        await Promise.all([
          apiFetch(`/club/${targetClubId}`),
          apiFetch(`/finance/club/${targetClubId}/transactions`),
          apiFetch(`/finance/club/${targetClubId}/balance`),
          apiFetch(`/sponsor/club/${targetClubId}`).catch(() => []),
          apiFetch(`/event/club/${targetClubId}`).catch(() => []),
        ]);

      setClub(clubData);
      setTransactions(txData ?? []);
      setBalance(balanceData?.balance ?? null);
      setSponsors(sponsorData ?? []);
      setEvents(eventData ?? []);
      setClubIdInput(targetClubId);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club?.id) return;

    setSubmitting(true);
    try {
      const payload = {
        clubId: club.id,
        type: form.type as 'CREDIT' | 'DEBIT',
        amount: parseFloat(form.amount),
        description:
          form.category !== 'Miscellaneous'
            ? `${form.category}: ${form.description}`
            : form.description,
        eventId: form.eventId || undefined,
        sponsorId: form.sponsorId || undefined,
      };

      let result: unknown;
      if (form.submissionMode === 'WALLET') {
        if (!isConnected || !address) {
          alert('Connect Pera Wallet before using wallet-sign mode.');
          return;
        }

        const prepared = await prepareLedgerWalletTransaction(token!, {
          ...payload,
          walletAddress: address,
        });
        setExplorerBaseUrl(prepared.explorerBaseUrl || defaultExplorerBaseUrl);

        const signedTransactions = await signPreparedTransactions(
          address,
          prepared,
        );
        result = await submitLedgerWalletTransaction(token!, {
          ...payload,
          walletAddress: address,
          note: prepared.note,
          signedTransactions,
        });
      } else {
        result = await apiFetch('/finance/transaction', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (!result) {
        throw new Error('Failed to save transaction');
      }

      setAddMode(false);
      setForm({
        type: 'DEBIT',
        amount: '',
        description: '',
        category: 'Venue',
        eventId: '',
        sponsorId: '',
        submissionMode: 'SERVER',
      });
      await loadLedger(club.id);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Failed to add transaction',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalCredit = transactions
    .filter((transaction) => transaction.type === 'CREDIT')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalDebit = transactions
    .filter((transaction) => transaction.type === 'DEBIT')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Club Finance Ledger
        </h1>
        <p className="text-slate-500 mt-1">
          Track sponsor credits, event expenses, and the live prize-pool balance
          with an Algorand audit trail.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Club Workspace
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={clubIdInput}
                onChange={(e) => setClubIdInput(e.target.value)}
                className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Paste the Club UUID here..."
              />
              <button
                onClick={() => loadLedger()}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load Ledger'}
              </button>
            </div>
          </div>
          {club ? (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4 min-w-[16rem]">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">
                Active Club
              </div>
              <div className="mt-1 font-bold text-slate-900">{club.name}</div>
              <div className="text-sm text-slate-500">
                {club.category} • {club.status}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-600">
              {form.submissionMode === 'WALLET'
                ? 'Wallet-sign mode records the transaction from the connected Pera account.'
                : 'Instant mode records the transaction immediately through the club treasury signer.'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Authorized by: {user?.name} ({user?.role})
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
            <span className="text-sm font-medium text-slate-600">
              {isConnected
                ? `Pera connected: ${address?.substring(0, 6)}...${address?.substring(address.length - 4)}`
                : 'Pera Wallet optional'}
            </span>
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
      </div>

      {club && balance !== null ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                label: 'Total Credits',
                value: totalCredit,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                border: 'border-emerald-100',
                prefix: '₹+',
              },
              {
                label: 'Total Expenses',
                value: totalDebit,
                color: 'text-rose-600',
                bg: 'bg-rose-50',
                border: 'border-rose-100',
                prefix: '₹-',
              },
              {
                label: 'Prize Pool Balance',
                value: balance,
                color: 'text-blue-700',
                bg: 'bg-blue-50',
                border: 'border-blue-100',
                prefix: '₹',
              },
              {
                label: 'Entries Logged',
                value: transactions.length,
                color: 'text-violet-700',
                bg: 'bg-violet-50',
                border: 'border-violet-100',
                prefix: '',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`${stat.bg} ${stat.border} border rounded-2xl p-5 text-center`}
              >
                <div className={`text-3xl font-black ${stat.color}`}>
                  {stat.prefix}
                  {stat.value.toLocaleString('en-IN')}
                </div>
                <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Transaction Desk
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Log sponsor credits or expense debits and keep the club ledger
                  ready for judges.
                </p>
              </div>
              <button
                onClick={() => setAddMode(!addMode)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                {addMode ? 'Cancel' : '+ New Entry'}
              </button>
            </div>

            {addMode ? (
              <form
                onSubmit={handleAdd}
                className="bg-slate-50 rounded-xl p-6 mb-6 space-y-4 border border-slate-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Submission Mode
                    </label>
                    <select
                      value={form.submissionMode}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          submissionMode: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20"
                    >
                      <option value="SERVER">Instant Algorand Log</option>
                      <option value="WALLET">Pera Wallet Sign</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Type
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          type: e.target.value,
                          sponsorId:
                            e.target.value === 'CREDIT' ? current.sponsorId : '',
                        }))
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20"
                    >
                      <option value="DEBIT">Debit (Expense)</option>
                      <option value="CREDIT">Credit (Income)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          amount: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20"
                      placeholder="e.g. 1500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          category: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Purpose
                    </label>
                    <input
                      type="text"
                      required
                      value={form.description}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20"
                      placeholder={
                        form.type === 'CREDIT'
                          ? 'e.g. Main sponsorship received'
                          : 'e.g. Stage banner printing'
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Linked Event
                    </label>
                    <select
                      value={form.eventId}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          eventId: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20"
                    >
                      <option value="">No linked event</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title} •{' '}
                          {new Date(event.date).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Sponsor
                    </label>
                    <select
                      value={form.sponsorId}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          sponsorId: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20"
                      disabled={form.type !== 'CREDIT'}
                    >
                      <option value="">
                        {form.type === 'CREDIT'
                          ? 'Select sponsor (optional)'
                          : 'Sponsor link available for credits'}
                      </option>
                      {sponsors.map((sponsor) => (
                        <option key={sponsor.id} value={sponsor.id}>
                          {sponsor.organization} • {sponsor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Log Transaction'}
                </button>
              </form>
            ) : null}

            {transactions.length === 0 ? (
              <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-xl">
                No transactions yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-[34rem] overflow-y-auto pr-1">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                          transaction.type === 'CREDIT'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        {transaction.type === 'CREDIT' ? '+' : '−'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center flex-wrap gap-2">
                          <span>{new Date(transaction.date).toLocaleString()}</span>
                          <span>
                            ·{' '}
                            {transaction.walletAddress
                              ? `Signed from ${transaction.walletAddress.slice(0, 6)}...${transaction.walletAddress.slice(-4)}`
                              : 'Recorded by club treasury signer'}
                          </span>
                          {transaction.event ? (
                            <span>· Event: {transaction.event.title}</span>
                          ) : null}
                          {transaction.sponsor ? (
                            <span>· Sponsor: {transaction.sponsor.name}</span>
                          ) : null}
                          {transaction.txnHash ? (
                            <a
                              href={`${explorerBaseUrl}/tx/${transaction.txnHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded transition-colors"
                              title={`Txn Id: ${transaction.txnHash}`}
                            >
                              <span className="text-[10px]">🔗</span>
                              AlgoExplorer
                            </a>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          transaction.type === 'CREDIT'
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {transaction.type === 'CREDIT' ? '+' : '−'}₹
                        {transaction.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {transaction.type === 'CREDIT'
                          ? 'Sponsor / income'
                          : 'Expense / release'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
          Load a club to view the balance, recent transaction history, and
          finance tools.
        </div>
      )}
    </div>
  );
}
