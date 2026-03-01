'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, Plus, Filter, ArrowUpRight, ArrowDownRight,
  Search, BarChart3, Activity
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { tradeAccountApi, tradeEntryApi, type TradeAccount, type TradeEntry } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function TradesPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [accounts, setAccounts] = useState<TradeAccount[]>([]);
  const [allTrades, setAllTrades] = useState<TradeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
        } catch (error) {}
      }
      setAllTrades(trades.sort((a, b) => 
        new Date(b.entryDateTime).getTime() - new Date(a.entryDateTime).getTime()
      ));
    } catch (error: any) {
      toast.error('Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = allTrades.filter(trade => {
    const accountMatch = selectedAccount === 'all' || trade.tradeAccountId === selectedAccount;
    const statusMatch = statusFilter === 'all' || trade.status === statusFilter;
    return accountMatch && statusMatch;
  });

  const handleCloseTrade = (tradeId: string) => {
    router.push(`/dashboard/trades/${tradeId}/close`);
  };

  const openCount = filteredTrades.filter(t => t.status === 'OPEN').length;
  const closedCount = filteredTrades.filter(t => t.status === 'CLOSED').length;
  const winCount = filteredTrades.filter(t => t.result === 'PROFIT').length;
  const totalPL = filteredTrades.reduce((sum, t) => sum + (Number(t.realisedProfitLoss) || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="skeleton h-8 w-40 rounded-lg"></div>
          <div className="skeleton h-10 w-32 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl"></div>
          ))}
        </div>
        <div className="skeleton h-96 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-light tracking-tight">All Trades</h1>
          <p className="text-sm text-gray-text mt-0.5">Complete trade history across all accounts</p>
        </div>
        <Link href="/dashboard/trades/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Trade
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card stat-card-green">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-green-primary" />
            <span className="text-xs text-gray-text font-medium uppercase tracking-wider">Total</span>
          </div>
          <p className="text-xl font-bold text-gray-light">{filteredTrades.length}</p>
        </div>
        <div className="stat-card stat-card-blue">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-primary" />
            <span className="text-xs text-gray-text font-medium uppercase tracking-wider">Open</span>
          </div>
          <p className="text-xl font-bold text-blue-primary">{openCount}</p>
        </div>
        <div className="stat-card stat-card-green">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-primary" />
            <span className="text-xs text-gray-text font-medium uppercase tracking-wider">Winning</span>
          </div>
          <p className="text-xl font-bold text-green-primary">{winCount}</p>
        </div>
        <div className={`stat-card ${totalPL >= 0 ? 'stat-card-green' : 'stat-card-red'}`}>
          <div className="flex items-center gap-2 mb-2">
            {totalPL >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-primary" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-primary" />
            )}
            <span className="text-xs text-gray-text font-medium uppercase tracking-wider">Net P/L</span>
          </div>
          <p className={`text-xl font-bold number-highlight ${totalPL >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
            {totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-green-primary" />
          <span className="text-sm font-semibold text-gray-light">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-text mb-1.5">Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Accounts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-text mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Status</option>
              <option value="OPEN">Open Only</option>
              <option value="CLOSED">Closed Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="card">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-16">
            <div className="empty-state-icon mx-auto">
              <TrendingUp className="w-10 h-10 text-gray-text" />
            </div>
            <h3 className="text-lg font-semibold text-gray-light mb-2">No Trades Found</h3>
            <p className="text-sm text-gray-text mb-6 max-w-sm mx-auto">
              {allTrades.length === 0 ? 'Start logging your trades to see them here' : 'No trades match your current filters'}
            </p>
            {allTrades.length === 0 && (
              <Link href="/dashboard/trades/new" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Log First Trade
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-dark-border/50">
                  <th className="text-left text-xs font-semibold text-gray-text uppercase tracking-wider px-6 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-text uppercase tracking-wider px-3 py-3">Account</th>
                  <th className="text-left text-xs font-semibold text-gray-text uppercase tracking-wider px-3 py-3">Instrument</th>
                  <th className="text-left text-xs font-semibold text-gray-text uppercase tracking-wider px-3 py-3">Dir</th>
                  <th className="text-left text-xs font-semibold text-gray-text uppercase tracking-wider px-3 py-3">Entry</th>
                  <th className="text-left text-xs font-semibold text-gray-text uppercase tracking-wider px-3 py-3">Size</th>
                  <th className="text-left text-xs font-semibold text-gray-text uppercase tracking-wider px-3 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-text uppercase tracking-wider px-3 py-3">Result</th>
                  <th className="text-right text-xs font-semibold text-gray-text uppercase tracking-wider px-3 py-3">P/L</th>
                  <th className="text-right text-xs font-semibold text-gray-text uppercase tracking-wider px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => {
                  const account = accounts.find(a => a.id === trade.tradeAccountId);
                  return (
                    <tr key={trade.id} className="border-b border-dark-border/30 hover:bg-dark-bg/40 transition-colors">
                      <td className="px-6 py-3 text-xs text-gray-text">{formatDateTime(trade.entryDateTime)}</td>
                      <td className="px-3 py-3 text-xs text-gray-text">{account?.accountName || 'Unknown'}</td>
                      <td className="px-3 py-3 text-sm font-semibold text-gray-light">{trade.instrument}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          trade.direction === 'BUY' 
                            ? 'bg-green-primary/10 text-green-primary' 
                            : 'bg-red-primary/10 text-red-primary'
                        }`}>
                          {trade.direction}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-light number-highlight">
                        {trade.entryPrice ? formatCurrency(Number(trade.entryPrice)) : '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-text">{trade.positionSize || '-'}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          trade.status === 'OPEN' 
                            ? 'bg-blue-primary/10 text-blue-primary' 
                            : 'bg-gray-text/10 text-gray-text'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {trade.result ? (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            trade.result === 'PROFIT' ? 'bg-green-primary/10 text-green-primary' :
                            trade.result === 'LOSS' ? 'bg-red-primary/10 text-red-primary' :
                            'bg-yellow-primary/10 text-yellow-primary'
                          }`}>
                            {trade.result}
                          </span>
                        ) : <span className="text-gray-text/40">—</span>}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {trade.realisedProfitLoss !== null ? (
                          <span className={`text-sm font-bold number-highlight ${
                            Number(trade.realisedProfitLoss) >= 0 ? 'text-green-primary' : 'text-red-primary'
                          }`}>
                            {Number(trade.realisedProfitLoss) >= 0 ? '+' : ''}
                            {formatCurrency(Number(trade.realisedProfitLoss))}
                          </span>
                        ) : <span className="text-gray-text/40">—</span>}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {trade.status === 'OPEN' && (
                          <button
                            onClick={() => handleCloseTrade(trade.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-primary/10 hover:bg-green-primary/20 text-green-primary rounded-lg text-xs font-semibold transition-colors"
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
        )}
      </div>
    </div>
  );
}
