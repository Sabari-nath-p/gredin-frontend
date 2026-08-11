'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ShieldCheck, User as UserIcon, Mail, Calendar, CheckCircle2,
  XCircle, Wallet, Layers, MessageSquare, Target, TrendingUp, ArrowUpRight,
  ArrowDownRight, Hash, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { adminApi, type AdminUserDetail } from '@/lib/api';
import { formatCurrency, formatPercentage, formatDateTime, getTradeNetProfitLoss } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) loadDetail();
  }, [id]);

  const loadDetail = async () => {
    if (!token || !id) return;
    try {
      const res = await adminApi.getUserDetail(token, id);
      setDetail(res.data);
    } catch {
      toast.error('Failed to load user detail');
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!token || !detail) return;
    setUpdating(true);
    try {
      await adminApi.setUserStatus(token, id, !detail.user.isActive);
      toast.success(detail.user.isActive ? 'User deactivated' : 'User activated');
      setDetail({ ...detail, user: { ...detail.user, isActive: !detail.user.isActive } });
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setUpdating(false);
    }
  };

  const toggleRole = async () => {
    if (!token || !detail) return;
    const nextRole = detail.user.role === 'SUPER_ADMIN' ? 'USER' : 'SUPER_ADMIN';
    setUpdating(true);
    try {
      await adminApi.setUserRole(token, id, nextRole);
      toast.success(`Role updated to ${nextRole === 'SUPER_ADMIN' ? 'Admin' : 'User'}`);
      setDetail({ ...detail, user: { ...detail.user, role: nextRole } });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !detail) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-8 w-48 rounded-lg"></div>
        <div className="skeleton h-40 rounded-2xl"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (<div key={i} className="skeleton h-28 rounded-2xl"></div>))}
        </div>
      </div>
    );
  }

  const { user, stats, tradeAccounts, recentTrades } = detail;
  const isSelf = user.id === currentUser?.id;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-purple-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Link>

      {/* Profile header */}
      <div className="card animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${user.role === 'SUPER_ADMIN' ? 'bg-purple-primary/10' : 'bg-green-primary/10'}`}>
              <span className={`text-xl font-bold ${user.role === 'SUPER_ADMIN' ? 'text-purple-primary' : 'text-green-primary'}`}>
                {(user.name || user.email)[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{user.name || 'Unnamed User'}</h1>
              <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />{user.email}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`badge ${user.role === 'SUPER_ADMIN' ? 'badge-info' : 'badge-warning'}`}>
                  {user.role === 'SUPER_ADMIN' ? <><ShieldCheck className="w-3 h-3" /> Admin</> : <><UserIcon className="w-3 h-3" /> User</>}
                </span>
                <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {user.isActive ? <><CheckCircle2 className="w-3 h-3" /> Active</> : <><XCircle className="w-3 h-3" /> Inactive</>}
                </span>
                <span className="badge bg-slate-50 text-slate-600 border border-slate-300">{user.authProvider}</span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Joined {formatDateTime(user.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleRole}
              disabled={updating || isSelf}
              title={isSelf ? "You can't change your own role" : undefined}
              className="btn-secondary text-xs py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Make {user.role === 'SUPER_ADMIN' ? 'User' : 'Admin'}
            </button>
            <button
              onClick={toggleStatus}
              disabled={updating || isSelf}
              title={isSelf ? "You can't deactivate your own account" : undefined}
              className={`text-xs py-2 px-3 rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${user.isActive
                ? 'bg-red-primary/10 text-red-primary hover:bg-red-primary/20 border border-red-primary/20'
                : 'bg-green-primary/10 text-green-primary hover:bg-green-primary/20 border border-green-primary/20'
                }`}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card stat-card-blue">
          <div className="flex items-center gap-1.5 mb-2">
            <Wallet className="w-3.5 h-3.5 text-blue-primary" />
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Accounts</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{stats.totalAccounts}</p>
        </div>
        <div className="stat-card stat-card-purple">
          <div className="flex items-center gap-1.5 mb-2">
            <Hash className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Trades</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{stats.totalTrades}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">{stats.openTrades} open</p>
        </div>
        <div className="stat-card stat-card-green">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3.5 h-3.5 text-green-primary" />
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Win Rate</span>
          </div>
          <p className="text-xl font-bold text-green-primary">{formatPercentage(stats.winRate)}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">{stats.winningTrades}W / {stats.losingTrades}L</p>
        </div>
        <div className={`stat-card ${stats.netProfitLoss >= 0 ? 'stat-card-green' : 'stat-card-red'}`}>
          <div className="flex items-center gap-1.5 mb-2">
            {stats.netProfitLoss >= 0
              ? <ArrowUpRight className="w-3.5 h-3.5 text-green-primary" />
              : <ArrowDownRight className="w-3.5 h-3.5 text-red-primary" />}
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Net P/L</span>
          </div>
          <p className={`text-xl font-bold ${stats.netProfitLoss >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
            {formatCurrency(stats.netProfitLoss)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trade accounts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Trading Accounts</h2>
            <span className="text-[10px] text-slate-600">{tradeAccounts.length} total</span>
          </div>
          {tradeAccounts.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-8">No trading accounts yet.</p>
          ) : (
            <div className="space-y-2.5">
              {tradeAccounts.map((account) => {
                const pl = Number(account.currentBalance) - Number(account.initialBalance);
                return (
                  <div key={account.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-300">
                    <div className="w-9 h-9 rounded-xl bg-green-primary/10 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-4 h-4 text-green-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{account.accountName}</p>
                      <p className="text-xs text-slate-600 truncate">
                        {account.brokerName} &middot; {account.marketSegment} &middot; {account.accountType} &middot; {account._count?.tradeEntries ?? 0} trades
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm number-highlight text-slate-900">
                        {formatCurrency(Number(account.currentBalance), account.currencyCode)}
                      </p>
                      <p className={`text-xs font-medium ${pl >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                        {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent trades */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Recent Trades</h2>
            <span className="text-[10px] text-slate-600">Latest {recentTrades.length}</span>
          </div>
          {recentTrades.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-8">No trades logged yet.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {recentTrades.map((trade) => {
                const pl = getTradeNetProfitLoss(trade.result, trade.realisedProfitLoss, trade.serviceCharge);
                const isBuy = trade.direction === 'BUY';
                return (
                  <div key={trade.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-300 bg-white">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isBuy ? 'bg-green-primary/10' : 'bg-red-primary/10'}`}>
                      {isBuy ? <ArrowUpRight className="w-3.5 h-3.5 text-green-primary" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {trade.instrument} <span className="text-slate-400 font-normal">&middot; {trade.tradeAccount?.accountName}</span>
                      </p>
                      <p className="text-[10px] text-slate-500">{formatDateTime(trade.entryDateTime)}</p>
                    </div>
                    {trade.status === 'OPEN' ? (
                      <span className="badge badge-info flex-shrink-0">Open</span>
                    ) : pl !== null ? (
                      <p className={`text-xs font-bold flex-shrink-0 ${pl >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                        {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Engagement */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card py-4 text-center">
          <Layers className="w-4 h-4 text-blue-primary mx-auto mb-1.5" />
          <p className="text-lg font-bold text-slate-900">{stats.totalTemplates}</p>
          <p className="text-[10px] text-slate-600">Log Templates</p>
        </div>
        <div className="card py-4 text-center">
          <MessageSquare className="w-4 h-4 text-yellow-primary mx-auto mb-1.5" />
          <p className="text-lg font-bold text-slate-900">{stats.totalChatSessions}</p>
          <p className="text-[10px] text-slate-600">AI Chat Sessions</p>
        </div>
        <div className="card py-4 text-center">
          <TrendingUp className="w-4 h-4 text-green-primary mx-auto mb-1.5" />
          <p className="text-lg font-bold text-slate-900">{stats.closedTrades}</p>
          <p className="text-[10px] text-slate-600">Closed Trades</p>
        </div>
      </div>
    </div>
  );
}
