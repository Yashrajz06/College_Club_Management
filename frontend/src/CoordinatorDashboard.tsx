import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useNavigate } from 'react-router-dom';

interface PendingEvent {
  id: string; title: string; description: string; date: string;
  venue: string; capacity: number;
  club: { name: string };
  status: string;
}

interface GlobalStats {
  clubCount: number; memberCount: number; eventCount: number; totalBudget: number;
}

export default function CoordinatorDashboard() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'COORDINATOR') { navigate('/'); return; }
    refreshData();
  }, [user]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [pendRes, statRes] = await Promise.all([
        fetch('http://localhost:3000/event/pending-approvals', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3000/club/global-stats', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (pendRes.ok) setPendingEvents(await pendRes.json());
      if (statRes.ok) setStats(await statRes.json());
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch(`http://localhost:3000/event/${id}/${action}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ remarks: remarks[id] })
    });
    if (res.ok) {
      alert(`Event ${action === 'approve' ? 'Approved' : 'Rejected'}!`);
      refreshData();
    }
  };

  if (loading && !stats) return <div className="p-12 text-center animate-pulse text-slate-400 font-medium">Loading Coordinator Command...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Faculty Coordinator</h1>
        <p className="text-slate-500 mt-1">Review event requests and monitor active club metrics.</p>
      </div>

      {/* Analytics Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Clubs', value: stats?.clubCount || 0, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
          { label: 'Total Members', value: stats?.memberCount || 0, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
          { label: 'Approved Events', value: stats?.eventCount || 0, color: 'text-blue-600', bg: 'bg-blue-50/50' },
          { label: 'College Budget', value: `₹${(stats?.totalBudget || 0).toLocaleString()}`, color: 'text-rose-600', bg: 'bg-rose-50/50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} p-6 rounded-2xl border border-slate-100`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Events */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Event Requests</h3>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-black">{pendingEvents.length} PENDING</span>
            </div>
            
            {pendingEvents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm italic">
                All requests have been processed.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingEvents.map(event => (
                  <li key={event.id} className="p-6 transition-all hover:bg-slate-50">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-3 flex-grow">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-bold text-slate-900">{event.title}</h4>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded border border-indigo-100">
                            {event.club.name}
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm line-clamp-2">{event.description}</p>
                        <div className="grid grid-cols-3 gap-4 text-[11px] font-bold">
                          <div><span className="block text-slate-400 uppercase">Date</span>{new Date(event.date).toLocaleDateString()}</div>
                          <div><span className="block text-slate-400 uppercase">Venue</span>{event.venue}</div>
                          <div><span className="block text-slate-400 uppercase">Capacity</span>{event.capacity} People</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3 md:min-w-[200px]">
                        <textarea 
                          placeholder="Feedback/Remarks..."
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
                          value={remarks[event.id] || ''}
                          onChange={(e) => setRemarks({ ...remarks, [event.id]: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(event.id, 'approve')}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all">APPROVE</button>
                          <button onClick={() => handleAction(event.id, 'reject')}
                            className="flex-1 py-2 bg-white border border-rose-200 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-50 transition-all">REJECT</button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <button onClick={() => navigate('/attendance')} className="w-full text-left px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex justify-between items-center">
                📊 Participation Monitor <span>→</span>
              </button>
              <button onClick={() => navigate('/ledger')} className="w-full text-left px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex justify-between items-center">
                💰 Budget Oversight <span>→</span>
              </button>
              <button onClick={() => navigate('/studio')} className="w-full text-left px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex justify-between items-center">
                ✨ Content Studio <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
