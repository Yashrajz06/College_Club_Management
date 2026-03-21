import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useNavigate } from 'react-router-dom';

export default function CreateEvent() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const [club, setClub] = useState<{ id: string; name: string } | null>(null);
  const [loadingClub, setLoadingClub] = useState(true);

  const [form, setForm] = useState({
    title: '',
    description: '',
    dateTime: '',
    venue: '',
    capacity: '50',
    budget: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !['PRESIDENT', 'VP'].includes(user.role)) {
      navigate('/');
      return;
    }
    const loadClub = async () => {
      setLoadingClub(true);
      try {
        const res = await fetch('http://localhost:3000/club/my-club', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setClub(await res.json());
      } finally {
        setLoadingClub(false);
      }
    };
    loadClub();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;
    setSubmitting(true);
    try {
      const isoDate = form.dateTime ? new Date(form.dateTime).toISOString() : null;
      const res = await fetch('http://localhost:3000/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          // Backend parses `new Date(body.date)`
          date: isoDate,
          venue: form.venue,
          capacity: parseInt(form.capacity, 10),
          budget: form.budget ? parseFloat(form.budget) : 0,
          clubId: club.id,
          isPublic: false,
        }),
      });

      if (res.ok) {
        alert('Event drafted successfully. Coordinator will approve it shortly.');
        navigate('/publish-events');
      } else {
        const d = await res.json();
        alert(d.message || 'Failed to create event');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;
  if (loadingClub) return <div className="p-12 text-center text-slate-400 animate-pulse">Loading your club...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 mt-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-900">Create New Event</h2>
        <p className="mt-2 text-slate-500">Draft it now; your coordinator will approve it before it becomes public.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mt-8">
        {club ? (
          <div className="text-sm text-slate-600">
            Creating event for: <span className="font-bold text-slate-900">{club.name}</span>
          </div>
        ) : (
          <div className="text-rose-600 text-sm font-semibold">No club found. Ask an admin to approve your club request first.</div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700">Event Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="e.g. Campus Hackathon 2026"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700">Description</label>
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            placeholder="What is this event about?"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Date & Time</label>
            <input
              type="datetime-local"
              required
              value={form.dateTime}
              onChange={(e) => setForm((p) => ({ ...p, dateTime: e.target.value }))}
              className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Venue</label>
            <input
              type="text"
              required
              value={form.venue}
              onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
              className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="e.g. Seminar Hall A"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Expected Capacity</label>
            <input
              type="number"
              min="1"
              required
              value={form.capacity}
              onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
              className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Budget Requirement (optional)</label>
            <input
              type="number"
              min="0"
              value={form.budget}
              onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
              className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="e.g. 5000"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !club}
          className={`w-full py-4 font-bold text-white rounded-xl shadow-lg transition-all ${
            submitting || !club
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-1'
          }`}
        >
          {submitting ? 'Creating Event...' : 'Create Event Draft'}
        </button>
      </form>
    </div>
  );
}

