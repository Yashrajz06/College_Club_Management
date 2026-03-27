import React, { useEffect, useState } from 'react';
import { apiFetch } from './lib/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { 
  TrendingUp, Users, ShieldCheck, Coins, Activity, 
  ChevronRight, Award, Trophy, Timer
} from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dash, lb] = await Promise.all([
          apiFetch('/analytics/dashboard'),
          apiFetch('/analytics/leaderboard?limit=10')
        ]);
        setData(dash);
        setLeaderboard(lb);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-indigo-500">
    <Activity className="animate-spin mr-2" /> Loading high-fidelity analytics...
  </div>;

  if (error) return <div className="p-8 text-red-500 bg-red-50 rounded-2xl border border-red-100">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Intelligence Dashboard</h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            Real-time multi-dimensional analytics for college ecosystem governance
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold border border-indigo-100">
          <Timer size={16} /> Updated {new Date().toLocaleTimeString()}
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Verified Members', value: data.memberCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'On-chain Treasury', value: `$${data.totalBudget.toLocaleString()}`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Tokens', value: data.tokenMetrics.totalActiveTokens, icon: Coins, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Participation Rate', value: `${data.participationRate}%`, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <s.icon size={24} />
            </div>
            <p className="text-slate-500 text-sm font-medium">{s.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Token Distribution */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 px-2">Governance Proof-of-Action</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.tokenMetrics.distributionByAction}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="action"
                >
                  {data.tokenMetrics.distributionByAction.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.2)" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 px-2">Ecosystem Growth Velocity</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyEventTrend}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Trends */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 px-2">Attendance Fidelity (LTM)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.attendanceRateTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="event" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} unit="%" />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="rate" fill="#ec4899" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-lg font-bold text-slate-900">Governance Leaderboard</h3>
            <Trophy className="text-amber-500" />
          </div>
          <div className="flex-grow overflow-auto">
            <table className="w-full">
              <thead className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="pb-4">Rank</th>
                  <th className="pb-4">Contributor</th>
                  <th className="pb-4 text-right">Tokens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaderboard.leaderboard.map((item: any) => (
                  <tr key={item.userId} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        item.rank === 1 ? 'bg-amber-100 text-amber-700' : 
                        item.rank === 2 ? 'bg-slate-200 text-slate-700' :
                        item.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-4">
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 uppercase tracking-tighter">
                          {item.role} • {item.department}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right font-black text-slate-900">
                      {item.totalTokens}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Activity size={200} />
        </div>
        <h3 className="text-2xl font-black mb-8 relative z-10 flex items-center gap-3">
          <Activity className="text-indigo-400" />
          Live Governance Stream
        </h3>
        <div className="space-y-6 relative z-10">
          {data.recentActivity.map((event: any) => (
            <div key={event.id} className="flex gap-4 group">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-indigo-500 rounded-full group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                <div className="w-0.5 flex-grow bg-slate-800 my-1" />
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{event.entityType}</span>
                  <span className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-slate-200 font-medium"> 
                  <span className="text-white font-bold">{event.action.replace('_', ' ')}</span> performed on entity 
                  <span className="bg-slate-800 px-2 py-0.5 rounded ml-2 font-mono text-[10px]">{event.entityId.slice(0,8)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
