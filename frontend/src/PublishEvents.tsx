import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiFetch } from './lib/api';
import type { RootState } from './store';

interface GovernanceProposal {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  _count?: { votes: number };
}

interface EventRecord {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  date: string;
  venue: string;
  capacity: number;
  budget?: number;
  status: string;
  isPublic: boolean;
  treasuryPlaceholderTxId?: string | null;
  club: { name: string };
}

interface EventFormState {
  title: string;
  description: string;
  category: string;
  date: string;
  venue: string;
  capacity: string;
  budget: string;
}

export default function PublishEvents() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [clubId, setClubId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [proposalsByEvent, setProposalsByEvent] = useState<
    Record<string, GovernanceProposal[]>
  >({});
  const [proposalDrafts, setProposalDrafts] = useState<
    Record<string, { title: string; description: string }>
  >({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>({
    title: '',
    description: '',
    category: '',
    date: '',
    venue: '',
    capacity: '',
    budget: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !['PRESIDENT', 'VP'].includes(user.role)) {
      navigate('/');
      return;
    }
    refresh();
  }, [navigate, user]);

  const refresh = async () => {
    setLoading(true);
    try {
      const myClub = await apiFetch('/club/my-club');
      setClubId(myClub?.id || null);

      if (!myClub?.id) {
        setEvents([]);
        setProposalsByEvent({});
        return;
      }

      const eventList = await apiFetch(`/event/club/${myClub.id}`);
      setEvents(eventList ?? []);

      const approvedEvents = (eventList ?? []).filter(
        (event: EventRecord) => event.status === 'APPROVED',
      );
      const proposalEntries = await Promise.all(
        approvedEvents.map(async (event: EventRecord) => [
          event.id,
          (await apiFetch(`/governance/event/${event.id}`)) ?? [],
        ]),
      );
      setProposalsByEvent(Object.fromEntries(proposalEntries));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (event: EventRecord) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      category: event.category || '',
      date: new Date(event.date).toISOString().slice(0, 16),
      venue: event.venue,
      capacity: String(event.capacity),
      budget: String(event.budget ?? 0),
    });
  };

  const saveEdit = async (eventId: string) => {
    setSaving(true);
    try {
      await apiFetch(`/event/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          date: new Date(form.date).toISOString(),
          venue: form.venue,
          capacity: Number(form.capacity),
          budget: Number(form.budget || 0),
        }),
      });
      setEditingId(null);
      await refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    const confirmed = window.confirm(
      'Delete this event draft? Events with registrations or transactions cannot be deleted.',
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      await apiFetch(`/event/${eventId}`, { method: 'DELETE' });
      await refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete event');
    } finally {
      setSaving(false);
    }
  };

  const markPublic = async (eventId: string) => {
    setSaving(true);
    try {
      await apiFetch(`/event/${eventId}/public`, { method: 'PATCH' });
      await refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to publish event');
    } finally {
      setSaving(false);
    }
  };

  const createProposal = async (eventId: string) => {
    const draft = proposalDrafts[eventId];
    if (!draft?.title || !draft.description) {
      alert('Add a proposal title and description first.');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/governance/proposals', {
        method: 'POST',
        body: JSON.stringify({
          eventId,
          title: draft.title,
          description: draft.description,
        }),
      });
      setProposalDrafts((current) => ({
        ...current,
        [eventId]: { title: '', description: '' },
      }));
      await refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Failed to create proposal',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Event Ops Board
          </h1>
          <p className="text-slate-500 mt-2">
            Update drafts, publish approved events, and submit governance
            proposals only for approved events.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/create-event')}
            className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
          >
            New Event
          </button>
          <button
            onClick={() => navigate('/studio')}
            className="px-5 py-2.5 bg-sky-50 text-sky-700 font-bold rounded-xl hover:bg-sky-100 transition-all"
          >
            Poster Studio
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center animate-pulse text-slate-400">
          Loading your events...
        </div>
      ) : !clubId ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
          No club found yet. Wait for your club approval before managing events.
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
          No events yet. Create your first event draft to get started.
        </div>
      ) : (
        <div className="space-y-5">
          {events.map((event) => {
            const proposalDraft = proposalDrafts[event.id] || {
              title: '',
              description: '',
            };
            const proposals = proposalsByEvent[event.id] || [];
            const isEditing = editingId === event.id;

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded border border-indigo-100">
                        {event.club.name}
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded border border-slate-200">
                        {event.status}
                      </span>
                      {event.isPublic ? (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded border border-emerald-100">
                          Public
                        </span>
                      ) : null}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {event.title}
                    </h2>
                    <p className="text-slate-500 text-sm">{event.description}</p>
                    <div className="text-slate-600 text-sm font-medium flex gap-4 flex-wrap">
                      <span>📅 {new Date(event.date).toLocaleString()}</span>
                      <span>📍 {event.venue}</span>
                      <span>🎟 Cap: {event.capacity}</span>
                      <span>💸 ₹{Number(event.budget || 0).toLocaleString()}</span>
                    </div>
                    {event.treasuryPlaceholderTxId ? (
                      <div className="text-xs text-slate-500 font-mono">
                        Treasury placeholder: {event.treasuryPlaceholderTxId}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => startEdit(event)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition"
                    >
                      Edit
                    </button>
                    {event.status === 'APPROVED' && !event.isPublic ? (
                      <button
                        onClick={() => markPublic(event.id)}
                        disabled={saving}
                        className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700 transition disabled:opacity-60"
                      >
                        Publish
                      </button>
                    ) : null}
                    <button
                      onClick={() => deleteEvent(event.id)}
                      disabled={saving}
                      className="px-4 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                    <input
                      value={form.title}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, title: e.target.value }))
                      }
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      placeholder="Title"
                    />
                    <input
                      value={form.category}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          category: e.target.value,
                        }))
                      }
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      placeholder="Category"
                    />
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          description: e.target.value,
                        }))
                      }
                      className="md:col-span-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none"
                      rows={4}
                      placeholder="Description"
                    />
                    <input
                      type="datetime-local"
                      value={form.date}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, date: e.target.value }))
                      }
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                    <input
                      value={form.venue}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          venue: e.target.value,
                        }))
                      }
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      placeholder="Venue"
                    />
                    <input
                      type="number"
                      min="1"
                      value={form.capacity}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          capacity: e.target.value,
                        }))
                      }
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      placeholder="Capacity"
                    />
                    <input
                      type="number"
                      min="0"
                      value={form.budget}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          budget: e.target.value,
                        }))
                      }
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      placeholder="Budget"
                    />
                    <div className="md:col-span-2 flex gap-3">
                      <button
                        onClick={() => saveEdit(event.id)}
                        disabled={saving}
                        className="px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60"
                      >
                        Save Event
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-5 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {event.status === 'APPROVED' ? (
                  <div className="border-t border-slate-100 pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-900">
                        Governance Proposal
                      </h3>
                      <input
                        value={proposalDraft.title}
                        onChange={(e) =>
                          setProposalDrafts((current) => ({
                            ...current,
                            [event.id]: {
                              ...proposalDraft,
                              title: e.target.value,
                            },
                          }))
                        }
                        placeholder="Proposal title"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                      <textarea
                        value={proposalDraft.description}
                        onChange={(e) =>
                          setProposalDrafts((current) => ({
                            ...current,
                            [event.id]: {
                              ...proposalDraft,
                              description: e.target.value,
                            },
                          }))
                        }
                        rows={4}
                        placeholder="Proposal description for this approved event"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none"
                      />
                      <button
                        onClick={() => createProposal(event.id)}
                        disabled={saving}
                        className="px-5 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-60"
                      >
                        Submit Proposal
                      </button>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-900">
                        Existing Proposals
                      </h3>
                      {proposals.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                          No governance proposals yet for this event.
                        </div>
                      ) : (
                        proposals.map((proposal) => (
                          <div
                            key={proposal.id}
                            className="rounded-2xl border border-slate-100 p-4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {proposal.title}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {new Date(proposal.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                                {proposal.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
