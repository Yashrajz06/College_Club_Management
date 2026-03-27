import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './lib/api';

interface Invitation {
  id: string;
  club: { name: string; category: string };
  customRole?: string;
}

interface Task {
  id: string; title: string; status: string; deadline: string;
}

interface Event {
  id: string; title: string; date: string; venue: string;
}

interface Registration {
  id: string;
  certificateUrl?: string;
  qrCode?: string;
  isWaitlisted: boolean;
  attended: boolean;
  registeredAt: string;
  event: { id: string; title: string; date: string; venue: string; capacity: number };
}

interface ClubRequest {
  id: string;
  name: string;
  category: string;
  status: string;
  vp?: { name: string; email: string } | null;
  coordinator?: { name: string; email: string } | null;
}

export default function MemberDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [clubRequests, setClubRequests] = useState<ClubRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    refreshData();
  }, [user]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [invData, taskData, eventData, regData, requestData] = await Promise.all([
        apiFetch('/club/my-invitations'),
        apiFetch('/task/my-tasks'),
        apiFetch('/event/public'),
        apiFetch('/event/my-registrations'),
        apiFetch('/club/my-requests'),
      ]);
      setInvitations(invData ?? []);
      setTasks(taskData ?? []);
      setUpcomingEvents(eventData ?? []);
      setRegistrations(regData ?? []);
      setClubRequests(requestData ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    const res = await apiFetch(`/club/invitation/${id}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (res !== undefined) {
      alert(`Invitation ${status.toLowerCase()}!`);
      refreshData();
    }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    const res = await apiFetch(`/task/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res !== undefined) refreshData();
  };

  const confirmedRegistrations = registrations.filter(
    (registration) => !registration.isWaitlisted,
  );
  const waitlistedRegistrations = registrations.filter(
    (registration) => registration.isWaitlisted,
  );

  if (loading && invitations.length === 0) return <div className="p-12 text-center animate-pulse text-slate-400">Loading Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 leading-none">Welcome, {user?.name}</h1>
          <p className="text-slate-500 mt-2 font-medium">Here's what's happening in your clubs.</p>
        </div>
      </div>

      {/* Invitations Section */}
      {invitations.length > 0 && (
        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100 border-4 border-white">
          <h3 className="text-lg font-black flex items-center gap-2">
            📩 New Club Invitations ({invitations.length})
          </h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations.map(inv => (
              <div key={inv.id} className="bg-white/10 p-4 rounded-xl border border-white/20 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white leading-tight">{inv.club.name}</div>
                  <div className="text-[10px] text-indigo-100 uppercase font-black tracking-widest mt-1">
                    Role: {inv.customRole || 'Member'} • {inv.club.category}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRespond(inv.id, 'ACCEPTED')} className="px-3 py-1.5 bg-white text-indigo-600 text-[10px] font-black rounded-lg hover:scale-105 transition-all">ACCEPT</button>
                  <button onClick={() => handleRespond(inv.id, 'REJECTED')} className="px-3 py-1.5 bg-indigo-500 text-white text-[10px] font-black rounded-lg hover:bg-indigo-400 transition-all">DECLINE</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {clubRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-black text-slate-900">
            Your Club Requests
          </h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {clubRequests.map((club) => (
              <div key={club.id} className="rounded-2xl border border-slate-100 p-4 bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900">{club.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{club.category}</div>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest">
                    {club.status}
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <div>VP: {club.vp?.name || 'Pending'}</div>
                  <div>Coordinator: {club.coordinator?.name || 'Pending'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates Section */}
      {registrations.some(r => r.certificateUrl) && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-xl shadow-amber-200/50 border-4 border-white">
          <h3 className="text-xl font-black flex items-center gap-2 italic">
            🏆 AI ACHIEVEMENTS UNLOCKED
          </h3>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {registrations.filter(r => r.certificateUrl).map(reg => (
              <div key={reg.id} className="bg-white/10 backdrop-blur-md p-5 rounded-[2rem] border border-white/30 hover:bg-white/20 transition-all group">
                <div className="flex justify-between items-start gap-4">
                   <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">🎓</div>
                   <div className="flex-grow space-y-1">
                      <h4 className="font-bold text-white line-clamp-1">{reg.event.title}</h4>
                      <p className="text-[10px] font-black text-amber-100 uppercase tracking-widest">{new Date(reg.event.date).toLocaleDateString()}</p>
                      <button 
                        onClick={() => window.open(reg.certificateUrl, '_blank')}
                        className="mt-4 w-full py-2 bg-white text-orange-600 text-[10px] font-black rounded-xl hover:shadow-lg transition-all"
                      >
                        VIEW CERTIFICATE
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {registrations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-black text-slate-900">Your Event Registrations</h3>
              <p className="text-sm text-slate-500 mt-1">
                Confirmed registrations and waitlist status in one place.
              </p>
            </div>
            <div className="flex gap-2 text-xs font-black uppercase tracking-widest">
              <span className="px-3 py-2 rounded-full bg-emerald-50 text-emerald-700">
                Confirmed {confirmedRegistrations.length}
              </span>
              <span className="px-3 py-2 rounded-full bg-amber-50 text-amber-700">
                Waitlist {waitlistedRegistrations.length}
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="rounded-2xl border border-slate-100 p-5 bg-slate-50 cursor-pointer hover:bg-white hover:shadow-lg transition-all"
                onClick={() => navigate(`/events/${registration.event.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900">{registration.event.title}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(registration.event.date).toLocaleString()} • {registration.event.venue}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      registration.isWaitlisted
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {registration.isWaitlisted ? 'Waitlisted' : 'Confirmed'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest">
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">
                    Registered {new Date(registration.registeredAt).toLocaleDateString()}
                  </span>
                  {registration.attended ? (
                    <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 font-bold">
                      Attendance Marked
                    </span>
                  ) : null}
                  {registration.qrCode ? (
                    <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                      QR Ready
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Board */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
            <h3 className="text-lg font-black text-slate-900">Assigned Tasks</h3>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase">To Do</span>
          </div>
          <div className="p-8">
            {tasks.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="text-4xl">🏝️</div>
                <p className="text-slate-400 font-medium text-sm italic">All caught up! No tasks assigned.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map(task => (
                  <div key={task.id} className="group p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider italic">Due: {new Date(task.deadline).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                           <span className={`w-2 h-2 rounded-full ${task.status === 'DONE' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></span>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.status}</span>
                        </div>
                        {task.status !== 'DONE' && (
                          <div className="flex gap-2 mt-2">
                            {task.status === 'TODO' && (
                              <button onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')} className="px-3 py-1 bg-white border border-slate-200 text-[9px] font-black rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all">START</button>
                            )}
                            <button onClick={() => updateTaskStatus(task.id, 'DONE')} className="px-3 py-1 bg-emerald-600 text-white text-[9px] font-black rounded-lg hover:scale-105 transition-all">FINISH</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Public Events */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <h3 className="text-lg font-black text-slate-900 mb-6">Explore Events</h3>
          <div className="space-y-6">
            {upcomingEvents.map(event => (
              <div key={event.id} className="relative group cursor-pointer" onClick={() => (window.location.href = `/events/${event.id}`)}>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all">
                    <span className="text-[10px] font-black text-indigo-600 group-hover:text-indigo-50 uppercase leading-none">
                      {new Date(event.date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-lg font-black text-indigo-900 group-hover:text-white leading-none mt-0.5">
                      {new Date(event.date).getDate()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{event.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{event.venue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
