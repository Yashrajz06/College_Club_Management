import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiFetch } from './lib/api';
import type { RootState } from './store';

interface EventOption {
  id: string;
  title: string;
  date: string;
  venue: string;
  description?: string;
  category?: string;
}

interface PosterResponse {
  imageUrl: string;
  prompt: string;
  source: string;
}

interface AssistantContext {
  source: string;
  dashboard: {
    clubCount: number;
    eventCount: number;
    sponsorCount: number;
    pendingEventCount: number;
  };
  clubs: Array<{ id: string; name: string; status: string }>;
  recentEvents: Array<{ id: string; title: string; status: string; venue: string }>;
  recentAnalytics: Array<{ entityType: string; action: string; createdAt: string }>;
  treasuryContext?: Array<{ id: string; title: string; amount: number; status: string }>;
  attendanceContext?: Array<{ eventId: string; _count: { id: number }; _sum: { attended: number } }>;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedAction?: {
    type: 'CREATE_PROPOSAL' | 'MINT_TOKEN';
    payload: any;
  };
}

interface PosterFormState {
  posterTitle: string;
  subtitle: string;
  registrationBanner: string;
  aboutText: string;
  prizePool: string;
  dayPrizePool: string;
  registrationFee: string;
  teamSize: string;
  eligibility: string;
  dateLabel: string;
  timeLabel: string;
  venueLabel: string;
  website: string;
  coordinatorName: string;
  coordinatorPhone: string;
  studentCoordinator: string;
  studentPhone: string;
  sponsors: string;
  benefits: string;
}

export default function AIStudio() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'chat' | 'creative'>('chat');
  const [assistantContext, setAssistantContext] = useState<AssistantContext | null>(null);

  // -- Creative Suite State --
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [mood, setMood] = useState('high-energy, cinematic');
  const [tagline, setTagline] = useState('');
  const [accentColor, setAccentColor] = useState('#a855f7');
  const [posterForm, setPosterForm] = useState<PosterFormState>({
    posterTitle: '',
    subtitle: '',
    registrationBanner: 'REGISTRATIONS OPEN NOW',
    aboutText:
      'Bring your best ideas, sharpen your skills, and compete in a high-energy campus showdown built for builders.',
    prizePool: '50,000',
    dayPrizePool: '10,000+ in prizes',
    registrationFee: '149',
    teamSize: '1 to 4 Students',
    eligibility: 'Open to all branches and all years',
    dateLabel: '',
    timeLabel: '',
    venueLabel: '',
    website: 'Register on CampusClubs',
    coordinatorName: '',
    coordinatorPhone: '',
    studentCoordinator: '',
    studentPhone: '',
    sponsors: 'RadhyaTech\nKNS Burgers & More\nCampus Partner',
    benefits:
      'Exciting prize opportunities\nInternship and career exposure\nCertificates to boost your profile\nCampus networking and goodies',
  });
  const [poster, setPoster] = useState<PosterResponse | null>(null);
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const [suggestingPosterCopy, setSuggestingPosterCopy] = useState(false);
  const posterCanvasRef = useRef<HTMLCanvasElement>(null);

  // -- Chat State --
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatting, setChatting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !['PRESIDENT', 'VP', 'COORDINATOR', 'ADMIN'].includes(user.role)) {
      navigate('/');
      return;
    }

    const loadContext = async () => {
      try {
        const context = await apiFetch('/ai/assistant-context');
        setAssistantContext(context);
      } catch (error) {
        console.error('Failed to load context:', error);
      }
    };

    const loadEvents = async () => {
      if (!user || !['PRESIDENT', 'VP'].includes(user.role)) return;
      try {
        const myClub = await apiFetch('/club/my-club');
        if (!myClub?.id) return;
        const eventList = await apiFetch(`/event/club/${myClub.id}`);
        setEvents(eventList ?? []);
        if (eventList?.length) {
          setSelectedEventId(eventList[0].id);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
      }
    };

    loadContext();
    loadEvents();
  }, [navigate, user]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const selectedEvent = events.find((event) => event.id === selectedEventId);
    if (!selectedEvent) {
      return;
    }

    setPosterForm((current) => ({
      ...current,
      posterTitle: current.posterTitle || selectedEvent.title,
      subtitle:
        current.subtitle ||
        selectedEvent.category ||
        'Code together. Build together. Win together.',
      aboutText: current.aboutText || selectedEvent.description || current.aboutText,
      dateLabel:
        current.dateLabel ||
        new Date(selectedEvent.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
      timeLabel:
        current.timeLabel ||
        new Date(selectedEvent.date).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      venueLabel: current.venueLabel || selectedEvent.venue,
    }));
  }, [events, selectedEventId]);

  useEffect(() => {
    const canvas = posterCanvasRef.current;
    const selectedEvent = events.find((event) => event.id === selectedEventId);
    if (!canvas || !poster || !selectedEvent) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      canvas.width = 1080;
      canvas.height = 1350;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      const topOverlay = ctx.createLinearGradient(0, 0, 0, canvas.height);
      topOverlay.addColorStop(0, 'rgba(7, 12, 28, 0.1)');
      topOverlay.addColorStop(0.45, 'rgba(11, 18, 38, 0.42)');
      topOverlay.addColorStop(1, 'rgba(6, 13, 32, 0.96)');
      ctx.fillStyle = topOverlay;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawTopBranding(ctx, accentColor);
      drawSponsorStrip(ctx, accentColor, posterForm.sponsors);

      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = 'rgba(255,255,255,0.85)';
      ctx.shadowBlur = 18;
      ctx.font = '900 96px Arial';
      const titleLines = wrapCenteredText(
        ctx,
        (posterForm.posterTitle || selectedEvent.title).toUpperCase(),
        canvas.width / 2,
        290,
        840,
        100,
      );
      ctx.shadowBlur = 0;
      const titleBottom = titleLines[titleLines.length - 1]?.y || 290;

      ctx.fillStyle = '#dbeafe';
      ctx.font = '700 42px Arial';
      ctx.textAlign = 'center';
      wrapText(
        ctx,
        posterForm.subtitle || tagline || 'Code together. Win together.',
        540,
        titleBottom + 72,
        760,
        52,
        'center',
      );
      ctx.textAlign = 'left';

      drawBanner(ctx, posterForm.registrationBanner || 'REGISTRATIONS OPEN NOW');
      drawDescriptionCard(ctx, accentColor, posterForm.aboutText);
      drawStatSidebar(ctx, accentColor, posterForm);
      drawBenefits(ctx, accentColor, posterForm.benefits, posterForm.eligibility);
      drawPrizeBadge(ctx, accentColor, posterForm);
      drawContactStrip(ctx, accentColor, posterForm);
      drawCtaCard(ctx, accentColor, posterForm);

      ctx.fillStyle = '#bfdbfe';
      ctx.font = '700 22px Arial';
      ctx.fillText(`Mood: ${mood}`, 72, 1248);
    };
    image.src = poster.imageUrl;
  }, [accentColor, events, mood, poster, posterForm, selectedEventId, tagline]);

  // -- AI Chat Logic --
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: chatPrompt.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setChatPrompt('');
    setChatting(true);

    try {
      // Create history payload from prev messages (limit last 10)
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      
      const res = await apiFetch('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content, history })
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply,
        suggestedAction: res.suggestedAction,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh context in case something changed behind the scenes
      setAssistantContext(await apiFetch('/ai/assistant-context'));
    } catch (err: any) {
      alert(err.message || 'Failed to chat with AI.');
    } finally {
      setChatting(false);
    }
  };

  const executeAction = async (msgId: string, type: 'CREATE_PROPOSAL' | 'MINT_TOKEN', payload: any) => {
    setActionLoading(msgId);
    try {
      await apiFetch('/ai/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload })
      });
      alert(`✅ Action ${type} executed successfully!`);
      // Update UI to show the action was taken
      setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, suggestedAction: undefined, content: m.content + '\n\n**[Action Executed successfully!]**' } : m));
    } catch (err: any) {
      alert(err.message || 'Action execution failed');
    } finally {
      setActionLoading(null);
    }
  };

  // -- Creative Suite Logic --
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      alert('Choose an event first.');
      return;
    }
    setGeneratingPoster(true);
    try {
      const data = await apiFetch(
        `/ai/generate-event-poster?eventId=${encodeURIComponent(
          selectedEventId,
        )}&mood=${encodeURIComponent(mood)}&tagline=${encodeURIComponent(tagline)}`,
      );
      setPoster(data);
    } catch (error: any) {
      alert(error.message || 'Failed to generate poster');
    } finally {
      setGeneratingPoster(false);
    }
  };

  const handleSuggestPosterCopy = async () => {
    if (!selectedEventId) {
      alert('Choose an event first.');
      return;
    }

    setSuggestingPosterCopy(true);
    try {
      const data = await apiFetch('/ai/poster-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          mood,
          currentFields: posterForm,
        }),
      });

      setPosterForm((current) => ({
        ...current,
        ...data,
      }));

      if (!tagline && data?.subtitle) {
        setTagline(data.subtitle);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to generate poster copy');
    } finally {
      setSuggestingPosterCopy(false);
    }
  };

  const downloadPoster = () => {
    const canvas = posterCanvasRef.current;
    if (!canvas) return;

    try {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `poster_${selectedEventId || 'event'}.png`;
      link.click();
    } catch (error) {
      alert('Could not export the poster. Try generating again.');
    }
  };

  const canGenerate = user?.role === 'PRESIDENT' || user?.role === 'VP';

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
            ✨ AI Studio
          </h1>
          <p className="text-slate-400 mt-1">Data-driven Chief of Staff & Creative Tools</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'chat' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            💬 Chief of Staff
          </button>
          <button
            onClick={() => setActiveTab('creative')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'creative' ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎨 Creative Suite
          </button>
        </div>
      </header>

      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
          {/* Main Chat Area */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/50">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <div className="text-6xl">🤖</div>
                  <h3 className="text-xl font-medium text-white">I am your Club's AI Chief of Staff.</h3>
                  <p className="text-sm text-slate-400 max-w-md">
                    I automatically analyze Treasury events, PoP attendance, proposals, and token activities. Ask me for suggestions or insights!
                  </p>
                </div>
              )}
              
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    
                    {/* Render Action Card if AI suggested an action */}
                    {msg.suggestedAction && (
                      <div className="mt-4 bg-slate-900/80 border border-indigo-500/30 rounded-xl p-4 shadow-inner">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-indigo-400 text-lg">⚡</span>
                          <span className="font-semibold text-indigo-300 text-sm">Suggested Action: {msg.suggestedAction.type.replace('_', ' ')}</span>
                        </div>
                        <pre className="text-xs bg-black/40 p-3 rounded-lg text-emerald-400/80 overflow-x-auto mb-4 border border-white/5">
                          {JSON.stringify(msg.suggestedAction.payload, null, 2)}
                        </pre>
                        <button
                          onClick={() => executeAction(msg.id, msg.suggestedAction!.type, msg.suggestedAction!.payload)}
                          disabled={actionLoading === msg.id}
                          className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                        >
                          {actionLoading === msg.id ? 'Executing on-chain...' : '🚀 Execute Action'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatting && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-400 p-4 rounded-2xl rounded-bl-none animate-pulse text-sm flex items-center gap-3">
                    <div className="flex gap-1"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div></div>
                    Checking Live Metrics...
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="p-4 bg-slate-800 border-t border-slate-700">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  placeholder="Ask for engagement analysis, suggest a proposal, or review treasury health..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  disabled={chatting}
                />
                <button
                  type="submit"
                  disabled={chatting || !chatPrompt.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>

          {/* Context Viewer Sidebar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-y-auto space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">🧠 Live Context Filter</h3>
              <p className="text-xs text-slate-500 mb-4">The AI currently sees this live data for your college.</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-400">Total Events</span>
                <span className="font-mono text-emerald-400">{assistantContext?.dashboard.eventCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-400">Total Sponsors</span>
                <span className="font-mono text-indigo-400">{assistantContext?.dashboard.sponsorCount || 0}</span>
              </div>
            </div>

            {assistantContext?.treasuryContext && assistantContext.treasuryContext.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-400 mb-3">Recent Treasury Requests</h4>
                <div className="space-y-2">
                  {assistantContext.treasuryContext.slice(0, 3).map(tr => (
                    <div key={tr.id} className="bg-slate-800/50 p-2 rounded-lg text-xs flex justify-between">
                      <span className="text-slate-300 line-clamp-1 truncate mr-2" title={tr.title}>{tr.title}</span>
                      <span className="font-mono text-emerald-400 w-12 text-right">{tr.amount} A</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {assistantContext?.recentEvents && assistantContext.recentEvents.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-400 mb-3">Recent Events</h4>
                <div className="space-y-2">
                  {assistantContext.recentEvents.slice(0, 3).map(ev => (
                    <div key={ev.id} className="bg-slate-800/50 p-2 rounded-lg text-xs">
                      <div className="text-slate-300 line-clamp-1">{ev.title}</div>
                      <div className="font-mono text-slate-500 text-[10px] mt-1 pr-1 border-r border-slate-600 inline-block">{ev.status}</div>
                      <div className="font-mono text-slate-500 text-[10px] ml-1 inline-block truncate max-w-[100px] align-bottom">{ev.venue}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'creative' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-200">SDXL Poster Generation</h3>
            <form onSubmit={handleGenerate} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-400 mb-1">Event</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                  disabled={!canGenerate}
                >
                  <option value="">Select an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} • {new Date(event.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Visual Mood</label>
                <input
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                  placeholder="e.g. bold campus energy"
                  disabled={!canGenerate}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Poster Title</label>
                  <input
                    value={posterForm.posterTitle}
                    onChange={(e) =>
                      setPosterForm((current) => ({
                        ...current,
                        posterTitle: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                    placeholder="Event name"
                    disabled={!canGenerate}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Subtitle</label>
                  <input
                    value={posterForm.subtitle}
                    onChange={(e) =>
                      setPosterForm((current) => ({
                        ...current,
                        subtitle: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                    placeholder="Hook line under title"
                    disabled={!canGenerate}
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Registration Banner</label>
                <input
                  value={posterForm.registrationBanner}
                  onChange={(e) =>
                    setPosterForm((current) => ({
                      ...current,
                      registrationBanner: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                  placeholder="Ex: Registration extended till 6 March 5:00 PM"
                  disabled={!canGenerate}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tagline Hint</label>
                <textarea
                  rows={3}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500 resize-none"
                  placeholder="Ex: Build, ship, and demo in 24 hours"
                  disabled={!canGenerate}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">About / Description</label>
                <textarea
                  rows={4}
                  value={posterForm.aboutText}
                  onChange={(e) =>
                    setPosterForm((current) => ({
                      ...current,
                      aboutText: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500 resize-none"
                  placeholder="Main body copy for the poster"
                  disabled={!canGenerate}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Prize Pool</label>
                  <input
                    value={posterForm.prizePool}
                    onChange={(e) =>
                      setPosterForm((current) => ({
                        ...current,
                        prizePool: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                    placeholder="50,000"
                    disabled={!canGenerate}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Day Prize / Highlight</label>
                  <input
                    value={posterForm.dayPrizePool}
                    onChange={(e) =>
                      setPosterForm((current) => ({
                        ...current,
                        dayPrizePool: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                    placeholder="10K+ in prizes"
                    disabled={!canGenerate}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Registration Fee</label>
                  <input
                    value={posterForm.registrationFee}
                    onChange={(e) =>
                      setPosterForm((current) => ({
                        ...current,
                        registrationFee: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                    placeholder="149"
                    disabled={!canGenerate}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Team Size</label>
                  <input
                    value={posterForm.teamSize}
                    onChange={(e) =>
                      setPosterForm((current) => ({
                        ...current,
                        teamSize: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                    placeholder="1 to 4 Students"
                    disabled={!canGenerate}
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Eligibility</label>
                <input
                  value={posterForm.eligibility}
                  onChange={(e) =>
                    setPosterForm((current) => ({
                      ...current,
                      eligibility: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                  placeholder="Open to all branches & all years"
                  disabled={!canGenerate}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Date Label</label>
                  <input
                    value={posterForm.dateLabel}
                    onChange={(e) =>
                      setPosterForm((current) => ({
                        ...current,
                        dateLabel: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                    placeholder="07 March 2026"
                    disabled={!canGenerate}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Time Label</label>
                  <input
                    value={posterForm.timeLabel}
                    onChange={(e) =>
                      setPosterForm((current) => ({
                        ...current,
                        timeLabel: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                    placeholder="2:20 to 4:30"
                    disabled={!canGenerate}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Venue Label</label>
                  <input
                    value={posterForm.venueLabel}
                    onChange={(e) =>
                      setPosterForm((current) => ({
                        ...current,
                        venueLabel: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                    placeholder="E124"
                    disabled={!canGenerate}
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Benefits / Why Join</label>
                <textarea
                  rows={4}
                  value={posterForm.benefits}
                  onChange={(e) =>
                    setPosterForm((current) => ({
                      ...current,
                      benefits: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500 resize-none"
                  placeholder="One point per line"
                  disabled={!canGenerate}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Sponsors</label>
                <textarea
                  rows={3}
                  value={posterForm.sponsors}
                  onChange={(e) =>
                    setPosterForm((current) => ({
                      ...current,
                      sponsors: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500 resize-none"
                  placeholder="One sponsor per line"
                  disabled={!canGenerate}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Website / CTA URL</label>
                <input
                  value={posterForm.website}
                  onChange={(e) =>
                    setPosterForm((current) => ({
                      ...current,
                      website: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                  placeholder="Registration link or CTA"
                  disabled={!canGenerate}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Faculty Coordinator</label>
                  <input
                    value={posterForm.coordinatorName}
                    onChange={(e) =>
                      setPosterForm((current) => ({
                        ...current,
                        coordinatorName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                    placeholder="Faculty coordinator"
                    disabled={!canGenerate}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Faculty Phone</label>
                  <input
                    value={posterForm.coordinatorPhone}
                    onChange={(e) =>
                      setPosterForm((current) => ({
                        ...current,
                        coordinatorPhone: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                    placeholder="+91..."
                    disabled={!canGenerate}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Student Coordinator</label>
                  <input
                    value={posterForm.studentCoordinator}
                    onChange={(e) =>
                      setPosterForm((current) => ({
                        ...current,
                        studentCoordinator: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                    placeholder="Student coordinator"
                    disabled={!canGenerate}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Student Phone</label>
                  <input
                    value={posterForm.studentPhone}
                    onChange={(e) =>
                      setPosterForm((current) => ({
                        ...current,
                        studentPhone: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                    placeholder="+91..."
                    disabled={!canGenerate}
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Accent Color</label>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-11 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800 p-1"
                  disabled={!canGenerate}
                />
              </div>
              <button
                type="button"
                onClick={handleSuggestPosterCopy}
                disabled={suggestingPosterCopy || !canGenerate}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-medium rounded-lg transition"
              >
                {suggestingPosterCopy ? 'AI Drafting Copy...' : 'AI Fill Details'}
              </button>
              <button
                type="submit"
                disabled={generatingPoster || suggestingPosterCopy || !canGenerate}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white font-medium rounded-lg transition"
              >
                {generatingPoster ? 'Generating Poster Base...' : 'Generate Poster'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[500px] flex items-center justify-center">
            {poster ? (
              <div className="flex w-full flex-col items-center gap-4">
                <canvas
                  ref={posterCanvasRef}
                  className="max-h-[700px] w-full max-w-[560px] rounded-xl border border-slate-700 bg-slate-950 object-contain shadow-2xl"
                />
                <div className="flex w-full max-w-[560px] justify-between gap-3">
                  <button
                    type="button"
                    onClick={downloadPoster}
                    className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-400"
                  >
                    Download PNG
                  </button>
                  <a
                    href={poster.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 rounded-xl border border-slate-700 px-4 py-3 text-center text-sm font-bold text-slate-200 transition hover:bg-slate-800"
                  >
                    Open Raw Background
                  </a>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl text-xs text-slate-300 w-full">
                  <span className="text-emerald-400 font-bold block mb-1">Canvas Composer</span>
                  Structured poster fields are composed here into a hackathon-style poster for PNG export.
                </div>
                <div className="bg-slate-800 p-4 rounded-xl text-xs text-slate-300 w-full">
                  <span className="text-purple-400 font-bold block mb-1">Exact Prompt Given to SDXL:</span>
                  {poster.prompt}
                </div>
              </div>
            ) : (
              <div className="text-center opacity-50 space-y-4">
                <div className="text-5xl">🖌️</div>
                <p className="text-slate-300">Choose an event and visual style to generate an asset.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign = 'left',
) {
  const words = text.split(' ');
  const lines: Array<{ text: string; y: number }> = [];
  let currentLine = '';
  let y = startY;
  const previousAlign = ctx.textAlign;
  ctx.textAlign = align;

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      ctx.fillText(currentLine, x, y);
      lines.push({ text: currentLine, y });
      currentLine = word;
      y += lineHeight;
      return;
    }
    currentLine = testLine;
  });

  if (currentLine) {
    ctx.fillText(currentLine, x, y);
    lines.push({ text: currentLine, y });
  }

  ctx.textAlign = previousAlign;
  return lines;
}

function wrapCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
) {
  return wrapText(ctx, text, x, startY, maxWidth, lineHeight, 'center');
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawTopBranding(
  ctx: CanvasRenderingContext2D,
  accentColor: string,
) {
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  roundRect(ctx, 40, 34, 300, 88, 18);
  ctx.fill();
  roundRect(ctx, 760, 34, 280, 88, 18);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 42px Arial';
  ctx.fillText('MIT', 62, 92);
  ctx.font = '700 30px Arial';
  ctx.fillText('Academy of Engineering', 138, 90);

  ctx.fillStyle = accentColor;
  ctx.font = '800 24px Arial';
  ctx.fillText('CODECHEF / HACKATHON', 786, 76);
  ctx.fillStyle = '#334155';
  ctx.font = '700 22px Arial';
  ctx.fillText('Campus Chapter Poster Builder', 786, 104);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 22px Arial';
  ctx.fillText('CAMPUSCLUBS AI POSTER', 392, 90);
}

function drawSponsorStrip(
  ctx: CanvasRenderingContext2D,
  accentColor: string,
  sponsorsValue: string,
) {
  const sponsors = sponsorsValue
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 18px Arial';
  ctx.fillText('SPONSORED BY', 430, 150);

  sponsors.forEach((sponsor, index) => {
    const x = 286 + index * 176;
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    roundRect(ctx, x, 166, 160, 54, 18);
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 18px Arial';
    wrapText(ctx, sponsor, x + 80, 199, 132, 18, 'center');
  });
}

function drawBanner(ctx: CanvasRenderingContext2D, bannerText: string) {
  ctx.fillStyle = 'rgba(255, 91, 91, 0.92)';
  roundRect(ctx, 120, 448, 840, 54, 18);
  ctx.fill();
  ctx.fillStyle = '#fff7ed';
  ctx.font = '800 30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(bannerText.toUpperCase(), 540, 484);
  ctx.textAlign = 'left';
}

function drawDescriptionCard(
  ctx: CanvasRenderingContext2D,
  accentColor: string,
  aboutText: string,
) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  roundRect(ctx, 72, 534, 480, 178, 28);
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 18px Arial';
  wrapText(ctx, aboutText, 104, 586, 420, 28);
}

function drawStatSidebar(
  ctx: CanvasRenderingContext2D,
  accentColor: string,
  form: PosterFormState,
) {
  const x = 612;
  const y = 534;
  const w = 396;
  const h = 300;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  roundRect(ctx, x, y, w, h, 30);
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  const stats = [
    ['DATE', form.dateLabel || 'To be announced'],
    ['TIME', form.timeLabel || 'To be announced'],
    ['VENUE', form.venueLabel || 'Campus venue'],
    ['ENTRY', `Rs ${form.registrationFee || '0'}`],
    ['TEAM', form.teamSize || 'Individual'],
  ];

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 24px Arial';
  ctx.fillText(form.dayPrizePool || '10K+ in prizes', x + 28, y + 46);

  stats.forEach(([label, value], index) => {
    const rowY = y + 92 + index * 38;
    ctx.fillStyle = '#93c5fd';
    ctx.font = '700 18px Arial';
    ctx.fillText(label, x + 28, rowY);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 24px Arial';
    ctx.fillText(value, x + 148, rowY + 2);
  });
}

function drawBenefits(
  ctx: CanvasRenderingContext2D,
  accentColor: string,
  benefitsValue: string,
  eligibility: string,
) {
  const benefits = benefitsValue
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '800 28px Arial';
  ctx.fillText('WHY YOU SHOULD JOIN?', 72, 792);

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  roundRect(ctx, 72, 814, 360, 42, 18);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 18px Arial';
  wrapText(ctx, eligibility, 252, 842, 320, 18, 'center');

  benefits.forEach((benefit, index) => {
    const y = 882 + index * 64;
    ctx.fillStyle = 'rgba(10, 22, 52, 0.75)';
    roundRect(ctx, 72, y, 390, 46, 22);
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 20px Arial';
    wrapText(ctx, benefit, 268, y + 30, 330, 20, 'center');
  });
}

function drawPrizeBadge(
  ctx: CanvasRenderingContext2D,
  accentColor: string,
  form: PosterFormState,
) {
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  roundRect(ctx, 540, 872, 220, 128, 26);
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.font = '900 28px Arial';
  ctx.fillText('PRIZE POOL', 574, 914);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 44px Arial';
  ctx.fillText(`Rs ${form.prizePool || '0'}`, 574, 966);
  ctx.fillStyle = '#334155';
  ctx.font = '700 18px Arial';
  ctx.fillText(form.dayPrizePool || 'Day prizes available', 574, 995);
}

function drawCtaCard(
  ctx: CanvasRenderingContext2D,
  accentColor: string,
  form: PosterFormState,
) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  roundRect(ctx, 790, 876, 220, 292, 28);
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#fff7ed';
  ctx.font = '900 34px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('REGISTER', 900, 926);
  ctx.fillText('NOW', 900, 964);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(830, 992, 140, 140);
  ctx.fillStyle = '#0f172a';
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if ((row + col) % 2 === 0 || (row * col) % 3 === 0) {
        ctx.fillRect(842 + col * 16, 1004 + row * 16, 10, 10);
      }
    }
  }
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 16px Arial';
  wrapText(ctx, form.website || 'campusclubs registration link', 900, 1160, 160, 18, 'center');
  ctx.textAlign = 'left';
}

function drawContactStrip(
  ctx: CanvasRenderingContext2D,
  accentColor: string,
  form: PosterFormState,
) {
  ctx.fillStyle = 'rgba(5, 10, 22, 0.86)';
  roundRect(ctx, 48, 1264, 984, 58, 22);
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 20px Arial';
  ctx.fillText(`Faculty: ${form.coordinatorName || 'Faculty coordinator'} ${form.coordinatorPhone ? `• ${form.coordinatorPhone}` : ''}`, 76, 1299);
  ctx.fillText(`Student: ${form.studentCoordinator || 'Student coordinator'} ${form.studentPhone ? `• ${form.studentPhone}` : ''}`, 520, 1299);
}
