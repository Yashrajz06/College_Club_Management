import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useNavigate } from 'react-router-dom';

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
  event: { title: string; date: string };
}

export default function MemberDashboard() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
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
      const [invRes, taskRes, eventRes, regRes] = await Promise.all([
        fetch('http://localhost:3000/club/my-invitations', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3000/task/my-tasks', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3000/event/public', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3000/event/my-registrations', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (invRes.ok) setInvitations(await invRes.json());
      if (taskRes.ok) setTasks(await taskRes.json());
      if (eventRes.ok) setUpcomingEvents(await eventRes.json());
      if (regRes && regRes.ok) setRegistrations(await regRes.json());
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    const res = await fetch(`http://localhost:3000/club/invitation/${id}/respond`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      alert(`Invitation ${status.toLowerCase()}!`);
      refreshData();
    }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    const res = await fetch(`http://localhost:3000/task/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) refreshData();
  };

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
