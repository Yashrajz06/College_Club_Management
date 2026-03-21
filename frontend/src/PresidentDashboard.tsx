import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useNavigate } from 'react-router-dom';

export default function PresidentDashboard() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [clubId, setClubId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [customRole, setCustomRole] = useState('');

  useEffect(() => {
    if (!user || !['PRESIDENT', 'VP'].includes(user.role)) {
      navigate('/');
      return;
    }
    fetch('http://localhost:3000/club/my-club', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setClubId(data?.id || null));
  }, [user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId) return;
    try {
      const res = await fetch(`http://localhost:3000/club/${clubId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ emailOrId: inviteEmail, customRole })
      });
      if (res.ok) {
        alert('Invitation sent successfully!');
        setInviteEmail('');
        setCustomRole('');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to send invitation');
      }
    } catch (e) {
      alert('Error connecting to server');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-none">Club Command</h2>
          <p className="text-slate-500 mt-2 font-medium italic">Growing your community starting today.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/attendance')} className="px-6 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-100 transition-all">Attendance Hub</button>
          <button onClick={() => navigate('/ledger')} className="px-6 py-3 bg-emerald-50 text-emerald-600 font-bold rounded-2xl hover:bg-emerald-100 transition-all">Finance Ledger</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900">Invite New Members</h3>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg font-black text-slate-400 uppercase tracking-widest">Growth Engine</span>
          </div>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleInvite}>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Member Email or ID</label>
              <input 
                type="text" 
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                placeholder="search by name/id..."
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Designation (Optional)</label>
              <input 
                type="text" 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                placeholder="e.g. Media Head"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
              />
            </div>
            <button className="md:col-span-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm rounded-2xl hover:shadow-xl hover:shadow-blue-500/20 active:scale-95 transition-all">
              DISPATCH INVITATION
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl overflow-hidden relative group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
             <h3 className="text-xl font-black italic relative z-10">Production Standard</h3>
             <p className="text-slate-400 text-xs mt-3 leading-relaxed relative z-10">
               Invitations are logged in the student's personal dashboard. Once accepted, their role updates automatically.
             </p>
          <button onClick={() => navigate('/taskboard')} className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-xs transition-all relative z-10">OPEN TASK BOARD</button>
          </div>
        </div>
      </div>
    </div>
  );
}
