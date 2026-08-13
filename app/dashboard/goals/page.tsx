'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, Plus, Trash2, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { goalsApi, type Goal, type GoalStatus } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';
import toast from 'react-hot-toast';

type TabKey = 'ALL' | GoalStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'ACHIEVED', label: 'Achieved' },
  { key: 'FAILED', label: 'Failed' },
  { key: 'ARCHIVED', label: 'Archived' },
];

const STATUS_STYLES: Record<GoalStatus, string> = {
  ACTIVE: 'bg-blue-primary/10 text-blue-primary',
  ACHIEVED: 'bg-green-primary/10 text-green-primary',
  FAILED: 'bg-red-primary/10 text-red-primary',
  ARCHIVED: 'bg-slate-100 text-slate-500',
};

const METRIC_LABELS: Record<string, string> = {
  NET_PROFIT: 'Net Profit',
  WIN_RATE: 'Win Rate',
  PROFIT_FACTOR: 'Profit Factor',
  MAX_DRAWDOWN: 'Max Drawdown',
  TRADE_COUNT: 'Trade Count',
  AVERAGE_WIN: 'Avg Win',
  AVERAGE_LOSS: 'Avg Loss',
  LARGEST_LOSS: 'Largest Loss',
};

export default function GoalsPage() {
  const token = useAuthStore((state) => state.token);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();
  }, [token]);

  const loadGoals = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await goalsApi.getAll(token, undefined, 1, 100);
      setGoals(res.data);
    } catch {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('Delete this goal? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await goalsApi.delete(token, id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast.success('Goal deleted');
    } catch {
      toast.error('Failed to delete goal');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredGoals = activeTab === 'ALL' ? goals : goals.filter((g) => g.status === activeTab);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-10 w-56 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-primary/10 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-green-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Goals</h1>
            <p className="text-xs text-slate-600">Set targets and track your progress</p>
          </div>
        </div>
        <Link href="/dashboard/goals/new" className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4">
          <Plus className="w-4 h-4" />
          New Goal
        </Link>
      </div>

      <div className="flex bg-white border border-slate-300 rounded-xl p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.key ? 'bg-green-primary/15 text-green-primary' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredGoals.length === 0 ? (
        <div className="card text-center py-16">
          <div className="empty-state-icon">
            <Target className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-600 mb-1 text-sm">No goals here yet</p>
          <p className="text-xs text-slate-600/60 mb-4">Create a goal to start tracking progress</p>
          <Link href="/dashboard/goals/new" className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4">
            <Plus className="w-4 h-4" />
            Create a Goal
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => (
            <div key={goal.id} className="card">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm truncate">{goal.name}</h3>
                  {goal.description && (
                    <p className="text-xs text-slate-600 truncate">{goal.description}</p>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[goal.status]}`}>
                  {goal.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                {formatDate(goal.startDate)} → {formatDate(goal.endDate)}
              </p>

              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-green-primary rounded-full transition-all"
                  style={{ width: `${goal.progressPercent}%` }}
                />
              </div>

              <div className="space-y-1.5 mb-4">
                {goal.metrics.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      {m.isMet ? (
                        <CheckCircle2 className="w-3 h-3 text-green-primary" />
                      ) : (
                        <XCircle className="w-3 h-3 text-slate-400" />
                      )}
                      {METRIC_LABELS[m.metricType] || m.metricType}
                    </span>
                    <span className="font-medium text-slate-700 number-highlight">
                      {formatNumber(m.currentValue ?? 0)} / {formatNumber(m.targetValue)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/goals/${goal.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-slate-600 border border-slate-300 hover:border-green-primary/40 hover:text-green-primary transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(goal.id)}
                  disabled={deletingId === goal.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-red-primary border border-red-primary/20 hover:bg-red-primary/5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
