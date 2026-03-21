import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  president: { name: string };
}

interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  description: string;
  club: { name: string };
}

export default function Home() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [clubsRes, eventsRes] = await Promise.all([
          fetch('http://localhost:3000/club'),
          fetch('http://localhost:3000/event/public')
        ]);
        
        if (clubsRes.ok) setClubs(await clubsRes.json());
        if (eventsRes.ok) setEvents(await eventsRes.json());
      } catch (e) {
        console.error('Failed to connect to backend', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, []);

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 flex flex-col items-center text-center">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-50 via-white to-sky-50" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 opacity-20 blur-[100px] rounded-full mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400 opacity-20 blur-[100px] rounded-full mix-blend-multiply" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Discover Your Campus <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Community
            </span>
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto font-medium">
            The ultimate ecosystem to explore clubs, organize immersive events, and shape your campus legacy.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <a href="#clubs" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 font-semibold text-lg">
              Explore Clubs
            </a>
            <Link to="/create-club" className="px-8 py-4 bg-white text-indigo-600 border border-indigo-100 rounded-xl shadow-sm hover:shadow-xl hover:bg-slate-50 hover:-translate-y-1 transition-all duration-300 font-semibold text-lg flex items-center justify-center gap-2">
              Start a Club <span>🚀</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32 pb-32">
        
        {/* Active Clubs Segment */}
        <section id="clubs" className="scroll-mt-24 space-y-10">
          <div className="flex justify-between items-end border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Active Clubs</h2>
              <p className="text-slate-500 mt-2">Join dynamic groups fueled by passion.</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : clubs.length === 0 ? (
            <p className="text-slate-500 py-12 text-center text-lg bg-slate-50 rounded-2xl border border-dashed border-slate-300">No active clubs found. Be the first to start one!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {clubs.map((club) => (
                <div key={club.id} className="group relative bg-white rounded-2xl border border-slate-200 p-8 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 transition-transform group-hover:scale-125 duration-500" />
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
                    {club.category}
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{club.name}</h3>
                  <p className="text-slate-600 line-clamp-3 mb-6">{club.description}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <p className="text-sm font-medium text-slate-500">
                      Led by <span className="text-slate-900">{club.president?.name || 'Students'}</span>
                    </p>
                    <Link to={club.id ? `/events?clubId=${club.id}` : "/login"} className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors">
                      View Events &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Events Segment */}
        <section id="events" className="scroll-mt-24 space-y-10">
          <div className="flex justify-between items-end border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Upcoming Public Events</h2>
              <p className="text-slate-500 mt-2">Engage with what's happening around campus.</p>
            </div>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {[1, 2].map((n) => (
                 <div key={n} className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
               ))}
             </div>
          ) : events.length === 0 ? (
            <p className="text-slate-500 py-12 text-center text-lg bg-slate-50 rounded-2xl border border-dashed border-slate-300">No upcoming public events. Check back later!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {events.map((event) => (
                <Link to={`/events/${event.id}`} key={event.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-purple-200 transition-all duration-300 flex flex-col sm:flex-row">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 sm:w-1/3 p-6 flex flex-col justify-center items-center text-white text-center">
                    <span className="text-4xl font-extrabold">{new Date(event.date).getDate()}</span>
                    <span className="text-lg font-medium opacity-90 uppercase tracking-wider">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div className="p-6 sm:w-2/3 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                      <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium ml-4 shrink-0 break-keep">
                        {event.club.name}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium mt-auto">
                      <span>📍</span> {event.venue}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
