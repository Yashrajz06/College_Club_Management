import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useNavigate } from 'react-router-dom';

interface Registration {
  id: string;
  attended: boolean;
  isWaitlisted: boolean;
  registeredAt: string;
  user: { id: string; name: string; email: string; role: string; studentId?: string };
}

export default function AttendanceTracker({ eventId }: { eventId?: string }) {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [eventIdInput, setEventIdInput] = useState(eventId || '');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [concluded, setConcluded] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!user || !['PRESIDENT', 'VP', 'COORDINATOR', 'ADMIN'].includes(user.role)) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchRegistrations = async () => {
    if (!eventIdInput) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/event/${eventIdInput}/registrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRegistrations(await res.json());
      else alert('Could not load registrations. Check the Event ID.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = async (reg: Registration) => {
    setSaving(reg.id);
    try {
      await fetch(`http://localhost:3000/event/${eventIdInput}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ registrationId: reg.id, attended: !reg.attended }),
      });
      setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, attended: !r.attended } : r));
    } finally {
      setSaving(null);
    }
  };

  const handleConclude = async () => {
    if (!window.confirm('Conclude this event? This action is permanent.')) return;
    await fetch(`http://localhost:3000/event/${eventIdInput}/conclude`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setConcluded(true);
    alert('Event marked as Concluded!');
  };

  const handleQRScan = async () => {
    if (!qrInput) return;
    setScanning(true);
    try {
      const res = await fetch(`http://localhost:3000/event/attendance/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ qrCode: qrInput })
      });
      if (res.ok) {
        alert('Attendance marked via QR!');
        setQrInput('');
        fetchRegistrations();
      } else {
        const err = await res.json();
        alert(err.message || 'Invalid QR Code');
      }
    } finally {
      setScanning(false);
    }
  };

  const members = registrations.filter(r => !r.isWaitlisted);
  const waitlist = registrations.filter(r => r.isWaitlisted);
  const presentCount = members.filter(r => r.attended).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Attendance Tracker</h1>
        <p className="text-slate-500 mt-1">Mark attendees for an event and conclude it when done.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Event ID</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={eventIdInput}
            onChange={e => setEventIdInput(e.target.value)}
            className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="Paste the Event UUID here..."
          />
          <button onClick={fetchRegistrations} disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
          </button>
        </div>
      </div>

      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0 w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">📷</div>
        <div className="flex-grow space-y-1">
          <h3 className="font-black text-lg">QR Scan Simulator</h3>
          <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider">Production Attendance Verification</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Scan/Enter QR Token..." 
            className="flex-grow md:w-64 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm outline-none placeholder:text-indigo-200"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
          />
          <button 
            onClick={handleQRScan}
            disabled={scanning}
            className="bg-white text-indigo-600 px-6 py-2 rounded-xl text-xs font-black hover:scale-105 transition-all">
            {scanning ? '...' : 'VERIFY'}
          </button>
        </div>
      </div>

      {registrations.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-5">
            {[
              { label: 'Total Registered', value: members.length, color: 'text-blue-600' },
              { label: 'Present', value: presentCount, color: 'text-emerald-600' },
              { label: 'On Waitlist', value: waitlist.length, color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
                <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-slate-500 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Registered */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Registered Attendees</h2>
            <div className="space-y-2">
              {members.map(reg => (
                <div key={reg.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${reg.attended ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div>
                    <div className="font-semibold text-slate-900">{reg.user.name}</div>
                    <div className="text-xs text-slate-500">{reg.user.email} {reg.user.studentId ? `· ${reg.user.studentId}` : ''} · <span className="capitalize">{reg.user.role.toLowerCase()}</span></div>
                  </div>
                  <button
                    onClick={() => toggleAttendance(reg)}
                    disabled={saving === reg.id}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${reg.attended ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                    {saving === reg.id ? '...' : reg.attended ? '✓ Present' : 'Mark Present'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Waitlist */}
          {waitlist.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Waitlist</h2>
              <div className="space-y-2">
                {waitlist.map((reg, i) => (
                  <div key={reg.id} className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="font-black text-amber-500 text-lg">#{i + 1}</span>
                    <div>
                      <div className="font-semibold text-slate-900">{reg.user.name}</div>
                      <div className="text-xs text-slate-500">{reg.user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conclude & Report */}
          <div className="flex justify-end gap-3">
            <button
              onClick={async () => {
                const res = await fetch(`http://localhost:3000/report/event/${eventIdInput}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `event_${eventIdInput}_report.pdf`;
                  a.click();
                } else {
                  alert('Failed to generate report.');
                }
              }}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2">
              📄 Download PDF Report
            </button>
            {!concluded && (user?.role === 'PRESIDENT' || user?.role === 'VP') && (
              <button onClick={handleConclude}
                className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl shadow hover:shadow-lg transition-all">
                Conclude Event
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
