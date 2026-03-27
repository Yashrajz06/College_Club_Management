import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiFetch } from './lib/api';
import type { RootState } from './store';

interface PendingClub {
  id: string;
  name: string;
  description: string;
  category: string;
  president: { name: string; email: string };
  vp?: { name: string; email: string } | null;
  coordinator?: { name: string; email: string } | null;
  status: string;
}

interface ClubStat {
  id: string;
  name: string;
  category: string;
  status: string;
  _count: { members: number; events: number };
  president?: { name: string; email: string } | null;
}

interface GlobalStats {
  clubCount: number;
  memberCount: number;
  eventCount: number;
  totalBudget: number;
  pendingClubCount: number;
  pendingEventCount: number;
}

export default function AdminDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [pendingClubs, setPendingClubs] = useState<PendingClub[]>([]);
  const [allClubs, setAllClubs] = useState<ClubStat[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    refreshData();
  }, [navigate, user]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [pendingData, statData, clubData] = await Promise.all([
        apiFetch('/club/pending'),
        apiFetch('/club/global-stats'),
        apiFetch('/club/all-with-stats'),
      ]);
      setPendingClubs(pendingData ?? []);
      setStats(statData);
      setAllClubs(clubData ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await apiFetch(`/club/${id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify({ remarks: remarks[id] || undefined }),
      });
      await refreshData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update club');
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-12 text-center animate-pulse text-slate-400 font-medium">
        Initializing Admin Suite...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          Admin Command Center
        </h1>
        <p className="text-slate-500 mt-1">
          College-wide club oversight, approvals, and activity health.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Clubs', value: stats?.clubCount || 0, color: 'text-indigo-600', icon: '🏛️' },
          { label: 'Members', value: stats?.memberCount || 0, color: 'text-emerald-600', icon: '👤' },
          { label: 'Approved Events', value: stats?.eventCount || 0, color: 'text-blue-600', icon: '📅' },
          { label: 'Budget Managed', value: `₹${(stats?.totalBudget || 0).toLocaleString()}`, color: 'text-rose-600', icon: '💰' },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className={`text-2xl font-black ${card.color}`}>
              {card.value}
            </div>
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Pending Club Approvals</h3>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-black">
                {pendingClubs.length}
              </span>
            </div>
            {pendingClubs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No pending club requests.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingClubs.map((club) => (
                  <li
                    key={club.id}
                    className="p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900">
                            {club.name}
                          </h4>
                          <p className="text-sm text-slate-500 line-clamp-2">
                            {club.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] font-bold uppercase text-slate-400">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                              {club.category}
                            </span>
                            <span>President: {club.president.name}</span>
                            {club.vp ? <span>VP: {club.vp.name}</span> : null}
                            {club.coordinator ? (
                              <span>Coordinator: {club.coordinator.name}</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[160px]">
                          <button
                            onClick={() => handleAction(club.id, 'approve')}
                            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(club.id, 'reject')}
                            className="px-4 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={remarks[club.id] || ''}
                        onChange={(e) =>
                          setRemarks((current) => ({
                            ...current,
                            [club.id]: e.target.value,
                          }))
                        }
                        className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
                        placeholder="Approval or rejection remarks"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900">
                Registered Clubs & Participation
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Club Name</th>
                    <th className="px-6 py-4">President</th>
                    <th className="px-6 py-4">Members</th>
                    <th className="px-6 py-4">Events</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allClubs.map((club) => (
                    <tr key={club.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{club.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-black">
                          {club.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {club.president?.name || 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {club._count.members}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {club._count.events}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            club.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : club.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {club.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
            <h3 className="text-lg font-black italic">Platform Control</h3>
            <p className="text-indigo-100 text-xs mt-1 leading-relaxed">
              Approving a club also syncs analytics and mints the President&apos;s
              entry token hook. Use remarks to keep the workflow auditable.
            </p>
            <div className="mt-6 space-y-3">
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold transition-all text-center">
                Pending Clubs: {stats?.pendingClubCount || 0}
              </button>
              <button
                onClick={() => navigate('/admin/coordinators')}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold transition-all text-center"
              >
                Manage Faculty Accounts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
