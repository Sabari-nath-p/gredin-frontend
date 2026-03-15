'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, TrendingUp, ArrowUpRight, ArrowDownRight, Edit3, Save,
  X, CheckCircle2, XCircle, MinusCircle, Clock, Trash2, Loader2,
  Image, BarChart3, Target, FileText, Wallet, Calendar,
  ChevronRight, Shield, Layers, AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import {
  tradeEntryApi, tradeAccountApi, logTemplateApi, uploadApi,
  type TradeEntry, type TradeAccount, type LogTemplate, type TradeFieldValueRequest,
} from '@/lib/api';
import { formatCurrency, formatDateTime, formatTradeFieldValue, getTradeGrossProfitLoss, getTradeNetProfitLoss } from '@/lib/utils';
import toast from 'react-hot-toast';

interface EditForm {
  instrument: string;
  entryDateTime: string;
  entryPrice: string;
  positionSize: string;
  stopLossAmount: string;
  takeProfitAmount: string;
  notes: string;
}

type FieldValueFormState = Record<string, { textValue?: string; booleanValue?: boolean; imageUrl?: string }>;

export default function TradeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const tradeId = params.id as string;

  const [trade, setTrade]         = useState<TradeEntry | null>(null);
  const [account, setAccount]     = useState<TradeAccount | null>(null);
  const [template, setTemplate]   = useState<LogTemplate | null>(null);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fieldValues, setFieldValues] = useState<FieldValueFormState>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const [form, setForm] = useState<EditForm>({
    instrument: '', entryDateTime: '', entryPrice: '', positionSize: '',
    stopLossAmount: '', takeProfitAmount: '', notes: '',
  });

  useEffect(() => { loadAll(); }, [tradeId]);

  const syncTemplateFieldValues = (tradeData: TradeEntry, templateData: LogTemplate | null) => {
    if (!templateData?.fields?.length) {
      setFieldValues({});
      return;
    }

    const nextValues: FieldValueFormState = {};

    templateData.fields.forEach((field) => {
      const existing = tradeData.fieldValues?.find((value) => value.fieldId === field.id);

      if (existing) {
        nextValues[field.id] = {
          textValue: existing.textValue || '',
          booleanValue: existing.booleanValue || false,
          imageUrl: existing.imageUrl || '',
        };
        return;
      }

      if (field.fieldType === 'CHECKBOX') {
        nextValues[field.id] = { booleanValue: field.defaultValue === 'true' };
      } else if (field.fieldType === 'IMAGE') {
        nextValues[field.id] = { imageUrl: '' };
      } else {
        nextValues[field.id] = { textValue: field.defaultValue || '' };
      }
    });

    setFieldValues(nextValues);
  };

  const loadAll = async () => {
    if (!token || !tradeId) return;
    setLoading(true);
    try {
      const res = await tradeEntryApi.getById(token, tradeId);
      const t = res.data;
      setTrade(t);
      syncForm(t);
      let loadedTemplate: LogTemplate | null = null;
      // Load account
      try {
        const accRes = await tradeAccountApi.getById(token, t.tradeAccountId);
        setAccount(accRes.data);
      } catch {}
      // Load template
      try {
        const tmplRes = await logTemplateApi.getTemplateForAccount(token, t.tradeAccountId);
        loadedTemplate = tmplRes.data;
        setTemplate(loadedTemplate);
      } catch {}
      syncTemplateFieldValues(t, loadedTemplate);
    } catch {
      toast.error('Trade not found');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const syncForm = (t: TradeEntry) => {
    setForm({
      instrument:      t.instrument,
      entryDateTime:   t.entryDateTime?.slice(0, 16) || '',
      entryPrice:      t.entryPrice != null ? String(t.entryPrice) : '',
      positionSize:    t.positionSize != null ? String(t.positionSize) : '',
      stopLossAmount:  String(t.stopLossAmount ?? 0),
      takeProfitAmount: String(t.takeProfitAmount ?? 0),
      notes:           t.notes || '',
    });
  };

  const handleImageUpload = async (fieldId: string, file: File) => {
    if (!token) return;
    setUploadingField(fieldId);
    try {
      const res = await uploadApi.uploadImage(token, file);
      if (res.data.url) {
        setFieldValues((prev) => ({ ...prev, [fieldId]: { imageUrl: res.data.url || '' } }));
        toast.success('Image uploaded');
      } else {
        toast.error('Image upload not available');
      }
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    if (!token || !trade) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        notes: form.notes,
      };

      if (trade.status === 'OPEN') {
        payload.instrument = form.instrument.trim();
        payload.entryDateTime = form.entryDateTime ? new Date(form.entryDateTime).toISOString() : undefined;
        payload.entryPrice = form.entryPrice ? parseFloat(form.entryPrice) : undefined;
        payload.positionSize = form.positionSize ? parseInt(form.positionSize) : undefined;
        payload.stopLossAmount = parseFloat(form.stopLossAmount || '0');
        payload.takeProfitAmount = parseFloat(form.takeProfitAmount || '0');
      }

      if (template?.fields?.length) {
        const nextFieldValues: TradeFieldValueRequest[] = template.fields.map((field) => {
          const value = fieldValues[field.id] || {};
          return {
            fieldId: field.id,
            textValue: field.fieldType === 'CHECKBOX' || field.fieldType === 'IMAGE' ? undefined : value.textValue || '',
            booleanValue: field.fieldType === 'CHECKBOX' ? Boolean(value.booleanValue) : undefined,
            imageUrl: field.fieldType === 'IMAGE' ? value.imageUrl || '' : undefined,
          };
        });

        payload.fieldValues = nextFieldValues;
      }

      const res = await tradeEntryApi.update(token, trade.id, payload as any);
      setTrade(res.data);
      syncForm(res.data);
      syncTemplateFieldValues(res.data, template);
      setEditing(false);
      toast.success('Trade updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update trade');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !trade) return;
    setDeleting(true);
    try {
      await tradeEntryApi.delete(token, trade.id);
      toast.success('Trade deleted');
      router.push('/dashboard/trades');
    } catch {
      toast.error('Failed to delete trade');
    } finally {
      setDeleting(false);
    }
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="skeleton w-9 h-9 rounded-xl" />
          <div className="skeleton h-7 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 skeleton h-72 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!trade) return null;

  const pl        = getTradeGrossProfitLoss(trade.result, trade.realisedProfitLoss) ?? 0;
  const netPl     = getTradeNetProfitLoss(trade.result, trade.realisedProfitLoss, trade.serviceCharge) ?? 0;
  const isBuy     = trade.direction === 'BUY';
  const isOpen    = trade.status === 'OPEN';
  const isClosed  = trade.status === 'CLOSED';
  const canEditCoreFields = editing && isOpen;

  const resultIcon = trade.result === 'PROFIT'
    ? <CheckCircle2 className="w-5 h-5 text-green-primary" />
    : trade.result === 'LOSS'
    ? <XCircle className="w-5 h-5 text-red-primary" />
    : trade.result === 'BREAK_EVEN'
    ? <MinusCircle className="w-5 h-5 text-yellow-primary" />
    : null;

  const resultColor = trade.result === 'PROFIT' ? 'text-green-primary'
    : trade.result === 'LOSS' ? 'text-red-primary'
    : 'text-yellow-primary';

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center hover:border-green-primary/40 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-gray-text" />
          </button>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isBuy ? 'bg-green-primary/10' : 'bg-red-primary/10'
          }`}>
            {isBuy
              ? <ArrowUpRight className="w-5 h-5 text-green-primary" />
              : <ArrowDownRight className="w-5 h-5 text-red-primary" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-light tracking-tight">{trade.instrument}</h1>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                isBuy ? 'bg-green-primary/10 text-green-primary' : 'bg-red-primary/10 text-red-primary'
              }`}>{trade.direction}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                isOpen ? 'bg-blue-primary/10 text-blue-primary' : 'bg-gray-text/10 text-gray-text'
              }`}>{trade.status}</span>
              {trade.result && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  trade.result === 'PROFIT' ? 'bg-green-primary/10 text-green-primary' :
                  trade.result === 'LOSS'   ? 'bg-red-primary/10 text-red-primary' :
                                              'bg-yellow-primary/10 text-yellow-primary'
                }`}>{trade.result}</span>
              )}
            </div>
            <p className="text-xs text-gray-text mt-0.5">{account?.accountName} • {formatDateTime(trade.entryDateTime)}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!editing && isOpen && (
            <Link
              href={`/dashboard/trades/${trade.id}/close`}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-primary/10 hover:bg-green-primary/20 text-green-primary rounded-xl text-xs font-bold transition-colors border border-green-primary/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Close Trade</span>
              <span className="sm:hidden">Close</span>
            </Link>
          )}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-dark-card hover:bg-dark-border/40 text-gray-light rounded-xl text-xs font-bold transition-colors border border-dark-border"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => { setEditing(false); syncForm(trade); syncTemplateFieldValues(trade, template); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-dark-card hover:bg-dark-border/40 text-gray-text rounded-xl text-xs font-bold transition-colors border border-dark-border"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-primary/15 hover:bg-green-primary/25 text-green-primary rounded-xl text-xs font-bold transition-colors border border-green-primary/30 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT — Trade Info (editable) */}
        <div className="lg:col-span-2 space-y-4">

          {/* P&L banner for closed trades */}
          {isClosed && trade.realisedProfitLoss !== null && (
            <div className={`rounded-2xl border p-5 ${
              pl >= 0
                ? 'bg-green-primary/5 border-green-primary/20'
                : 'bg-red-primary/5 border-red-primary/20'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {resultIcon}
                  <div>
                    <p className="text-xs text-gray-text font-medium uppercase tracking-wider">Realised P&L</p>
                    <p className={`text-3xl font-bold number-highlight mt-0.5 ${resultColor}`}>
                      {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-text mb-0.5">Service Charge</p>
                  <p className="text-sm font-semibold text-gray-light">
                    -{formatCurrency(Number(trade.serviceCharge))}
                  </p>
                  <p className="text-xs text-gray-text mt-1">Net</p>
                  <p className={`text-sm font-bold number-highlight ${
                    netPl >= 0 ? 'text-green-primary' : 'text-red-primary'
                  }`}>
                    {netPl >= 0 ? '+' : ''}
                    {formatCurrency(netPl)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trade Details Card */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-green-primary" />
              <h3 className="text-sm font-bold text-gray-light">Trade Details</h3>
              {editing && <span className="text-[10px] text-blue-primary bg-blue-primary/10 px-2 py-0.5 rounded-full font-semibold ml-auto">Editing</span>}
            </div>

            {editing && isClosed && (
              <div className="mb-4 rounded-xl border border-blue-primary/20 bg-blue-primary/5 px-3 py-2 text-xs text-blue-primary">
                Closed trades only allow note and template-field updates. Core trade values stay locked after close.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Instrument */}
              <div>
                <label className="block text-xs font-medium text-gray-text mb-1.5">Instrument</label>
                {canEditCoreFields ? (
                  <input
                    className="input w-full text-sm"
                    value={form.instrument}
                    onChange={e => setForm(p => ({ ...p, instrument: e.target.value }))}
                    placeholder="e.g. AAPL, EURUSD"
                  />
                ) : (
                  <p className="text-sm font-bold text-gray-light">{trade.instrument}</p>
                )}
              </div>

              {/* Entry Date */}
              <div>
                <label className="block text-xs font-medium text-gray-text mb-1.5">Entry Date & Time</label>
                {canEditCoreFields ? (
                  <input
                    type="datetime-local"
                    className="input w-full text-sm"
                    value={form.entryDateTime}
                    onChange={e => setForm(p => ({ ...p, entryDateTime: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-gray-light flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-text" />
                    {formatDateTime(trade.entryDateTime)}
                  </p>
                )}
              </div>

              {/* Entry Price */}
              <div>
                <label className="block text-xs font-medium text-gray-text mb-1.5">Entry Price</label>
                {canEditCoreFields ? (
                  <input
                    type="number" step="any"
                    className="input w-full text-sm"
                    value={form.entryPrice}
                    onChange={e => setForm(p => ({ ...p, entryPrice: e.target.value }))}
                    placeholder="0.00"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-light number-highlight">
                    {trade.entryPrice != null ? formatCurrency(Number(trade.entryPrice)) : '—'}
                  </p>
                )}
              </div>

              {/* Position Size */}
              <div>
                <label className="block text-xs font-medium text-gray-text mb-1.5">Position Size</label>
                {canEditCoreFields ? (
                  <input
                    type="number" step="1"
                    className="input w-full text-sm"
                    value={form.positionSize}
                    onChange={e => setForm(p => ({ ...p, positionSize: e.target.value }))}
                    placeholder="Qty / Lots"
                  />
                ) : (
                  <p className="text-sm text-gray-light">{trade.positionSize ?? '—'}</p>
                )}
              </div>

              {/* Stop Loss */}
              <div>
                <label className="block text-xs font-medium text-gray-text mb-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-red-primary/70" /> Stop Loss Amount
                </label>
                {canEditCoreFields ? (
                  <input
                    type="number" step="any"
                    className="input w-full text-sm"
                    value={form.stopLossAmount}
                    onChange={e => setForm(p => ({ ...p, stopLossAmount: e.target.value }))}
                    placeholder="0.00"
                  />
                ) : (
                  <p className="text-sm font-semibold text-red-primary/80 number-highlight">
                    {trade.stopLossAmount != null ? formatCurrency(Number(trade.stopLossAmount)) : '—'}
                  </p>
                )}
              </div>

              {/* Take Profit */}
              <div>
                <label className="block text-xs font-medium text-gray-text mb-1.5 flex items-center gap-1">
                  <Target className="w-3 h-3 text-green-primary/70" /> Take Profit Amount
                </label>
                {canEditCoreFields ? (
                  <input
                    type="number" step="any"
                    className="input w-full text-sm"
                    value={form.takeProfitAmount}
                    onChange={e => setForm(p => ({ ...p, takeProfitAmount: e.target.value }))}
                    placeholder="0.00"
                  />
                ) : (
                  <p className="text-sm font-semibold text-green-primary/80 number-highlight">
                    {trade.takeProfitAmount != null ? formatCurrency(Number(trade.takeProfitAmount)) : '—'}
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4 pt-4 border-t border-dark-border/40">
              <label className="block text-xs font-medium text-gray-text mb-1.5 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Notes
              </label>
              {editing ? (
                <textarea
                  className="input w-full text-sm"
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Strategy, rationale, market conditions..."
                />
              ) : (
                <p className="text-sm text-gray-light whitespace-pre-wrap min-h-[2.5rem]">
                  {trade.notes || <span className="text-gray-text/40 italic">No notes</span>}
                </p>
              )}
            </div>
          </div>

          {/* Template field values */}
          {template?.fields?.length ? (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-green-primary" />
                <h3 className="text-sm font-bold text-gray-light">Log Template: {template.name}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {template.fields
                  .sort((a, b) => a.fieldOrder - b.fieldOrder)
                  .map(field => {
                    const fv = trade.fieldValues?.find(v => v.fieldId === field.id);
                    const fieldValue = fieldValues[field.id];
                    const formattedValue = formatTradeFieldValue(fv, field);
                    return (
                      <div key={field.id}>
                        <label className="block text-xs font-medium text-gray-text mb-1.5">{field.fieldName}</label>
                        {editing && field.fieldType === 'TEXT' && (
                          <input
                            type="text"
                            value={fieldValue?.textValue || ''}
                            onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.id]: { textValue: e.target.value } }))}
                            className="input w-full text-sm"
                            placeholder={field.placeholder || `Enter ${field.fieldName.toLowerCase()}...`}
                          />
                        )}
                        {editing && field.fieldType === 'LONG_TEXT' && (
                          <textarea
                            value={fieldValue?.textValue || ''}
                            onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.id]: { textValue: e.target.value } }))}
                            className="input w-full text-sm"
                            rows={3}
                            placeholder={field.placeholder || `Enter ${field.fieldName.toLowerCase()}...`}
                          />
                        )}
                        {editing && field.fieldType === 'MULTIPLE_CHOICE' && (
                          <select
                            value={fieldValue?.textValue || ''}
                            onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.id]: { textValue: e.target.value } }))}
                            className="input w-full text-sm"
                          >
                            <option value="">Select an option</option>
                            {(field.fieldOptions || []).map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        )}
                        {editing && field.fieldType === 'CHECKBOX' && (
                          <label className="flex items-center gap-3 p-2.5 rounded-xl bg-dark-bg/50 border border-dark-border cursor-pointer hover:border-green-primary/20 transition-colors">
                            <input
                              type="checkbox"
                              checked={fieldValue?.booleanValue || false}
                              onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.id]: { booleanValue: e.target.checked } }))}
                              className="w-4 h-4 rounded border-dark-border text-green-primary focus:ring-green-primary bg-dark-bg"
                            />
                            <span className="text-xs font-medium text-gray-light">{field.fieldName}</span>
                          </label>
                        )}
                        {editing && field.fieldType === 'IMAGE' && (
                          <div>
                            {fieldValue?.imageUrl ? (
                              <div className="relative rounded-xl overflow-hidden border border-dark-border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={fieldValue.imageUrl} alt={field.fieldName} className="w-full max-h-48 object-contain bg-dark-bg" />
                                <button
                                  type="button"
                                  onClick={() => setFieldValues((prev) => ({ ...prev, [field.id]: { imageUrl: '' } }))}
                                  className="absolute top-2 right-2 p-1 bg-dark-bg/80 rounded-lg text-gray-text hover:text-red-primary transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-dark-border hover:border-green-primary/30 cursor-pointer transition-colors">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(field.id, file);
                                  }}
                                />
                                {uploadingField === field.id ? (
                                  <Loader2 className="w-5 h-5 text-green-primary animate-spin" />
                                ) : (
                                  <>
                                    <Image className="w-5 h-5 text-gray-text mb-1" />
                                    <span className="text-[10px] text-gray-text">Click to upload</span>
                                  </>
                                )}
                              </label>
                            )}
                          </div>
                        )}
                        {!editing && field.fieldType === 'CHECKBOX' ? (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            fv?.booleanValue ? 'bg-green-primary/10 text-green-primary' : 'bg-gray-text/10 text-gray-text'
                          }`}>
                            {fv?.booleanValue ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {fv?.booleanValue ? 'Yes' : 'No'}
                          </div>
                        ) : !editing && field.fieldType === 'IMAGE' && fv?.imageUrl ? (
                          <a href={fv.imageUrl} target="_blank" rel="noreferrer"
                            className="block rounded-xl overflow-hidden border border-dark-border hover:border-green-primary/30 transition-colors">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={fv.imageUrl} alt={field.fieldName} className="w-full max-h-48 object-contain bg-dark-bg" />
                          </a>
                        ) : !editing && field.fieldType === 'LONG_TEXT' ? (
                          <p className="text-sm text-gray-light whitespace-pre-wrap bg-dark-bg/60 rounded-xl p-3 border border-dark-border/40">
                            {formattedValue || <span className="text-gray-text/40 italic">Empty</span>}
                          </p>
                        ) : !editing ? (
                          <p className="text-sm text-gray-light">{formattedValue || <span className="text-gray-text/40 italic">—</span>}</p>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : null}
        </div>

        {/* RIGHT — Summary sidebar */}
        <div className="space-y-4">

          {/* Account info */}
          {account && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-green-primary" />
                <h3 className="text-sm font-bold text-gray-light">Account</h3>
              </div>
              <Link
                href={`/dashboard/accounts/${account.id}`}
                className="flex items-center gap-3 p-3 bg-dark-bg/60 rounded-xl border border-dark-border/40 hover:border-green-primary/20 transition-colors group"
              >
                <div className="w-9 h-9 bg-green-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-4 h-4 text-green-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-light text-sm truncate">{account.accountName}</p>
                  <p className="text-[11px] text-gray-text">{account.brokerName} • {account.accountType}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-text/40 group-hover:text-green-primary transition-colors flex-shrink-0" />
              </Link>
            </div>
          )}

          {/* Stats card */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-primary" />
              <h3 className="text-sm font-bold text-gray-light">Summary</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-text">Status</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isOpen ? 'bg-blue-primary/10 text-blue-primary' : 'bg-gray-text/10 text-gray-text'
                }`}>{trade.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-text">Direction</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isBuy ? 'bg-green-primary/10 text-green-primary' : 'bg-red-primary/10 text-red-primary'
                }`}>{trade.direction}</span>
              </div>
              {isClosed && trade.result && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-text">Result</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    trade.result === 'PROFIT' ? 'bg-green-primary/10 text-green-primary' :
                    trade.result === 'LOSS'   ? 'bg-red-primary/10 text-red-primary' :
                                                'bg-yellow-primary/10 text-yellow-primary'
                  }`}>{resultIcon}{trade.result}</span>
                </div>
              )}
              {isClosed && trade.realisedProfitLoss !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-text">P&L</span>
                  <span className={`text-sm font-bold number-highlight ${pl >= 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                    {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-text">Service Charge</span>
                <span className="text-xs text-gray-light font-medium">
                  {formatCurrency(Number(trade.serviceCharge))}
                </span>
              </div>
              <div className="border-t border-dark-border/40 pt-3 flex items-center justify-between">
                <span className="text-xs text-gray-text">Logged</span>
                <span className="text-xs text-gray-text/70">{formatDateTime(trade.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Open trade actions */}
          {isOpen && (
            <div className="card border-blue-primary/15">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-blue-primary" />
                <h3 className="text-sm font-bold text-gray-light">Open Position</h3>
              </div>
              <Link
                href={`/dashboard/trades/${trade.id}/close`}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-primary/10 hover:bg-green-primary/20 text-green-primary rounded-xl text-sm font-bold transition-colors border border-green-primary/25 active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                Close This Trade
              </Link>
            </div>
          )}

          {/* Danger zone */}
          <div className="card border-red-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-primary/60" />
              <h3 className="text-sm font-bold text-gray-text">Danger Zone</h3>
            </div>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-red-primary/5 hover:bg-red-primary/10 text-red-primary/70 hover:text-red-primary rounded-xl text-xs font-semibold transition-colors border border-red-primary/15"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Trade
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-text text-center">Are you sure? This cannot be undone.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="py-2 rounded-xl text-xs font-semibold text-gray-text bg-dark-bg hover:bg-dark-border/40 transition-colors border border-dark-border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="py-2 rounded-xl text-xs font-bold text-white bg-red-primary/80 hover:bg-red-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
