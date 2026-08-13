'use client';

import { useState } from 'react';
import { Plus, Trash2, Loader2, Target } from 'lucide-react';
import type { Goal, GoalMetricType, GoalMetricComparator } from '@/lib/api';

export interface GoalFormValues {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  metrics: { id?: string; metricType: GoalMetricType; comparator: GoalMetricComparator; targetValue: number }[];
}

const METRIC_OPTIONS: { value: GoalMetricType; label: string }[] = [
  { value: 'NET_PROFIT', label: 'Net Profit' },
  { value: 'WIN_RATE', label: 'Win Rate (%)' },
  { value: 'PROFIT_FACTOR', label: 'Profit Factor' },
  { value: 'MAX_DRAWDOWN', label: 'Max Drawdown' },
  { value: 'TRADE_COUNT', label: 'Trade Count' },
  { value: 'AVERAGE_WIN', label: 'Average Win' },
  { value: 'AVERAGE_LOSS', label: 'Average Loss' },
  { value: 'LARGEST_LOSS', label: 'Largest Loss' },
];

const COMPARATOR_OPTIONS: { value: GoalMetricComparator; label: string }[] = [
  { value: 'GTE', label: 'At least (≥)' },
  { value: 'LTE', label: 'At most (≤)' },
];

interface GoalFormProps {
  initialGoal?: Goal;
  submitLabel: string;
  loading: boolean;
  onSubmit: (values: GoalFormValues) => void | Promise<void>;
  extraAction?: React.ReactNode;
}

export default function GoalForm({ initialGoal, submitLabel, loading, onSubmit, extraAction }: GoalFormProps) {
  const [name, setName] = useState(initialGoal?.name ?? '');
  const [description, setDescription] = useState(initialGoal?.description ?? '');
  const [startDate, setStartDate] = useState(
    initialGoal?.startDate ? initialGoal.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(initialGoal?.endDate ? initialGoal.endDate.slice(0, 10) : '');
  const [metrics, setMetrics] = useState<GoalFormValues['metrics']>(
    initialGoal?.metrics.map((m) => ({
      id: m.id,
      metricType: m.metricType,
      comparator: m.comparator,
      targetValue: m.targetValue,
    })) ?? [{ metricType: 'NET_PROFIT', comparator: 'GTE', targetValue: 0 }],
  );
  const [error, setError] = useState('');

  const addMetric = () => {
    setMetrics((prev) => [...prev, { metricType: 'WIN_RATE', comparator: 'GTE', targetValue: 0 }]);
  };

  const removeMetric = (index: number) => {
    setMetrics((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMetric = (index: number, patch: Partial<GoalFormValues['metrics'][number]>) => {
    setMetrics((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please give your goal a name.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please set both a start and end date.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be on or after the start date.');
      return;
    }
    if (metrics.length === 0) {
      setError('Add at least one target metric.');
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      startDate,
      endDate,
      metrics: metrics.map((m) => ({ ...m, targetValue: Number(m.targetValue) })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-green-primary" />
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Goal Details</h3>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-900 mb-1">
            Name <span className="text-red-primary">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Monthly profit target"
            className="input w-full text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-900 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional notes about this goal"
            className="input w-full text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-900 mb-1">
              Start Date <span className="text-red-primary">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-full text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-900 mb-1">
              End Date <span className="text-red-primary">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-full text-sm"
              required
            />
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Target Metrics <span className="text-red-primary">*</span>
          </h3>
          <button
            type="button"
            onClick={addMetric}
            className="flex items-center gap-1 text-xs font-semibold text-green-primary hover:text-green-secondary transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Metric
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          A goal is only marked <strong>achieved</strong> once every metric below is met.
        </p>

        <div className="space-y-3">
          {metrics.map((metric, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-slate-50 rounded-xl border border-slate-300">
              <div className="col-span-12 sm:col-span-5">
                <label className="block text-[10px] font-medium text-slate-600 mb-1">Metric</label>
                <select
                  value={metric.metricType}
                  onChange={(e) => updateMetric(index, { metricType: e.target.value as GoalMetricType })}
                  className="input w-full text-xs py-2"
                >
                  {METRIC_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-[10px] font-medium text-slate-600 mb-1">Condition</label>
                <select
                  value={metric.comparator}
                  onChange={(e) => updateMetric(index, { comparator: e.target.value as GoalMetricComparator })}
                  className="input w-full text-xs py-2"
                >
                  {COMPARATOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-5 sm:col-span-3">
                <label className="block text-[10px] font-medium text-slate-600 mb-1">Target</label>
                <input
                  type="number"
                  step="any"
                  value={metric.targetValue}
                  onChange={(e) => updateMetric(index, { targetValue: Number(e.target.value) })}
                  className="input w-full text-xs py-2"
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeMetric(index)}
                  disabled={metrics.length === 1}
                  title="Remove metric"
                  className="w-8 h-8 rounded-lg text-red-primary hover:bg-red-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-primary bg-red-primary/5 border border-red-primary/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="card">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </button>
        {extraAction}
      </div>
    </form>
  );
}
