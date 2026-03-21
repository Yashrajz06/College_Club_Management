import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useNavigate } from 'react-router-dom';

export default function AIPosterCreator() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [generatedBg, setGeneratedBg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !['PRESIDENT', 'VP', 'COORDINATOR', 'ADMIN'].includes(user.role)) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/ai/generate-poster?prompt=${encodeURIComponent(prompt)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedBg(data.imageUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">AI Poster Studio</h2>
        <p className="text-slate-500 mt-1">Generate stunning event backgrounds seamlessly and customize your club posters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">AI Image Prompt</label>
              <textarea 
                rows={4}
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                placeholder="Ex: A futuristic neon-lit hackathon stage with glowing code screens..."
              />
            </div>
            <button 
              disabled={loading}
              className={`w-full py-2 flex justify-center items-center text-white font-medium rounded-lg shadow-sm transition ${loading ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {loading ? 'Generating...' : '✨ Generate Vibe'}
            </button>
          </form>

          <div className="border-t border-slate-200 pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Canvas Overlay Elements</h3>
            <p className="text-xs text-slate-500">Fabric.js components will render here in the final build. Add your club logos and event titles on top of the generated background.</p>
            <button className="w-full py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg shadow-sm transition text-sm">
              Add Text Overlay
            </button>
            <button className="w-full py-2 bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:bg-slate-800 transition text-sm">
              📥 Export to PDF
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[500px] flex items-center justify-center relative overflow-hidden">
          {generatedBg ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <img src={generatedBg} alt="AI Generated Poster Background" className="w-full h-auto max-h-[600px] object-cover rounded-lg shadow-md border border-slate-200" />
              {/* Overlay elements representing fabric.js objects */}
              <div className="absolute inset-0 flex items-center justify-center drop-shadow-lg pointer-events-none">
                <h1 className="text-5xl font-extrabold text-white text-center blur-[0.5px]">Your Event Title<br/><span className="text-3xl font-medium text-slate-200">Date & Venue</span></h1>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3 px-8">
              <div className="text-4xl">🎨</div>
              <p className="text-slate-500 font-medium">Your canvas is empty.</p>
              <p className="text-sm text-slate-400">Enter an AI prompt on the left to generate your foundational background image.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
