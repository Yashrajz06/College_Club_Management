import React, { useEffect, useState } from 'react';
import { apiFetch } from './lib/api';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { format } from 'date-fns';

interface Vote {
  id: string;
  voteFor: boolean;
  weight: number;
  voter: { name: string };
  txId?: string;
  createdAt: string;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  spendAmount?: number;
  deadline?: string;
  forWeight: number;
  againstWeight: number;
  proposer: { name: string };
  club: { name: string };
  event: { title: string };
  votes: Vote[];
  _count: { votes: number };
  createdAt: string;
}

const Governance: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  
  const user = useSelector((state: RootState) => state.auth.user);
  const collegeId = useSelector((state: RootState) => state.college.currentCollegeId);

  useEffect(() => {
    fetchProposals();
  }, [collegeId]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/governance/proposals');
      setProposals(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposalDetails = async (id: string) => {
    try {
      const data = await apiFetch(`/governance/proposals/${id}`);
      setSelectedProposal(data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVote = async (voteFor: boolean) => {
    if (!selectedProposal) return;
    try {
      setVoting(true);
      await apiFetch(`/governance/proposals/${selectedProposal.id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ voteFor }),
      });
      await fetchProposalDetails(selectedProposal.id);
      await fetchProposals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVoting(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedProposal) return;
    try {
      await apiFetch(`/governance/proposals/${selectedProposal.id}/finalize`, {
        method: 'POST',
      });
      await fetchProposalDetails(selectedProposal.id);
      await fetchProposals();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExecute = async () => {
    if (!selectedProposal) return;
    try {
      await apiFetch(`/governance/proposals/${selectedProposal.id}/execute`, {
        method: 'POST',
      });
      await fetchProposalDetails(selectedProposal.id);
      await fetchProposals();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-500';
      case 'APPROVED': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      case 'EXECUTED': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Governance...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">DAO Governance</h1>
          <p className="text-gray-400">On-chain voting and decision making for {selectedProposal?.club?.name || 'Clubs'}</p>
        </div>
      </header>

      {error && <div className="bg-red-500/20 text-red-300 p-4 rounded mb-6">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Proposals List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Proposals</h2>
          {proposals.length === 0 && <p className="text-gray-500 italic">No proposals found.</p>}
          {proposals.map((p) => (
            <div
              key={p.id}
              onClick={() => fetchProposalDetails(p.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedProposal?.id === p.id 
                  ? 'bg-blue-600/20 border-blue-500' 
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${getStatusColor(p.status)}`}>
                  {p.status}
                </span>
                <span className="text-xs text-gray-500">
                  {format(new Date(p.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              <h3 className="font-medium text-white line-clamp-1">{p.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{p.club.name}</p>
            </div>
          ))}
        </div>

        {/* Proposal Details */}
        <div className="lg:col-span-2">
          {selectedProposal ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 sticky top-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedProposal.title}</h2>
                  <p className="text-gray-400 mt-1">Proposed by <span className="text-blue-400">{selectedProposal.proposer.name}</span> for <span className="text-blue-400">{selectedProposal.event.title}</span></p>
                </div>
                <div className="text-right">
                  {selectedProposal.spendAmount && (
                    <div className="text-2xl font-mono text-green-400 font-bold">
                      ${selectedProposal.spendAmount.toLocaleString()}
                    </div>
                  )}
                  {selectedProposal.deadline && (
                    <div className="text-xs text-gray-500 mt-1">
                      Ends: {format(new Date(selectedProposal.deadline), 'PPp')}
                    </div>
                  )}
                </div>
              </div>

              <div className="prose prose-invert max-w-none mb-8">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedProposal.description}</p>
              </div>

              {/* Vote Visualization */}
              <div className="mb-10">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-400 font-bold">FOR: {selectedProposal.forWeight.toFixed(1)}</span>
                  <span className="text-red-400 font-bold">AGAINST: {selectedProposal.againstWeight.toFixed(1)}</span>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-green-500 transition-all duration-500" 
                    style={{ width: `${(selectedProposal.forWeight / (selectedProposal.forWeight + selectedProposal.againstWeight || 1)) * 100}%` }}
                  />
                  <div 
                    className="bg-red-500 transition-all duration-500" 
                    style={{ width: `${(selectedProposal.againstWeight / (selectedProposal.forWeight + selectedProposal.againstWeight || 1)) * 100}%` }}
                  />
                </div>
                <p className="text-center text-xs text-gray-500 mt-3">{selectedProposal._count.votes} total votes cast</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-4 pt-6 border-t border-white/10">
                {selectedProposal.status === 'SUBMITTED' && (
                  <>
                    <button
                      onClick={() => handleVote(true)}
                      disabled={voting}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                    >
                      {voting ? 'Casting...' : 'Vote FOR'}
                    </button>
                    <button
                      onClick={() => handleVote(false)}
                      disabled={voting}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                    >
                      {voting ? 'Casting...' : 'Vote AGAINST'}
                    </button>
                  </>
                )}

                {(user?.role === 'PRESIDENT' || user?.role === 'VP') && selectedProposal.status === 'SUBMITTED' && (
                  <button
                    onClick={handleFinalize}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl border border-blue-400"
                  >
                    Finalize Tally & Close Voting
                  </button>
                )}

                {(user?.role === 'ADMIN' || user?.role === 'COORDINATOR') && selectedProposal.status === 'APPROVED' && (
                  <button
                    onClick={handleExecute}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/20"
                  >
                    Execute Proposal {selectedProposal.spendAmount ? `& Release $${selectedProposal.spendAmount}` : ''}
                  </button>
                )}
              </div>

              {/* Vote History */}
              <div className="mt-12">
                <h3 className="text-lg font-semibold text-white mb-4">Voting History</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {selectedProposal.votes.map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${v.voteFor ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-gray-300">{v.voter.name}</span>
                        <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">Weight: {v.weight.toFixed(1)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-[10px] text-gray-500">{format(new Date(v.createdAt), 'HH:mm | MMM d')}</span>
                         {v.txId && (
                           <a 
                             href={`https://testnet.explorer.perawallet.app/tx/${v.txId}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-[9px] text-blue-400 hover:underline"
                           >
                             On-chain Tx
                           </a>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center bg-white/5 border border-white/10 border-dashed rounded-2xl text-gray-500">
              <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Select a proposal to view details and vote</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Governance;
