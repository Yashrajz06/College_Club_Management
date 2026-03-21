import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useNavigate } from 'react-router-dom';

export default function SponsorCRM() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [email, setEmail] = useState('');
  const [clubId, setClubId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [sponsors, setSponsors] = useState<
    Array<{
      id: string;
      name: string;
      organization: string;
      email?: string | null;
      phone?: string | null;
      status: string;
      transactions?: Array<{ amount: number; date: string }>;
    }>
  >([]);

  if (!user || (user.role !== 'PRESIDENT' && user.role !== 'VP')) {
    navigate('/');
    return null;
  }

  const loadClubAndSponsors = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const clubRes = await fetch('http://localhost:3000/club/my-club', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!clubRes.ok) return;
      const club = await clubRes.json();
      setClubId(club.id);

      const balRes = await fetch(`http://localhost:3000/finance/club/${club.id}/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (balRes.ok) {
        const b = await balRes.json();
        setBalance(b.balance ?? null);
      }

      const sponsorsRes = await fetch(`http://localhost:3000/sponsor/club/${club.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sponsorsRes.ok) setSponsors(await sponsorsRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClubAndSponsors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId || !token) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/sponsor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          organization: org,
          email: email || undefined,
          clubId,
        }),
      });

      if (res.ok) {
        setName('');
        setOrg('');
        setEmail('');
        await loadClubAndSponsors();
      } else {
        const d = await res.json().catch(() => null);
        alert(d?.message || 'Failed to add sponsor');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSponsorStatus = async (sponsorId: string, status: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/sponsor/${sponsorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await loadClubAndSponsors();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sponsor CRM</h2>
          <p className="text-slate-500 mt-1">Manage sponsors, track statuses, and overview club finances.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-500">Prize Pool Balance</p>
          <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
            ₹{(balance ?? 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-h-[420px]">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Prospect</h3>
          <form className="space-y-4" onSubmit={handleAddSponsor}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Contact Person</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Organization</label>
              <input type="text" required value={org} onChange={e => setOrg(e.target.value)} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="TechCorp" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="jane@techcorp.com" />
            </div>
            <button
              disabled={loading}
              className="w-full py-2 bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:bg-slate-800 transition disabled:opacity-60"
            >
              Save Sponsor
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Sponsorship Tracking</h3>
          {loading && sponsors.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Loading sponsors...</div>
          ) : sponsors.length === 0 ? (
            <div className="text-center p-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
              No sponsors tracked yet. Add one from the left panel.
            </div>
          ) : (
            <div className="space-y-3">
              {sponsors.map((s) => (
                <div key={s.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-sm text-slate-600">{s.organization}</div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                        Status: {s.status}
                      </div>
                      {s.transactions && s.transactions.length > 0 && (
                        <div className="text-xs text-emerald-700 mt-2 font-semibold">
                          Contributions: {s.transactions.reduce((sum, t) => sum + t.amount, 0)}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => updateSponsorStatus(s.id, 'CONTACTED')}
                        className="px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition disabled:opacity-60"
                      >
                        Contacted
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => updateSponsorStatus(s.id, 'CONFIRMED')}
                        className="px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition disabled:opacity-60"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
