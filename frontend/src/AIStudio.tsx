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
  const [poster, setPoster] = useState<PosterResponse | null>(null);
  const [generatingPoster, setGeneratingPoster] = useState(false);

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
              <button
                disabled={generatingPoster || !canGenerate}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white font-medium rounded-lg transition"
              >
                {generatingPoster ? 'Generating Asset...' : 'Generate Art'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[500px] flex items-center justify-center">
            {poster ? (
              <div className="flex flex-col items-center gap-4">
                <img src={poster.imageUrl} alt="Poster" className="max-h-[600px] object-contain rounded-xl shadow-2xl" />
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
