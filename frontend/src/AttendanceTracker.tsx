import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { apiFetch, apiRequest } from './lib/api';
import type { RootState } from './store';

interface EventOption {
  id: string;
  title: string;
  date: string;
  venue: string;
  status: string;
  isPublic: boolean;
}

interface Registration {
  id: string;
  attended: boolean;
  isWaitlisted: boolean;
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

export default function AttendanceTracker({ eventId }: { eventId?: string }) {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(eventId || '');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [concluding, setConcluding] = useState(false);

  useEffect(() => {
    if (!user || !['PRESIDENT', 'VP', 'COORDINATOR', 'ADMIN'].includes(user.role)) {
      navigate('/login');
      return;
    }

    const loadEvents = async () => {
      setLoading(true);
      try {
        if (user.role === 'COORDINATOR') {
          const pending = await apiFetch('/event/pending-approvals');
          const normalized = (pending ?? []).map((item: any) => ({
            id: item.id,
            title: item.title,
            date: item.date,
            venue: item.venue,
            status: item.status,
            isPublic: item.isPublic,
          }));
          setEvents(normalized);
          setSelectedEventId((current) => current || normalized[0]?.id || '');
          return;
        }

        const myClub = await apiFetch('/club/my-club');
        if (!myClub?.id) {
          setEvents([]);
          setSelectedEventId('');
          return;
        }
        const eventList = await apiFetch(`/event/club/${myClub.id}`);
        setEvents(eventList ?? []);
        setSelectedEventId((current) => current || eventId || eventList?.[0]?.id || '');
      } catch (error) {
        console.error(error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [eventId, navigate, user]);

  useEffect(() => {
    const fetchRegistrations = async () => {
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

    fetchRegistrations();
  }, [selectedEventId]);

  const toggleAttendance = async (registration: Registration) => {
    if (!selectedEventId) return;

    setSaving(registration.id);
    try {
      await apiFetch(`/event/${selectedEventId}/attendance`, {
        method: 'PATCH',
        body: JSON.stringify({
          registrationId: registration.id,
          attended: !registration.attended,
        }),
      });
      setRegistrations((current) =>
        current.map((item) =>
          item.id === registration.id
            ? { ...item, attended: !item.attended }
            : item,
        ),
      );
    } finally {
      setSaving(null);
    }
  };

  const handleConclude = async () => {
    if (!selectedEventId) return;
    const confirmed = window.confirm(
      'Conclude this event and lock its operational state?',
    );
    if (!confirmed) return;

    setConcluding(true);
    try {
      await apiFetch(`/event/${selectedEventId}/conclude`, { method: 'PATCH' });
      setEvents((current) =>
        current.map((event) =>
          event.id === selectedEventId
            ? { ...event, status: 'CONCLUDED' }
            : event,
        ),
      );
      alert('Event concluded successfully.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to conclude event');
    } finally {
      setConcluding(false);
    }
  };

  const handleQRScan = async () => {
    if (!qrInput) return;
    setScanning(true);
    try {
      await apiFetch('/event/attendance/qr', {
        method: 'POST',
        body: JSON.stringify({ qrCode: qrInput }),
      });
      setQrInput('');
      const data = await apiFetch(`/event/${selectedEventId}/registrations`);
      setRegistrations(data ?? []);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Invalid QR code');
    } finally {
      setScanning(false);
    }
  };

  const downloadReport = async () => {
    if (!selectedEventId) return;
    setDownloading(true);
    try {
      const response = await apiRequest(`/report/event/${selectedEventId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `event_${selectedEventId}_report.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const selectedEvent = events.find((item) => item.id === selectedEventId) || null;
  const waitlisted = registrations.filter((registration) => registration.isWaitlisted);
  const activeRegistrations = registrations.filter(
    (registration) => !registration.isWaitlisted,
  );
  const memberRegistrations = activeRegistrations.filter(
    (registration) => registration.user.role !== 'GUEST',
  );
  const guestRegistrations = activeRegistrations.filter(
    (registration) => registration.user.role === 'GUEST',
  );

  const stats = useMemo(
    () => ({
      total: activeRegistrations.length,
      members: memberRegistrations.length,
      guests: guestRegistrations.length,
      present: activeRegistrations.filter((registration) => registration.attended).length,
      waitlisted: waitlisted.length,
    }),
    [activeRegistrations, guestRegistrations.length, memberRegistrations.length, waitlisted.length],
  );

  if (loading) {
    return (
      <div className="p-12 text-center animate-pulse text-slate-400">
        Loading attendance desk...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Attendance Desk</h1>
        <p className="text-slate-500 mt-1">
          Track members and guests separately, scan QR tokens, and generate the final report.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Select Event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        >
          <option value="">Choose an event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} • {new Date(event.date).toLocaleDateString()} • {event.status}
            </option>
          ))}
        </select>
        {!events.length ? (
          <p className="text-sm text-slate-500">
            No events available for attendance tracking yet.
          </p>
        ) : null}
      </div>

      {selectedEvent ? (
        <>
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-100">
                Event Overview
              </div>
              <h2 className="text-2xl font-black">{selectedEvent.title}</h2>
              <div className="text-sm text-indigo-100">
                {new Date(selectedEvent.date).toLocaleString()} • {selectedEvent.venue}
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest">
                <span className="px-2 py-1 rounded-full bg-white/10 font-bold">
                  {selectedEvent.status}
                </span>
                {selectedEvent.isPublic ? (
                  <span className="px-2 py-1 rounded-full bg-emerald-500/20 font-bold">
                    Public
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-100">
                QR Attendance
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter or scan QR token"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-indigo-200"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                />
                <button
                  onClick={handleQRScan}
                  disabled={scanning || !selectedEventId}
                  className="bg-white text-indigo-600 px-5 py-3 rounded-xl text-sm font-black hover:scale-105 transition-all disabled:opacity-60"
                >
                  {scanning ? '...' : 'Verify'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {[
              { label: 'Active', value: stats.total, color: 'text-blue-600' },
              { label: 'Members', value: stats.members, color: 'text-indigo-600' },
              { label: 'Guests', value: stats.guests, color: 'text-sky-600' },
              { label: 'Present', value: stats.present, color: 'text-emerald-600' },
              { label: 'Waitlist', value: stats.waitlisted, color: 'text-amber-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
                <div className={`text-4xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Member Attendance</h2>
              <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                {memberRegistrations.length === 0 ? (
                  <p className="text-sm text-slate-500">No member registrations yet.</p>
                ) : (
                  memberRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                        registration.attended
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {registration.user.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {registration.user.email}
                          {registration.user.studentId ? ` • ${registration.user.studentId}` : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAttendance(registration)}
                        disabled={saving === registration.id}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                          registration.attended
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {saving === registration.id
                          ? '...'
                          : registration.attended
                            ? 'Present'
                            : 'Mark Present'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Guest Attendance</h2>
              <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                {guestRegistrations.length === 0 ? (
                  <p className="text-sm text-slate-500">No guest registrations yet.</p>
                ) : (
                  guestRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                        registration.attended
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
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
                      </div>
                      <button
                        onClick={() => toggleAttendance(registration)}
                        disabled={saving === registration.id}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                          registration.attended
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {saving === registration.id
                          ? '...'
                          : registration.attended
                            ? 'Present'
                            : 'Mark Present'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {waitlisted.length > 0 ? (
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Waitlist</h2>
              <div className="space-y-2">
                {waitlisted.map((registration, index) => (
                  <div key={registration.id} className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="font-black text-amber-500 text-lg">#{index + 1}</span>
                    <div>
                      <div className="font-semibold text-slate-900">{registration.user.name}</div>
                      <div className="text-xs text-slate-500">{registration.user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              onClick={downloadReport}
              disabled={downloading || !selectedEventId}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {downloading ? 'Generating...' : 'Download PDF Report'}
            </button>
            {(user?.role === 'PRESIDENT' || user?.role === 'VP') && (
              <button
                onClick={handleConclude}
                disabled={concluding || selectedEvent.status === 'CONCLUDED'}
                className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl shadow hover:shadow-lg transition-all disabled:opacity-60"
              >
                {selectedEvent.status === 'CONCLUDED'
                  ? 'Already Concluded'
                  : concluding
                    ? 'Concluding...'
                    : 'Conclude Event'}
              </button>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
