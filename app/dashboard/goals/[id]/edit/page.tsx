'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Target, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { goalsApi, type Goal } from '@/lib/api';
import GoalForm, { type GoalFormValues } from '@/components/GoalForm';
import toast from 'react-hot-toast';

export default function EditGoalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!token || !params.id) return;
    (async () => {
      try {
        const res = await goalsApi.getById(token, params.id);
        setGoal(res.data);
      } catch {
        toast.error('Failed to load goal');
        router.push('/dashboard/goals');
      } finally {
        setFetching(false);
      }
    })();
  }, [token, params.id]);

  const handleSubmit = async (values: GoalFormValues) => {
    if (!token || !params.id) return;
    setLoading(true);
    try {
      await goalsApi.update(token, params.id, {
        name: values.name,
        description: values.description,
        startDate: values.startDate,
        endDate: values.endDate,
        metrics: values.metrics.map((m) => ({
          id: m.id,
          metricType: m.metricType,
          comparator: m.comparator,
          targetValue: m.targetValue,
        })),
      });
      toast.success('Goal updated');
      router.push('/dashboard/goals');
    } catch {
      toast.error('Failed to update goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !params.id) return;
    if (!confirm('Delete this goal? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await goalsApi.delete(token, params.id);
      toast.success('Goal deleted');
      router.push('/dashboard/goals');
    } catch {
      toast.error('Failed to delete goal');
      setDeleting(false);
    }
  };

  if (fetching) {
    return (
      <div className="w-full max-w-2xl mx-auto animate-fade-in pb-6 space-y-4">
        <div className="skeleton h-10 w-56 rounded-lg"></div>
        <div className="skeleton h-64 rounded-2xl"></div>
      </div>
    );
  }

  if (!goal) return null;

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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Goal</h1>
          <p className="text-xs text-slate-600">Update targets, dates, or metrics</p>
        </div>
      </div>

      <GoalForm
        initialGoal={goal}
        submitLabel="Save Changes"
        loading={loading}
        onSubmit={handleSubmit}
        extraAction={
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-1.5 w-full mt-2 py-2.5 rounded-xl text-xs font-medium text-red-primary border border-red-primary/20 hover:bg-red-primary/5 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Goal
          </button>
        }
      />
    </div>
  );
}
