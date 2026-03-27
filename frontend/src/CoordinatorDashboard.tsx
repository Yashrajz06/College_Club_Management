import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiFetch } from './lib/api';
import type { RootState } from './store';

interface PendingEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  capacity: number;
  category?: string | null;
  club: { name: string };
  status: string;
}

interface GlobalStats {
  clubCount: number;
  memberCount: number;
  eventCount: number;
  totalBudget: number;
  pendingEventCount: number;
  sponsorCount: number;
}

export default function CoordinatorDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'COORDINATOR') {
      navigate('/');
      return;
    }
    refreshData();
  }, [navigate, user]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [pendingData, statData] = await Promise.all([
        apiFetch('/event/pending-approvals'),
        apiFetch('/club/global-stats'),
      ]);
      setPendingEvents(pendingData ?? []);
      setStats(statData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await apiFetch(`/event/${id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify({ remarks: remarks[id] || undefined }),
      });
      await refreshData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update event');
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-12 text-center animate-pulse text-slate-400 font-medium">
        Loading Coordinator Command...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          Faculty Coordinator
        </h1>
        <p className="text-slate-500 mt-1">
          Review event requests, capture remarks, and monitor campus activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Clubs', value: stats?.clubCount || 0, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
          { label: 'Total Members', value: stats?.memberCount || 0, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
          { label: 'Approved Events', value: stats?.eventCount || 0, color: 'text-blue-600', bg: 'bg-blue-50/50' },
          { label: 'Sponsors', value: stats?.sponsorCount || 0, color: 'text-rose-600', bg: 'bg-rose-50/50' },
        ].map((card) => (
          <div key={card.label} className={`${card.bg} p-6 rounded-2xl border border-slate-100`}>
            <div className={`text-2xl font-black ${card.color}`}>
              {card.value}
            </div>
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Event Requests</h3>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-black">
                {pendingEvents.length} PENDING
              </span>
            </div>

            {pendingEvents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm italic">
                All requests have been processed.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingEvents.map((event) => (
                  <li key={event.id} className="p-6 transition-all hover:bg-slate-50">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-3 flex-grow">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="text-lg font-bold text-slate-900">
                            {event.title}
                          </h4>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded border border-indigo-100">
                            {event.club.name}
                          </span>
                          {event.category ? (
                            <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-black uppercase rounded border border-sky-100">
                              {event.category}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-slate-500 text-sm line-clamp-2">
                          {event.description}
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-[11px] font-bold">
                          <div>
                            <span className="block text-slate-400 uppercase">
                              Date
                            </span>
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="block text-slate-400 uppercase">
                              Venue
                            </span>
                            {event.venue}
                          </div>
                          <div>
                            <span className="block text-slate-400 uppercase">
                              Capacity
                            </span>
                            {event.capacity} People
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 md:min-w-[220px]">
                        <textarea
                          placeholder="Feedback or approval remarks..."
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
                          value={remarks[event.id] || ''}
                          onChange={(e) =>
                            setRemarks((current) => ({
                              ...current,
                              [event.id]: e.target.value,
                            }))
                          }
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(event.id, 'approve')}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all"
                          >
                            APPROVE
                          </button>
                          <button
                            onClick={() => handleAction(event.id, 'reject')}
                            className="flex-1 py-2 bg-white border border-rose-200 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-50 transition-all"
                          >
                            REJECT
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Workflow Notes</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                Approving an event keeps it governance-eligible and makes it
                available for publication by the club team.
              </p>
              <p>
                Creation already queued the treasury placeholder and PoP setup
                task. Your role here is the approval checkpoint.
              </p>
            </div>
            <div className="mt-6 space-y-2">
              <button
                onClick={() => navigate('/attendance')}
                className="w-full text-left px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Participation Monitor
              </button>
              <button
                onClick={() => navigate('/studio')}
                className="w-full text-left px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                AI Poster Studio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
