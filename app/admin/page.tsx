'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users, UserCheck, UserPlus, Wallet, TrendingUp, TrendingDown,
  Activity, MessageSquare, Layers, ArrowUpRight, ArrowDownRight,
  ChevronRight, ShieldCheck, Target, PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuthStore } from '@/lib/store';
import { adminApi, type AdminOverview, type AdminGrowthPoint } from '@/lib/api';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#7c3aed', '#2563eb', '#047857', '#d97706', '#dc2626', '#059669'];

const GROWTH_RANGES: Array<{ label: string; value: number }> = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
];

export default function AdminOverviewPage() {
  const token = useAuthStore((state) => state.token);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [growth, setGrowth] = useState<AdminGrowthPoint[]>([]);
  const [growthDays, setGrowthDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [growthLoading, setGrowthLoading] = useState(false);

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    loadGrowth(growthDays);
  }, [growthDays]);

  const loadOverview = async () => {
    if (!token) return;
    try {
      const res = await adminApi.getOverview(token);
      setOverview(res.data);
    } catch {
      toast.error('Failed to load admin overview');
    } finally {
      setLoading(false);
    }
  };

  const loadGrowth = async (days: number) => {
    if (!token) return;
    setGrowthLoading(true);
    try {
      const res = await adminApi.getGrowth(token, days);
      setGrowth(res.data);
    } catch {
      toast.error('Failed to load growth data');
    } finally {
      setGrowthLoading(false);
    }
  };

  const growthChartData = useMemo(
    () => growth.map((g) => ({
      ...g,
      label: new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })),
    [growth],
  );

  const roleData = useMemo(() => {
    if (!overview) return [];
    return overview.users.byRole.map((r) => ({ name: r.role === 'SUPER_ADMIN' ? 'Admins' : 'Users', value: r.count }));
  }, [overview]);

  const segmentData = useMemo(() => {
    if (!overview) return [];
    return overview.accounts.bySegment.map((s) => ({ name: s.segment, value: s.count }));
  }, [overview]);

  if (loading || !overview) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-2">
          <div className="skeleton h-8 w-64 rounded-lg"></div>
          <div className="skeleton h-5 w-96 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-2xl"></div>
          ))}
        </div>
        <div className="skeleton h-80 rounded-2xl"></div>
      </div>
    );
  }

  const { users, accounts, trades, engagement, recentSignups } = overview;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-1 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-purple-primary" />
          Platform Overview
        </h1>
        <p className="text-slate-600 text-sm">Complete analytics across every user, account, and trade on Gredin</p>
      </div>

      {/* ═══ Top Stats ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <div className="stat-card stat-card-purple animate-fade-in stagger-1">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 bg-purple-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-primary" />
            </div>
            <span className="text-[10px] font-semibold text-green-primary bg-green-primary/10 px-2 py-1 rounded-md">
              +{users.newThisWeek} this week
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1 number-highlight">{users.total}</h3>
          <p className="text-xs text-slate-600">Total Users ({users.active} active)</p>
        </div>

        <div className="stat-card stat-card-blue animate-fade-in stagger-2">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 bg-blue-primary/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-primary" />
            </div>
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md border border-slate-300">
              {formatCurrency(accounts.totalCurrentBalance)}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{accounts.total}</h3>
          <p className="text-xs text-slate-600">Trading Accounts</p>
        </div>

        <div className={`stat-card ${trades.netProfitLoss >= 0 ? 'stat-card-green' : 'stat-card-red'} animate-fade-in stagger-3`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${trades.netProfitLoss >= 0 ? 'bg-green-primary/10' : 'bg-red-primary/10'}`}>
              {trades.netProfitLoss >= 0
                ? <ArrowUpRight className="w-5 h-5 text-green-primary" />
                : <ArrowDownRight className="w-5 h-5 text-red-primary" />}
            </div>
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md border border-slate-300">
              {formatPercentage(trades.winRate)} win rate
            </span>
          </div>
          <h3 className={`text-2xl font-bold mb-1 number-highlight ${trades.netProfitLoss >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
            {trades.netProfitLoss >= 0 ? '+' : ''}{formatCurrency(trades.netProfitLoss)}
          </h3>
          <p className="text-xs text-slate-600">Platform Net P/L ({trades.closed} closed trades)</p>
        </div>

        <div className="stat-card stat-card-yellow animate-fade-in stagger-4">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 bg-yellow-primary/10 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-yellow-primary" />
            </div>
            {trades.open > 0 && (
              <span className="text-[10px] font-semibold text-blue-primary bg-blue-primary/10 px-2 py-1 rounded-md">
                {trades.open} open
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{trades.total}</h3>
          <p className="text-xs text-slate-600">Total Trades Logged</p>
        </div>
      </div>

      {/* ═══ Secondary Stats ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card py-4">
          <div className="flex items-center gap-2 mb-1.5">
            <UserPlus className="w-3.5 h-3.5 text-purple-primary" />
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">New Today</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{users.newToday}</p>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-2 mb-1.5">
            <UserCheck className="w-3.5 h-3.5 text-green-primary" />
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">New (30D)</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{users.newThisMonth}</p>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-primary" />
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Templates</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{engagement.totalTemplates}</p>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-2 mb-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-yellow-primary" />
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">AI Chats</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{engagement.totalChatSessions}</p>
        </div>
      </div>

      {/* ═══ Growth Chart ═══ */}
      <div className="card animate-fade-in stagger-2">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Platform Growth</h2>
            <p className="text-xs text-slate-600 mt-0.5">New signups & trading activity over time</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl p-1">
            {GROWTH_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setGrowthDays(r.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${growthDays === r.value ? 'bg-purple-primary/15 text-purple-primary' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72">
          {growthLoading ? (
            <div className="w-full h-full skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminUsersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#1e293b', fontSize: 12 }}
                  formatter={(value: number, name: string) => [value, name === 'newUsers' ? 'New Users' : 'Trades']}
                />
                <Area type="monotone" dataKey="newUsers" stroke="#7c3aed" strokeWidth={2.5} fill="url(#adminUsersGradient)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ═══ Trades Volume + Distribution ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2 animate-fade-in stagger-3">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Trading Activity</h2>
          <p className="text-xs text-slate-600 mb-4">Trades logged per day across the platform</p>
          <div className="h-64">
            {growthLoading ? (
              <div className="w-full h-full skeleton rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#1e293b', fontSize: 12 }}
                    formatter={(value: number) => [value, 'Trades']}
                  />
                  <Bar dataKey="trades" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card animate-fade-in stagger-4">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Accounts by Segment</h2>
          <p className="text-xs text-slate-600 mb-4">Market segment distribution</p>
          {segmentData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-slate-600">No accounts yet.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={82}
                    paddingAngle={4}
                    label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {segmentData.map((entry, idx) => (
                      <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#1e293b', fontSize: 12 }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ═══ P&L Breakdown + Account Types + Recent Signups ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card animate-fade-in stagger-3">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-primary" />
            Platform P&amp;L
          </h2>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 bg-green-primary/5 border border-green-primary/20 rounded-xl">
              <div>
                <p className="text-[10px] text-slate-600">Gross Profit</p>
                <p className="text-lg font-bold text-green-primary">{formatCurrency(trades.totalGrossProfit)}</p>
              </div>
              <span className="text-xs font-bold text-green-primary bg-green-primary/10 px-2 py-1 rounded-lg">
                {trades.winningTrades} wins
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-primary/5 border border-red-primary/20 rounded-xl">
              <div>
                <p className="text-[10px] text-slate-600">Gross Loss</p>
                <p className="text-lg font-bold text-red-primary">{formatCurrency(trades.totalGrossLoss)}</p>
              </div>
              <span className="text-xs font-bold text-red-primary bg-red-primary/10 px-2 py-1 rounded-lg">
                {trades.losingTrades} losses
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-300 mt-2 pt-3">
              <span className="text-xs text-slate-600">Profit Factor</span>
              <span className="text-xs font-bold text-slate-900">
                {trades.profitFactor >= 999 ? '∞' : trades.profitFactor.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="card animate-fade-in stagger-4">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-blue-primary" />
            Accounts by Type
          </h2>
          <div className="space-y-2">
            {accounts.byType.map((a) => {
              const pct = accounts.total > 0 ? (a.count / accounts.total) * 100 : 0;
              return (
                <div key={a.type}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span className="font-medium">{a.type}</span>
                    <span className="font-bold text-slate-900">{a.count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {accounts.byType.length === 0 && <p className="text-xs text-slate-600">No accounts yet.</p>}
          </div>
        </div>

        <div className="card animate-fade-in stagger-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Recent Signups</h2>
            <Link href="/admin/users" className="flex items-center gap-1 text-xs text-purple-primary hover:text-purple-600 transition-colors font-medium">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentSignups.slice(0, 5).map((u) => (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-300 hover:border-purple-primary/30 hover:bg-purple-primary/5 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-purple-primary">
                    {(u.name || u.email)[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{u.name || 'Unnamed'}</p>
                  <p className="text-[10px] text-slate-600 truncate">{u.email}</p>
                </div>
                <span className="text-[10px] text-slate-500 flex-shrink-0">{formatDate(u.createdAt)}</span>
              </Link>
            ))}
            {recentSignups.length === 0 && <p className="text-xs text-slate-600">No users yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
