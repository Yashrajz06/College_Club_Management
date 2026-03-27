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

interface ClubTask {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: string;
  deadline?: string | null;
  assignee: {
    name: string;
    email: string;
  };
}

interface ClubEvent {
  id: string;
  title: string;
  date: string;
  venue: string;
  status: string;
  isPublic: boolean;
  capacity: number;
}

interface EventRegistration {
  id: string;
  isWaitlisted: boolean;
  attended: boolean;
  registeredAt: string;
  guestPhone?: string | null;
  guestInstitution?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    studentId?: string | null;
  };
}

export default function PresidentDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [club, setClub] = useState<ClubDetails | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [tasks, setTasks] = useState<ClubTask[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    vpEmailOrId: '',
    coordinatorEmailOrId: '',
  });
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'MEDIUM',
    deadline: '',
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

      const [clubDetails, clubMembers, clubTasks, clubEvents] = await Promise.all([
        apiFetch(`/club/${myClub.id}`),
        apiFetch(`/club/${myClub.id}/members`),
        apiFetch(`/task/club/${myClub.id}`),
        apiFetch(`/event/club/${myClub.id}`),
      ]);

      setClub(clubDetails);
      setMembers(clubMembers ?? []);
      setTasks(clubTasks ?? []);
      setEvents(clubEvents ?? []);
      setSelectedEventId((current) => current || clubEvents?.[0]?.id || '');
      setRoleDrafts(
        Object.fromEntries(
          (clubMembers ?? []).map((member: ClubMember) => [
            member.id,
            member.customRole || '',
          ]),
        ),
      );
      setTaskForm((current) => ({
        ...current,
        assigneeId: current.assigneeId || clubMembers?.[0]?.user.id || '',
      }));
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

  useEffect(() => {
    const loadRegistrations = async () => {
      if (!selectedEventId) {
        setRegistrations([]);
        return;
      }

      try {
        const data = await apiFetch(`/event/${selectedEventId}/registrations`);
        setRegistrations(data ?? []);
      } catch (error) {
        console.error(error);
        setRegistrations([]);
      }
    };

    loadRegistrations();
  }, [selectedEventId]);

  const handleMemberRoleSave = async (memberId: string) => {
    if (!club) return;

    setSaving(true);
    try {
      const updated = await apiFetch(`/club/${club.id}/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customRole: roleDrafts[memberId] || null,
        }),
      });
      setMembers((current) =>
        current.map((member) =>
          member.id === memberId ? { ...member, customRole: updated.customRole } : member,
        ),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update member role');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;

    setSaving(true);
    try {
      await apiFetch('/task', {
        method: 'POST',
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description,
          assigneeId: taskForm.assigneeId,
          priority: taskForm.priority,
          deadline: taskForm.deadline || undefined,
          clubId: club.id,
        }),
      });
      setTaskForm({
        title: '',
        description: '',
        assigneeId: members[0]?.user.id || '',
        priority: 'MEDIUM',
        deadline: '',
      });
      await loadClub();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to assign task');
    } finally {
      setSaving(false);
    }
  };

  const handleConcludeEvent = async () => {
    if (!selectedEventId) return;
    const confirmed = window.confirm(
      'Mark this event as concluded and trigger report generation?',
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      await apiFetch(`/event/${selectedEventId}/conclude`, { method: 'PATCH' });
      await loadClub();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to conclude event');
    } finally {
      setSaving(false);
    }
  };

  const memberRegistrations = registrations.filter(
    (registration) => registration.user.role !== 'GUEST',
  );
  const guestRegistrations = registrations.filter(
    (registration) => registration.user.role === 'GUEST',
  );
  const waitlistedRegistrations = registrations.filter(
    (registration) => registration.isWaitlisted,
  );
  const confirmedRegistrations = registrations.filter(
    (registration) => !registration.isWaitlisted,
  );
  const selectedEvent = events.find((event) => event.id === selectedEventId) || null;

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

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">
                Assign Tasks
              </h3>
              <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg font-black text-slate-400 uppercase tracking-widest">
                Delivery
              </span>
            </div>

            <form className="space-y-5" onSubmit={handleCreateTask}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Task Title
                  </label>
                  <input
                    required
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm((current) => ({
                        ...current,
                        title: e.target.value,
                      }))
                    }
                    className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10"
                    placeholder="e.g. Finalize sponsor deck"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Assignee
                  </label>
                  <select
                    required
                    value={taskForm.assigneeId}
                    onChange={(e) =>
                      setTaskForm((current) => ({
                        ...current,
                        assigneeId: e.target.value,
                      }))
                    }
                    className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="">Select member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.user.id}>
                        {member.user.name}
                        {member.customRole ? ` - ${member.customRole}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Task Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 resize-none"
                  placeholder="Describe the deliverable and what success looks like."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm((current) => ({
                        ...current,
                        priority: e.target.value,
                      }))
                    }
                    className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={taskForm.deadline}
                    onChange={(e) =>
                      setTaskForm((current) => ({
                        ...current,
                        deadline: e.target.value,
                      }))
                    }
                    className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || members.length === 0}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm rounded-2xl hover:shadow-xl transition-all disabled:opacity-60"
              >
                {saving ? 'Assigning...' : 'Assign Task'}
              </button>
            </form>

            <div className="space-y-3">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Recent Tasks
              </h4>
              {tasks.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No club tasks created yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-slate-100 p-4 bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {task.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {task.assignee.name} • {task.priority} • {task.status}
                          </div>
                        </div>
                        {task.deadline ? (
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Due {new Date(task.deadline).toLocaleDateString()}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            <h3 className="font-bold text-slate-900 mb-4">Event Registration Desk</h3>
            {events.length === 0 ? (
              <p className="text-sm text-slate-500">
                No club events yet. Create and approve an event to monitor registrations here.
              </p>
            ) : (
              <div className="space-y-4">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10"
                >
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} • {event.status}
                    </option>
                  ))}
                </select>

                {selectedEvent ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <div className="font-semibold text-slate-900">{selectedEvent.title}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(selectedEvent.date).toLocaleString()} • {selectedEvent.venue}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest">
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">
                        {selectedEvent.status}
                      </span>
                      {selectedEvent.isPublic ? (
                        <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                          Public
                        </span>
                      ) : null}
                      <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                        {registrations.length}/{selectedEvent.capacity} registrations
                      </span>
                      <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                        {confirmedRegistrations.length} confirmed
                      </span>
                      <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-bold">
                        {waitlistedRegistrations.length} waitlisted
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleConcludeEvent}
                      disabled={saving || selectedEvent.status === 'CONCLUDED'}
                      className="w-full mt-2 px-4 py-2 text-xs font-black rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all disabled:opacity-60"
                    >
                      {selectedEvent.status === 'CONCLUDED'
                        ? 'Event Already Concluded'
                        : 'Conclude Event & Generate Report'}
                    </button>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-900">Members</h4>
                      <span className="text-xs font-bold text-slate-500">
                        {memberRegistrations.length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-56 overflow-auto pr-1">
                      {memberRegistrations.length === 0 ? (
                        <p className="text-sm text-slate-500">No member registrations yet.</p>
                      ) : (
                        memberRegistrations.map((registration) => (
                          <div key={registration.id} className="rounded-xl bg-slate-50 p-3">
                            <div className="font-medium text-slate-900">
                              {registration.user.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {registration.user.email}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest">
                              {registration.user.studentId ? (
                                <span className="text-slate-400">
                                  {registration.user.studentId}
                                </span>
                              ) : null}
                              {registration.isWaitlisted ? (
                                <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-bold">
                                  Waitlist
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-900">Guests</h4>
                      <span className="text-xs font-bold text-slate-500">
                        {guestRegistrations.length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-56 overflow-auto pr-1">
                      {guestRegistrations.length === 0 ? (
                        <p className="text-sm text-slate-500">No guest registrations yet.</p>
                      ) : (
                        guestRegistrations.map((registration) => (
                          <div key={registration.id} className="rounded-xl bg-slate-50 p-3">
                            <div className="font-medium text-slate-900">
                              {registration.user.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {registration.user.email}
                            </div>
                            {registration.guestPhone ? (
                              <div className="text-xs text-slate-500">
                                {registration.guestPhone}
                              </div>
                            ) : null}
                            {registration.guestInstitution ? (
                              <div className="text-xs text-slate-500">
                                {registration.guestInstitution}
                              </div>
                            ) : null}
                            <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest">
                              <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 font-bold">
                                Guest
                              </span>
                              {registration.isWaitlisted ? (
                                <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-bold">
                                  Waitlist
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={roleDrafts[member.id] || ''}
                      onChange={(e) =>
                        setRoleDrafts((current) => ({
                          ...current,
                          [member.id]: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="Set custom role"
                    />
                    <button
                      type="button"
                      onClick={() => handleMemberRoleSave(member.id)}
                      disabled={saving}
                      className="px-4 py-2 text-xs font-black rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-60"
                    >
                      Save
                    </button>
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
