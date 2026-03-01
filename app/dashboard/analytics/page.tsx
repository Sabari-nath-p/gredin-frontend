'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Target, PieChart,
  ArrowUpRight, ArrowDownRight, Activity, Wallet,
  Calendar, ChevronLeft, ChevronRight, Flame,
  Award, Zap, Clock, Hash, ArrowUp, ArrowDown,
  Filter
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { tradeAccountApi, tradeEntryApi, type TradeAccount, type TradeStats, type TradeEntry } from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AccountWithStats {
  account: TradeAccount;
  stats: TradeStats;
  trades: TradeEntry[];
}

// ─── Helpers ───
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AnalyticsPage() {
  const token = useAuthStore((state) => state.token);
  const [accountsWithStats, setAccountsWithStats] = useState<AccountWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'instruments' | 'streaks'>('overview');

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    if (!token) return;
    try {
      const accountsRes = await tradeAccountApi.getAll(token);
      const accountsData: AccountWithStats[] = [];
      for (const account of accountsRes.data) {
        try {
          const [statsRes, tradesRes] = await Promise.all([
            tradeEntryApi.getStats(token, account.id),
            tradeEntryApi.getByAccount(token, account.id),
          ]);
          accountsData.push({ account, stats: statsRes.data, trades: tradesRes.data });
        } catch {}
      }
      setAccountsWithStats(accountsData);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // ─── Filtered data ───
  const filteredData = selectedAccount === 'all'
    ? accountsWithStats
    : accountsWithStats.filter(item => item.account.id === selectedAccount);

  const allTrades = useMemo(() => filteredData.flatMap(a => a.trades), [filteredData]);
  const closedTrades = useMemo(() => allTrades.filter(t => t.status === 'CLOSED'), [allTrades]);

  // ─── Aggregated stats ───
  const totalStats = useMemo(() => filteredData.reduce((acc, item) => ({
    totalTrades: acc.totalTrades + item.stats.totalTrades,
    openTrades: acc.openTrades + (item.stats.openTrades ?? 0),
    closedTrades: acc.closedTrades + (item.stats.closedTrades ?? 0),
    winningTrades: acc.winningTrades + item.stats.winningTrades,
    losingTrades: acc.losingTrades + item.stats.losingTrades,
    breakEvenTrades: acc.breakEvenTrades + (item.stats.breakEvenTrades ?? 0),
    totalProfit: acc.totalProfit + item.stats.totalProfit,
    totalLoss: acc.totalLoss + item.stats.totalLoss,
    netProfitLoss: acc.netProfitLoss + item.stats.netProfitLoss,
    largestWin: Math.max(acc.largestWin, item.stats.largestWin ?? 0),
    largestLoss: Math.max(acc.largestLoss, item.stats.largestLoss ?? 0),
  }), {
    totalTrades: 0, openTrades: 0, closedTrades: 0, winningTrades: 0, losingTrades: 0,
    breakEvenTrades: 0, totalProfit: 0, totalLoss: 0, netProfitLoss: 0, largestWin: 0, largestLoss: 0
  }), [filteredData]);

  const overallWinRate = totalStats.closedTrades > 0
    ? (totalStats.winningTrades / totalStats.closedTrades) * 100 : 0;
  const profitFactor = totalStats.totalLoss > 0
    ? totalStats.totalProfit / totalStats.totalLoss
    : totalStats.totalProfit > 0 ? Infinity : 0;
  const avgWin = totalStats.winningTrades > 0 ? totalStats.totalProfit / totalStats.winningTrades : 0;
  const avgLoss = totalStats.losingTrades > 0 ? totalStats.totalLoss / totalStats.losingTrades : 0;
  const expectancy = totalStats.closedTrades > 0
    ? ((overallWinRate / 100) * avgWin) - ((1 - overallWinRate / 100) * avgLoss) : 0;

  // ─── Calendar data (daily P/L map) ───
  const dailyPL = useMemo(() => {
    const map: Record<string, { pl: number; wins: number; losses: number; even: number; trades: TradeEntry[] }> = {};
    closedTrades.forEach(t => {
      const d = new Date(t.entryDateTime).toISOString().slice(0, 10);
      if (!map[d]) map[d] = { pl: 0, wins: 0, losses: 0, even: 0, trades: [] };
      const pl = Number(t.realisedProfitLoss) || 0;
      if (t.result === 'PROFIT') { map[d].pl += pl; map[d].wins++; }
      else if (t.result === 'LOSS') {
        map[d].pl -= (Number(t.stopLossAmount) + Number(t.serviceCharge));
        map[d].losses++;
      } else { map[d].pl -= Number(t.serviceCharge) || 0; map[d].even++; }
      map[d].trades.push(t);
    });
    return map;
  }, [closedTrades]);

  // ─── Instrument breakdown ───
  const instrumentData = useMemo(() => {
    const map: Record<string, { trades: number; wins: number; losses: number; pl: number }> = {};
    closedTrades.forEach(t => {
      const ins = t.instrument;
      if (!map[ins]) map[ins] = { trades: 0, wins: 0, losses: 0, pl: 0 };
      map[ins].trades++;
      if (t.result === 'PROFIT') {
        map[ins].wins++;
        map[ins].pl += Number(t.realisedProfitLoss) || 0;
      } else if (t.result === 'LOSS') {
        map[ins].losses++;
        map[ins].pl -= (Number(t.stopLossAmount) + Number(t.serviceCharge));
      }
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data, winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0 }))
      .sort((a, b) => b.trades - a.trades);
  }, [closedTrades]);

  // ─── Streak calculations ───
  const streaks = useMemo(() => {
    const sorted = [...closedTrades].sort((a, b) =>
      new Date(a.entryDateTime).getTime() - new Date(b.entryDateTime).getTime()
    );
    let currentWin = 0, currentLoss = 0, maxWin = 0, maxLoss = 0;
    let current = 0;
    sorted.forEach(t => {
      if (t.result === 'PROFIT') {
        currentWin++; currentLoss = 0; current++;
        maxWin = Math.max(maxWin, currentWin);
      } else if (t.result === 'LOSS') {
        currentLoss++; currentWin = 0; current--;
        maxLoss = Math.max(maxLoss, currentLoss);
      } else {
        currentWin = 0; currentLoss = 0;
      }
    });
    // Current streak
    let currentStreak = 0;
    let currentType: 'win' | 'loss' | 'none' = 'none';
    for (let i = sorted.length - 1; i >= 0; i--) {
      const r = sorted[i].result;
      if (i === sorted.length - 1) {
        if (r === 'PROFIT') { currentType = 'win'; currentStreak = 1; }
        else if (r === 'LOSS') { currentType = 'loss'; currentStreak = 1; }
        else break;
      } else {
        if (currentType === 'win' && r === 'PROFIT') currentStreak++;
        else if (currentType === 'loss' && r === 'LOSS') currentStreak++;
        else break;
      }
    }
    return { maxWin, maxLoss, currentStreak, currentType };
  }, [closedTrades]);

  // ─── Monthly P/L for the selected calendar month ───
  const monthPL = useMemo(() => {
    let total = 0;
    let wins = 0, losses = 0;
    Object.entries(dailyPL).forEach(([date, data]) => {
      const d = new Date(date);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        total += data.pl;
        wins += data.wins;
        losses += data.losses;
      }
    });
    return { total, wins, losses };
  }, [dailyPL, calMonth, calYear]);

  // ─── Direction stats ───
  const directionStats = useMemo(() => {
    const buys = closedTrades.filter(t => t.direction === 'BUY');
    const sells = closedTrades.filter(t => t.direction === 'SELL');
    const buyWins = buys.filter(t => t.result === 'PROFIT').length;
    const sellWins = sells.filter(t => t.result === 'PROFIT').length;
    return {
      buyCount: buys.length, buyWins, buyWinRate: buys.length > 0 ? (buyWins / buys.length) * 100 : 0,
      sellCount: sells.length, sellWins, sellWinRate: sells.length > 0 ? (sellWins / sells.length) * 100 : 0,
    };
  }, [closedTrades]);

  // ─── Calendar heatmap max for color scaling ───
  const maxAbsPL = useMemo(() => {
    let max = 1;
    Object.values(dailyPL).forEach(v => { max = Math.max(max, Math.abs(v.pl)); });
    return max;
  }, [dailyPL]);

  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="skeleton h-8 w-52 rounded-lg"></div>
          <div className="skeleton h-10 w-40 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (<div key={i} className="skeleton h-28 rounded-2xl"></div>))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-72 rounded-2xl"></div>
          <div className="skeleton h-72 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // ─── Calendar builder ───
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  const calendarCells: (null | { day: number; key: string })[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ day: d, key });
  }

  return (
    <div className="w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-light tracking-tight">Analytics Dashboard</h1>
          <p className="text-xs text-gray-text mt-0.5">
            {closedTrades.length} closed trades across {filteredData.length} account{filteredData.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-text" />
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="input text-sm py-1.5 px-3"
          >
            <option value="all">All Accounts</option>
            {accountsWithStats.map(item => (
              <option key={item.account.id} value={item.account.id}>
                {item.account.accountName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {accountsWithStats.length === 0 ? (
        <div className="card text-center py-16">
          <div className="empty-state-icon mx-auto">
            <BarChart3 className="w-10 h-10 text-gray-text" />
          </div>
          <h3 className="text-lg font-semibold text-gray-light mb-2">No Data Available</h3>
          <p className="text-sm text-gray-text">Start logging trades to see your analytics</p>
        </div>
      ) : (
        <>
          {/* ═══════ TOP STATS ROW ═══════ */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            <div className="stat-card stat-card-green">
              <div className="flex items-center gap-1.5 mb-2">
                <Hash className="w-3.5 h-3.5 text-green-primary" />
                <span className="text-[10px] text-gray-text font-medium uppercase tracking-wider">Trades</span>
              </div>
              <p className="text-xl font-bold text-gray-light">{totalStats.closedTrades}</p>
              <p className="text-[10px] text-gray-text mt-0.5">
                <span className="text-green-primary">{totalStats.winningTrades}W</span>
                {' / '}
                <span className="text-red-primary">{totalStats.losingTrades}L</span>
                {totalStats.breakEvenTrades > 0 && <span> / {totalStats.breakEvenTrades}E</span>}
              </p>
            </div>

            <div className="stat-card stat-card-blue">
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5 text-blue-primary" />
                <span className="text-[10px] text-gray-text font-medium uppercase tracking-wider">Win Rate</span>
              </div>
              <p className="text-xl font-bold text-green-primary">{formatPercentage(overallWinRate)}</p>
              <div className="w-full h-1.5 bg-dark-border rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-green-primary rounded-full transition-all" style={{ width: `${overallWinRate}%` }} />
              </div>
            </div>

            <div className={`stat-card ${totalStats.netProfitLoss >= 0 ? 'stat-card-green' : 'stat-card-red'}`}>
              <div className="flex items-center gap-1.5 mb-2">
                {totalStats.netProfitLoss >= 0
                  ? <ArrowUpRight className="w-3.5 h-3.5 text-green-primary" />
                  : <ArrowDownRight className="w-3.5 h-3.5 text-red-primary" />}
                <span className="text-[10px] text-gray-text font-medium uppercase tracking-wider">Net P/L</span>
              </div>
              <p className={`text-xl font-bold ${totalStats.netProfitLoss >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                {formatCurrency(totalStats.netProfitLoss)}
              </p>
            </div>

            <div className="stat-card stat-card-yellow">
              <div className="flex items-center gap-1.5 mb-2">
                <PieChart className="w-3.5 h-3.5 text-yellow-primary" />
                <span className="text-[10px] text-gray-text font-medium uppercase tracking-wider">Profit Factor</span>
              </div>
              <p className="text-xl font-bold text-gray-light">
                {profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}
              </p>
            </div>

            <div className="stat-card stat-card-purple col-span-2 lg:col-span-1">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] text-gray-text font-medium uppercase tracking-wider">Expectancy</span>
              </div>
              <p className={`text-xl font-bold ${expectancy >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                {formatCurrency(expectancy)}
              </p>
              <p className="text-[10px] text-gray-text mt-0.5">per trade avg</p>
            </div>
          </div>

          {/* ═══════ TAB NAVIGATION ═══════ */}
          <div className="flex items-center gap-1 bg-dark-card border border-dark-border rounded-xl p-1 mb-5 overflow-x-auto">
            {([
              { key: 'overview', label: 'Overview', icon: Activity },
              { key: 'calendar', label: 'Calendar', icon: Calendar },
              { key: 'instruments', label: 'Instruments', icon: BarChart3 },
              { key: 'streaks', label: 'Streaks & Stats', icon: Flame },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-green-primary/15 text-green-primary border border-green-primary/30'
                    : 'text-gray-text hover:text-gray-light'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══════ TAB: OVERVIEW ═══════ */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-12 gap-4">
              {/* P/L Breakdown */}
              <div className="col-span-12 lg:col-span-4 card">
                <h2 className="text-sm font-bold text-gray-light mb-4">Profit & Loss</h2>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 bg-green-primary/5 border border-green-primary/20 rounded-xl">
                    <div>
                      <p className="text-[10px] text-gray-text">Total Profit</p>
                      <p className="text-lg font-bold text-green-primary">{formatCurrency(totalStats.totalProfit)}</p>
                    </div>
                    <span className="text-xs font-bold text-green-primary bg-green-primary/10 px-2 py-1 rounded-lg">
                      {totalStats.winningTrades} wins
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-primary/5 border border-red-primary/20 rounded-xl">
                    <div>
                      <p className="text-[10px] text-gray-text">Total Loss</p>
                      <p className="text-lg font-bold text-red-primary">{formatCurrency(totalStats.totalLoss)}</p>
                    </div>
                    <span className="text-xs font-bold text-red-primary bg-red-primary/10 px-2 py-1 rounded-lg">
                      {totalStats.losingTrades} losses
                    </span>
                  </div>
                  {/* Win Rate bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[10px] text-gray-text mb-1">
                      <span>Win Rate</span>
                      <span className="font-bold text-green-primary">{formatPercentage(overallWinRate)}</span>
                    </div>
                    <div className="w-full h-2.5 bg-dark-border rounded-full overflow-hidden flex">
                      <div className="h-full bg-green-primary rounded-l-full transition-all" style={{ width: `${overallWinRate}%` }} />
                      <div className="h-full bg-red-primary rounded-r-full transition-all" style={{ width: `${100 - overallWinRate}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] mt-1">
                      <span className="text-green-primary">{totalStats.winningTrades} W</span>
                      <span className="text-red-primary">{totalStats.losingTrades} L</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="col-span-12 lg:col-span-4 card">
                <h2 className="text-sm font-bold text-gray-light mb-4">Key Metrics</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Average Win', value: formatCurrency(avgWin), color: 'text-green-primary' },
                    { label: 'Average Loss', value: formatCurrency(avgLoss), color: 'text-red-primary' },
                    { label: 'Largest Win', value: formatCurrency(totalStats.largestWin), color: 'text-green-primary' },
                    { label: 'Largest Loss', value: formatCurrency(totalStats.largestLoss), color: 'text-red-primary' },
                    { label: 'Profit Factor', value: profitFactor === Infinity ? '∞' : profitFactor.toFixed(2), color: 'text-gray-light' },
                    { label: 'Expectancy', value: formatCurrency(expectancy), color: expectancy >= 0 ? 'text-green-primary' : 'text-red-primary' },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-dark-border/30 last:border-0">
                      <span className="text-xs text-gray-text">{m.label}</span>
                      <span className={`text-xs font-bold ${m.color}`}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direction & Account Performance */}
              <div className="col-span-12 lg:col-span-4 space-y-4">
                {/* Direction split */}
                <div className="card">
                  <h2 className="text-sm font-bold text-gray-light mb-3">By Direction</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-green-primary/5 border border-green-primary/20 text-center">
                      <ArrowUp className="w-4 h-4 text-green-primary mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-light">{directionStats.buyCount}</p>
                      <p className="text-[10px] text-gray-text">LONG trades</p>
                      <p className="text-xs font-bold text-green-primary mt-1">{formatPercentage(directionStats.buyWinRate)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-red-primary/5 border border-red-primary/20 text-center">
                      <ArrowDown className="w-4 h-4 text-red-primary mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-light">{directionStats.sellCount}</p>
                      <p className="text-[10px] text-gray-text">SHORT trades</p>
                      <p className="text-xs font-bold text-green-primary mt-1">{formatPercentage(directionStats.sellWinRate)}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Streaks */}
                <div className="card">
                  <h2 className="text-sm font-bold text-gray-light mb-3">Streaks</h2>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-dark-bg/50 border border-dark-border">
                      <p className="text-lg font-bold text-green-primary">{streaks.maxWin}</p>
                      <p className="text-[10px] text-gray-text">Best Win</p>
                    </div>
                    <div className="p-2 rounded-lg bg-dark-bg/50 border border-dark-border">
                      <p className="text-lg font-bold text-red-primary">{streaks.maxLoss}</p>
                      <p className="text-[10px] text-gray-text">Worst Loss</p>
                    </div>
                    <div className="p-2 rounded-lg bg-dark-bg/50 border border-dark-border">
                      <p className={`text-lg font-bold ${streaks.currentType === 'win' ? 'text-green-primary' : streaks.currentType === 'loss' ? 'text-red-primary' : 'text-gray-text'}`}>
                        {streaks.currentStreak}
                      </p>
                      <p className="text-[10px] text-gray-text">Current</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Performance — full width */}
              {filteredData.length > 1 && (
                <div className="col-span-12 card">
                  <h2 className="text-sm font-bold text-gray-light mb-4">Account Performance</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredData.map(({ account, stats }) => {
                      const pl = Number(account.currentBalance) - Number(account.initialBalance);
                      const plPct = Number(account.initialBalance) > 0 ? (pl / Number(account.initialBalance)) * 100 : 0;
                      return (
                        <div key={account.id} className="p-3 bg-dark-bg/60 rounded-xl border border-dark-border/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Wallet className="w-3.5 h-3.5 text-green-primary" />
                              <span className="font-semibold text-gray-light text-xs">{account.accountName}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              account.accountType === 'LIVE' ? 'bg-green-primary/10 text-green-primary' :
                              account.accountType === 'DEMO' ? 'bg-blue-primary/10 text-blue-primary' :
                              'bg-yellow-primary/10 text-yellow-primary'
                            }`}>{account.accountType}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div>
                              <p className="text-[10px] text-gray-text">Balance</p>
                              <p className="text-xs font-bold text-green-primary">{formatCurrency(Number(account.currentBalance))}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-text">P/L</p>
                              <p className={`text-xs font-bold ${pl >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                                {pl >= 0 ? '+' : ''}{formatPercentage(plPct)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-text">Trades</p>
                              <p className="text-xs font-bold text-gray-light">{stats.totalTrades}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-text">Win Rate</p>
                              <p className="text-xs font-bold text-green-primary">{formatPercentage(stats.winRate ?? 0)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════ TAB: CALENDAR ═══════ */}
          {activeTab === 'calendar' && (
            <div className="grid grid-cols-12 gap-4">
              {/* Calendar */}
              <div className="col-span-12 lg:col-span-8 card">
                {/* Calendar header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-light flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-primary" />
                    {MONTH_NAMES[calMonth]} {calYear}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                      className="w-7 h-7 rounded-lg bg-dark-bg border border-dark-border flex items-center justify-center hover:border-green-primary/50 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-gray-text" />
                    </button>
                    <button
                      onClick={() => { const n = new Date(); setCalMonth(n.getMonth()); setCalYear(n.getFullYear()); }}
                      className="px-3 py-1 rounded-lg text-[10px] font-semibold text-gray-text hover:text-green-primary border border-dark-border hover:border-green-primary/50 transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                      className="w-7 h-7 rounded-lg bg-dark-bg border border-dark-border flex items-center justify-center hover:border-green-primary/50 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-gray-text" />
                    </button>
                  </div>
                </div>

                {/* Day labels */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_LABELS.map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-gray-text uppercase tracking-wider py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((cell, idx) => {
                    if (!cell) return <div key={`empty-${idx}`} className="aspect-square" />;
                    const data = dailyPL[cell.key];
                    const isToday = cell.key === new Date().toISOString().slice(0, 10);
                    const isHovered = hoveredDay === cell.key;

                    let bgColor = 'bg-dark-bg/30';
                    let textColor = 'text-gray-text';
                    if (data) {
                      const intensity = Math.min(Math.abs(data.pl) / maxAbsPL, 1);
                      const alpha = Math.max(0.1, intensity * 0.5);
                      if (data.pl > 0) {
                        bgColor = `bg-green-primary/${Math.round(alpha * 100)}`;
                        textColor = 'text-green-primary';
                      } else if (data.pl < 0) {
                        bgColor = `bg-red-primary/${Math.round(alpha * 100)}`;
                        textColor = 'text-red-primary';
                      } else {
                        bgColor = 'bg-yellow-primary/10';
                        textColor = 'text-yellow-primary';
                      }
                    }

                    // Use explicit classes for Tailwind JIT safety
                    let cellBg = 'bg-dark-bg/30';
                    let cellText = 'text-gray-text';
                    if (data) {
                      if (data.pl > 0) {
                        const pct = Math.abs(data.pl) / maxAbsPL;
                        cellBg = pct > 0.6 ? 'bg-green-primary/30' : pct > 0.3 ? 'bg-green-primary/20' : 'bg-green-primary/10';
                        cellText = 'text-green-primary';
                      } else if (data.pl < 0) {
                        const pct = Math.abs(data.pl) / maxAbsPL;
                        cellBg = pct > 0.6 ? 'bg-red-primary/30' : pct > 0.3 ? 'bg-red-primary/20' : 'bg-red-primary/10';
                        cellText = 'text-red-primary';
                      } else {
                        cellBg = 'bg-yellow-primary/10';
                        cellText = 'text-yellow-primary';
                      }
                    }

                    return (
                      <div
                        key={cell.key}
                        onMouseEnter={() => setHoveredDay(cell.key)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`relative aspect-square rounded-lg border transition-all cursor-default flex flex-col items-center justify-center ${cellBg} ${
                          isToday ? 'border-green-primary' : isHovered && data ? 'border-gray-text/50' : 'border-transparent'
                        }`}
                      >
                        <span className={`text-xs font-medium ${data ? cellText : 'text-gray-text/60'}`}>
                          {cell.day}
                        </span>
                        {data && (
                          <span className={`text-[8px] font-bold ${cellText} mt-0.5 leading-none`}>
                            {data.pl >= 0 ? '+' : ''}{data.pl.toFixed(0)}
                          </span>
                        )}
                        {data && data.trades.length > 0 && (
                          <div className="flex gap-0.5 mt-0.5">
                            {data.wins > 0 && <div className="w-1 h-1 rounded-full bg-green-primary" />}
                            {data.losses > 0 && <div className="w-1 h-1 rounded-full bg-red-primary" />}
                            {data.even > 0 && <div className="w-1 h-1 rounded-full bg-yellow-primary" />}
                          </div>
                        )}

                        {/* Tooltip */}
                        {isHovered && data && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-44 p-2.5 rounded-xl bg-dark-card border border-dark-border shadow-elevated text-left pointer-events-none">
                            <p className="text-[10px] text-gray-text mb-1">{new Date(cell.key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            <p className={`text-sm font-bold ${data.pl >= 0 ? 'text-green-primary' : 'text-red-primary'} mb-1`}>
                              {data.pl >= 0 ? '+' : ''}{formatCurrency(data.pl)}
                            </p>
                            <div className="flex gap-2 text-[10px]">
                              <span className="text-green-primary">{data.wins}W</span>
                              <span className="text-red-primary">{data.losses}L</span>
                              {data.even > 0 && <span className="text-yellow-primary">{data.even}E</span>}
                            </div>
                            <div className="mt-1.5 pt-1.5 border-t border-dark-border/50 space-y-0.5">
                              {data.trades.slice(0, 3).map(t => (
                                <div key={t.id} className="flex items-center justify-between">
                                  <span className="text-[10px] text-gray-text">{t.instrument}</span>
                                  <span className={`text-[10px] font-bold ${t.result === 'PROFIT' ? 'text-green-primary' : t.result === 'LOSS' ? 'text-red-primary' : 'text-yellow-primary'}`}>
                                    {t.result === 'PROFIT' ? '+' : '-'}{formatCurrency(Math.abs(Number(t.realisedProfitLoss) || 0))}
                                  </span>
                                </div>
                              ))}
                              {data.trades.length > 3 && (
                                <p className="text-[9px] text-gray-text">+{data.trades.length - 3} more</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-dark-border/30">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-primary/20" /><span className="text-[10px] text-gray-text">Profit Day</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-primary/20" /><span className="text-[10px] text-gray-text">Loss Day</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-primary/10" /><span className="text-[10px] text-gray-text">Break Even</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border border-green-primary" /><span className="text-[10px] text-gray-text">Today</span></div>
                </div>
              </div>

              {/* Month Summary sidebar */}
              <div className="col-span-12 lg:col-span-4 space-y-4">
                <div className="card">
                  <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider mb-3">Month Summary</h3>
                  <div className={`text-center p-4 rounded-xl mb-3 ${monthPL.total >= 0 ? 'bg-green-primary/5' : 'bg-red-primary/5'}`}>
                    <p className="text-[10px] text-gray-text uppercase tracking-wider mb-1">Net P/L</p>
                    <p className={`text-2xl font-bold ${monthPL.total >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                      {monthPL.total >= 0 ? '+' : ''}{formatCurrency(monthPL.total)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-dark-bg/50 border border-dark-border text-center">
                      <p className="text-lg font-bold text-green-primary">{monthPL.wins}</p>
                      <p className="text-[10px] text-gray-text">Wins</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-dark-bg/50 border border-dark-border text-center">
                      <p className="text-lg font-bold text-red-primary">{monthPL.losses}</p>
                      <p className="text-[10px] text-gray-text">Losses</p>
                    </div>
                  </div>
                  {(monthPL.wins + monthPL.losses) > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-gray-text mb-1">
                        <span>Month Win Rate</span>
                        <span className="font-bold text-green-primary">
                          {formatPercentage((monthPL.wins / (monthPL.wins + monthPL.losses)) * 100)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-dark-border rounded-full overflow-hidden">
                        <div className="h-full bg-green-primary rounded-full" style={{ width: `${(monthPL.wins / (monthPL.wins + monthPL.losses)) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Hovered day detail */}
                <div className="card">
                  <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider mb-3">
                    {hoveredDay ? new Date(hoveredDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Hover a day'}
                  </h3>
                  {hoveredDay && dailyPL[hoveredDay] ? (
                    <div className="space-y-2">
                      {dailyPL[hoveredDay].trades.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-bg/50 border border-dark-border/50">
                          <div>
                            <p className="text-xs font-semibold text-gray-light">{t.instrument}</p>
                            <p className="text-[10px] text-gray-text">
                              {t.direction} • {new Date(t.entryDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={`text-xs font-bold ${t.result === 'PROFIT' ? 'text-green-primary' : t.result === 'LOSS' ? 'text-red-primary' : 'text-yellow-primary'}`}>
                            {t.result === 'PROFIT' ? '+' : t.result === 'LOSS' ? '-' : ''}{formatCurrency(Math.abs(Number(t.realisedProfitLoss) || 0))}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-text">Hover over a calendar day to see trade details</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════ TAB: INSTRUMENTS ═══════ */}
          {activeTab === 'instruments' && (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 card">
                <h2 className="text-sm font-bold text-gray-light mb-4">Instrument Performance</h2>
                {instrumentData.length === 0 ? (
                  <p className="text-xs text-gray-text py-8 text-center">No closed trades to analyze</p>
                ) : (
                  <div className="space-y-2">
                    {instrumentData.map((ins, idx) => {
                      const maxTrades = instrumentData[0]?.trades || 1;
                      return (
                        <div key={ins.name} className="p-3 rounded-xl bg-dark-bg/40 border border-dark-border/50 hover:border-dark-border transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-gray-text font-mono w-5">#{idx + 1}</span>
                              <span className="text-sm font-bold text-gray-light">{ins.name}</span>
                              <span className="text-[10px] text-gray-text">{ins.trades} trades</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold ${ins.pl >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                                {ins.pl >= 0 ? '+' : ''}{formatCurrency(ins.pl)}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                ins.winRate >= 60 ? 'bg-green-primary/10 text-green-primary' :
                                ins.winRate >= 40 ? 'bg-yellow-primary/10 text-yellow-primary' :
                                'bg-red-primary/10 text-red-primary'
                              }`}>
                                {formatPercentage(ins.winRate)}
                              </span>
                            </div>
                          </div>
                          {/* Visual bar */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-dark-border rounded-full overflow-hidden flex">
                              <div className="h-full bg-green-primary rounded-l-full" style={{ width: `${(ins.wins / ins.trades) * 100}%` }} />
                              <div className="h-full bg-red-primary rounded-r-full" style={{ width: `${(ins.losses / ins.trades) * 100}%` }} />
                            </div>
                            <div className="flex gap-2 text-[10px] w-20 justify-end">
                              <span className="text-green-primary">{ins.wins}W</span>
                              <span className="text-red-primary">{ins.losses}L</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top / Bottom instruments */}
              {instrumentData.length >= 2 && (
                <>
                  <div className="col-span-12 lg:col-span-6 card">
                    <h2 className="text-sm font-bold text-gray-light mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-green-primary" />
                      Most Profitable
                    </h2>
                    <div className="space-y-2">
                      {[...instrumentData].sort((a, b) => b.pl - a.pl).slice(0, 5).map(ins => (
                        <div key={ins.name} className="flex items-center justify-between p-2.5 rounded-lg bg-green-primary/5 border border-green-primary/10">
                          <div>
                            <span className="text-xs font-bold text-gray-light">{ins.name}</span>
                            <span className="text-[10px] text-gray-text ml-2">{ins.trades} trades</span>
                          </div>
                          <span className="text-xs font-bold text-green-primary">+{formatCurrency(ins.pl)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-6 card">
                    <h2 className="text-sm font-bold text-gray-light mb-3 flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-red-primary" />
                      Least Profitable
                    </h2>
                    <div className="space-y-2">
                      {[...instrumentData].sort((a, b) => a.pl - b.pl).slice(0, 5).map(ins => (
                        <div key={ins.name} className="flex items-center justify-between p-2.5 rounded-lg bg-red-primary/5 border border-red-primary/10">
                          <div>
                            <span className="text-xs font-bold text-gray-light">{ins.name}</span>
                            <span className="text-[10px] text-gray-text ml-2">{ins.trades} trades</span>
                          </div>
                          <span className="text-xs font-bold text-red-primary">{formatCurrency(ins.pl)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══════ TAB: STREAKS & DETAILED STATS ═══════ */}
          {activeTab === 'streaks' && (
            <div className="grid grid-cols-12 gap-4">
              {/* Streak cards */}
              <div className="col-span-12 lg:col-span-4 card">
                <h2 className="text-sm font-bold text-gray-light mb-4 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Trading Streaks
                </h2>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-green-primary/5 border border-green-primary/20 text-center">
                    <p className="text-3xl font-bold text-green-primary">{streaks.maxWin}</p>
                    <p className="text-xs text-gray-text mt-1">Best Winning Streak</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-primary/5 border border-red-primary/20 text-center">
                    <p className="text-3xl font-bold text-red-primary">{streaks.maxLoss}</p>
                    <p className="text-xs text-gray-text mt-1">Worst Losing Streak</p>
                  </div>
                  <div className={`p-4 rounded-xl text-center ${
                    streaks.currentType === 'win' ? 'bg-green-primary/5 border border-green-primary/20'
                    : streaks.currentType === 'loss' ? 'bg-red-primary/5 border border-red-primary/20'
                    : 'bg-dark-bg/50 border border-dark-border'
                  }`}>
                    <p className={`text-3xl font-bold ${
                      streaks.currentType === 'win' ? 'text-green-primary'
                      : streaks.currentType === 'loss' ? 'text-red-primary'
                      : 'text-gray-text'
                    }`}>{streaks.currentStreak}</p>
                    <p className="text-xs text-gray-text mt-1">
                      Current Streak {streaks.currentType !== 'none' && `(${streaks.currentType === 'win' ? 'Winning' : 'Losing'})`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Stats table */}
              <div className="col-span-12 lg:col-span-8 card">
                <h2 className="text-sm font-bold text-gray-light mb-4">Detailed Account Statistics</h2>
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-dark-border/50">
                        <th className="text-left text-[10px] font-semibold text-gray-text uppercase tracking-wider px-6 py-2">Account</th>
                        <th className="text-center text-[10px] font-semibold text-gray-text uppercase tracking-wider px-2 py-2">Trades</th>
                        <th className="text-center text-[10px] font-semibold text-gray-text uppercase tracking-wider px-2 py-2">Win Rate</th>
                        <th className="text-center text-[10px] font-semibold text-gray-text uppercase tracking-wider px-2 py-2">Avg Win</th>
                        <th className="text-center text-[10px] font-semibold text-gray-text uppercase tracking-wider px-2 py-2">Avg Loss</th>
                        <th className="text-center text-[10px] font-semibold text-gray-text uppercase tracking-wider px-2 py-2">Best</th>
                        <th className="text-center text-[10px] font-semibold text-gray-text uppercase tracking-wider px-2 py-2">Worst</th>
                        <th className="text-right text-[10px] font-semibold text-gray-text uppercase tracking-wider px-6 py-2">P.Factor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map(({ account, stats }) => (
                        <tr key={account.id} className="border-b border-dark-border/30 hover:bg-dark-bg/40 transition-colors">
                          <td className="px-6 py-2.5">
                            <p className="font-semibold text-gray-light text-xs">{account.accountName}</p>
                            <p className="text-[10px] text-gray-text">{account.brokerName}</p>
                          </td>
                          <td className="px-2 py-2.5 text-center text-xs text-gray-light">{stats.totalTrades}</td>
                          <td className="px-2 py-2.5 text-center">
                            <span className="text-xs font-bold text-green-primary">{formatPercentage(stats.winRate ?? 0)}</span>
                          </td>
                          <td className="px-2 py-2.5 text-center text-xs text-green-primary">{formatCurrency(stats.averageWin ?? 0)}</td>
                          <td className="px-2 py-2.5 text-center text-xs text-red-primary">{formatCurrency(stats.averageLoss ?? 0)}</td>
                          <td className="px-2 py-2.5 text-center text-xs font-bold text-green-primary">{formatCurrency(stats.largestWin ?? 0)}</td>
                          <td className="px-2 py-2.5 text-center text-xs font-bold text-red-primary">{formatCurrency(stats.largestLoss ?? 0)}</td>
                          <td className="px-6 py-2.5 text-right text-xs font-bold text-gray-light">{(stats.profitFactor ?? 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent closed trades */}
              <div className="col-span-12 card">
                <h2 className="text-sm font-bold text-gray-light mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-primary" />
                  Recent Closed Trades
                </h2>
                {closedTrades.length === 0 ? (
                  <p className="text-xs text-gray-text py-6 text-center">No closed trades yet</p>
                ) : (
                  <div className="overflow-x-auto -mx-6">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b border-dark-border/50">
                          <th className="text-left text-[10px] font-semibold text-gray-text uppercase tracking-wider px-6 py-2">Date</th>
                          <th className="text-left text-[10px] font-semibold text-gray-text uppercase tracking-wider px-2 py-2">Instrument</th>
                          <th className="text-center text-[10px] font-semibold text-gray-text uppercase tracking-wider px-2 py-2">Dir</th>
                          <th className="text-center text-[10px] font-semibold text-gray-text uppercase tracking-wider px-2 py-2">Entry</th>
                          <th className="text-center text-[10px] font-semibold text-gray-text uppercase tracking-wider px-2 py-2">Result</th>
                          <th className="text-right text-[10px] font-semibold text-gray-text uppercase tracking-wider px-6 py-2">P/L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {closedTrades.slice(0, 20).map(t => (
                          <tr key={t.id} className="border-b border-dark-border/30 hover:bg-dark-bg/40 transition-colors">
                            <td className="px-6 py-2 text-[10px] text-gray-text">
                              {new Date(t.entryDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-2 py-2 text-xs font-semibold text-gray-light">{t.instrument}</td>
                            <td className="px-2 py-2 text-center">
                              <span className={`text-[10px] font-bold ${t.direction === 'BUY' ? 'text-green-primary' : 'text-red-primary'}`}>
                                {t.direction}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center text-xs text-gray-text">
                              {t.entryPrice ? `$${Number(t.entryPrice).toFixed(2)}` : '—'}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                t.result === 'PROFIT' ? 'bg-green-primary/10 text-green-primary' :
                                t.result === 'LOSS' ? 'bg-red-primary/10 text-red-primary' :
                                'bg-yellow-primary/10 text-yellow-primary'
                              }`}>
                                {t.result === 'BREAK_EVEN' ? 'EVEN' : t.result}
                              </span>
                            </td>
                            <td className={`px-6 py-2 text-right text-xs font-bold ${
                              t.result === 'PROFIT' ? 'text-green-primary' : t.result === 'LOSS' ? 'text-red-primary' : 'text-yellow-primary'
                            }`}>
                              {t.result === 'PROFIT' ? '+' : t.result === 'LOSS' ? '-' : ''}
                              {formatCurrency(Math.abs(Number(t.realisedProfitLoss) || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
