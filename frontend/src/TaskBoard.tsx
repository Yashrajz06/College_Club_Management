import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useNavigate } from 'react-router-dom';

interface Member {
  id: string;
  user: { id: string, name: string; email: string };
  role: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline: string;
  assignee: { name: string };
}

export default function TaskBoard() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [clubId, setClubId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', assigneeId: '', deadline: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const init = async () => {
      try {
        const clubRes = await fetch('http://localhost:3000/club/my-club', { headers: { Authorization: `Bearer ${token}` } });
        const clubData = await clubRes.json();
        if (clubData?.id) {
          setClubId(clubData.id);
          const [memRes, taskRes] = await Promise.all([
            fetch(`http://localhost:3000/club/${clubData.id}/members`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`http://localhost:3000/task/club/${clubData.id}`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          if (memRes.ok) setMembers(await memRes.json());
          if (taskRes.ok) setTasks(await taskRes.json());
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user, token]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId) return;
    const res = await fetch('http://localhost:3000/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...newTask, clubId }),
    });
    if (res.ok) {
      alert('Task Assigned!');
      setShowCreate(false);
      // Refresh tasks
      const taskRes = await fetch(`http://localhost:3000/task/club/${clubId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (taskRes.ok) setTasks(await taskRes.json());
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`http://localhost:3000/task/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setTasks((prev: Task[]) => prev.map((t: Task) => t.id === id ? { ...t, status: status as any } : t));
  };

  if (loading) return <div className="p-12 text-center text-slate-400 animate-pulse font-black">SYNCING TASK ENGINE...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 leading-none italic">Work Delegation</h1>
          <p className="text-slate-500 mt-2 font-medium">Assign tasks and track execution across your squad.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-slate-200">
          + DELEGATE WORK
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((status: 'TODO' | 'IN_PROGRESS' | 'DONE') => (
          <div key={status} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 min-h-[500px] flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{status.replace('_', ' ')}</h3>
              <span className="w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[10px] font-black">{tasks.filter((t: Task) => t.status === status).length}</span>
            </div>
            
            {tasks.filter((t: Task) => t.status === status).map((task: Task) => (
              <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-grab active:cursor-grabbing group">
                <div className={`text-[9px] font-black uppercase tracking-widest mb-2 inline-block px-2 py-0.5 rounded-md ${task.priority === 'HIGH' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                  {task.priority || 'MEDIUM'}
                </div>
                <h4 className="font-bold text-slate-900 leading-tight">{task.title}</h4>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{task.description}</p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">@{task.assignee?.name}</span>
                  <div className="flex gap-1">
                    {status !== 'TODO' && <button onClick={() => updateStatus(task.id, 'TODO')} className="w-4 h-4 bg-slate-100 rounded text-slate-400 flex items-center justify-center">←</button>}
                    {status !== 'DONE' && <button onClick={() => updateStatus(task.id, status === 'TODO' ? 'IN_PROGRESS' : 'DONE')} className="w-4 h-4 bg-indigo-50 rounded text-indigo-600 flex items-center justify-center">→</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-10 border-4 border-white">
            <h2 className="text-2xl font-black text-slate-900 mb-8 italic">Delegate New Task</h2>
            <form onSubmit={handleCreateTask} className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Task Objective</label>
                <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-300 transition-all"
                  placeholder="e.g. Design Event Poster" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 h-24 resize-none transition-all"
                  placeholder="Add context..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}></textarea>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Assign to Member</label>
                <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none transition-all capitalize"
                  value={newTask.assigneeId} onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}>
                  <option value="">Select Assignee</option>
                  {members.map((m: Member) => <option key={m.id} value={m.user.id}>{m.user.name} ({m.role})</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Deadline Date</label>
                <input type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none transition-all"
                  value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
              </div>
              <div className="col-span-2 flex gap-4 mt-4">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-4 font-black text-slate-400 tracking-widest hover:text-slate-600 transition-colors uppercase">Abuse/Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all uppercase tracking-widest text-sm">COMMENCE TASK</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
