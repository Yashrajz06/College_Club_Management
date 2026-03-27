import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { connectPeraWallet, disconnectPeraWallet } from './lib/pera';
import { useNavigate } from 'react-router-dom';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export default function Profile() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', department: '', year: '' });
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${backendUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProfile(data);
      setForm({ name: data.name || '', department: data.department || '', year: String(data.year || '') });
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          department: form.department,
          year: form.year ? parseInt(form.year) : undefined,
        }),
      });
      const data = await res.json();
      setProfile(data);
      setEditing(false);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setWalletLoading(true);
    try {
      const accounts = await connectPeraWallet();
      if (accounts && accounts.length > 0) {
        const walletAddress = accounts[0];
        // Notify backend
        await fetch(`${backendUrl}/auth/wallet/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ walletAddress }),
        });
        fetchProfile();
      }
    } catch (err) {
      console.error('Wallet connect failed', err);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleDisconnectWallet = async () => {
    setWalletLoading(true);
    try {
      await disconnectPeraWallet();
      await fetch(`${backendUrl}/auth/wallet/disconnect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProfile();
    } catch (err) {
      console.error('Wallet disconnect failed', err);
    } finally {
      setWalletLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-slate-400 text-lg">Loading profile...</div>
      </div>
    );
  }

  const roleBadgeColor: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700',
    COORDINATOR: 'bg-purple-100 text-purple-700',
    PRESIDENT: 'bg-blue-100 text-blue-700',
    VP: 'bg-indigo-100 text-indigo-700',
    MEMBER: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{profile.name}</h2>
            <p className="text-sm text-slate-500">{profile.email}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${roleBadgeColor[profile.role] || 'bg-slate-100 text-slate-600'}`}>
            {profile.role}
          </span>
        </div>

        {editing ? (
          <div className="space-y-3">
            <input
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Full Name"
            />
            <input
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={form.department}
              onChange={e => setForm({ ...form, department: e.target.value })}
              placeholder="Department"
            />
            <input
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={form.year}
              onChange={e => setForm({ ...form, year: e.target.value })}
              placeholder="Year"
              type="number"
            />
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-400 text-xs uppercase tracking-wider">Student ID</span>
                <p className="font-medium text-slate-700">{profile.studentId || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase tracking-wider">Department</span>
                <p className="font-medium text-slate-700">{profile.department || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase tracking-wider">Year</span>
                <p className="font-medium text-slate-700">{profile.year || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase tracking-wider">Verified</span>
                <p className="font-medium text-slate-700">{profile.isVerified ? '✅ Yes' : '❌ No'}</p>
              </div>
            </div>
            <button onClick={() => setEditing(true)}
              className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Wallet Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <span>🔗</span> Pera Wallet
        </h3>

        {profile.walletAddress ? (
          <div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-3">
              <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold mb-1">Connected Address</p>
              <p className="text-sm font-mono text-emerald-800 break-all">{profile.walletAddress}</p>
            </div>
            <button onClick={handleDisconnectWallet} disabled={walletLoading}
              className="px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 disabled:opacity-50 transition-colors">
              {walletLoading ? 'Disconnecting...' : 'Disconnect Wallet'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-500 mb-3">
              Connect your Pera Wallet to access Treasury, Governance, and earn Entry Tokens.
            </p>
            <button onClick={handleConnectWallet} disabled={walletLoading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg hover:shadow-lg disabled:opacity-50 transition-all">
              {walletLoading ? 'Connecting...' : '🔐 Connect Pera Wallet'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
