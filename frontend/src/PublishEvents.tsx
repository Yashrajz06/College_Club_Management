import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useNavigate } from 'react-router-dom';

interface PublishableEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  capacity: number;
  status: string;
  isPublic: boolean;
  club: { name: string };
}

export default function PublishEvents() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const [events, setEvents] = useState<PublishableEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/event/publishable', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setEvents(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !['PRESIDENT', 'VP'].includes(user.role)) {
      navigate('/');
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markPublic = async (eventId: string) => {
    const res = await fetch(`http://localhost:3000/event/${eventId}/public`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      alert('Event is now public.');
      await refresh();
    } else {
      const d = await res.json().catch(() => null);
      alert(d?.message || 'Failed to publish event');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Publish Approved Events</h1>
        <p className="text-slate-500 mt-2">Make approved events public so they appear on the Home feed.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center animate-pulse text-slate-400">Loading publishable events...</div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
          No approved events pending publication.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded border border-indigo-100">
                      {ev.club.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Approved (not public)
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{ev.title}</h2>
                  <p className="text-slate-500 text-sm line-clamp-2">{ev.description}</p>
                  <div className="text-slate-600 text-sm font-medium flex gap-4 flex-wrap">
                    <span>📅 {new Date(ev.date).toLocaleString()}</span>
                    <span>📍 {ev.venue}</span>
                    <span>🎟 Cap: {ev.capacity}</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <button
                    onClick={() => markPublic(ev.id)}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                  >
                    Mark as Public
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

