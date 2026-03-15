'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Wallet, TrendingUp, BarChart3, DollarSign,
  ArrowUpRight, ArrowDownRight, Plus, Activity,
  ChevronRight, Sparkles, Clock, CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { tradeAccountApi, tradeEntryApi, type TradeAccount, type TradeEntry } from '@/lib/api';
import { formatCurrency, formatPercentage, formatDateTime, getTradeNetProfitLoss } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [accounts, setAccounts] = useState<TradeAccount[]>([]);
  const [recentTrades, setRecentTrades] = useState<TradeEntry[]>([]);
  const [tradeTab, setTradeTab] = useState<'open' | 'closed'>('open');
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
        const allTrades: TradeEntry[] = [];
        for (const account of accountsRes.data) {
          try {
            const tradesRes = await tradeEntryApi.getByAccount(token, account.id);
            allTrades.push(...tradesRes.data);
          } catch (error) {}
        }
        const sorted = allTrades.sort((a, b) => 
          new Date(b.entryDateTime).getTime() - new Date(a.entryDateTime).getTime()
        );
        setRecentTrades(sorted.slice(0, 12));
      }
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);
  const totalInitialBalance = accounts.reduce((sum, acc) => sum + Number(acc.initialBalance), 0);
  const totalProfitLoss = totalBalance - totalInitialBalance;
  const profitLossPercentage = totalInitialBalance > 0 
    ? (totalProfitLoss / totalInitialBalance) * 100 : 0;
  const openTrades = recentTrades.filter(t => t.status === 'OPEN').length;

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-light mb-1 tracking-tight">
              Welcome back, <span className="gradient-text">{user?.name || 'Trader'}</span> 👋
            </h1>
            <p className="text-gray-text text-sm">Here&apos;s your trading overview for today</p>
          </div>
          <Link 
            href="/dashboard/trades/new" 
            className="hidden md:flex btn-primary items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Trade
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <div className="stat-card stat-card-green animate-fade-in stagger-1">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 bg-green-primary/10 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-primary" />
            </div>
            <span className="text-[10px] font-semibold text-gray-text uppercase tracking-wider bg-dark-bg px-2 py-1 rounded-md">
              Total
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-light mb-1 number-highlight">
            {formatCurrency(totalBalance)}
          </h3>
          <p className="text-xs text-gray-text">Current Balance</p>
        </div>

        <div className={`stat-card ${totalProfitLoss >= 0 ? 'stat-card-green' : 'stat-card-red'} animate-fade-in stagger-2`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              totalProfitLoss >= 0 ? 'bg-green-primary/10' : 'bg-red-primary/10'
            }`}>
              {totalProfitLoss >= 0 ? (
                <ArrowUpRight className="w-5 h-5 text-green-primary" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-red-primary" />
              )}
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-md ${
              totalProfitLoss >= 0 
                ? 'text-green-primary bg-green-primary/10' 
                : 'text-red-primary bg-red-primary/10'
            }`}>
              {totalProfitLoss >= 0 ? '+' : ''}{formatPercentage(profitLossPercentage)}
            </span>
          </div>
          <h3 className={`text-2xl font-bold mb-1 number-highlight ${
            totalProfitLoss >= 0 ? 'text-green-primary' : 'text-red-primary'
          }`}>
            {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss)}
          </h3>
          <p className="text-xs text-gray-text">
            {totalProfitLoss >= 0 ? 'Total Profit' : 'Total Loss'}
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
          <h3 className="text-2xl font-bold text-gray-light mb-1">{accounts.length}</h3>
          <p className="text-xs text-gray-text">Active Accounts</p>
        </div>

        <div className="stat-card stat-card-yellow animate-fade-in stagger-4">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 bg-yellow-primary/10 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-yellow-primary" />
            </div>
            {openTrades > 0 && (
              <span className="text-[10px] font-semibold text-blue-primary bg-blue-primary/10 px-2 py-1 rounded-md">
                {openTrades} open
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-light mb-1">{recentTrades.length}</h3>
          <p className="text-xs text-gray-text">Recent Trades</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Accounts */}
        <div className="card animate-fade-in stagger-3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-light">Trading Accounts</h2>
            <Link href="/dashboard/accounts" className="flex items-center gap-1 text-xs text-green-primary hover:text-green-secondary transition-colors font-medium">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="empty-state-icon">
                <Wallet className="w-8 h-8 text-gray-text" />
              </div>
              <p className="text-gray-text mb-1 text-sm">No accounts yet</p>
              <p className="text-xs text-gray-text/60 mb-4">Create your first trading account</p>
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
                    className="flex items-center gap-4 p-3.5 bg-dark-bg/60 rounded-xl border border-dark-border/50 hover:border-green-primary/20 hover:bg-dark-bg transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-primary/15 transition-colors">
                      <Wallet className="w-5 h-5 text-green-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-light text-sm truncate">{account.accountName}</h3>
                      <p className="text-xs text-gray-text truncate">{account.brokerName} • {account.marketSegment}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-green-primary text-sm number-highlight">
                        {formatCurrency(Number(account.currentBalance), account.currencyCode)}
                      </p>
                      <p className={`text-xs font-medium ${pl >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                        {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-text/40 group-hover:text-green-primary transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Trades — tabbed */}
        <div className="card animate-fade-in stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-light">Trade Log</h2>
            <Link href="/dashboard/trades" className="flex items-center gap-1 text-xs text-green-primary hover:text-green-secondary transition-colors font-medium">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Open / Closed tabs */}
          <div className="flex bg-dark-bg rounded-xl p-1 mb-4 gap-0.5">
            <button
              onClick={() => setTradeTab('open')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tradeTab === 'open' ? 'bg-blue-primary/15 text-blue-primary' : 'text-gray-text hover:text-gray-light'
              }`}
            >
              <Clock className="w-3 h-3" />
              Open
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tradeTab === 'open' ? 'bg-blue-primary/20 text-blue-primary' : 'bg-dark-card text-gray-text'
              }`}>
                {recentTrades.filter(t => t.status === 'OPEN').length}
              </span>
            </button>
            <button
              onClick={() => setTradeTab('closed')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tradeTab === 'closed' ? 'bg-green-primary/15 text-green-primary' : 'text-gray-text hover:text-gray-light'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Closed
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tradeTab === 'closed' ? 'bg-green-primary/20 text-green-primary' : 'bg-dark-card text-gray-text'
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
                  <TrendingUp className="w-8 h-8 text-gray-text" />
                </div>
                <p className="text-gray-text mb-1 text-sm">No trades yet</p>
                <p className="text-xs text-gray-text/60 mb-4">Start logging your trades</p>
                <Link href="/dashboard/trades/new" className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4">
                  <Plus className="w-4 h-4" /> Log Trade
                </Link>
              </div>
            );
            if (displayed.length === 0) return (
              <div className="text-center py-8">
                <p className="text-sm text-gray-text">
                  {tradeTab === 'open' ? 'No open positions' : 'No closed trades yet'}
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
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        trade.status === 'OPEN'
                          ? 'bg-blue-primary/5 border-blue-primary/15 hover:border-blue-primary/30'
                          : 'bg-dark-bg/60 border-dark-border/50 hover:border-dark-border'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isBuy ? 'bg-green-primary/10' : 'bg-red-primary/10'
                      }`}>
                        {isBuy
                          ? <ArrowUpRight className="w-4 h-4 text-green-primary" />
                          : <ArrowDownRight className="w-4 h-4 text-red-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-light text-sm">{trade.instrument}</span>
                          <span className={`text-[10px] px-1 py-0.5 rounded font-bold ${
                            isBuy ? 'bg-green-primary/10 text-green-primary' : 'bg-red-primary/10 text-red-primary'
                          }`}>{trade.direction}</span>
                        </div>
                        <p className="text-xs text-gray-text/70">{formatDateTime(trade.entryDateTime)}</p>
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
                          <p className={`text-sm font-bold number-highlight ${
                            pl >= 0 ? 'text-green-primary' : 'text-red-primary'
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

      {/* Quick Actions */}
      <div className="card animate-fade-in stagger-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-green-primary" />
          <h2 className="text-lg font-bold text-gray-light">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/dashboard/trades/new"
            className="flex items-center gap-3 p-4 bg-dark-bg/60 rounded-xl border border-green-primary/20 hover:border-green-primary/40 hover:bg-green-primary/5 transition-all group"
          >
            <div className="w-10 h-10 bg-green-primary/10 rounded-xl flex items-center justify-center group-hover:bg-green-primary/15 transition-colors">
              <Plus className="w-5 h-5 text-green-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-light text-sm">New Trade</h3>
              <p className="text-xs text-gray-text">Log a trade entry</p>
            </div>
          </Link>

          <Link
            href="/dashboard/accounts/new"
            className="flex items-center gap-3 p-4 bg-dark-bg/60 rounded-xl border border-dark-border/50 hover:border-blue-primary/30 hover:bg-blue-primary/5 transition-all group"
          >
            <div className="w-10 h-10 bg-blue-primary/10 rounded-xl flex items-center justify-center group-hover:bg-blue-primary/15 transition-colors">
              <Wallet className="w-5 h-5 text-blue-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-light text-sm">New Account</h3>
              <p className="text-xs text-gray-text">Create trading account</p>
            </div>
          </Link>

          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-3 p-4 bg-dark-bg/60 rounded-xl border border-dark-border/50 hover:border-yellow-primary/30 hover:bg-yellow-primary/5 transition-all group"
          >
            <div className="w-10 h-10 bg-yellow-primary/10 rounded-xl flex items-center justify-center group-hover:bg-yellow-primary/15 transition-colors">
              <BarChart3 className="w-5 h-5 text-yellow-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-light text-sm">Analytics</h3>
              <p className="text-xs text-gray-text">Performance metrics</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
