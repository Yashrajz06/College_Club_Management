import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useNavigate } from 'react-router-dom';

interface TokenEntry {
  id: string;
  txId: string;
  soulboundTxId: string | null;
  actionType: string;
  createdAt: string;
  club?: { name: string };
  event?: { title: string };
}

export default function MyTokens() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<TokenEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTokens();
  }, [user]);

  const fetchTokens = async () => {
    try {
      const res = await fetch('http://localhost:3000/token/my-tokens', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse text-slate-400">Loading your portfolio...</div>;

  const getActionColor = (action: string) => {
    switch(action) {
      case 'JOIN': return 'from-blue-400 to-indigo-500 shadow-blue-500/20';
      case 'REGISTER': return 'from-emerald-400 to-teal-500 shadow-emerald-500/20';
      case 'ATTEND': return 'from-purple-400 to-fuchsia-500 shadow-purple-500/20';
      case 'VOTE': return 'from-amber-400 to-orange-500 shadow-amber-500/20';
      case 'SPONSOR': return 'from-rose-400 to-pink-500 shadow-rose-500/20';
      default: return 'from-slate-400 to-slate-500 shadow-slate-500/20';
    }
  };

  const getActionIcon = (action: string) => {
    switch(action) {
      case 'JOIN': return '👋';
      case 'REGISTER': return '🎫';
      case 'ATTEND': return '🎓';
      case 'VOTE': return '🗳️';
      case 'SPONSOR': return '💎';
      default: return '🪙';
    }
  };

  const soulboundTokens = tokens.filter(t => t.soulboundTxId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Portfolio Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 leading-tight">
          My Token Portfolio
        </h1>
        <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
          Your immutable record of participation. Every action you take is verified and stored securely, building your ultimate college profile.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Tokens</p>
          <p className="text-5xl font-black text-slate-900 mt-2">{tokens.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Soulbound NFTs</p>
          <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mt-2">{soulboundTokens.length}</p>
        </div>
        <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
           <p className="text-sm font-bold text-indigo-300 uppercase tracking-widest relative z-10">Voting Power</p>
           <p className="text-5xl font-black text-white mt-2 relative z-10">{Math.min(tokens.length + soulboundTokens.length, 10)} / 10</p>
           <p className="text-xs text-indigo-400/60 mt-2 font-medium relative z-10">Max Tier Status</p>
        </div>
      </div>

      {/* Soulbound Showcase */}
      {soulboundTokens.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
             <span className="text-3xl">✨</span> Soulbound Achievements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {soulboundTokens.map(token => (
              <div key={token.id} className="relative group p-[2px] rounded-3xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300">
                 <div className="bg-white rounded-[22px] p-6 h-full backdrop-blur-3xl">
                    <div className="flex justify-between items-start gap-4">
                       <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">💎</div>
                       <div className="flex-grow space-y-1">
                          <h4 className="font-bold text-slate-900 leading-tight">Proof of Presence</h4>
                          <p className="text-xs font-bold text-slate-400 line-clamp-1">{token.event?.title || token.club?.name || 'Milestone Achievement'}</p>
                          <div className="pt-3">
                            <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 text-[9px] font-black rounded-lg uppercase tracking-widest border border-purple-100">Soulbound NFT</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token Ledger History */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
           <span className="text-3xl">📖</span> Token Ledger
        </h2>
        <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          {tokens.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-medium">No tokens found. Start participating in clubs to earn tokens!</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {tokens.map(token => (
                <div key={token.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg bg-gradient-to-br ${getActionColor(token.actionType)} group-hover:scale-110 transition-transform duration-300`}>
                      {getActionIcon(token.actionType)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">
                        {token.actionType} Token
                        {token.soulboundTxId && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold align-middle">PoP</span>}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {new Date(token.createdAt).toLocaleString()} • {token.event?.title || token.club?.name || 'Platform Action'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                        TX: {token.txId.substring(0, 16)}...
                     </span>
                     <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Verify Setup ↗</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
