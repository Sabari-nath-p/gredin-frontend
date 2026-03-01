'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Wallet, Plus, ArrowUpRight, ArrowDownRight, 
  ChevronRight, Search, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { tradeAccountApi, type TradeAccount } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AccountsPage() {
  const { token } = useAuthStore();
  const [accounts, setAccounts] = useState<TradeAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    if (!token) return;
    try {
      const res = await tradeAccountApi.getAll(token);
      setAccounts(res.data);
    } catch (error: any) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const filtered = accounts.filter(a =>
    a.accountName.toLowerCase().includes(search.toLowerCase()) ||
    a.brokerName.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = accounts.reduce((s, a) => s + Number(a.currentBalance), 0);
  const totalInitial = accounts.reduce((s, a) => s + Number(a.initialBalance), 0);
  const totalPL = totalBalance - totalInitial;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="skeleton h-8 w-48 rounded-lg"></div>
          <div className="skeleton h-10 w-36 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-52 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-light tracking-tight">Trading Accounts</h1>
          <p className="text-sm text-gray-text mt-0.5">{accounts.length} account{accounts.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/dashboard/accounts/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Account
        </Link>
      </div>

      {/* Summary Stats */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card stat-card-green">
            <p className="text-xs text-gray-text font-medium uppercase tracking-wider mb-2">Total Balance</p>
            <p className="text-xl font-bold text-gray-light number-highlight">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="stat-card stat-card-blue">
            <p className="text-xs text-gray-text font-medium uppercase tracking-wider mb-2">Total Invested</p>
            <p className="text-xl font-bold text-gray-light number-highlight">{formatCurrency(totalInitial)}</p>
          </div>
          <div className={`stat-card ${totalPL >= 0 ? 'stat-card-green' : 'stat-card-red'}`}>
            <p className="text-xs text-gray-text font-medium uppercase tracking-wider mb-2">Total P&L</p>
            <p className={`text-xl font-bold number-highlight ${totalPL >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
              {totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL)}
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      {accounts.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-text" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full sm:max-w-sm"
          />
        </div>
      )}

      {/* Accounts Grid */}
      {filtered.length === 0 && accounts.length === 0 ? (
        <div className="card text-center py-16">
          <div className="empty-state-icon mx-auto">
            <Wallet className="w-10 h-10 text-gray-text" />
          </div>
          <h3 className="text-lg font-semibold text-gray-light mb-2">No Accounts Yet</h3>
          <p className="text-sm text-gray-text mb-6 max-w-sm mx-auto">
            Create your first trading account to start logging trades and tracking performance.
          </p>
          <Link href="/dashboard/accounts/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Account
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Search className="w-8 h-8 text-gray-text mx-auto mb-3" />
          <p className="text-gray-text">No accounts match &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((account, i) => {
            const pl = Number(account.currentBalance) - Number(account.initialBalance);
            const plPct = Number(account.initialBalance) > 0 
              ? (pl / Number(account.initialBalance)) * 100 : 0;
            return (
              <div
                key={account.id}
                className={`card group animate-fade-in stagger-${Math.min(i + 1, 6)}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 bg-green-primary/10 rounded-xl flex items-center justify-center group-hover:bg-green-primary/15 transition-colors">
                    <Wallet className="w-5 h-5 text-green-primary" />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    pl >= 0 
                      ? 'text-green-primary bg-green-primary/10' 
                      : 'text-red-primary bg-red-primary/10'
                  }`}>
                    {pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%
                  </span>
                </div>

                <h3 className="font-bold text-gray-light mb-0.5 truncate">{account.accountName}</h3>
                <p className="text-xs text-gray-text mb-4">{account.brokerName} • {account.marketSegment}</p>

                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-text mb-0.5">Balance</p>
                    <p className="text-lg font-bold text-green-primary number-highlight">
                      {formatCurrency(Number(account.currentBalance), account.currencyCode)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-text mb-0.5">P&L</p>
                    <p className={`text-sm font-bold number-highlight ${pl >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                      {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                    </p>
                  </div>
                </div>

                <div className="divider-green"></div>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/dashboard/accounts/${account.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-green-primary hover:bg-green-primary/10 rounded-lg transition-colors"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    View Details
                  </Link>
                  <div className="w-px h-5 bg-dark-border"></div>
                  <Link
                    href="/dashboard/trades/new"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-primary hover:bg-blue-primary/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Trade
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
