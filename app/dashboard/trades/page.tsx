'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, Plus, ArrowUpRight, ArrowDownRight,
  BarChart3, Clock, ChevronRight, Filter, CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { tradeAccountApi, tradeEntryApi, type TradeAccount, type TradeEntry } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

type TabKey = 'all' | 'open' | 'closed';

export default function TradesPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [accounts, setAccounts] = useState<TradeAccount[]>([]);
  const [allTrades, setAllTrades] = useState<TradeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!token) return;
    try {
      const accountsRes = await tradeAccountApi.getAll(token);
      setAccounts(accountsRes.data);
      const trades: TradeEntry[] = [];
      for (const account of accountsRes.data) {
        try {
          const tradesRes = await tradeEntryApi.getByAccount(token, account.id);
          trades.push(...tradesRes.data);
        } catch {}
      }
      setAllTrades(
        trades.sort((a, b) => new Date(b.entryDateTime).getTime() - new Date(a.entryDateTime).getTime())
      );
    } catch {
      toast.error('Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  const byAccount = (t: TradeEntry) => selectedAccount === 'all' || t.tradeAccountId === selectedAccount;

  const filteredTrades = allTrades.filter(t => {
    if (!byAccount(t)) return false;
    if (activeTab === 'open')   return t.status === 'OPEN';
    if (activeTab === 'closed') return t.status === 'CLOSED';
    return true;
  });

  const openCount   = allTrades.filter(t => byAccount(t) && t.status === 'OPEN').length;
  const closedCount = allTrades.filter(t => byAccount(t) && t.status === 'CLOSED').length;
  const allCount    = allTrades.filter(t => byAccount(t)).length;
  const winCount    = filteredTrades.filter(t => t.result === 'PROFIT').length;
  const totalPL     = filteredTrades.reduce((s, t) => s + (Number(t.realisedProfitLoss) || 0), 0);

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="skeleton h-8 w-40 rounded-lg" />
          <div className="skeleton h-10 w-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
        <div className="skeleton h-12 rounded-xl" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all',    label: 'All',    count: allCount    },
    { key: 'open',   label: 'Open',   count: openCount   },
    { key: 'closed', label: 'Closed', count: closedCount },
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-light tracking-tight">Trade Log</h1>
          <p className="text-sm text-gray-text mt-0.5">{allTrades.length} total entries</p>
        </div>
        <Link href="/dashboard/trades/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Trade</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card stat-card-green">
          <div className="flex items-center gap-2 mb-1.5">
            <BarChart3 className="w-4 h-4 text-green-primary" />
            <span className="text-[11px] text-gray-text font-medium uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-light">{filteredTrades.length}</p>
        </div>
        <div className="stat-card stat-card-blue">
          <div className="flex items-center gap-2 mb-1.5">
            <Clock className="w-4 h-4 text-blue-primary" />
            <span className="text-[11px] text-gray-text font-medium uppercase tracking-wider">Open</span>
          </div>
          <p className="text-2xl font-bold text-blue-primary">{openCount}</p>
        </div>
        <div className="stat-card stat-card-green">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="w-4 h-4 text-green-primary" />
            <span className="text-[11px] text-gray-text font-medium uppercase tracking-wider">Winning</span>
          </div>
          <p className="text-2xl font-bold text-green-primary">{winCount}</p>
        </div>
        <div className={`stat-card ${totalPL >= 0 ? 'stat-card-green' : 'stat-card-red'}`}>
          <div className="flex items-center gap-2 mb-1.5">
            {totalPL >= 0
              ? <ArrowUpRight className="w-4 h-4 text-green-primary" />
              : <ArrowDownRight className="w-4 h-4 text-red-primary" />}
            <span className="text-[11px] text-gray-text font-medium uppercase tracking-wider">Net P/L</span>
          </div>
          <p className={`text-xl font-bold number-highlight ${totalPL >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
            {totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL)}
          </p>
        </div>
      </div>

      {/* ── Tabs + Account filter ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex bg-dark-card border border-dark-border/60 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-green-primary/15 text-green-primary'
                  : 'text-gray-text hover:text-gray-light'
              }`}
            >
              {tab.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.key ? 'bg-green-primary/20 text-green-primary' : 'bg-dark-bg text-gray-text'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>
        {accounts.length > 1 && (
          <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
            <Filter className="w-4 h-4 text-gray-text flex-shrink-0" />
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="input flex-1 text-sm"
            >
              <option value="all">All Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.accountName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Trade list ── */}
      {filteredTrades.length === 0 ? (
        <div className="card text-center py-16">
          <div className="empty-state-icon mx-auto">
            <TrendingUp className="w-10 h-10 text-gray-text" />
          </div>
          <h3 className="text-lg font-semibold text-gray-light mb-2">No Trades Found</h3>
          <p className="text-sm text-gray-text mb-6 max-w-sm mx-auto">
            {allTrades.length === 0
              ? 'Start logging your trades to see them here'
              : 'No trades match your current filters'}
          </p>
          {allTrades.length === 0 && (
            <Link href="/dashboard/trades/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Log First Trade
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* ── Mobile cards (hidden md+) ── */}
          <div className="md:hidden space-y-3">
            {filteredTrades.map(trade => {
              const account = accounts.find(a => a.id === trade.tradeAccountId);
              const pl = Number(trade.realisedProfitLoss);
              const isBuy  = trade.direction === 'BUY';
              const isOpen = trade.status === 'OPEN';
              return (
                <div
                  key={trade.id}
                  onClick={() => router.push(`/dashboard/trades/${trade.id}`)}
                  className={`bg-dark-card rounded-2xl border p-4 transition-colors cursor-pointer hover:border-green-primary/20 active:scale-[0.99] ${
                    isOpen ? 'border-blue-primary/20' : 'border-dark-border/50'
                  }`}
                >
                  {/* Top row: icon + instrument + badges + close/p&l */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isBuy ? 'bg-green-primary/10' : 'bg-red-primary/10'
                      }`}>
                        {isBuy
                          ? <ArrowUpRight className="w-5 h-5 text-green-primary" />
                          : <ArrowDownRight className="w-5 h-5 text-red-primary" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-light text-base leading-tight">{trade.instrument}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            isBuy ? 'bg-green-primary/10 text-green-primary' : 'bg-red-primary/10 text-red-primary'
                          }`}>{trade.direction}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            isOpen ? 'bg-blue-primary/10 text-blue-primary' : 'bg-gray-text/10 text-gray-text'
                          }`}>{trade.status}</span>
                          {trade.result && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              trade.result === 'PROFIT' ? 'bg-green-primary/10 text-green-primary' :
                              trade.result === 'LOSS'   ? 'bg-red-primary/10 text-red-primary' :
                                                          'bg-yellow-primary/10 text-yellow-primary'
                            }`}>{trade.result}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Right action */}
                    {isOpen ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/trades/${trade.id}/close`); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-primary/10 hover:bg-green-primary/20 active:scale-95 text-green-primary rounded-xl text-xs font-bold transition-all border border-green-primary/20 flex-shrink-0"
                      >
                        Close <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : trade.realisedProfitLoss !== null ? (
                      <div className="text-right flex-shrink-0">
                        <p className={`text-lg font-bold number-highlight leading-tight ${pl >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                          {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                        </p>
                        <CheckCircle2 className="w-3.5 h-3.5 text-gray-text/40 ml-auto mt-0.5" />
                      </div>
                    ) : null}
                  </div>

                  {/* Detail grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs border-t border-dark-border/30 pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-text">Account</span>
                      <span className="text-gray-light font-medium truncate ml-2 max-w-[110px]">{account?.accountName || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-text">Size</span>
                      <span className="text-gray-light font-medium">{trade.positionSize || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-text">Entry</span>
                      <span className="text-gray-light font-medium number-highlight">
                        {trade.entryPrice ? formatCurrency(Number(trade.entryPrice)) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-text">Stop Loss</span>
                      <span className="text-red-primary/80 font-medium number-highlight">
                        {trade.stopLossAmount ? formatCurrency(Number(trade.stopLossAmount)) : '—'}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1.5 border-t border-dark-border/20 mt-0.5">
                      <span className="text-gray-text/60">{formatDateTime(trade.entryDateTime)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop table (md+) ── */}
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-dark-border/50">
                  <th className="text-left text-[11px] font-semibold text-gray-text uppercase tracking-wider pl-5 pr-3 py-3">Date</th>
                  <th className="text-left text-[11px] font-semibold text-gray-text uppercase tracking-wider px-3 py-3">Account</th>
                  <th className="text-left text-[11px] font-semibold text-gray-text uppercase tracking-wider px-3 py-3">Instrument</th>
                  <th className="text-left text-[11px] font-semibold text-gray-text uppercase tracking-wider px-3 py-3">Dir</th>
                  <th className="text-left text-[11px] font-semibold text-gray-text uppercase tracking-wider px-3 py-3">Entry</th>
                  <th className="text-left text-[11px] font-semibold text-gray-text uppercase tracking-wider px-3 py-3">Size</th>
                  <th className="text-left text-[11px] font-semibold text-gray-text uppercase tracking-wider px-3 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold text-gray-text uppercase tracking-wider px-3 py-3">Result</th>
                  <th className="text-right text-[11px] font-semibold text-gray-text uppercase tracking-wider px-3 py-3">P/L</th>
                  <th className="pr-5 pl-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map(trade => {
                  const account = accounts.find(a => a.id === trade.tradeAccountId);
                  const pl = Number(trade.realisedProfitLoss);
                  return (
                    <tr key={trade.id} onClick={() => router.push(`/dashboard/trades/${trade.id}`)} className="border-b border-dark-border/30 hover:bg-dark-bg/40 transition-colors cursor-pointer">
                      <td className="pl-5 pr-3 py-3 text-xs text-gray-text whitespace-nowrap">{formatDateTime(trade.entryDateTime)}</td>
                      <td className="px-3 py-3 text-xs text-gray-text">{account?.accountName || '—'}</td>
                      <td className="px-3 py-3 text-sm font-bold text-gray-light">{trade.instrument}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          trade.direction === 'BUY' ? 'bg-green-primary/10 text-green-primary' : 'bg-red-primary/10 text-red-primary'
                        }`}>{trade.direction}</span>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-light number-highlight">
                        {trade.entryPrice ? formatCurrency(Number(trade.entryPrice)) : '—'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-text">{trade.positionSize || '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          trade.status === 'OPEN' ? 'bg-blue-primary/10 text-blue-primary' : 'bg-gray-text/10 text-gray-text'
                        }`}>{trade.status}</span>
                      </td>
                      <td className="px-3 py-3">
                        {trade.result
                          ? <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              trade.result === 'PROFIT' ? 'bg-green-primary/10 text-green-primary' :
                              trade.result === 'LOSS'   ? 'bg-red-primary/10 text-red-primary' :
                                                          'bg-yellow-primary/10 text-yellow-primary'
                            }`}>{trade.result}</span>
                          : <span className="text-gray-text/30">—</span>
                        }
                      </td>
                      <td className="px-3 py-3 text-right">
                        {trade.realisedProfitLoss !== null
                          ? <span className={`text-sm font-bold number-highlight ${pl >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                              {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                            </span>
                          : <span className="text-gray-text/30">—</span>
                        }
                      </td>
                      <td className="pr-5 pl-3 py-3 text-right">
                        {trade.status === 'OPEN' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/trades/${trade.id}/close`); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-primary/10 hover:bg-green-primary/20 text-green-primary rounded-lg text-xs font-bold transition-colors border border-green-primary/20"
                          >
                            Close
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
