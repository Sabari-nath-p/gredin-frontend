'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers, Plus, Trash2, Edit3, FileText, ChevronRight,
  Search, ToggleLeft, ToggleRight, Wallet, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { logTemplateApi, type LogTemplate, type PaginatedMeta } from '@/lib/api';
import toast from 'react-hot-toast';

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: 'Text',
  LONG_TEXT: 'Long Text',
  CHECKBOX: 'Checkbox',
  IMAGE: 'Image',
};

const FIELD_TYPE_COLORS: Record<string, string> = {
  TEXT: 'bg-blue-primary/10 text-blue-primary',
  LONG_TEXT: 'bg-green-primary/10 text-green-primary',
  CHECKBOX: 'bg-yellow-primary/10 text-yellow-primary',
  IMAGE: 'bg-purple-400/10 text-purple-400',
};

export default function TemplatesPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [templates, setTemplates] = useState<LogTemplate[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [page]);

  const loadTemplates = async () => {
    if (!token) return;
    try {
      const res = await logTemplateApi.getAll(token, page, 12);
      setTemplates(res.data);
      setMeta(res.meta);
    } catch (error: any) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await logTemplateApi.delete(token, id);
      toast.success('Template deleted');
      setDeleteId(null);
      loadTemplates();
    } catch (error: any) {
      toast.error('Failed to delete template');
    }
  };

  const handleToggleActive = async (template: LogTemplate) => {
    if (!token) return;
    try {
      await logTemplateApi.update(token, template.id, { isActive: !template.isActive });
      toast.success(template.isActive ? 'Template deactivated' : 'Template activated');
      loadTemplates();
    } catch (error: any) {
      toast.error('Failed to update template');
    }
  };

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="skeleton h-8 w-48 rounded-lg"></div>
          <div className="skeleton h-10 w-36 rounded-lg"></div>
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
          <h1 className="text-2xl font-bold text-gray-light tracking-tight">Log Templates</h1>
          <p className="text-sm text-gray-text mt-0.5">
            Create custom field templates for your trade logs
          </p>
        </div>
        <Link href="/dashboard/templates/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Template
        </Link>
      </div>

      {/* Search */}
      {templates.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-text" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full sm:max-w-sm"
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="card border-red-primary/30 bg-red-primary/5 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-primary mb-1">Delete Template?</h3>
              <p className="text-sm text-gray-text mb-3">
                This will permanently delete this template and unlink it from all accounts. Field values in existing trades will be preserved.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="px-4 py-2 bg-red-primary text-white rounded-lg text-sm font-semibold hover:bg-red-primary/90 transition-colors"
                >
                  Delete Template
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 bg-dark-bg text-gray-text rounded-lg text-sm font-semibold hover:text-gray-light transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {filtered.length === 0 && templates.length === 0 ? (
        <div className="card text-center py-16">
          <div className="empty-state-icon mx-auto">
            <Layers className="w-10 h-10 text-gray-text" />
          </div>
          <h3 className="text-lg font-semibold text-gray-light mb-2">No Templates Yet</h3>
          <p className="text-sm text-gray-text mb-6 max-w-sm mx-auto">
            Create custom field templates to add extra data fields to your trade logs — like screenshots, notes, checklists, and more.
          </p>
          <Link href="/dashboard/templates/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Template
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Search className="w-8 h-8 text-gray-text mx-auto mb-3" />
          <p className="text-gray-text">No templates match &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template, i) => (
            <div
              key={template.id}
              className={`card group animate-fade-in`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 bg-green-primary/10 rounded-xl flex items-center justify-center group-hover:bg-green-primary/15 transition-colors">
                  <Layers className="w-5 h-5 text-green-primary" />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleActive(template)}
                    className="text-gray-text hover:text-green-primary transition-colors"
                    title={template.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {template.isActive ? (
                      <ToggleRight className="w-5 h-5 text-green-primary" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                    template.isActive
                      ? 'bg-green-primary/10 text-green-primary'
                      : 'bg-gray-text/10 text-gray-text'
                  }`}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Info */}
              <h3 className="font-bold text-gray-light mb-0.5 truncate">{template.name}</h3>
              {template.description && (
                <p className="text-xs text-gray-text mb-3 line-clamp-2">{template.description}</p>
              )}

              {/* Fields preview */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(template.fields || []).slice(0, 5).map((field) => (
                  <span
                    key={field.id}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${FIELD_TYPE_COLORS[field.fieldType] || 'bg-gray-text/10 text-gray-text'}`}
                  >
                    {field.fieldName}
                  </span>
                ))}
                {(template.fields || []).length > 5 && (
                  <span className="text-[10px] text-gray-text px-2 py-0.5">
                    +{(template.fields || []).length - 5} more
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 mb-3 text-[10px] text-gray-text">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {(template.fields || []).length} field{(template.fields || []).length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  {template._count?.accounts ?? 0} account{(template._count?.accounts ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="divider-green"></div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/dashboard/templates/${template.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-green-primary hover:bg-green-primary/10 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </Link>
                <div className="w-px h-5 bg-dark-border"></div>
                <button
                  onClick={() => setDeleteId(template.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-primary hover:bg-red-primary/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-dark-border text-gray-text hover:text-green-primary hover:border-green-primary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                  p === page
                    ? 'bg-green-primary/15 text-green-primary border border-green-primary/30'
                    : 'text-gray-text hover:text-gray-light'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-dark-border text-gray-text hover:text-green-primary hover:border-green-primary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
