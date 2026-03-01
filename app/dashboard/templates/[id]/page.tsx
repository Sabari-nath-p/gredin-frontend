'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Layers, Save, Trash2, Plus,
  Type, AlignLeft, CheckSquare, Image, Loader2, Info,
  Wallet, LinkIcon, Unlink, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import {
  logTemplateApi, tradeAccountApi,
  type LogTemplate, type FieldType, type TradeAccount,
  type UpdateTemplateFieldRequest,
} from '@/lib/api';
import toast from 'react-hot-toast';

const FIELD_TYPES: { value: FieldType; label: string; icon: React.ElementType; desc: string; color: string }[] = [
  { value: 'TEXT', label: 'Text', icon: Type, desc: 'Short text input', color: 'blue-primary' },
  { value: 'LONG_TEXT', label: 'Long Text', icon: AlignLeft, desc: 'Multi-line textarea', color: 'green-primary' },
  { value: 'CHECKBOX', label: 'Checkbox', icon: CheckSquare, desc: 'Yes / No toggle', color: 'yellow-primary' },
  { value: 'IMAGE', label: 'Image', icon: Image, desc: 'Upload image (S3)', color: 'purple-400' },
];

interface FieldItem {
  _key: string;
  id?: string; // existing field ID
  fieldName: string;
  fieldType: FieldType;
  fieldOrder: number;
  placeholder: string;
  defaultValue: string;
}

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  const token = useAuthStore((state) => state.token);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fields, setFields] = useState<FieldItem[]>([]);

  // Account assignment
  const [accounts, setAccounts] = useState<TradeAccount[]>([]);
  const [assignedAccounts, setAssignedAccounts] = useState<TradeAccount[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    loadTemplate();
    loadAccounts();
  }, [templateId]);

  const loadTemplate = async () => {
    if (!token || !templateId) return;
    try {
      const res = await logTemplateApi.getById(token, templateId);
      const t = res.data;
      setName(t.name);
      setDescription(t.description || '');
      setIsActive(t.isActive);
      setFields(
        (t.fields || [])
          .sort((a, b) => a.fieldOrder - b.fieldOrder)
          .map(f => ({
            _key: crypto.randomUUID(),
            id: f.id,
            fieldName: f.fieldName,
            fieldType: f.fieldType,
            fieldOrder: f.fieldOrder,
            placeholder: f.placeholder || '',
            defaultValue: f.defaultValue || '',
          }))
      );
      setAssignedAccounts(t.accounts || []);
    } catch {
      toast.error('Failed to load template');
      router.push('/dashboard/templates');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    if (!token) return;
    try {
      const res = await tradeAccountApi.getAll(token);
      setAccounts(res.data);
    } catch {}
  };

  const addField = (type: FieldType) => {
    setFields(prev => [
      ...prev,
      {
        _key: crypto.randomUUID(),
        fieldName: '',
        fieldType: type,
        fieldOrder: prev.length,
        placeholder: '',
        defaultValue: '',
      },
    ]);
  };

  const removeField = (key: string) => {
    setFields(prev => prev.filter(f => f._key !== key).map((f, i) => ({ ...f, fieldOrder: i })));
  };

  const updateField = (key: string, updates: Partial<FieldItem>) => {
    setFields(prev => prev.map(f => f._key === key ? { ...f, ...updates } : f));
  };

  const moveField = (key: string, direction: 'up' | 'down') => {
    setFields(prev => {
      const idx = prev.findIndex(f => f._key === key);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr.map((f, i) => ({ ...f, fieldOrder: i }));
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!name.trim()) { toast.error('Template name is required'); return; }
    if (fields.length === 0) { toast.error('Add at least one field'); return; }
    for (const f of fields) {
      if (!f.fieldName.trim()) { toast.error('All fields must have a name'); return; }
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        isActive,
        fields: fields.map(f => ({
          id: f.id,
          fieldName: f.fieldName,
          fieldType: f.fieldType,
          fieldOrder: f.fieldOrder,
          placeholder: f.placeholder || undefined,
          defaultValue: f.defaultValue || undefined,
        } as UpdateTemplateFieldRequest)),
      };
      await logTemplateApi.update(token, templateId, payload);
      toast.success('Template updated!');
      router.push('/dashboard/templates');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignAccount = async () => {
    if (!token || !selectedAccountId) return;
    setAssigning(true);
    try {
      await logTemplateApi.assignToAccount(token, templateId, selectedAccountId);
      toast.success('Template assigned to account');
      setSelectedAccountId('');
      loadTemplate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignAccount = async (accountId: string) => {
    if (!token) return;
    try {
      await logTemplateApi.unassignFromAccount(token, accountId);
      toast.success('Template unlinked from account');
      loadTemplate();
    } catch {
      toast.error('Failed to unlink');
    }
  };

  const getFieldIcon = (type: FieldType) => {
    const ft = FIELD_TYPES.find(f => f.value === type);
    return ft ? ft.icon : Type;
  };

  const getFieldColor = (type: FieldType) => {
    const ft = FIELD_TYPES.find(f => f.value === type);
    return ft ? ft.color : 'gray-text';
  };

  // Accounts not yet assigned to this template
  const unassignedAccounts = accounts.filter(
    a => !assignedAccounts.some(aa => aa.id === a.id)
  );

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="skeleton w-9 h-9 rounded-xl" />
          <div className="skeleton h-8 w-48 rounded-lg" />
        </div>
        <div className="flex flex-col xl:flex-row gap-5">
          <div className="xl:w-[340px] flex-shrink-0 space-y-4">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-40 rounded-2xl" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="skeleton h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/templates"
          className="w-9 h-9 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center hover:border-green-primary/50 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-gray-text" />
        </Link>
        <div className="w-10 h-10 bg-green-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Layers className="w-5 h-5 text-green-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-light tracking-tight">Edit Template</h1>
          <p className="text-xs text-gray-text">Update fields and manage account assignments</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="flex flex-col xl:flex-row gap-5">

          {/* ────── LEFT COLUMN ────── */}
          <div className="xl:w-[340px] flex-shrink-0 space-y-4">

            {/* Template Info */}
            <div className="card">
              <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider mb-3">Template Info</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-light mb-1">
                    Name <span className="text-red-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input w-full text-sm"
                    placeholder="e.g., Swing Trade Log"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-light mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input w-full text-sm"
                    rows={2}
                    placeholder="Optional description..."
                  />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-bg/50 border border-dark-border">
                  <span className="text-xs text-gray-text flex-1">Status</span>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-green-primary/10 text-green-primary border border-green-primary/30'
                        : 'bg-dark-bg text-gray-text border border-dark-border'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-primary' : 'bg-gray-text'}`} />
                    {isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            </div>

            {/* Add Field Buttons */}
            <div className="card">
              <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider mb-3">Add Fields</h3>
              <div className="grid grid-cols-2 gap-2">
                {FIELD_TYPES.map(ft => {
                  const Icon = ft.icon;
                  return (
                    <button
                      key={ft.value}
                      type="button"
                      onClick={() => addField(ft.value)}
                      className="flex items-center gap-2 p-3 rounded-xl border border-dark-border hover:border-green-primary/30 hover:bg-dark-bg/50 transition-all group"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-${ft.color}/10 flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 text-${ft.color}`} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-light">{ft.label}</p>
                        <p className="text-[10px] text-gray-text">{ft.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Assignments */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon className="w-4 h-4 text-green-primary" />
                <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider">Assigned Accounts</h3>
              </div>

              {/* Assign dropdown */}
              {unassignedAccounts.length > 0 && (
                <div className="flex gap-2 mb-3">
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="input flex-1 text-xs py-2"
                  >
                    <option value="">Select account to assign...</option>
                    {unassignedAccounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} ({a.brokerName})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAssignAccount}
                    disabled={!selectedAccountId || assigning}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-green-primary/10 text-green-primary border border-green-primary/20 hover:bg-green-primary/15 transition-all disabled:opacity-40"
                  >
                    {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* Assigned list */}
              {assignedAccounts.length === 0 ? (
                <p className="text-xs text-gray-text py-4 text-center">
                  No accounts assigned. Trades in assigned accounts will show these custom fields.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {assignedAccounts.map(acc => (
                    <div
                      key={acc.id}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-dark-bg/60 border border-dark-border/50"
                    >
                      <Wallet className="w-4 h-4 text-green-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-light truncate">{acc.accountName}</p>
                        <p className="text-[10px] text-gray-text">{acc.brokerName} • {acc.marketSegment}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnassignAccount(acc.id)}
                        className="text-gray-text hover:text-red-primary transition-colors p-1"
                        title="Unlink"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save */}
            <div className="card">
              <button
                type="submit"
                disabled={saving}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              <Link
                href="/dashboard/templates"
                className="block w-full mt-2 py-2.5 rounded-xl text-center text-xs font-medium text-gray-text hover:text-gray-light border border-dark-border hover:border-dark-border-hover transition-all"
              >
                Cancel
              </Link>
            </div>
          </div>

          {/* ────── RIGHT COLUMN: Fields ────── */}
          <div className="flex-1 min-w-0">
            <div className="card min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider">
                  Fields ({fields.length})
                </h3>
                {fields.length > 0 && (
                  <span className="text-[10px] text-gray-text">Use arrows to reorder</span>
                )}
              </div>

              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-dark-bg/60 rounded-2xl flex items-center justify-center mb-4 border border-dark-border">
                    <Layers className="w-8 h-8 text-gray-text/40" />
                  </div>
                  <p className="text-sm text-gray-text mb-1">No fields</p>
                  <p className="text-xs text-gray-text/60">Click a field type on the left to add</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {fields.map((field, idx) => {
                    const FieldIcon = getFieldIcon(field.fieldType);
                    const fieldColor = getFieldColor(field.fieldType);
                    return (
                      <div
                        key={field._key}
                        className="p-3.5 rounded-xl bg-dark-bg/60 border border-dark-border/50 hover:border-dark-border transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveField(field._key, 'up')}
                              disabled={idx === 0}
                              className="text-gray-text hover:text-green-primary disabled:opacity-20 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveField(field._key, 'down')}
                              disabled={idx === fields.length - 1}
                              className="text-gray-text hover:text-green-primary disabled:opacity-20 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                          </div>

                          <div className={`w-7 h-7 rounded-lg bg-${fieldColor}/10 flex items-center justify-center flex-shrink-0`}>
                            <FieldIcon className={`w-3.5 h-3.5 text-${fieldColor}`} />
                          </div>

                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-${fieldColor}/10 text-${fieldColor}`}>
                            {field.fieldType.replace('_', ' ')}
                          </span>

                          {field.id && (
                            <span className="text-[10px] text-gray-text/50">saved</span>
                          )}

                          <span className="text-[10px] text-gray-text ml-auto mr-2">#{idx + 1}</span>

                          <button
                            type="button"
                            onClick={() => removeField(field._key)}
                            className="text-gray-text hover:text-red-primary transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-medium text-gray-text mb-1">
                              Field Name <span className="text-red-primary">*</span>
                            </label>
                            <input
                              type="text"
                              value={field.fieldName}
                              onChange={(e) => updateField(field._key, { fieldName: e.target.value })}
                              className="input w-full text-xs py-2"
                              placeholder="e.g., Setup Screenshot"
                              required
                            />
                          </div>
                          {(field.fieldType === 'TEXT' || field.fieldType === 'LONG_TEXT') && (
                            <div>
                              <label className="block text-[10px] font-medium text-gray-text mb-1">Placeholder</label>
                              <input
                                type="text"
                                value={field.placeholder || ''}
                                onChange={(e) => updateField(field._key, { placeholder: e.target.value })}
                                className="input w-full text-xs py-2"
                                placeholder="Input hint text..."
                              />
                            </div>
                          )}
                          {field.fieldType === 'CHECKBOX' && (
                            <div>
                              <label className="block text-[10px] font-medium text-gray-text mb-1">Default</label>
                              <select
                                value={field.defaultValue || 'false'}
                                onChange={(e) => updateField(field._key, { defaultValue: e.target.value })}
                                className="input w-full text-xs py-2"
                              >
                                <option value="false">Unchecked</option>
                                <option value="true">Checked</option>
                              </select>
                            </div>
                          )}
                          {(field.fieldType === 'TEXT' || field.fieldType === 'LONG_TEXT') && (
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-medium text-gray-text mb-1">Default Value</label>
                              <input
                                type="text"
                                value={field.defaultValue || ''}
                                onChange={(e) => updateField(field._key, { defaultValue: e.target.value })}
                                className="input w-full text-xs py-2"
                                placeholder="Optional default..."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
