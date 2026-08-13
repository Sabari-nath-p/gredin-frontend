'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, ChevronRight, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { goalsApi, type Goal, type GoalStatus } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';

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

export default function GoalProgressWidget({ limit = 3 }: { limit?: number }) {
  const { token } = useAuthStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await goalsApi.getProgressSummary(token, limit);
        setGoals(res.data);
      } catch {
        // Silently fail — the widget just shows its empty state.
      } finally {
        setLoading(false);
      }
    })();
  }, [token, limit]);

  if (loading) {
    return <div className="skeleton h-56 rounded-2xl"></div>;
  }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-green-primary" />
          <h2 className="text-lg font-bold text-slate-900">Goals</h2>
        </div>
        <Link href="/dashboard/goals" className="flex items-center gap-1 text-xs text-green-primary hover:text-green-secondary transition-colors font-medium">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-10">
          <div className="empty-state-icon">
            <Target className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-600 mb-1 text-sm">No active goals</p>
          <p className="text-xs text-slate-600/60 mb-4">Set a target and track your progress here</p>
          <Link href="/dashboard/goals/new" className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4">
            <Plus className="w-4 h-4" />
            Create a Goal
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <Link
              key={goal.id}
              href={`/dashboard/goals/${goal.id}/edit`}
              className="block p-3.5 bg-slate-50 rounded-xl border border-slate-300 hover:border-green-primary/20 transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-semibold text-slate-900 text-sm truncate">{goal.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[goal.status]}`}>
                  {goal.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-2.5">
                {formatDate(goal.startDate)} → {formatDate(goal.endDate)}
              </p>

              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2.5">
                <div
                  className="h-full bg-green-primary rounded-full transition-all"
                  style={{ width: `${goal.progressPercent}%` }}
                />
              </div>

              <div className="space-y-1">
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
