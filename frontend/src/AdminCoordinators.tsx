import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useNavigate, Link } from 'react-router-dom';
import { X, Mail, CheckCircle, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiFetch } from './lib/api';

interface Coordinator {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  coordinatedClubs: { id: string; name: string }[];
}

export default function AdminCoordinators() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchCoordinators();
  }, [user, navigate]);

  const fetchCoordinators = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/coordinators');
      setCoordinators(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);

    try {
      await apiFetch('/admin/invite-coordinator', {
        method: 'POST',
        body: JSON.stringify({ name: inviteName, email: inviteEmail }),
      });
      toast.success(`Invite sent to ${inviteEmail}`);
      setShowModal(false);
      setInviteName('');
      setInviteEmail('');
      fetchCoordinators();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResend = async (userId: string, email: string) => {
    try {
      await apiFetch(`/admin/resend-invite/${userId}`, {
        method: 'POST',
      });
      toast.info(`Resent invite to ${email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error');
    }
  };

  if (loading && coordinators.length === 0) {
    return <div className="p-12 text-center animate-pulse text-slate-400">Loading Coordinators...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              to="/admin" 
              className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← Back to Admin
            </Link>
          </div>
          <h1 className="text-3xl font-black text-slate-900">Faculty Coordinators</h1>
          <p className="text-slate-500 mt-1">Manage accounts and platform access for faculty members.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Coordinator
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Coordinator</th>
                <th className="px-6 py-4">Assigned Clubs</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coordinators.map(coord => (
                <tr key={coord.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{coord.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" />
                      {coord.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {coord.coordinatedClubs.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {coord.coordinatedClubs.map(club => (
                          <span key={club.id} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold max-w-[150px] truncate">
                            {club.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {coord.isVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-700">
                        <AlertCircle className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!coord.isVerified && (
                      <button
                        onClick={() => handleResend(coord.id, coord.email)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Resend Invite
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {coordinators.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No faculty coordinators found. Click "Add Coordinator" to invite one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Coordinator Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Invite Faculty Coordinator</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-5">
              {inviteError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {inviteError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. Dr. Ramesh Sharma"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="ramesh@college.edu.in"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className={`w-full py-3 font-bold text-white rounded-xl shadow-lg transition-all ${
                    inviteLoading 
                      ? 'bg-indigo-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-indigo-500/30'
                  }`}
                >
                  {inviteLoading ? 'Sending Invitation...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
