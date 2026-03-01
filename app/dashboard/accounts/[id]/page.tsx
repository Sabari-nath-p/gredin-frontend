'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Wallet, TrendingUp, Trash2, DollarSign, BarChart3,
  ArrowUpRight, ArrowDownRight, Target, Activity, Plus, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { tradeAccountApi, tradeEntryApi, type TradeAccount, type TradeEntry, type TradeStats } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const accountId = params.id as string;
  
  const [account, setAccount] = useState<TradeAccount | null>(null);
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadAccountData();
  }, [accountId]);

  const loadAccountData = async () => {
    if (!token || !accountId) return;
    try {
      const [accountRes, tradesRes, statsRes] = await Promise.all([
        tradeAccountApi.getById(token, accountId),
        tradeEntryApi.getByAccount(token, accountId),
        tradeEntryApi.getStats(token, accountId),
      ]);
      setAccount(accountRes.data);
      setTrades(tradesRes.data);
      setStats(statsRes.data);
    } catch (error: any) {
      toast.error('Failed to load account data');
      router.push('/dashboard/accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTrade = async (tradeId: string) => {
    router.push(`/dashboard/trades/${tradeId}/close`);
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    try {
      await tradeAccountApi.delete(token, accountId);
      toast.success('Account deleted successfully');
      router.push('/dashboard/accounts');
    } catch (error: any) {
      toast.error('Failed to delete account');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-6 w-32 rounded-lg"></div>
        <div className="flex items-center gap-4">
          <div className="skeleton w-14 h-14 rounded-2xl"></div>
          <div className="space-y-2">
            <div className="skeleton h-8 w-48 rounded-lg"></div>
            <div className="skeleton h-4 w-32 rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl"></div>
          ))}
        </div>
        <div className="skeleton h-64 rounded-2xl"></div>
      </div>
    );
  }

  if (!account) return null;

  const profitLoss = Number(account.currentBalance) - Number(account.initialBalance);
  const profitLossPercentage = Number(account.initialBalance) > 0
    ? (profitLoss / Number(account.initialBalance)) * 100 : 0;
  const openTrades = trades.filter(t => t.status === 'OPEN').length;
  const closedTrades = trades.filter(t => t.status === 'CLOSED').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back & Header */}
      <div>
        <Link
          href="/dashboard/accounts"
          className="inline-flex items-center gap-2 text-sm text-gray-text hover:text-green-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Accounts
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-primary/10 rounded-2xl flex items-center justify-center">
              <Wallet className="w-7 h-7 text-green-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-light tracking-tight">{account.accountName}</h1>
              <p className="text-sm text-gray-text">{account.brokerName} • {account.marketSegment} • 
                <span className={`ml-1 text-xs font-semibold px-1.5 py-0.5 rounded ${
                  account.accountType === 'LIVE' ? 'bg-green-primary/10 text-green-primary' :
                  account.accountType === 'DEMO' ? 'bg-blue-primary/10 text-blue-primary' :
                  'bg-yellow-primary/10 text-yellow-primary'
                }`}>{account.accountType}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/trades/new?accountId=${account.id}`}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Trade
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 rounded-xl border border-dark-border text-gray-text hover:text-red-primary hover:border-red-primary/50 hover:bg-red-primary/5 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="card border-red-primary/30 bg-red-primary/5 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-primary mb-1">Delete Account?</h3>
              <p className="text-sm text-gray-text mb-3">This will permanently delete this account and all {trades.length} trades. This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-primary text-white rounded-lg text-sm font-semibold hover:bg-red-primary/90 transition-colors">
                  Delete Account
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-dark-bg text-gray-text rounded-lg text-sm font-semibold hover:text-gray-light transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card stat-card-green">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-green-primary" />
            <span className="text-xs text-gray-text font-medium uppercase tracking-wider">Balance</span>
          </div>
          <p className="text-xl font-bold text-green-primary number-highlight">
            {formatCurrency(Number(account.currentBalance), account.currencyCode)}
          </p>
          <p className="text-xs text-gray-text mt-1">Initial: {formatCurrency(Number(account.initialBalance))}</p>
        </div>

        <div className={`stat-card ${profitLoss >= 0 ? 'stat-card-green' : 'stat-card-red'}`}>
          <div className="flex items-center gap-2 mb-3">
            {profitLoss >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-primary" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-primary" />
            )}
            <span className="text-xs text-gray-text font-medium uppercase tracking-wider">P&L</span>
          </div>
          <p className={`text-xl font-bold number-highlight ${profitLoss >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
            {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss, account.currencyCode)}
          </p>
          <p className={`text-xs mt-1 ${profitLoss >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
            {profitLoss >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%
          </p>
        </div>

        <div className="stat-card stat-card-blue">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-blue-primary" />
            <span className="text-xs text-gray-text font-medium uppercase tracking-wider">Win Rate</span>
          </div>
          <p className="text-xl font-bold text-gray-light">{(stats?.winRate ?? 0).toFixed(1)}%</p>
          <p className="text-xs text-gray-text mt-1">
            <span className="text-green-primary">{stats?.winningTrades ?? 0}W</span>
            {' / '}
            <span className="text-red-primary">{stats?.losingTrades ?? 0}L</span>
          </p>
        </div>

        <div className="stat-card stat-card-yellow">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-yellow-primary" />
            <span className="text-xs text-gray-text font-medium uppercase tracking-wider">Trades</span>
          </div>
          <p className="text-xl font-bold text-gray-light">{stats?.totalTrades ?? 0}</p>
          <p className="text-xs text-gray-text mt-1">
            {openTrades > 0 && <span className="text-blue-primary">{openTrades} open</span>}
            {openTrades > 0 && closedTrades > 0 && ' • '}
            {closedTrades > 0 && <span>{closedTrades} closed</span>}
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      {stats && (stats.totalTrades ?? 0) > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-green-primary" />
            <h2 className="text-lg font-bold text-gray-light">Performance Metrics</h2>
          </div>
          
          <div className="mb-5 p-4 bg-dark-bg/60 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-text">Win Rate</span>
              <span className="text-sm font-bold text-green-primary">{(stats.winRate ?? 0).toFixed(1)}%</span>
            </div>
            <div className="w-full h-2.5 bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-primary to-green-secondary rounded-full transition-all duration-700"
                style={{ width: `${stats.winRate ?? 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-3 bg-dark-bg/60 rounded-xl">
              <p className="text-xs text-gray-text mb-1">Avg Win</p>
              <p className="text-sm font-bold text-green-primary number-highlight">
                {formatCurrency(stats.averageWin ?? 0, account.currencyCode)}
              </p>
            </div>
            <div className="p-3 bg-dark-bg/60 rounded-xl">
              <p className="text-xs text-gray-text mb-1">Avg Loss</p>
              <p className="text-sm font-bold text-red-primary number-highlight">
                {formatCurrency(stats.averageLoss ?? 0, account.currencyCode)}
              </p>
            </div>
            <div className="p-3 bg-dark-bg/60 rounded-xl">
              <p className="text-xs text-gray-text mb-1">Largest Win</p>
              <p className="text-sm font-bold text-green-primary number-highlight">
                {formatCurrency(stats.largestWin ?? 0, account.currencyCode)}
              </p>
            </div>
            <div className="p-3 bg-dark-bg/60 rounded-xl">
              <p className="text-xs text-gray-text mb-1">Largest Loss</p>
              <p className="text-sm font-bold text-red-primary number-highlight">
                {formatCurrency(stats.largestLoss ?? 0, account.currencyCode)}
              </p>
            </div>
            <div className="p-3 bg-dark-bg/60 rounded-xl">
              <p className="text-xs text-gray-text mb-1">Profit Factor</p>
              <p className="text-sm font-bold text-gray-light number-highlight">
                {(stats.profitFactor ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-dark-bg/60 rounded-xl">
              <p className="text-xs text-gray-text mb-1">Net P/L</p>
              <p className={`text-sm font-bold number-highlight ${(stats.netProfitLoss ?? 0) >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                {formatCurrency(stats.netProfitLoss ?? 0, account.currencyCode)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trades Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-light">Trade History</h2>
          <Link
            href={`/dashboard/trades/new?accountId=${account.id}`}
            className="flex items-center gap-1 text-xs text-green-primary hover:text-green-secondary transition-colors font-medium"
          >
            <Plus className="w-3 h-3" />
            New Trade
          </Link>
        </div>

        {trades.length === 0 ? (
          <div className="text-center py-12">
            <div className="empty-state-icon mx-auto">
              <TrendingUp className="w-8 h-8 text-gray-text" />
            </div>
            <p className="text-gray-text mb-1 text-sm">No trades logged yet</p>
            <p className="text-xs text-gray-text/60 mb-4">Start trading to track your performance</p>
            <Link
              href={`/dashboard/trades/new?accountId=${account.id}`}
              className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4"
            >
              <Plus className="w-4 h-4" />
              Log First Trade
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-dark-border/50">
                  <th className="text-left text-xs font-semibold text-gray-text uppercase tracking-wider px-6 py-3">Date</th>
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
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-dark-border/30 hover:bg-dark-bg/40 transition-colors">
                    <td className="px-6 py-3 text-xs text-gray-text">{formatDateTime(trade.entryDateTime)}</td>
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
                          className="text-xs font-semibold text-green-primary hover:text-green-secondary transition-colors"
                        >
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
