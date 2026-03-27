import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiFetch } from './lib/api';
import type { RootState } from './store';

interface EventOption {
  id: string;
  title: string;
  date: string;
  venue: string;
}

interface PosterResponse {
  imageUrl: string;
  prompt: string;
  source: string;
}

interface AssistantContext {
  source: string;
  dashboard: {
    clubCount: number;
    eventCount: number;
    sponsorCount: number;
    pendingEventCount: number;
  };
  clubs: Array<{ id: string; name: string; status: string }>;
  recentEvents: Array<{ id: string; title: string; status: string; venue: string }>;
  recentAnalytics: Array<{ entityType: string; action: string; createdAt: string }>;
}

export default function AIPosterCreator() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [assistantContext, setAssistantContext] = useState<AssistantContext | null>(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [mood, setMood] = useState('high-energy, cinematic');
  const [tagline, setTagline] = useState('');
  const [poster, setPoster] = useState<PosterResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !['PRESIDENT', 'VP', 'COORDINATOR', 'ADMIN'].includes(user.role)) {
      navigate('/');
      return;
    }

    const loadContext = async () => {
      try {
        const context = await apiFetch('/ai/assistant-context');
        setAssistantContext(context);
      } catch (error) {
        console.error(error);
      }
    };

    const loadEvents = async () => {
      if (!user || !['PRESIDENT', 'VP'].includes(user.role)) return;
      try {
        const myClub = await apiFetch('/club/my-club');
        if (!myClub?.id) return;
        const eventList = await apiFetch(`/event/club/${myClub.id}`);
        setEvents(eventList ?? []);
        if (eventList?.length) {
          setSelectedEventId(eventList[0].id);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadContext();
    loadEvents();
  }, [navigate, user]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      alert('Choose an event first.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch(
        `/ai/generate-event-poster?eventId=${encodeURIComponent(
          selectedEventId,
        )}&mood=${encodeURIComponent(mood)}&tagline=${encodeURIComponent(tagline)}`,
      );
      setPoster(data);
      const refreshed = await apiFetch('/ai/assistant-context');
      setAssistantContext(refreshed);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to generate poster');
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = user?.role === 'PRESIDENT' || user?.role === 'VP';

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">AI Poster Studio</h2>
        <p className="text-slate-500 mt-1">
          Generate event-specific poster art with Stable Diffusion and keep the
          assistant panel grounded in real club, event, and sponsor data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                disabled={!canGenerate}
              >
                <option value="">Select an event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} • {new Date(event.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Visual Mood
              </label>
              <input
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                placeholder="e.g. bold campus energy, warm spotlight"
                disabled={!canGenerate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tagline Hint
              </label>
              <textarea
                rows={3}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 resize-none text-sm"
                placeholder="Ex: Build, ship, and demo in 24 hours"
                disabled={!canGenerate}
              />
            </div>
            <button
              disabled={loading || !canGenerate}
              className={`w-full py-2 flex justify-center items-center text-white font-medium rounded-lg shadow-sm transition ${
                loading || !canGenerate
                  ? 'bg-sky-300'
                  : 'bg-sky-600 hover:bg-sky-700'
              }`}
            >
              {loading ? 'Generating...' : 'Generate Poster'}
            </button>
            {!canGenerate ? (
              <p className="text-xs text-slate-500">
                Poster generation is reserved for President and VP roles, but you
                can still inspect the assistant context below.
              </p>
            ) : null}
          </form>

          <div className="border-t border-slate-200 pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Assistant Context
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Clubs', value: assistantContext?.dashboard.clubCount || 0 },
                { label: 'Events', value: assistantContext?.dashboard.eventCount || 0 },
                { label: 'Sponsors', value: assistantContext?.dashboard.sponsorCount || 0 },
                { label: 'Pending Events', value: assistantContext?.dashboard.pendingEventCount || 0 },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xl font-black text-slate-900">
                    {metric.value}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500">
              Source: {assistantContext?.source || 'loading'}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[500px] flex items-center justify-center relative overflow-hidden">
            {poster ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
                <img
                  src={poster.imageUrl}
                  alt="AI generated event poster background"
                  className="w-full h-auto max-h-[600px] object-cover rounded-lg shadow-md border border-slate-200"
                />
                <div className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
                  <div className="font-semibold text-slate-900 mb-1">
                    Prompt
                  </div>
                  <div>{poster.prompt}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    Source: {poster.source}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 px-8">
                <div className="text-4xl">🎨</div>
                <p className="text-slate-500 font-medium">Your canvas is empty.</p>
                <p className="text-sm text-slate-400">
                  Choose an event and generate a poster-ready background.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Real-Time Context Feed
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
              <div>
                <div className="font-semibold text-slate-900 mb-2">
                  Recent Events
                </div>
                <div className="space-y-2">
                  {(assistantContext?.recentEvents || []).slice(0, 5).map((event) => (
                    <div key={event.id} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <div className="font-medium text-slate-900">{event.title}</div>
                      <div className="text-slate-500">
                        {event.status} • {event.venue}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-900 mb-2">
                  Recent Analytics Events
                </div>
                <div className="space-y-2">
                  {(assistantContext?.recentAnalytics || []).slice(0, 5).map((entry, index) => (
                    <div
                      key={`${entry.entityType}-${entry.createdAt}-${index}`}
                      className="rounded-xl bg-slate-50 border border-slate-200 p-3"
                    >
                      <div className="font-medium text-slate-900">
                        {entry.entityType} → {entry.action}
                      </div>
                      <div className="text-slate-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
