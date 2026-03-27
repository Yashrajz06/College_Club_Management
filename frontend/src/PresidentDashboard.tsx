import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiFetch } from './lib/api';
import type { RootState } from './store';

interface ClubDetails {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  president?: { name: string; email: string } | null;
  vp?: { name: string; email: string } | null;
  coordinator?: { name: string; email: string } | null;
  _count: {
    members: number;
    events: number;
    sponsors: number;
    tasks: number;
  };
}

interface ClubMember {
  id: string;
  customRole?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function PresidentDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [club, setClub] = useState<ClubDetails | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    vpEmailOrId: '',
    coordinatorEmailOrId: '',
  });

  useEffect(() => {
    if (!user || !['PRESIDENT', 'VP'].includes(user.role)) {
      navigate('/');
      return;
    }
    loadClub();
  }, [navigate, user]);

  const loadClub = async () => {
    setLoading(true);
    try {
      const myClub = await apiFetch('/club/my-club');
      if (!myClub?.id) {
        setClub(null);
        setMembers([]);
        return;
      }

      const [clubDetails, clubMembers] = await Promise.all([
        apiFetch(`/club/${myClub.id}`),
        apiFetch(`/club/${myClub.id}/members`),
      ]);

      setClub(clubDetails);
      setMembers(clubMembers ?? []);
      setForm({
        name: clubDetails.name || '',
        description: clubDetails.description || '',
        category: clubDetails.category || '',
        vpEmailOrId: '',
        coordinatorEmailOrId: '',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;

    setSaving(true);
    try {
      await apiFetch(`/club/${club.id}/invite`, {
        method: 'POST',
        body: JSON.stringify({ emailOrId: inviteEmail, customRole }),
      });
      setInviteEmail('');
      setCustomRole('');
      alert('Invitation sent successfully.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;

    setSaving(true);
    try {
      const updated = await apiFetch(`/club/${club.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          vpEmailOrId: form.vpEmailOrId || undefined,
          coordinatorEmailOrId: form.coordinatorEmailOrId || undefined,
        }),
      });
      alert('Club updated successfully.');
      setClub((current) =>
        current
          ? {
              ...current,
              name: updated.name,
              description: updated.description,
              category: updated.category,
            }
          : current,
      );
      await loadClub();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update club');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!club) return;
    const confirmed = window.confirm(
      'Archive this club? Existing data stays in analytics, but the club will become inactive.',
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      await apiFetch(`/club/${club.id}`, { method: 'DELETE' });
      alert('Club archived.');
      navigate('/');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to archive club');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center animate-pulse text-slate-400 font-medium">
        Loading club command center...
      </div>
    );
  }

  if (!club) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">No club found</h2>
        <p className="text-slate-500">
          Your club may still be pending approval. Once approved, you can manage
          the club here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-slate-900 leading-none">
              {club.name}
            </h2>
            <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-black uppercase tracking-wider">
              {club.status}
            </span>
          </div>
          <p className="text-slate-500 mt-2 font-medium">
            Edit club details, manage your leadership setup, and grow the team.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/create-event')}
            className="px-6 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-100 transition-all"
          >
            Create Event
          </button>
          <button
            onClick={() => navigate('/finances')}
            className="px-6 py-3 bg-emerald-50 text-emerald-600 font-bold rounded-2xl hover:bg-emerald-100 transition-all"
          >
            Sponsor CRM
          </button>
          <button
            onClick={handleArchive}
            disabled={saving}
            className="px-6 py-3 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-all disabled:opacity-60"
          >
            Archive Club
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">
                Club Profile
              </h3>
              <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg font-black text-slate-400 uppercase tracking-widest">
                CRUD
              </span>
            </div>

            <form className="space-y-5" onSubmit={handleSave}>
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Club Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, name: e.target.value }))
                  }
                  className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Category
                  </label>
                  <input
                    value={form.category}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        category: e.target.value,
                      }))
                    }
                    className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Replace VP
                  </label>
                  <input
                    value={form.vpEmailOrId}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        vpEmailOrId: e.target.value,
                      }))
                    }
                    placeholder="email or student ID"
                    className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Replace Coordinator
                  </label>
                  <input
                    value={form.coordinatorEmailOrId}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        coordinatorEmailOrId: e.target.value,
                      }))
                    }
                    placeholder="faculty email or ID"
                    className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm rounded-2xl hover:shadow-xl transition-all disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Club Changes'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">
                Invite New Members
              </h3>
              <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg font-black text-slate-400 uppercase tracking-widest">
                Growth
              </span>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleInvite}>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Member Email or ID
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                  placeholder="search by email or student ID"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Designation
                </label>
                <input
                  type="text"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                  placeholder="e.g. Media Head"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                />
              </div>
              <button className="md:col-span-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm rounded-2xl hover:shadow-xl hover:shadow-blue-500/20 transition-all disabled:opacity-60">
                {saving ? 'Working...' : 'Dispatch Invitation'}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl overflow-hidden relative">
            <h3 className="text-xl font-black italic relative z-10">
              Club Snapshot
            </h3>
            <div className="mt-6 grid grid-cols-2 gap-4 relative z-10">
              {[
                { label: 'Members', value: club._count.members },
                { label: 'Events', value: club._count.events },
                { label: 'Sponsors', value: club._count.sponsors },
                { label: 'Tasks', value: club._count.tasks },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl bg-white/10 p-4 border border-white/10"
                >
                  <div className="text-2xl font-black">{metric.value}</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-300">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-xs text-slate-300 space-y-1 relative z-10">
              <p>President: {club.president?.name || 'Unassigned'}</p>
              <p>VP: {club.vp?.name || 'Unassigned'}</p>
              <p>Coordinator: {club.coordinator?.name || 'Unassigned'}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Current Members</h3>
            <div className="space-y-3 max-h-[440px] overflow-auto pr-1">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-slate-100 p-4"
                >
                  <div className="font-semibold text-slate-900">
                    {member.user.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {member.user.email}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">
                      {member.user.role}
                    </span>
                    {member.customRole ? (
                      <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                        {member.customRole}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
              {members.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No members yet besides the leadership team.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
