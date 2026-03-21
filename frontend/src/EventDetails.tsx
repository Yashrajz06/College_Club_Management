import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';

interface EventData {
  id: string; title: string; description: string; date: string; venue: string;
  capacity: number; status: string; club: { id: string, name: string; description: string };
  registrations: { id: string, userId: string, qrCode?: string, certificateUrl?: string }[];
}

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [guestForm, setGuestForm] = useState({ name: '', email: '', phone: '', institution: '' });
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    // Fetch all public events to find the current one
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://localhost:3000/event/${id}`);
        if (res.ok) {
          const data = await res.json();
          setEvent(data);
          // Check if current user is registered
          if (user) {
            const registrationsRes = await fetch(`http://localhost:3000/event/${id}/registrations`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (registrationsRes.ok) {
              const regs = await registrationsRes.json();
              const myReg = regs.find((r: any) => r.user.id === user.id);
              if (myReg) {
                setRegistered(true);
                setEvent(prev => prev ? { ...prev, registrations: regs } : null);
              }
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, user, token]);

  const handleMemberRegister = async () => {
    if (!user) { navigate('/login'); return; }
    setRegistering(true);
    try {
      const res = await fetch(`http://localhost:3000/event/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'MEMBER' }),
      });
      if (res.ok) {
        setRegistered(true);
        alert('Successfully registered for the event!');
      } else {
        const d = await res.json();
        alert(d.message || 'Registration failed');
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleGuestRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    try {
      // Guest registration is a different backend route (no auth required)
      const res = await fetch(`http://localhost:3000/event/${id}/register-guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'GUEST', ...guestForm }),
      });
      if (res.ok) {
        setShowGuestModal(false);
        setRegistered(true);
        alert('Registered as guest! Check your email for confirmation details.');
      } else {
        const d = await res.json();
        alert(d.message || 'Guest registration failed');
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
    </div>
  );

  if (!event) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <p className="text-2xl font-bold text-slate-700">Event not found.</p>
      <button onClick={() => navigate('/')} className="mt-4 text-blue-600 underline">Go Back Home</button>
    </div>
  );

  const spotsLeft = event.capacity - (event.registrations?.length ?? 0);
  const isFull = spotsLeft <= 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-10 text-white shadow-xl">
        <span className="text-sm font-semibold uppercase tracking-widest opacity-75">{event.club?.name}</span>
        <h1 className="text-4xl font-extrabold mt-2 leading-tight">{event.title}</h1>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="opacity-70 mb-1">📅 Date & Time</div>
            <div className="font-semibold">{new Date(event.date).toLocaleString()}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="opacity-70 mb-1">📍 Venue</div>
            <div className="font-semibold">{event.venue}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="opacity-70 mb-1">🎟 Capacity</div>
            <div className="font-semibold">{isFull ? <span className="text-rose-300">Full — Waitlist Open</span> : `${spotsLeft} spots left`}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* About */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">About This Event</h2>
          <p className="text-slate-600 leading-relaxed whitespace-pre-line">{event.description}</p>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-2">Organized by</h3>
            <p className="text-slate-900 font-bold">{event.club?.name}</p>
            <p className="text-slate-500 text-sm mt-1">{event.club?.description}</p>
          </div>
        </div>

        {/* Registration Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4 self-start sticky top-24">
          <h2 className="text-lg font-bold text-slate-900">Register for Event</h2>
          {registered ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 text-center font-semibold">
                ✅ You're registered!
              </div>
              {event.registrations?.find(r => r.userId === user?.id)?.certificateUrl && (
                <button
                  onClick={() => window.open(event.registrations?.find(r => r.userId === user?.id)?.certificateUrl, '_blank')}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-2xl shadow-xl shadow-amber-200 hover:scale-105 transition-all text-sm italic"
                >
                  🏆 DOWNLOAD AI ACHIEVEMENT CERTIFICATE
                </button>
              )}
              {event.registrations?.find(r => r.userId === user?.id)?.qrCode && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center shadow-inner">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Entry Token</div>
                  <div className="text-lg font-black text-slate-900 break-all font-mono">
                    {event.registrations.find(r => r.userId === user?.id)?.qrCode}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3 font-medium">Show this at the venue to mark attendance.</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {user ? (
                <button onClick={handleMemberRegister} disabled={registering}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all ${registering ? 'bg-blue-300' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:-translate-y-0.5'}`}>
                  {registering ? 'Registering...' : isFull ? 'Join Waitlist' : '🎟 Register as Member'}
                </button>
              ) : (
                <button onClick={() => navigate('/login')}
                  className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg transition-all">
                  Sign In to Register
                </button>
              )}
              <div className="relative flex items-center gap-2">
                <div className="flex-grow border-t border-slate-200" />
                <span className="text-xs text-slate-400">OR</span>
                <div className="flex-grow border-t border-slate-200" />
              </div>
              <button onClick={() => setShowGuestModal(true)}
                className="w-full py-3 rounded-xl font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all">
                Register as Guest
              </button>
              
              {user && ['ADMIN', 'COORDINATOR', 'PRESIDENT', 'VP'].includes(user.role) && (
                <button
                  onClick={async () => {
                    const res = await fetch(`http://localhost:3000/report/event/${id}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `event_report.pdf`;
                      a.click();
                    }
                  }}
                  className="w-full py-3 rounded-xl font-bold text-indigo-600 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 transition-all mt-2">
                  📄 Download Report
                </button>
              )}
            </>
          )}
          <p className="text-xs text-slate-400 text-center mt-2">
            {event.registrations?.length ?? 0} / {event.capacity} registered
          </p>
        </div>
      </div>

      {/* Guest Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Guest Registration</h2>
            <form onSubmit={handleGuestRegister} className="space-y-4">
              {(['name', 'email', 'phone', 'institution'] as const).map(field => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 capitalize">{field}</label>
                  <input type={field === 'email' ? 'email' : 'text'} required={field !== 'institution'}
                    value={guestForm[field]}
                    onChange={e => setGuestForm(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder={field === 'institution' ? 'Your college/school (optional)' : `Your ${field}`} />
                </div>
              ))}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowGuestModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={registering}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-60">
                  {registering ? 'Registering...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
