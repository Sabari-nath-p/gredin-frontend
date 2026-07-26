'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Target, PieChart,
  ArrowUpRight, ArrowDownRight, Activity, Wallet,
  Calendar, ChevronLeft, ChevronRight, Flame,
  Award, Zap, Clock, Hash, ArrowUp, ArrowDown,
  Filter, CalendarRange
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuthStore } from '@/lib/store';
import { tradeAccountApi, tradeEntryApi, type TradeAccount, type TradeStats, type TradeEntry } from '@/lib/api';
import { formatCurrency, formatPercentage, getTradeNetProfitLoss } from '@/lib/utils';
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

// ─── Date filter (applies across every analytics tab) ───
type DateFilterPreset = 'ALL' | '1D' | '7D' | '30D' | '90D' | '1Y' | 'CUSTOM';

const DATE_FILTER_OPTIONS: Array<{ label: string; value: DateFilterPreset }> = [
  { label: 'All Time', value: 'ALL' },
  { label: '1D', value: '1D' },
  { label: '7D', value: '7D' },
  { label: '30D', value: '30D' },
  { label: '90D', value: '90D' },
  { label: '1Y', value: '1Y' },
  { label: 'Custom', value: 'CUSTOM' },
];

// ─── Chart bucketing helpers (for the Equity Curve) ───
type Granularity = 'day' | 'week' | 'month' | 'year';
type RangeBucket = { key: string; label: string; startTs: number; endTs: number };

const toLocalDayKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const buildBuckets = (start: Date, end: Date, granularity: Granularity): RangeBucket[] => {
  const buckets: RangeBucket[] = [];
  const endTime = end.getTime();

  if (granularity === 'day') {
    const cursor = new Date(start); cursor.setHours(0, 0, 0, 0);
    let guard = 0;
    while (cursor.getTime() <= endTime && guard < 400) {
      const dayStart = new Date(cursor);
      const dayEnd = new Date(cursor); dayEnd.setHours(23, 59, 59, 999);
      buckets.push({
        key: toLocalDayKey(dayStart),
        label: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        startTs: dayStart.getTime(),
        endTs: Math.min(dayEnd.getTime(), endTime),
      });
      cursor.setDate(cursor.getDate() + 1);
      guard++;
    }
    return buckets;
  }

  if (granularity === 'week') {
    const cursor = new Date(start); cursor.setHours(0, 0, 0, 0);
    let guard = 0;
    while (cursor.getTime() <= endTime && guard < 300) {
      const weekStart = new Date(cursor);
      const weekEnd = new Date(cursor); weekEnd.setDate(weekEnd.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);
      buckets.push({
        key: toLocalDayKey(weekStart),
        label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        startTs: weekStart.getTime(),
        endTs: Math.min(weekEnd.getTime(), endTime),
      });
      cursor.setDate(cursor.getDate() + 7);
      guard++;
    }
    return buckets;
  }

  if (granularity === 'month') {
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    let guard = 0;
    while (cursor.getTime() <= endTime && guard < 240) {
      const monthStart = new Date(cursor);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
      buckets.push({
        key: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        label: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        startTs: monthStart.getTime(),
        endTs: Math.min(monthEnd.getTime(), endTime),
      });
      cursor.setMonth(cursor.getMonth() + 1);
      guard++;
    }
    return buckets;
  }

  const cursor = new Date(start.getFullYear(), 0, 1);
  let guard = 0;
  while (cursor.getTime() <= endTime && guard < 60) {
    const yearStart = new Date(cursor);
    const yearEnd = new Date(cursor.getFullYear(), 11, 31, 23, 59, 59, 999);
    buckets.push({
      key: String(yearStart.getFullYear()),
      label: String(yearStart.getFullYear()),
      startTs: yearStart.getTime(),
      endTs: Math.min(yearEnd.getTime(), endTime),
    });
    cursor.setFullYear(cursor.getFullYear() + 1);
    guard++;
  }
  return buckets;
};

export default function AnalyticsPage() {
  const token = useAuthStore((state) => state.token);
  const [accountsWithStats, setAccountsWithStats] = useState<AccountWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'instruments' | 'streaks'>('overview');

  // ─── Date filter state ───
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('30D');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

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
        } catch { }
      }
      setAccountsWithStats(accountsData);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // ─── Account-filtered data ───
  const filteredData = selectedAccount === 'all'
    ? accountsWithStats
    : accountsWithStats.filter(item => item.account.id === selectedAccount);

  const allAccountTrades = useMemo(() => filteredData.flatMap(a => a.trades), [filteredData]);

  // ─── Date range resolution ───
  const dateBounds = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    let start: Date | null = null;
    let end: Date = now;

    switch (dateFilter) {
      case '1D':
        start = new Date(now); start.setHours(0, 0, 0, 0);
        break;
      case '7D':
        start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
        break;
      case '30D':
        start = new Date(now); start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0);
        break;
      case '90D':
        start = new Date(now); start.setDate(start.getDate() - 89); start.setHours(0, 0, 0, 0);
        break;
      case '1Y':
        start = new Date(now); start.setFullYear(start.getFullYear() - 1); start.setHours(0, 0, 0, 0);
        break;
      case 'CUSTOM':
        start = customStart ? new Date(`${customStart}T00:00:00`) : null;
        end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : now;
        break;
      case 'ALL':
      default:
        start = null;
        end = now;
        break;
    }
    return { start, end };
  }, [dateFilter, customStart, customEnd]);

  const activeDateFilterLabel = useMemo(() => {
    if (dateFilter !== 'CUSTOM') {
      return DATE_FILTER_OPTIONS.find(o => o.value === dateFilter)?.label ?? 'All Time';
    }
    if (customStart && customEnd) return `${customStart} → ${customEnd}`;
    if (customStart) return `From ${customStart}`;
    if (customEnd) return `Until ${customEnd}`;
    return 'Custom';
  }, [dateFilter, customStart, customEnd]);

  // ─── Date-filtered trades: everything below derives from this ───
  const allTrades = useMemo(() => {
    const { start, end } = dateBounds;
    if (!start && !end) return allAccountTrades;
    return allAccountTrades.filter(t => {
      const ts = new Date(t.entryDateTime).getTime();
      if (start && ts < start.getTime()) return false;
      if (end && ts > end.getTime()) return false;
      return true;
    });
  }, [allAccountTrades, dateBounds]);

  const closedTrades = useMemo(() => allTrades.filter(t => t.status === 'CLOSED'), [allTrades]);
  const openTradesCount = useMemo(() => allTrades.filter(t => t.status === 'OPEN').length, [allTrades]);

  // ─── Equity Curve + Win/Loss (Overview tab) ───
  const totalInitialBalance = useMemo(
    () => filteredData.reduce((sum, { account }) => sum + Number(account.initialBalance), 0),
    [filteredData],
  );

  const granularity: Granularity = useMemo(() => {
    if (dateFilter === '1D') return 'day';
    if (dateFilter === '7D' || dateFilter === '30D') return 'day';
    if (dateFilter === '90D') return 'week';
    if (dateFilter === '1Y') return 'month';
    if (dateFilter === 'CUSTOM') {
      const { start, end } = dateBounds;
      if (start && end) {
        const days = (end.getTime() - start.getTime()) / 86400000;
        if (days <= 31) return 'day';
        if (days <= 180) return 'week';
        if (days <= 730) return 'month';
        return 'year';
      }
    }
    return 'month'; // ALL time
  }, [dateFilter, dateBounds]);

  const effectiveStart = useMemo(() => {
    if (dateBounds.start) return dateBounds.start;
    if (allTrades.length > 0) {
      const earliestTs = allTrades.reduce(
        (min, t) => Math.min(min, new Date(t.entryDateTime).getTime()), Infinity,
      );
      return new Date(earliestTs);
    }
    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() - 1);
    return fallback;
  }, [dateBounds, allTrades]);

  const effectiveEnd = dateBounds.end;

  const chartBuckets = useMemo(
    () => buildBuckets(effectiveStart, effectiveEnd, granularity),
    [effectiveStart, effectiveEnd, granularity],
  );

  const equityCurveData = useMemo(() => {
    const sortedClosed = [...closedTrades].sort(
      (a, b) => new Date(a.entryDateTime).getTime() - new Date(b.entryDateTime).getTime(),
    );

    let equity = totalInitialBalance;
    let tradeIndex = 0;

    return chartBuckets.map((bucket) => {
      while (tradeIndex < sortedClosed.length) {
        const tradeTs = new Date(sortedClosed[tradeIndex].entryDateTime).getTime();
        if (tradeTs > bucket.endTs) break;
        equity += getTradeNetProfitLoss(
          sortedClosed[tradeIndex].result,
          sortedClosed[tradeIndex].realisedProfitLoss,
          sortedClosed[tradeIndex].serviceCharge,
        ) || 0;
        tradeIndex++;
      }
      return { date: bucket.label, equity, pnl: equity - totalInitialBalance };
    });
  }, [closedTrades, totalInitialBalance, chartBuckets]);

  const winLossPieData = useMemo(() => {
    const wins = closedTrades.filter((t) => t.result === 'PROFIT').length;
    const losses = closedTrades.filter((t) => t.result === 'LOSS').length;
    return [
      { name: 'Wins', value: wins, color: '#047857' },
      { name: 'Losses', value: losses, color: '#dc2626' },
    ];
  }, [closedTrades]);

  // ─── Aggregated stats — computed directly from date-filtered closed trades
  //     (not from the accounts' lifetime API stats) so the date filter actually applies ───
  const totalStats = useMemo(() => {
    let winningTrades = 0, losingTrades = 0, breakEvenTrades = 0;
    let totalProfit = 0, totalLoss = 0, largestWin = 0, largestLoss = 0;

    closedTrades.forEach(t => {
      const net = getTradeNetProfitLoss(t.result, t.realisedProfitLoss, t.serviceCharge) || 0;
      if (t.result === 'PROFIT') {
        winningTrades++;
        totalProfit += net;
        largestWin = Math.max(largestWin, net);
      } else if (t.result === 'LOSS') {
        losingTrades++;
        totalLoss += Math.abs(net);
        largestLoss = Math.max(largestLoss, Math.abs(net));
      } else {
        breakEvenTrades++;
      }
    });

    const closedCount = closedTrades.length;
    const netProfitLoss = totalProfit - totalLoss;

    return {
      totalTrades: allTrades.length,
      openTrades: openTradesCount,
      closedTrades: closedCount,
      winningTrades,
      losingTrades,
      breakEvenTrades,
      totalProfit,
      totalLoss,
      netProfitLoss,
      largestWin,
      largestLoss,
    };
  }, [closedTrades, allTrades, openTradesCount]);

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
      const netPl = getTradeNetProfitLoss(t.result, t.realisedProfitLoss, t.serviceCharge) || 0;
      map[d].pl += netPl;
      if (t.result === 'PROFIT') { map[d].wins++; }
      else if (t.result === 'LOSS') { map[d].losses++; }
      else { map[d].even++; }
      map[d].trades.push(t);
    });
    return map;
  }, [closedTrades]);

  // ─── Instrument breakdown ───
  const instrumentData = useMemo(() => {
    const map: Record<string, { trades: number; wins: number; losses: number; pl: number; lossSum: number }> = {};
    closedTrades.forEach(t => {
      const ins = t.instrument;
      if (!map[ins]) map[ins] = { trades: 0, wins: 0, losses: 0, pl: 0, lossSum: 0 };
      const netPl = getTradeNetProfitLoss(t.result, t.realisedProfitLoss, t.serviceCharge) || 0;
      map[ins].trades++;
      map[ins].pl += netPl;
      if (t.result === 'PROFIT') {
        map[ins].wins++;
      } else if (t.result === 'LOSS') {
        map[ins].losses++;
        map[ins].lossSum += netPl;
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {closedTrades.length} closed trades across {filteredData.length} account{filteredData.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-600" />
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

      {/* ─── Global Date Filter ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5 text-slate-600">
          <CalendarRange className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Date Range</span>
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl p-1 flex-wrap">
          {DATE_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setDateFilter(option.value);
                setShowCustomPicker(option.value === 'CUSTOM');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${dateFilter === option.value
                ? 'bg-green-primary/20 text-green-primary'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {showCustomPicker && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-green-primary focus:ring-2 focus:ring-green-primary/20 transition-all"
            />
            <span className="text-xs text-slate-600">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-green-primary focus:ring-2 focus:ring-green-primary/20 transition-all"
            />
          </div>
        )}

        {dateFilter !== 'ALL' && (
          <span className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-lg">
            Showing: {activeDateFilterLabel}
          </span>
        )}
      </div>

      {accountsWithStats.length === 0 ? (
        <div className="card text-center py-16">
          <div className="empty-state-icon mx-auto">
            <BarChart3 className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Data Available</h3>
          <p className="text-sm text-slate-600">Start logging trades to see your analytics</p>
        </div>
      ) : (
        <>
          {/* ═══════ TOP STATS ROW ═══════ */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            <div className="stat-card stat-card-green">
              <div className="flex items-center gap-1.5 mb-2">
                <Hash className="w-3.5 h-3.5 text-green-primary" />
                <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Trades</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{totalStats.closedTrades}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                <span className="text-green-primary">{totalStats.winningTrades}W</span>
                {' / '}
                <span className="text-red-primary">{totalStats.losingTrades}L</span>
                {totalStats.breakEvenTrades > 0 && <span> / {totalStats.breakEvenTrades}E</span>}
              </p>
            </div>

            <div className="stat-card stat-card-blue">
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5 text-blue-primary" />
                <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Win Rate</span>
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
                <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Net P/L</span>
              </div>
              <p className={`text-xl font-bold ${totalStats.netProfitLoss >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                {formatCurrency(totalStats.netProfitLoss)}
              </p>
            </div>

            <div className="stat-card stat-card-yellow">
              <div className="flex items-center gap-1.5 mb-2">
                <PieChart className="w-3.5 h-3.5 text-yellow-primary" />
                <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Profit Factor</span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}
              </p>
            </div>

            <div className="stat-card stat-card-purple col-span-2 lg:col-span-1">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Expectancy</span>
              </div>
              <p className={`text-xl font-bold ${expectancy >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                {formatCurrency(expectancy)}
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5">per trade avg</p>
            </div>
          </div>

          {/* ═══════ TAB NAVIGATION ═══════ */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl p-1 mb-5 overflow-x-auto">
            {([
              { key: 'overview', label: 'Overview', icon: Activity },
              { key: 'calendar', label: 'Calendar', icon: Calendar },
              { key: 'instruments', label: 'Instruments', icon: BarChart3 },
              { key: 'streaks', label: 'Streaks & Stats', icon: Flame },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeTab === tab.key
                  ? 'bg-green-primary/15 text-green-primary border border-green-primary/30'
                  : 'text-slate-600 hover:text-slate-900'
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
              {/* Equity Curve */}
              <div className="col-span-12 lg:col-span-8 card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Equity Curve</h2>
                    <p className="text-[10px] text-slate-600 mt-0.5">Account equity over {activeDateFilterLabel.toLowerCase()}</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityCurveData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="analyticsEquityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#047857" stopOpacity={0.35} />
                          <stop offset="60%" stopColor="#047857" stopOpacity={0.08} />
                          <stop offset="100%" stopColor="#047857" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={76}
                        domain={['auto', 'auto']}
                        tickFormatter={(value: number) => formatCurrency(value)}
                      />
                      <Tooltip
                        contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#1e293b', fontSize: 12 }}
                        formatter={(value: number) => [formatCurrency(Number(value)), 'Equity']}
                      />
                      <Area
                        type="monotone"
                        dataKey="equity"
                        stroke="#047857"
                        strokeWidth={2.5}
                        fill="url(#analyticsEquityGradient)"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Win vs Loss */}
              <div className="col-span-12 lg:col-span-4 card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-900">Win vs Loss</h2>
                  <span className="text-[10px] text-slate-600">Closed trades</span>
                </div>
                {closedTrades.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-xs text-slate-600">
                    No closed trades in this range.
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={winLossPieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={54}
                          outerRadius={82}
                          paddingAngle={4}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {winLossPieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#1e293b', fontSize: 12 }}
                          formatter={(value: number) => [value, 'Trades']}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* P/L Breakdown */}
              <div className="col-span-12 lg:col-span-4 card">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Profit & Loss</h2>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 bg-green-primary/5 border border-green-primary/20 rounded-xl">
                    <div>
                      <p className="text-[10px] text-slate-600">Total Profit</p>
                      <p className="text-lg font-bold text-green-primary">{formatCurrency(totalStats.totalProfit)}</p>
                    </div>
                    <span className="text-xs font-bold text-green-primary bg-green-primary/10 px-2 py-1 rounded-lg">
                      {totalStats.winningTrades} wins
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-primary/5 border border-red-primary/20 rounded-xl">
                    <div>
                      <p className="text-[10px] text-slate-600">Total Loss</p>
                      <p className="text-lg font-bold text-red-primary">{formatCurrency(totalStats.totalLoss)}</p>
                    </div>
                    <span className="text-xs font-bold text-red-primary bg-red-primary/10 px-2 py-1 rounded-lg">
                      {totalStats.losingTrades} losses
                    </span>
                  </div>
                  {/* Win Rate bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[10px] text-slate-600 mb-1">
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
                <h2 className="text-sm font-bold text-slate-900 mb-4">Key Metrics</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Average Win', value: formatCurrency(avgWin), color: 'text-green-primary' },
                    { label: 'Average Loss', value: formatCurrency(avgLoss), color: 'text-red-primary' },
                    { label: 'Largest Win', value: formatCurrency(totalStats.largestWin), color: 'text-green-primary' },
                    { label: 'Largest Loss', value: formatCurrency(totalStats.largestLoss), color: 'text-red-primary' },
                    { label: 'Profit Factor', value: profitFactor === Infinity ? '∞' : profitFactor.toFixed(2), color: 'text-slate-900' },
                    { label: 'Expectancy', value: formatCurrency(expectancy), color: expectancy >= 0 ? 'text-green-primary' : 'text-red-primary' },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-300 last:border-0">
                      <span className="text-xs text-slate-600">{m.label}</span>
                      <span className={`text-xs font-bold ${m.color}`}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direction & Account Performance */}
              <div className="col-span-12 lg:col-span-4 space-y-4">
                {/* Direction split */}
                <div className="card">
                  <h2 className="text-sm font-bold text-slate-900 mb-3">By Direction</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-green-primary/5 border border-green-primary/20 text-center">
                      <ArrowUp className="w-4 h-4 text-green-primary mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{directionStats.buyCount}</p>
                      <p className="text-[10px] text-slate-600">LONG trades</p>
                      <p className="text-xs font-bold text-green-primary mt-1">{formatPercentage(directionStats.buyWinRate)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-red-primary/5 border border-red-primary/20 text-center">
                      <ArrowDown className="w-4 h-4 text-red-primary mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{directionStats.sellCount}</p>
                      <p className="text-[10px] text-slate-600">SHORT trades</p>
                      <p className="text-xs font-bold text-green-primary mt-1">{formatPercentage(directionStats.sellWinRate)}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Streaks */}
                <div className="card">
                  <h2 className="text-sm font-bold text-slate-900 mb-3">Streaks</h2>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-300">
                      <p className="text-lg font-bold text-green-primary">{streaks.maxWin}</p>
                      <p className="text-[10px] text-slate-600">Best Win</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-300">
                      <p className="text-lg font-bold text-red-primary">{streaks.maxLoss}</p>
                      <p className="text-[10px] text-slate-600">Worst Loss</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-300">
                      <p className={`text-lg font-bold ${streaks.currentType === 'win' ? 'text-green-primary' : streaks.currentType === 'loss' ? 'text-red-primary' : 'text-slate-600'}`}>
                        {streaks.currentStreak}
                      </p>
                      <p className="text-[10px] text-slate-600">Current</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Performance — full width (reflects lifetime account balance, not the date filter) */}
              {filteredData.length > 1 && (
                <div className="col-span-12 card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-900">Account Performance</h2>
                    <span className="text-[10px] text-slate-600">Lifetime balance (not affected by date filter)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredData.map(({ account, stats }) => {
                      const pl = Number(account.currentBalance) - Number(account.initialBalance);
                      const plPct = Number(account.initialBalance) > 0 ? (pl / Number(account.initialBalance)) * 100 : 0;
                      return (
                        <div key={account.id} className="p-3 bg-slate-50 rounded-xl border border-slate-300">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Wallet className="w-3.5 h-3.5 text-green-primary" />
                              <span className="font-semibold text-slate-900 text-xs">{account.accountName}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${account.accountType === 'LIVE' ? 'bg-green-primary/10 text-green-primary' :
                              account.accountType === 'DEMO' ? 'bg-blue-primary/10 text-blue-primary' :
                                'bg-yellow-primary/10 text-yellow-primary'
                              }`}>{account.accountType}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div>
                              <p className="text-[10px] text-slate-600">Balance</p>
                              <p className="text-xs font-bold text-green-primary">{formatCurrency(Number(account.currentBalance))}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-600">P/L</p>
                              <p className={`text-xs font-bold ${pl >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                                {pl >= 0 ? '+' : ''}{formatPercentage(plPct)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-600">Trades</p>
                              <p className="text-xs font-bold text-slate-900">{stats.totalTrades}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-600">Win Rate</p>
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
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-primary" />
                    {MONTH_NAMES[calMonth]} {calYear}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                      className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-300 flex items-center justify-center hover:border-green-primary/50 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <button
                      onClick={() => { const n = new Date(); setCalMonth(n.getMonth()); setCalYear(n.getFullYear()); }}
                      className="px-3 py-1 rounded-lg text-[10px] font-semibold text-slate-600 hover:text-green-primary border border-slate-300 hover:border-green-primary/50 transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                      className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-300 flex items-center justify-center hover:border-green-primary/50 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                </div>

                {/* Day labels */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_LABELS.map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-slate-600 uppercase tracking-wider py-1">
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

                    // Use explicit classes for Tailwind JIT safety
                    let cellBg = 'bg-slate-50';
                    let cellText = 'text-slate-600';
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
                        className={`relative aspect-square rounded-lg border transition-all cursor-default flex flex-col items-center justify-center ${cellBg} ${isToday ? 'border-green-primary' : isHovered && data ? 'border-gray-text/50' : 'border-transparent'
                          }`}
                      >
                        <span className={`text-xs font-medium ${data ? cellText : 'text-slate-600/60'}`}>
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
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-44 p-2.5 rounded-xl bg-white border border-slate-300 shadow-elevated text-left pointer-events-none">
                            <p className="text-[10px] text-slate-600 mb-1">{new Date(cell.key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            <p className={`text-sm font-bold ${data.pl >= 0 ? 'text-green-primary' : 'text-red-primary'} mb-1`}>
                              {data.pl >= 0 ? '+' : ''}{formatCurrency(data.pl)}
                            </p>
                            <div className="flex gap-2 text-[10px]">
                              <span className="text-green-primary">{data.wins}W</span>
                              <span className="text-red-primary">{data.losses}L</span>
                              {data.even > 0 && <span className="text-yellow-primary">{data.even}E</span>}
                            </div>
                            <div className="mt-1.5 pt-1.5 border-t border-slate-300 space-y-0.5">
                              {data.trades.slice(0, 3).map(t => (
                                <div key={t.id} className="flex items-center justify-between">
                                  <span className="text-[10px] text-slate-600">{t.instrument}</span>
                                  <span className={`text-[10px] font-bold ${t.result === 'PROFIT' ? 'text-green-primary' : t.result === 'LOSS' ? 'text-red-primary' : 'text-yellow-primary'}`}>
                                    {t.result === 'PROFIT' ? '+' : '-'}{formatCurrency(Math.abs(Number(t.realisedProfitLoss) || 0))}
                                  </span>
                                </div>
                              ))}
                              {data.trades.length > 3 && (
                                <p className="text-[9px] text-slate-600">+{data.trades.length - 3} more</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-300">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-primary/20" /><span className="text-[10px] text-slate-600">Profit Day</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-primary/20" /><span className="text-[10px] text-slate-600">Loss Day</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-primary/10" /><span className="text-[10px] text-slate-600">Break Even</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border border-green-primary" /><span className="text-[10px] text-slate-600">Today</span></div>
                </div>
              </div>

              {/* Month Summary sidebar */}
              <div className="col-span-12 lg:col-span-4 space-y-4">
                <div className="card">
                  <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Month Summary</h3>
                  <div className={`text-center p-4 rounded-xl mb-3 ${monthPL.total >= 0 ? 'bg-green-primary/5' : 'bg-red-primary/5'}`}>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Net P/L</p>
                    <p className={`text-2xl font-bold ${monthPL.total >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                      {monthPL.total >= 0 ? '+' : ''}{formatCurrency(monthPL.total)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-center">
                      <p className="text-lg font-bold text-green-primary">{monthPL.wins}</p>
                      <p className="text-[10px] text-slate-600">Wins</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-center">
                      <p className="text-lg font-bold text-red-primary">{monthPL.losses}</p>
                      <p className="text-[10px] text-slate-600">Losses</p>
                    </div>
                  </div>
                  {(monthPL.wins + monthPL.losses) > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-slate-600 mb-1">
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
                  <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                    {hoveredDay ? new Date(hoveredDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Hover a day'}
                  </h3>
                  {hoveredDay && dailyPL[hoveredDay] ? (
                    <div className="space-y-2">
                      {dailyPL[hoveredDay].trades.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-300">
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{t.instrument}</p>
                            <p className="text-[10px] text-slate-600">
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
                    <p className="text-xs text-slate-600">Hover over a calendar day to see trade details</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════ TAB: INSTRUMENTS ═══════ */}
          {activeTab === 'instruments' && (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 card">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Instrument Performance</h2>
                {instrumentData.length === 0 ? (
                  <p className="text-xs text-slate-600 py-8 text-center">No closed trades to analyze</p>
                ) : (
                  <div className="space-y-2">
                    {instrumentData.map((ins, idx) => {
                      return (
                        <div key={ins.name} className="p-3 rounded-xl bg-slate-50 border border-slate-300 hover:border-slate-300 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-600 font-mono w-5">#{idx + 1}</span>
                              <span className="text-sm font-bold text-slate-900">{ins.name}</span>
                              <span className="text-[10px] text-slate-600">{ins.trades} trades</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold ${ins.pl >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                                {ins.pl >= 0 ? '+' : ''}{formatCurrency(ins.pl)}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ins.winRate >= 60 ? 'bg-green-primary/10 text-green-primary' :
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
                    <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-green-primary" />
                      Most Profitable
                    </h2>
                    <div className="space-y-2">
                      {[...instrumentData].sort((a, b) => b.pl - a.pl).slice(0, 5).map(ins => (
                        <div key={ins.name} className="flex items-center justify-between p-2.5 rounded-lg bg-green-primary/5 border border-green-primary/10">
                          <div>
                            <span className="text-xs font-bold text-slate-900">{ins.name}</span>
                            <span className="text-[10px] text-slate-600 ml-2">{ins.trades} trades</span>
                          </div>
                          <span className="text-xs font-bold text-green-primary">
                            {ins.pl >= 0 ? '+' : ''}{formatCurrency(ins.pl)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-6 card">
                    <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-red-primary" />
                      Most Losses
                    </h2>
                    <div className="space-y-2">
                      {[...instrumentData].sort((a, b) => b.losses - a.losses || a.lossSum - b.lossSum).slice(0, 5).map(ins => (
                        <div key={ins.name} className="flex items-center justify-between p-2.5 rounded-lg bg-red-primary/5 border border-red-primary/10">
                          <div>
                            <span className="text-xs font-bold text-slate-900">{ins.name}</span>
                            <span className="text-[10px] text-slate-600 ml-2">{ins.trades} trades</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-red-primary">{formatCurrency(ins.lossSum)}</p>
                          </div>
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
                <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Trading Streaks
                </h2>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-green-primary/5 border border-green-primary/20 text-center">
                    <p className="text-3xl font-bold text-green-primary">{streaks.maxWin}</p>
                    <p className="text-xs text-slate-600 mt-1">Best Winning Streak</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-primary/5 border border-red-primary/20 text-center">
                    <p className="text-3xl font-bold text-red-primary">{streaks.maxLoss}</p>
                    <p className="text-xs text-slate-600 mt-1">Worst Losing Streak</p>
                  </div>
                  <div className={`p-4 rounded-xl text-center ${streaks.currentType === 'win' ? 'bg-green-primary/5 border border-green-primary/20'
                    : streaks.currentType === 'loss' ? 'bg-red-primary/5 border border-red-primary/20'
                      : 'bg-slate-50 border border-slate-300'
                    }`}>
                    <p className={`text-3xl font-bold ${streaks.currentType === 'win' ? 'text-green-primary'
                      : streaks.currentType === 'loss' ? 'text-red-primary'
                        : 'text-slate-600'
                      }`}>{streaks.currentStreak}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Current Streak {streaks.currentType !== 'none' && `(${streaks.currentType === 'win' ? 'Winning' : 'Losing'})`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Stats table */}
              <div className="col-span-12 lg:col-span-8 card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-900">Detailed Account Statistics</h2>
                  <span className="text-[10px] text-slate-600">Lifetime (not affected by date filter)</span>
                </div>
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-300">
                        <th className="text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-6 py-2">Account</th>
                        <th className="text-center text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 py-2">Trades</th>
                        <th className="text-center text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 py-2">Win Rate</th>
                        <th className="text-center text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 py-2">Avg Win</th>
                        <th className="text-center text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 py-2">Avg Loss</th>
                        <th className="text-center text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 py-2">Best</th>
                        <th className="text-center text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 py-2">Worst</th>
                        <th className="text-right text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-6 py-2">P.Factor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map(({ account, stats }) => (
                        <tr key={account.id} className="border-b border-slate-300 hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-2.5">
                            <p className="font-semibold text-slate-900 text-xs">{account.accountName}</p>
                            <p className="text-[10px] text-slate-600">{account.brokerName}</p>
                          </td>
                          <td className="px-2 py-2.5 text-center text-xs text-slate-900">{stats.totalTrades}</td>
                          <td className="px-2 py-2.5 text-center">
                            <span className="text-xs font-bold text-green-primary">{formatPercentage(stats.winRate ?? 0)}</span>
                          </td>
                          <td className="px-2 py-2.5 text-center text-xs text-green-primary">{formatCurrency(stats.averageWin ?? 0)}</td>
                          <td className="px-2 py-2.5 text-center text-xs text-red-primary">{formatCurrency(stats.averageLoss ?? 0)}</td>
                          <td className="px-2 py-2.5 text-center text-xs font-bold text-green-primary">{formatCurrency(stats.largestWin ?? 0)}</td>
                          <td className="px-2 py-2.5 text-center text-xs font-bold text-red-primary">{formatCurrency(stats.largestLoss ?? 0)}</td>
                          <td className="px-6 py-2.5 text-right text-xs font-bold text-slate-900">{(stats.profitFactor ?? 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent closed trades */}
              <div className="col-span-12 card">
                <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-primary" />
                  Recent Closed Trades
                </h2>
                {closedTrades.length === 0 ? (
                  <p className="text-xs text-slate-600 py-6 text-center">No closed trades in this range</p>
                ) : (
                  <div className="overflow-x-auto -mx-6">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-300">
                          <th className="text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-6 py-2">Date</th>
                          <th className="text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 py-2">Instrument</th>
                          <th className="text-center text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 py-2">Dir</th>
                          <th className="text-center text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 py-2">Entry</th>
                          <th className="text-center text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 py-2">Result</th>
                          <th className="text-right text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-6 py-2">P/L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {closedTrades.slice(0, 20).map(t => (
                          <tr key={t.id} className="border-b border-slate-300 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-2 text-[10px] text-slate-600">
                              {new Date(t.entryDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-2 py-2 text-xs font-semibold text-slate-900">{t.instrument}</td>
                            <td className="px-2 py-2 text-center">
                              <span className={`text-[10px] font-bold ${t.direction === 'BUY' ? 'text-green-primary' : 'text-red-primary'}`}>
                                {t.direction}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center text-xs text-slate-600">
                              {t.entryPrice ? `$${Number(t.entryPrice).toFixed(2)}` : '—'}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.result === 'PROFIT' ? 'bg-green-primary/10 text-green-primary' :
                                t.result === 'LOSS' ? 'bg-red-primary/10 text-red-primary' :
                                  'bg-yellow-primary/10 text-yellow-primary'
                                }`}>
                                {t.result === 'BREAK_EVEN' ? 'EVEN' : t.result}
                              </span>
                            </td>
                            <td className={`px-6 py-2 text-right text-xs font-bold ${t.result === 'PROFIT' ? 'text-green-primary' : t.result === 'LOSS' ? 'text-red-primary' : 'text-yellow-primary'
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