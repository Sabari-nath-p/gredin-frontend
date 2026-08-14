'use client';

import { useEffect, useState } from 'react';
import {
  Brain,
  Sparkles,
  RefreshCw,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import {
  aiAnalystApi,
  tradeAccountApi,
  type AiAnalysis,
  type AiAnalystSettings,
  type AnalystFrequency,
  type TradeAccount,
  type UpdateAiAnalystSettingsRequest,
} from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import AccountMultiSelect from './AccountMultiSelect';

const FREQUENCY_LABELS: Record<AnalystFrequency, string> = {
  OFF: 'Off',
  DAILY: 'Daily',
  EVERY_2_DAYS: 'Every 2 days',
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: 'bg-red-primary/10 text-red-primary',
  MEDIUM: 'bg-yellow-primary/10 text-yellow-primary',
  LOW: 'bg-slate-100 text-slate-600',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AiAnalystCard() {
  const { token } = useAuthStore();
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AiAnalystSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [accounts, setAccounts] = useState<TradeAccount[]>([]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await aiAnalystApi.getLatest(token);
        setAnalysis(res.data);
      } catch {
        // Silently fail — the card just shows its empty state.
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const openSettings = async () => {
    setShowSettings((v) => !v);
    if (!token || settings) return;
    try {
      const [settingsRes, accountsRes] = await Promise.all([
        aiAnalystApi.getSettings(token),
        tradeAccountApi.getAll(token),
      ]);
      setSettings(settingsRes.data);
      setAccounts(accountsRes.data);
    } catch {
      toast.error('Could not load analyst settings');
    }
  };

  const saveSettings = async (patch: UpdateAiAnalystSettingsRequest) => {
    if (!token) return;
    setSavingSettings(true);
    try {
      const res = await aiAnalystApi.updateSettings(token, patch);
      setSettings(res.data);
      toast.success('Analyst settings updated');
    } catch {
      toast.error('Could not update analyst settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const refresh = async () => {
    if (!token || refreshing) return;
    setRefreshing(true);
    try {
      const res = await aiAnalystApi.generate(token);
      setAnalysis(res.data);
      toast.success('Mentor plan refreshed');
    } catch (err: any) {
      if (err?.response?.status === 429) {
        toast.error('Please wait a few minutes before refreshing again');
      } else {
        toast.error('Could not refresh your mentor plan');
      }
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div className="skeleton h-72 rounded-2xl"></div>;
  }

  const plan = analysis?.plan;
  const keyStatPills = plan?.keyStats
    ? [
        { label: 'Net P&L', value: formatCurrency(plan.keyStats.netProfitLoss) },
        { label: 'Win Rate', value: `${plan.keyStats.winRate.toFixed(1)}%` },
        { label: 'Profit Factor', value: plan.keyStats.profitFactor.toFixed(2) },
        { label: 'Trades', value: String(plan.keyStats.totalTrades) },
      ]
    : [];

  return (
    <div className="card animate-fade-in relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-purple-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-purple-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              Your Mentor Plan
              <Sparkles className="w-3.5 h-3.5 text-purple-primary" />
            </h2>
            {analysis && (
              <p className="text-xs text-slate-600/70">Updated {timeAgo(analysis.createdAt)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            title="Refresh plan"
            className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:text-purple-primary hover:border-purple-primary/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openSettings}
            title="Analyst settings"
            className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:text-purple-primary hover:border-purple-primary/30 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings popover */}
      {showSettings && (
        <div className="mb-5 p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-semibold text-slate-700">Auto-analysis frequency</label>
            <select
              value={settings?.frequency ?? 'OFF'}
              onChange={(e) => saveSettings({ frequency: e.target.value as AnalystFrequency })}
              disabled={!settings || savingSettings}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20 transition-all"
            >
              {(Object.keys(FREQUENCY_LABELS) as AnalystFrequency[]).map((f) => (
                <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="analyst-email-toggle" className="text-xs font-semibold text-slate-700">
              Email me new plans
            </label>
            <input
              id="analyst-email-toggle"
              type="checkbox"
              checked={settings?.emailEnabled ?? true}
              disabled={!settings || savingSettings}
              onChange={(e) => saveSettings({ emailEnabled: e.target.checked })}
              className="w-4 h-4 accent-purple-primary cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Trade accounts to analyse</label>
            <AccountMultiSelect
              accounts={accounts}
              selectedIds={settings?.tradeAccounts.map((a) => a.id) ?? []}
              onChange={(ids) => saveSettings({ tradeAccountIds: ids })}
              disabled={!settings || savingSettings}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            When enabled, a fresh plan is generated automatically and emailed to you on this schedule, based on the trade accounts selected above.
          </p>
        </div>
      )}

      {!plan ? (
        <div className="text-center py-10">
          <div className="empty-state-icon">
            <Brain className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-600 mb-1 text-sm">No mentor plan yet</p>
          <p className="text-xs text-slate-600/60">Log a few trades to unlock personalised coaching</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">{plan.headline}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{plan.summary}</p>
          </div>

          {keyStatPills.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {keyStatPills.map((s) => (
                <div key={s.label} className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
                  <p className="text-sm font-bold text-slate-900 number-highlight">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {(plan.strengths.length > 0 || plan.weaknesses.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plan.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Strengths</p>
                  <ul className="space-y-1.5">
                    {plan.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-primary mt-0.5 flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.weaknesses.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Weaknesses</p>
                  <ul className="space-y-1.5">
                    {plan.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-slate-700">
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-primary mt-0.5 flex-shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {plan.actionItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Action Plan</p>
              <ol className="space-y-2">
                {plan.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-300 rounded-lg">
                    <span className="w-5 h-5 rounded-full bg-purple-primary/10 text-purple-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.MEDIUM}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {plan.mentorNote && (
            <p className="text-sm text-slate-600 italic border-t border-slate-200 pt-4">
              &ldquo;{plan.mentorNote}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
