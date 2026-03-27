import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from './lib/api';
import { 
  BadgeCheck, ExternalLink, ShieldAlert, Coins,
  ArrowLeft, Clock, Search, Database, User, Building, MapPin
} from 'lucide-react';

const PublicVerifyToken: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch(`/verify/token/${assetId}`);
        setData(res);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (assetId) fetchData();
  }, [assetId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-indigo-500 gap-4">
      <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      <span className="font-bold tracking-widest text-xs uppercase animate-pulse">Scanning Governance Layer...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 sm:p-12 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-3xl w-full space-y-8 animate-in slide-in-from-bottom-5 duration-700">
        <header className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-semibold group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Campus Hub
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
            <Search size={14} className="text-slate-400" />
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-tighter">PROOF-OF-ACTION 2.0</span>
          </div>
        </header>

        {error || !data ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-red-100 shadow-xl shadow-red-500/5 flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center shadow-inner">
              <ShieldAlert size={40} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">Token Incomplete</h1>
            <p className="text-slate-500 max-w-sm">
              We couldn't locate a verified entry token matching this identifier on the governance ledger.
            </p>
            <div className="w-full bg-slate-50 p-4 rounded-xl font-mono text-xs text-slate-400 border border-slate-100 uppercase tracking-tighter break-all">
              {assetId}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700">
                <Coins size={240} />
              </div>
              
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/50 animate-pulse">
                  <BadgeCheck size={28} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest leading-none">Authentication Pass</h2>
                  <h1 className="text-3xl font-black mt-1">Proof-Of-{data.actionType}</h1>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] block">Token Holder</span>
                    <p className="flex items-center gap-2 text-xl font-bold leading-snug">
                       <User size={18} className="text-indigo-400" /> {data.holder.name}
                    </p>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] block">Issued To Wallet</span>
                    <p className="text-xs font-mono font-bold leading-snug truncate pr-6 hover:text-white transition-colors">{data.holder.walletAddress || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] block">Record Category</span>
                    <p className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm font-bold uppercase tracking-widest border border-indigo-500/30">
                      <Database size={14} /> ACTIVE SOULBOUND
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] block">Issuance Date</span>
                    <p className="flex items-center gap-2 text-slate-300 font-medium font-mono text-sm leading-none">
                      <Clock size={16} className="text-indigo-400" /> {new Date(data.createdAt).toISOString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-800 flex flex-wrap items-center justify-between gap-6 relative z-10">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2">Immutable Governance Proof</span>
                  <div className="px-4 py-2 bg-black/40 rounded-xl font-mono text-[11px] text-emerald-400 border border-emerald-500/20 flex items-center gap-3">
                    ASA: {data.tokenId || 'OFF-CHAIN'}
                    <BadgeCheck size={14} className="text-emerald-500" />
                  </div>
                </div>
                {data.explorerUrl && (
                  <a href={data.explorerUrl} target="_blank" rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all hover:scale-105 shadow-xl shadow-white/5">
                    Explore On-chain <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Building size={20} className="text-slate-400" /> Issuing Hub
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-sm font-medium text-slate-500">College</span>
                    <span className="text-sm font-bold text-slate-900">{data.college.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-sm font-medium text-slate-500">Associated Club</span>
                    <span className="text-sm font-bold text-slate-900">{data.club?.name || 'College Ecosystem'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-sm font-medium text-slate-500">Activity Type</span>
                    <span className="text-sm font-black text-rose-600 uppercase tracking-tighter italic">{data.actionType}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center gap-3 items-center text-center group">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <MapPin size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900">Event Signature</h3>
                <p className="text-[10px] text-slate-500 leading-relaxed px-4 uppercase font-bold tracking-widest">
                  {data.event?.title || 'GENERAL ECOSYSTEM PARTICIPATION'}
                </p>
                <div className="text-[10px] font-mono font-bold text-slate-300">
                  REF: {data.id.slice(0, 8)}
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="pt-12 pb-8 text-center space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Non-Transferable Participation Credential
          </p>
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="h-[1px] w-8 bg-slate-200" />
            <span className="text-[8px] font-mono text-slate-300 font-bold uppercase tracking-tighter italic shadow-sm hover:text-slate-400 transition-colors cursor-default">CRYPTO-AUTH-V1 • 2026</span>
            <div className="h-[1px] w-8 bg-slate-200" />
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PublicVerifyToken;
