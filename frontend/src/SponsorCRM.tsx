import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiFetch } from './lib/api';
import type { RootState } from './store';

interface EventOption {
  id: string;
  title: string;
  date: string;
}

interface SponsorRecord {
  id: string;
  name: string;
  organization: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  outreachDraft?: string | null;
  lastContactedAt?: string | null;
  transactions?: Array<{ amount: number; date: string }>;
}

interface DraftResponse {
  subject: string;
  message: string;
}

export default function SponsorCRM() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [clubId, setClubId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [sponsors, setSponsors] = useState<SponsorRecord[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, DraftResponse>>({});
  const [selectedEventBySponsor, setSelectedEventBySponsor] = useState<
    Record<string, string>
  >({});
  const [form, setForm] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
  });
  const [contributionForm, setContributionForm] = useState({
    sponsorId: '',
    eventId: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    if (!user || (user.role !== 'PRESIDENT' && user.role !== 'VP')) {
      navigate('/');
      return;
    }
    loadClubAndSponsors();
  }, [navigate, user]);

  const loadClubAndSponsors = async () => {
    setLoading(true);
    try {
      const club = await apiFetch('/club/my-club');
      setClubId(club?.id || null);
      if (!club?.id) {
        setSponsors([]);
        setEvents([]);
        return;
      }

      const [balanceData, sponsorData, eventData] = await Promise.all([
        apiFetch(`/finance/club/${club.id}/balance`),
        apiFetch(`/sponsor/club/${club.id}`),
        apiFetch(`/event/club/${club.id}`),
      ]);

      setBalance(balanceData?.balance ?? null);
      setSponsors(sponsorData ?? []);
      setEvents(eventData ?? []);
      setContributionForm((current) => ({
        ...current,
        sponsorId: current.sponsorId || sponsorData?.[0]?.id || '',
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId) return;

    setLoading(true);
    try {
      await apiFetch('/sponsor', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          clubId,
          email: form.email || undefined,
          phone: form.phone || undefined,
        }),
      });
      setForm({ name: '', organization: '', email: '', phone: '' });
      await loadClubAndSponsors();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add sponsor');
    } finally {
      setLoading(false);
    }
  };

  const updateSponsorStatus = async (sponsorId: string, status: string) => {
    setLoading(true);
    try {
      await apiFetch(`/sponsor/${sponsorId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadClubAndSponsors();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update sponsor');
    } finally {
      setLoading(false);
    }
  };

  const generateDraft = async (sponsorId: string) => {
    const eventId = selectedEventBySponsor[sponsorId];
    if (!eventId) {
      alert('Choose an event before generating an outreach draft.');
      return;
    }

    setLoading(true);
    try {
      const draft = await apiFetch(`/sponsor/${sponsorId}/outreach-draft`, {
        method: 'POST',
        body: JSON.stringify({ eventId }),
      });
      setDrafts((current) => ({ ...current, [sponsorId]: draft }));
      await loadClubAndSponsors();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to generate outreach draft',
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteSponsor = async (sponsorId: string) => {
    const confirmed = window.confirm('Delete this sponsor record?');
    if (!confirmed) return;
    setLoading(true);
    try {
      await apiFetch(`/sponsor/${sponsorId}`, { method: 'DELETE' });
      await loadClubAndSponsors();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete sponsor');
    } finally {
      setLoading(false);
    }
  };

  const handleLogContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId || !contributionForm.sponsorId) return;

    setLoading(true);
    try {
      await apiFetch('/finance/transaction', {
        method: 'POST',
        body: JSON.stringify({
          clubId,
          sponsorId: contributionForm.sponsorId,
          eventId: contributionForm.eventId || undefined,
          type: 'CREDIT',
          amount: Number(contributionForm.amount),
          description: contributionForm.description.trim()
            ? `Sponsor Credit: ${contributionForm.description.trim()}`
            : 'Sponsor Credit: Contribution received',
        }),
      });
      setContributionForm((current) => ({
        sponsorId: current.sponsorId,
        eventId: '',
        amount: '',
        description: '',
      }));
      await loadClubAndSponsors();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Failed to log sponsor credit',
      );
    } finally {
      setLoading(false);
    }
  };

  const copyDraft = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard.`);
    } catch {
      alert(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sponsor CRM</h2>
          <p className="text-slate-500 mt-1">
            Track sponsors, generate AI outreach drafts, and connect sponsorship
            activity back to live event plans.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-500">Prize Pool Balance</p>
          <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
            ₹{(balance ?? 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Add Prospect
            </h3>
            <form className="space-y-4" onSubmit={handleAddSponsor}>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Contact Person
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, name: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Organization
                </label>
                <input
                  type="text"
                  required
                  value={form.organization}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      organization: e.target.value,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="TechCorp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, email: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="jane@techcorp.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Phone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, phone: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 9876543210"
                />
              </div>
              <button
                disabled={loading || !clubId}
                className="w-full py-2 bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:bg-slate-800 transition disabled:opacity-60"
              >
                Save Sponsor
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Log Sponsor Credit
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Record the contribution directly into the Algorand-backed club
              ledger.
            </p>
            <form className="space-y-4" onSubmit={handleLogContribution}>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Sponsor
                </label>
                <select
                  required
                  value={contributionForm.sponsorId}
                  onChange={(e) =>
                    setContributionForm((current) => ({
                      ...current,
                      sponsorId: e.target.value,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose sponsor</option>
                  {sponsors.map((sponsor) => (
                    <option key={sponsor.id} value={sponsor.id}>
                      {sponsor.organization} • {sponsor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Amount
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={contributionForm.amount}
                  onChange={(e) =>
                    setContributionForm((current) => ({
                      ...current,
                      amount: e.target.value,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Linked Event
                </label>
                <select
                  value={contributionForm.eventId}
                  onChange={(e) =>
                    setContributionForm((current) => ({
                      ...current,
                      eventId: e.target.value,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No event linked</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} • {new Date(event.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Purpose
                </label>
                <input
                  type="text"
                  value={contributionForm.description}
                  onChange={(e) =>
                    setContributionForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Title sponsor contribution"
                />
              </div>
              <button
                disabled={loading || !clubId || sponsors.length === 0}
                className="w-full py-2 bg-emerald-600 text-white font-medium rounded-lg shadow-sm hover:bg-emerald-700 transition disabled:opacity-60"
              >
                Log Credit Transaction
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Sponsorship Tracking
          </h3>
          {loading && sponsors.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Loading sponsors...
            </div>
          ) : sponsors.length === 0 ? (
            <div className="text-center p-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
              No sponsors tracked yet. Add one from the left panel.
            </div>
          ) : (
            <div className="space-y-4">
              {sponsors.map((sponsor) => {
                const draft = drafts[sponsor.id];
                return (
                  <div
                    key={sponsor.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-sky-100 transition-colors space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <div className="font-bold text-slate-900">
                          {sponsor.name}
                        </div>
                        <div className="text-sm text-slate-600">
                          {sponsor.organization}
                        </div>
                        <div className="text-[11px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                          Status: {sponsor.status}
                        </div>
                        {sponsor.lastContactedAt ? (
                          <div className="text-xs text-slate-500 mt-2">
                            Last contacted:{' '}
                            {new Date(sponsor.lastContactedAt).toLocaleString()}
                          </div>
                        ) : null}
                        {sponsor.transactions && sponsor.transactions.length > 0 ? (
                          <div className="text-xs text-emerald-700 mt-2 font-semibold">
                            Contributions: ₹
                            {sponsor.transactions.reduce(
                              (sum, transaction) => sum + transaction.amount,
                              0,
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => updateSponsorStatus(sponsor.id, 'CONTACTED')}
                          className="px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition disabled:opacity-60"
                        >
                          Contacted
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() =>
                            updateSponsorStatus(sponsor.id, 'NEGOTIATING')
                          }
                          className="px-3 py-2 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-100 transition disabled:opacity-60"
                        >
                          Negotiating
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => updateSponsorStatus(sponsor.id, 'CONFIRMED')}
                          className="px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition disabled:opacity-60"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => deleteSponsor(sponsor.id)}
                          className="px-3 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
                      <select
                        value={selectedEventBySponsor[sponsor.id] || ''}
                        onChange={(e) =>
                          setSelectedEventBySponsor((current) => ({
                            ...current,
                            [sponsor.id]: e.target.value,
                          }))
                        }
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <option value="">Choose event for outreach draft</option>
                        {events.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.title} • {new Date(event.date).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => generateDraft(sponsor.id)}
                        disabled={loading || !events.length}
                        className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition disabled:opacity-60"
                      >
                        Generate Outreach Draft
                      </button>
                    </div>

                    {draft || sponsor.outreachDraft ? (
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                        {draft?.subject ? (
                          <div className="text-sm font-semibold text-slate-900">
                            Subject: {draft.subject}
                          </div>
                        ) : null}
                        <div className="flex gap-2 flex-wrap">
                          {draft?.subject ? (
                            <button
                              type="button"
                              onClick={() => copyDraft(draft.subject, 'Subject')}
                              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                            >
                              Copy Subject
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() =>
                              copyDraft(draft?.message || sponsor.outreachDraft || '', 'Draft')
                            }
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                          >
                            Copy Body
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap text-sm text-slate-600 font-sans">
                          {draft?.message || sponsor.outreachDraft}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
