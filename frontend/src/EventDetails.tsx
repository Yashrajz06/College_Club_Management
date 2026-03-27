import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiFetch, apiRequest } from './lib/api';
import type { RootState } from './store';

interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  capacity: number;
  status: string;
  club: { id: string; name: string; description: string };
  registrations: {
    id: string;
    userId: string;
    qrCode?: string;
    certificateUrl?: string;
  }[];
  proposals?: { id: string; title: string; status: string; createdAt: string }[];
}

interface MyRegistration {
  id: string;
  qrCode?: string;
  certificateUrl?: string;
  isWaitlisted: boolean;
  attended: boolean;
  registeredAt: string;
  event: { id: string; title: string; date: string; venue: string; capacity: number };
}

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.auth);
  const currentCollegeId = useSelector(
    (state: RootState) => state.college.currentCollegeId,
  );
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [myRegistration, setMyRegistration] = useState<MyRegistration | null>(null);
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    institution: '',
  });
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventData = await apiFetch(`/event/${id}`);
        setEvent(eventData);

        if (user) {
          try {
            const registrations = await apiFetch('/event/my-registrations');
            const myReg = (registrations ?? []).find(
              (registration: MyRegistration) => registration.event.id === id,
            );
            if (myReg) {
              setRegistered(true);
              setMyRegistration(myReg);
            }
          } catch {
            // Ignore current-user registration lookup failures.
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [currentCollegeId, id, user]);

  const handleMemberRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setRegistering(true);
    try {
      const registration = await apiFetch(`/event/${id}/register`, { method: 'POST' });
      setRegistered(true);
      setMyRegistration({
        ...registration,
        event: {
          id: event?.id || id || '',
          title: event?.title || '',
          date: event?.date || '',
          venue: event?.venue || '',
          capacity: event?.capacity || 0,
        },
      });
      alert(
        registration?.isWaitlisted
          ? 'Event is full. You were added to the waitlist.'
          : 'Successfully registered for the event.',
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleGuestRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const registration = await apiFetch(`/event/${id}/register-guest`, {
        method: 'POST',
        body: JSON.stringify(guestForm),
      });
      setShowGuestModal(false);
      setRegistered(true);
      setMyRegistration({
        ...registration,
        event: {
          id: event?.id || id || '',
          title: event?.title || '',
          date: event?.date || '',
          venue: event?.venue || '',
          capacity: event?.capacity || 0,
        },
      });
      alert(
        registration?.isWaitlisted
          ? 'Event is full. You were added to the guest waitlist.'
          : 'Registered as guest. Check your email for confirmation details.',
      );
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Guest registration failed',
      );
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-2xl font-bold text-slate-700">Event not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 underline">
          Go Back Home
        </button>
      </div>
    );
  }

  const spotsLeft = Math.max(event.capacity - (event.registrations?.length ?? 0), 0);
  const isFull = spotsLeft <= 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="bg-gradient-to-br from-sky-600 to-indigo-700 rounded-3xl p-10 text-white shadow-xl">
        <span className="text-sm font-semibold uppercase tracking-widest opacity-75">
          {event.club?.name}
        </span>
        <h1 className="text-4xl font-extrabold mt-2 leading-tight">
          {event.title}
        </h1>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="opacity-70 mb-1">Date & Time</div>
            <div className="font-semibold">
              {new Date(event.date).toLocaleString()}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="opacity-70 mb-1">Venue</div>
            <div className="font-semibold">{event.venue}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="opacity-70 mb-1">Capacity</div>
            <div className="font-semibold">
              {isFull ? 'Full - waitlist open' : `${spotsLeft} spots left`}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              About This Event
            </h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-2">Organized by</h3>
            <p className="text-slate-900 font-bold">{event.club?.name}</p>
            <p className="text-slate-500 text-sm mt-1">{event.club?.description}</p>
          </div>

          {event.proposals?.length ? (
            <div className="pt-6 border-t border-slate-100">
              <h3 className="font-semibold text-slate-700 mb-3">
                Governance Activity
              </h3>
              <div className="space-y-3">
                {event.proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="rounded-xl border border-slate-100 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-900">
                        {proposal.title}
                      </div>
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                        {proposal.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Created {new Date(proposal.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4 self-start sticky top-24">
          <h2 className="text-lg font-bold text-slate-900">Register for Event</h2>
          {registered ? (
            <div className="space-y-4">
              <div
                className={`rounded-xl p-4 text-center font-semibold border ${
                  myRegistration?.isWaitlisted
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                {myRegistration?.isWaitlisted
                  ? 'You are on the waitlist. We will notify you if a slot opens.'
                  : 'You are confirmed for this event.'}
              </div>
              {myRegistration ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Registered on {new Date(myRegistration.registeredAt).toLocaleString()}
                </div>
              ) : null}
              {myRegistration?.certificateUrl ? (
                <button
                  onClick={() => window.open(myRegistration.certificateUrl, '_blank')}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-2xl shadow-xl shadow-amber-200 hover:scale-105 transition-all text-sm"
                >
                  Download Certificate
                </button>
              ) : null}
              {myRegistration?.qrCode ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center shadow-inner">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Your Entry QR
                  </div>
                  <div className="text-lg font-black text-slate-900 break-all font-mono">
                    {myRegistration.qrCode}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {user ? (
                <button
                  onClick={handleMemberRegister}
                  disabled={registering}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                    registering
                      ? 'bg-blue-300'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  {registering ? 'Registering...' : isFull ? 'Join Waitlist' : 'Register as Member'}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg transition-all"
                >
                  Sign In to Register
                </button>
              )}
              <div className="relative flex items-center gap-2">
                <div className="flex-grow border-t border-slate-200" />
                <span className="text-xs text-slate-400">OR</span>
                <div className="flex-grow border-t border-slate-200" />
              </div>
              <button
                onClick={() => setShowGuestModal(true)}
                className="w-full py-3 rounded-xl font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Register as Guest
              </button>

              {user &&
              ['ADMIN', 'COORDINATOR', 'PRESIDENT', 'VP'].includes(user.role) ? (
                <button
                  onClick={async () => {
                    try {
                      const response = await apiRequest(`/report/event/${id}`);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'event_report.pdf';
                      link.click();
                    } catch (error) {
                      alert(
                        error instanceof Error
                          ? error.message
                          : 'Failed to download report',
                      );
                    }
                  }}
                  className="w-full py-3 rounded-xl font-bold text-indigo-600 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 transition-all mt-2"
                >
                  Download Report
                </button>
              ) : null}
            </>
          )}
          <p className="text-xs text-slate-400 text-center mt-2">
            {event.registrations?.length ?? 0} / {event.capacity} registered
          </p>
          <p className="text-xs text-slate-400 text-center">
            Once capacity fills up, new registrations automatically join the waitlist.
          </p>
        </div>
      </div>

      {showGuestModal ? (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Guest Registration
            </h2>
            <form onSubmit={handleGuestRegister} className="space-y-4">
              {(['name', 'email', 'phone', 'institution'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 capitalize">
                    {field}
                  </label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    required={field !== 'institution'}
                    value={guestForm[field]}
                    onChange={(e) =>
                      setGuestForm((current) => ({
                        ...current,
                        [field]: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder={
                      field === 'institution'
                        ? 'Your college or school (optional)'
                        : `Your ${field}`
                    }
                  />
                </div>
              ))}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowGuestModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-60"
                >
                  {registering ? 'Registering...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
