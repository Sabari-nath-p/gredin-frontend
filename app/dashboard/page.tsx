'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wallet, TrendingUp, BarChart3, DollarSign,
  ArrowUpRight, ArrowDownRight, Plus, Activity,
  ChevronRight, Sparkles, Clock, CheckCircle2, CalendarRange,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts';
import { useAuthStore } from '@/lib/store';
import { tradeAccountApi, tradeEntryApi, type TradeAccount, type TradeEntry } from '@/lib/api';
import { formatCurrency, formatPercentage, formatDateTime, getTradeNetProfitLoss } from '@/lib/utils';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────
// Date filter / bucketing helpers
// ─────────────────────────────────────────────────────────────

type Granularity = 'day' | 'week' | 'month' | 'year';
type DateFilterPreset = 'ALL' | '1D' | '7D' | '30D' | '90D' | '1Y' | 'CUSTOM';

type RangeBucket = {
  key: string;
  label: string;
  startTs: number;
  endTs: number;
};

const toLocalDayKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const buildBuckets = (start: Date, end: Date, granularity: Granularity): RangeBucket[] => {
  const buckets: RangeBucket[] = [];

  if (granularity === 'day') {
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endTime = end.getTime();
    let guard = 0;
    while (cursor.getTime() <= endTime && guard < 400) {
      const dayStart = new Date(cursor);
      const dayEnd = new Date(cursor);
      dayEnd.setHours(23, 59, 59, 999);
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
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endTime = end.getTime();
    let guard = 0;
    while (cursor.getTime() <= endTime && guard < 300) {
      const weekStart = new Date(cursor);
      const weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
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
    const endTime = end.getTime();
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

  // year
  const cursor = new Date(start.getFullYear(), 0, 1);
  const endTime = end.getTime();
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

const DATE_FILTER_OPTIONS: Array<{ label: string; value: DateFilterPreset }> = [
  { label: 'All Time', value: 'ALL' },
  { label: '1D', value: '1D' },
  { label: '7D', value: '7D' },
  { label: '30D', value: '30D' },
  { label: '90D', value: '90D' },
  { label: '1Y', value: '1Y' },
  { label: 'Custom', value: 'CUSTOM' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [accounts, setAccounts] = useState<TradeAccount[]>([]);
  const [allTrades, setAllTrades] = useState<TradeEntry[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [tradeTab, setTradeTab] = useState<'open' | 'closed'>('open');
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('30D');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!token) return;
    try {
      const accountsRes = await tradeAccountApi.getAll(token);
      setAccounts(accountsRes.data);
      if (accountsRes.data.length > 0) {
        const trades: TradeEntry[] = [];
        for (const account of accountsRes.data) {
          try {
            const tradesRes = await tradeEntryApi.getByAccount(token, account.id);
            trades.push(...tradesRes.data);
          } catch (error) { }
        }
        const sorted = trades.sort((a, b) =>
          new Date(b.entryDateTime).getTime() - new Date(a.entryDateTime).getTime()
        );
        setAllTrades(sorted);
      }
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Filtering pipeline: account → date range. All analytics
  // below derive from `dateFilteredTrades`.
  // ─────────────────────────────────────────────────────────

  const filteredAccounts = useMemo(() => {
    if (selectedAccountId === 'ALL') return accounts;
    return accounts.filter(a => a.id === selectedAccountId);
  }, [accounts, selectedAccountId]);

  const accountFilteredTrades = useMemo(() => {
    if (selectedAccountId === 'ALL') return allTrades;
    return allTrades.filter(t => t.tradeAccountId === selectedAccountId);
  }, [allTrades, selectedAccountId]);

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

  const dateFilteredTrades = useMemo(() => {
    const { start, end } = dateBounds;
    if (!start && !end) return accountFilteredTrades;
    return accountFilteredTrades.filter(t => {
      const ts = new Date(t.entryDateTime).getTime();
      if (start && ts < start.getTime()) return false;
      if (end && ts > end.getTime()) return false;
      return true;
    });
  }, [accountFilteredTrades, dateBounds]);

  const recentTrades = dateFilteredTrades.slice(0, 12);

  const closedTrades = useMemo(
    () => dateFilteredTrades.filter((trade) => trade.status === 'CLOSED'),
    [dateFilteredTrades],
  );

  const totalBalance = filteredAccounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);
  const totalInitialBalance = filteredAccounts.reduce((sum, acc) => sum + Number(acc.initialBalance), 0);

  // P/L for the currently selected date range (not just the raw current-vs-initial balance delta)
  const periodProfitLoss = useMemo(
    () => closedTrades.reduce(
      (sum, t) => sum + (getTradeNetProfitLoss(t.result, t.realisedProfitLoss, t.serviceCharge) || 0),
      0,
    ),
    [closedTrades],
  );
  const periodProfitLossPercentage = totalInitialBalance > 0
    ? (periodProfitLoss / totalInitialBalance) * 100 : 0;

  const openTradesCount = dateFilteredTrades.filter(t => t.status === 'OPEN').length;

  // ─────────────────────────────────────────────────────────
  // Chart bucketing — granularity auto-adapts to selected range
  // ─────────────────────────────────────────────────────────

  const granularity: Granularity = useMemo(() => {
    if (dateFilter === '1D' || dateFilter === '7D' || dateFilter === '30D') return 'day';
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
    if (dateFilteredTrades.length > 0) {
      const earliestTs = dateFilteredTrades.reduce(
        (min, t) => Math.min(min, new Date(t.entryDateTime).getTime()), Infinity,
      );
      return new Date(earliestTs);
    }
    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() - 1);
    return fallback;
  }, [dateBounds, dateFilteredTrades]);

  const effectiveEnd = dateBounds.end;

  const chartBuckets = useMemo(
    () => buildBuckets(effectiveStart, effectiveEnd, granularity),
    [effectiveStart, effectiveEnd, granularity],
  );

  // ─── Equity Curve: cumulative account equity across the selected range ───
  const startingEquity = useMemo(() => {
    if (!effectiveStart) return totalInitialBalance;
    const tradesBeforeStart = accountFilteredTrades.filter(
      t => t.status === 'CLOSED' && new Date(t.entryDateTime).getTime() < effectiveStart.getTime()
    );
    const sumBefore = tradesBeforeStart.reduce(
      (sum, t) => sum + (getTradeNetProfitLoss(t.result, t.realisedProfitLoss, t.serviceCharge) || 0),
      0
    );
    return totalInitialBalance + sumBefore;
  }, [accountFilteredTrades, effectiveStart, totalInitialBalance]);

  const equityCurveData = useMemo(() => {
    const sortedClosed = [...closedTrades].sort(
      (a, b) => new Date(a.entryDateTime).getTime() - new Date(b.entryDateTime).getTime(),
    );

    let equity = startingEquity;
    let rangePnl = 0;
    let tradeIndex = 0;

    return chartBuckets.map((bucket) => {
      while (tradeIndex < sortedClosed.length) {
        const tradeTs = new Date(sortedClosed[tradeIndex].entryDateTime).getTime();
        if (tradeTs > bucket.endTs) break;
        const net = getTradeNetProfitLoss(
          sortedClosed[tradeIndex].result,
          sortedClosed[tradeIndex].realisedProfitLoss,
          sortedClosed[tradeIndex].serviceCharge,
        ) || 0;
        equity += net;
        rangePnl += net;
        tradeIndex++;
      }
      return {
        date: bucket.label,
        equity,
        pnl: rangePnl,
      };
    });
  }, [closedTrades, startingEquity, chartBuckets]);

  // ─── Daily P&L: wins AND losses both rendered as upward bars, colored by sign ───
  const dailyPnLData = useMemo(() => {
    const bucketMap = new Map<string, { date: string; pnl: number; sortTs: number }>();
    for (const bucket of chartBuckets) {
      bucketMap.set(bucket.key, { date: bucket.label, pnl: 0, sortTs: bucket.startTs });
    }
    if (chartBuckets.length === 0) return [];

    const minTs = chartBuckets[0].startTs;
    const maxTs = chartBuckets[chartBuckets.length - 1].endTs;

    for (const trade of closedTrades) {
      const tradeTs = new Date(trade.entryDateTime).getTime();
      if (tradeTs < minTs || tradeTs > maxTs) continue;

      const bucket = chartBuckets.find(b => tradeTs >= b.startTs && tradeTs <= b.endTs);
      if (!bucket) continue;

      const net = getTradeNetProfitLoss(trade.result, trade.realisedProfitLoss, trade.serviceCharge) || 0;
      const row = bucketMap.get(bucket.key);
      if (row) row.pnl += net;
    }

    return Array.from(bucketMap.values())
      .sort((a, b) => a.sortTs - b.sortTs)
      .map(({ date, pnl }) => ({
        date,
        pnl,               // signed value, used for tooltip + color decision
        displayValue: Math.abs(pnl), // always positive so the bar renders upward
      }));
  }, [closedTrades, chartBuckets]);

  const winLossPieData = useMemo(() => {
    const wins = closedTrades.filter((trade) => trade.result === 'PROFIT').length;
    const losses = closedTrades.filter((trade) => trade.result === 'LOSS').length;
    return [
      { name: 'Wins', value: wins, color: '#047857' },
      { name: 'Losses', value: losses, color: '#dc2626' },
    ];
  }, [closedTrades]);

  const activeDateFilterLabel = useMemo(() => {
    if (dateFilter !== 'CUSTOM') {
      return DATE_FILTER_OPTIONS.find(o => o.value === dateFilter)?.label ?? 'All Time';
    }
    if (customStart && customEnd) return `${customStart} → ${customEnd}`;
    if (customStart) return `From ${customStart}`;
    if (customEnd) return `Until ${customEnd}`;
    return 'Custom';
  }, [dateFilter, customStart, customEnd]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-2">
          <div className="skeleton h-8 w-48 rounded-lg"></div>
          <div className="skeleton h-5 w-72 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-2xl"></div>
          <div className="skeleton h-80 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="animate-fade-in">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-1 tracking-tight">
              Welcome back, <span className="gradient-text">{user?.name || 'Trader'}</span> 👋
            </h1>
            <p className="text-slate-600 text-sm">Here&apos;s your trading overview for today</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm text-slate-700 outline-none focus:border-green-primary focus:ring-2 focus:ring-green-primary/20 transition-all cursor-pointer min-w-[160px]"
            >
              <option value="ALL">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName} ({acc.accountType})
                </option>
              ))}
            </select>
            <Link
              href="/dashboard/trades/new"
              className="btn-primary items-center gap-2 flex"
            >
              <Plus className="w-4 h-4" />
              New Trade
            </Link>
          </div>
        </div>

        {/* ─── Global Date Filter ─── */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-600">
            <CalendarRange className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Date Range</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl p-1 flex-wrap">
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <div className="stat-card stat-card-green animate-fade-in stagger-1">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 bg-green-primary/10 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-primary" />
            </div>
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md border border-slate-300">
              Total
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1 number-highlight">
            {formatCurrency(totalBalance)}
          </h3>
          <p className="text-xs text-slate-600">Current Balance</p>
        </div>

        <div className={`stat-card ${periodProfitLoss >= 0 ? 'stat-card-green' : 'stat-card-red'} animate-fade-in stagger-2`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${periodProfitLoss >= 0 ? 'bg-green-primary/10' : 'bg-red-primary/10'
              }`}>
              {periodProfitLoss >= 0 ? (
                <ArrowUpRight className="w-5 h-5 text-green-primary" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-red-primary" />
              )}
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-md ${periodProfitLoss >= 0
              ? 'text-green-primary bg-green-primary/10'
              : 'text-red-primary bg-red-primary/10'
              }`}>
              {periodProfitLoss >= 0 ? '+' : ''}{formatPercentage(periodProfitLossPercentage)}
            </span>
          </div>
          <h3 className={`text-2xl font-bold mb-1 number-highlight ${periodProfitLoss >= 0 ? 'text-green-primary' : 'text-red-primary'
            }`}>
            {periodProfitLoss >= 0 ? '+' : ''}{formatCurrency(periodProfitLoss)}
          </h3>
          <p className="text-xs text-slate-600">
            {periodProfitLoss >= 0 ? 'Profit' : 'Loss'} ({activeDateFilterLabel})
          </p>
        </div>

        <div className="stat-card stat-card-blue animate-fade-in stagger-3">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 bg-blue-primary/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-primary" />
            </div>
            <Link href="/dashboard/accounts/new" className="text-green-primary hover:text-green-secondary transition-colors">
              <Plus className="w-4 h-4" />
            </Link>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{accounts.length}</h3>
          <p className="text-xs text-slate-600">Active Accounts</p>
        </div>

        <div className="stat-card stat-card-yellow animate-fade-in stagger-4">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 bg-yellow-primary/10 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-yellow-primary" />
            </div>
            {openTradesCount > 0 && (
              <span className="text-[10px] font-semibold text-blue-primary bg-blue-primary/10 px-2 py-1 rounded-md">
                {openTradesCount} open
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{recentTrades.length}</h3>
          <p className="text-xs text-slate-600">Trades ({activeDateFilterLabel})</p>
        </div>
      </div>

      <div className="card animate-fade-in stagger-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-green-primary" />
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/dashboard/trades/new"
            className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-green-primary/20 hover:border-green-primary/40 hover:bg-green-primary/5 transition-all group"
          >
            <div className="w-10 h-10 bg-green-primary/10 rounded-xl flex items-center justify-center group-hover:bg-green-primary/15 transition-colors">
              <Plus className="w-5 h-5 text-green-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">New Trade</h3>
              <p className="text-xs text-slate-600">Log a trade entry</p>
            </div>
          </Link>

          <Link
            href="/dashboard/accounts/new"
            className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-300 hover:border-blue-primary/30 hover:bg-blue-primary/5 transition-all group"
          >
            <div className="w-10 h-10 bg-blue-primary/10 rounded-xl flex items-center justify-center group-hover:bg-blue-primary/15 transition-colors">
              <Wallet className="w-5 h-5 text-blue-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">New Account</h3>
              <p className="text-xs text-slate-600">Create trading account</p>
            </div>
          </Link>

          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-300 hover:border-yellow-primary/30 hover:bg-yellow-primary/5 transition-all group"
          >
            <div className="w-10 h-10 bg-yellow-primary/10 rounded-xl flex items-center justify-center group-hover:bg-yellow-primary/15 transition-colors">
              <BarChart3 className="w-5 h-5 text-yellow-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Analytics</h3>
              <p className="text-xs text-slate-600">Performance metrics</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Equity Curve + Win/Loss */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card md:col-span-2 animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Equity Curve</h2>
              <p className="text-xs text-slate-600 mt-0.5">Account equity over {activeDateFilterLabel.toLowerCase()}</p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={equityCurveData}
                margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
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
                  width={80}
                  domain={['auto', 'auto']}
                  tickFormatter={(value: number) => formatCurrency(value)}
                />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#1e293b', fontSize: 12 }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(Number(value)),
                    name === 'equity' ? 'Equity' : 'P&L',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#047857"
                  strokeWidth={2.5}
                  fill="url(#equityGradient)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card animate-fade-in stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Win vs Loss</h2>
            <span className="text-xs text-slate-600">Closed trades</span>
          </div>

          {closedTrades.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-slate-600">
              No closed trades yet.
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={winLossPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={95}
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
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Cumulative P&L — net profit/loss accumulated over the selected range (separate from raw equity) */}
      <div className="card animate-fade-in stagger-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Cumulative P&amp;L</h2>
            <p className="text-xs text-slate-600 mt-0.5">Running net profit/loss over {activeDateFilterLabel.toLowerCase()}</p>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={equityCurveData}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
                domain={[(dataMin: number) => Math.min(0, Math.floor(dataMin)), (dataMax: number) => Math.max(0, Math.ceil(dataMax))]}
                tickFormatter={(value: number) => formatCurrency(value)}
              />
              <ReferenceLine y={0} stroke="#e2e8f0" strokeDasharray="4 4" />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#1e293b', fontSize: 12 }}
                formatter={(value: number) => [formatCurrency(Number(value)), 'Cumulative P&L']}
              />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily P&L — both wins and losses render as upward bars, colored by sign */}
      <div className="card animate-fade-in stagger-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daily P&amp;L</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              <span className="inline-flex items-center gap-1 mr-3">
                <span className="w-2 h-2 rounded-full bg-green-primary inline-block" /> Profit
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-primary inline-block" /> Loss
              </span>
            </p>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyPnLData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
                tickFormatter={(value: number) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#1e293b', fontSize: 12 }}
                formatter={(_value: number, _name: string, item: any) => {
                  const actual = item?.payload?.pnl ?? 0;
                  return [`${actual >= 0 ? '+' : ''}${formatCurrency(actual)}`, actual >= 0 ? 'Profit' : 'Loss'];
                }}
              />
              {/* displayValue is always positive so every bar renders upward from the baseline;
                  color reflects the underlying signed pnl (green = profit, red = loss) */}
              <Bar dataKey="displayValue" radius={[6, 6, 0, 0]}>
                {dailyPnLData.map((entry, index) => (
                  <Cell key={`${entry.date}-${index}`} fill={entry.pnl >= 0 ? '#047857' : '#dc2626'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Accounts */}
        <div className="card animate-fade-in stagger-3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Trading Accounts</h2>
            <Link href="/dashboard/accounts" className="flex items-center gap-1 text-xs text-green-primary hover:text-green-secondary transition-colors font-medium">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="empty-state-icon">
                <Wallet className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-600 mb-1 text-sm">No accounts yet</p>
              <p className="text-xs text-slate-600/60 mb-4">Create your first trading account</p>
              <Link href="/dashboard/accounts/new" className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4">
                <Plus className="w-4 h-4" />
                Create Account
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {accounts.slice(0, 3).map((account) => {
                const pl = Number(account.currentBalance) - Number(account.initialBalance);
                return (
                  <Link
                    key={account.id}
                    href={`/dashboard/accounts/${account.id}`}
                    className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-300 hover:border-green-primary/20 hover:bg-slate-50 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-primary/15 transition-colors">
                      <Wallet className="w-5 h-5 text-green-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">{account.accountName}</h3>
                      <p className="text-xs text-slate-600 truncate">{account.brokerName} • {account.marketSegment}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-green-primary text-sm number-highlight">
                        {formatCurrency(Number(account.currentBalance), account.currencyCode)}
                      </p>
                      <p className={`text-xs font-medium ${pl >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                        {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600/40 group-hover:text-green-primary transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Trades — tabbed */}
        <div className="card animate-fade-in stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Trade Log</h2>
            <Link href="/dashboard/trades" className="flex items-center gap-1 text-xs text-green-primary hover:text-green-secondary transition-colors font-medium">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Open / Closed tabs */}
          <div className="flex bg-slate-50 border border-slate-300 rounded-xl p-1 mb-4 gap-0.5">
            <button
              onClick={() => setTradeTab('open')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${tradeTab === 'open' ? 'bg-blue-primary/15 text-blue-primary' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Clock className="w-3 h-3" />
              Open
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tradeTab === 'open' ? 'bg-blue-primary/20 text-blue-primary' : 'bg-white text-slate-600'
                }`}>
                {recentTrades.filter(t => t.status === 'OPEN').length}
              </span>
            </button>
            <button
              onClick={() => setTradeTab('closed')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${tradeTab === 'closed' ? 'bg-green-primary/15 text-green-primary' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Closed
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tradeTab === 'closed' ? 'bg-green-primary/20 text-green-primary' : 'bg-white text-slate-600'
                }`}>
                {recentTrades.filter(t => t.status === 'CLOSED').length}
              </span>
            </button>
          </div>

          {(() => {
            const displayed = recentTrades.filter(t =>
              tradeTab === 'open' ? t.status === 'OPEN' : t.status === 'CLOSED'
            ).slice(0, 5);
            if (recentTrades.length === 0) return (
              <div className="text-center py-10">
                <div className="empty-state-icon">
                  <TrendingUp className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-600 mb-1 text-sm">No trades in this range</p>
                <p className="text-xs text-slate-600/60 mb-4">Try a different date filter or log a new trade</p>
                <Link href="/dashboard/trades/new" className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4">
                  <Plus className="w-4 h-4" /> Log Trade
                </Link>
              </div>
            );
            if (displayed.length === 0) return (
              <div className="text-center py-8">
                <p className="text-sm text-slate-600">
                  {tradeTab === 'open' ? 'No open positions' : 'No closed trades in this range'}
                </p>
                {tradeTab === 'open' && (
                  <Link href="/dashboard/trades/new" className="btn-primary inline-flex items-center gap-2 text-xs py-1.5 px-3 mt-3">
                    <Plus className="w-3 h-3" /> New Trade
                  </Link>
                )}
              </div>
            );
            return (
              <div className="space-y-2">
                {displayed.map(trade => {
                  const pl = getTradeNetProfitLoss(trade.result, trade.realisedProfitLoss, trade.serviceCharge);
                  const isBuy = trade.direction === 'BUY';
                  return (
                    <div
                      key={trade.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${trade.status === 'OPEN'
                        ? 'bg-blue-primary/5 border-blue-primary/15 hover:border-blue-primary/30'
                        : 'bg-slate-50 border-slate-300 hover:border-slate-300'
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isBuy ? 'bg-green-primary/10' : 'bg-red-primary/10'
                        }`}>
                        {isBuy
                          ? <ArrowUpRight className="w-4 h-4 text-green-primary" />
                          : <ArrowDownRight className="w-4 h-4 text-red-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">{trade.instrument}</span>
                          <span className={`text-[10px] px-1 py-0.5 rounded font-bold ${isBuy ? 'bg-green-primary/10 text-green-primary' : 'bg-red-primary/10 text-red-primary'
                            }`}>{trade.direction}</span>
                        </div>
                        <p className="text-xs text-slate-600/70">{formatDateTime(trade.entryDateTime)}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {trade.status === 'OPEN' ? (
                          <button
                            onClick={() => router.push(`/dashboard/trades/${trade.id}/close`)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-primary/10 hover:bg-green-primary/20 active:scale-95 text-green-primary rounded-lg text-[11px] font-bold transition-all border border-green-primary/20"
                          >
                            Close <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : pl !== null ? (
                          <p className={`text-sm font-bold number-highlight ${pl >= 0 ? 'text-green-primary' : 'text-red-primary'
                            }`}>
                            {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}