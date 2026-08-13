'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Target } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { goalsApi } from '@/lib/api';
import GoalForm, { type GoalFormValues } from '@/components/GoalForm';
import toast from 'react-hot-toast';

export default function NewGoalPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: GoalFormValues) => {
    if (!token) return;
    setLoading(true);
    try {
      await goalsApi.create(token, {
        name: values.name,
        description: values.description,
        startDate: values.startDate,
        endDate: values.endDate,
        metrics: values.metrics.map((m) => ({
          metricType: m.metricType,
          comparator: m.comparator,
          targetValue: m.targetValue,
        })),
      });
      toast.success('Goal created');
      router.push('/dashboard/goals');
    } catch {
      toast.error('Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in pb-6">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/dashboard/goals"
          className="w-9 h-9 rounded-xl bg-white border border-slate-300 flex items-center justify-center hover:border-green-primary/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="w-10 h-10 bg-green-primary/10 rounded-xl flex items-center justify-center">
          <Target className="w-5 h-5 text-green-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Goal</h1>
          <p className="text-xs text-slate-600">Define a target and the metrics that count as success</p>
        </div>
      </div>

      <GoalForm submitLabel="Create Goal" loading={loading} onSubmit={handleSubmit} />
    </div>
  );
}
