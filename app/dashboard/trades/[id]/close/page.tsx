'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, XCircle, CheckCircle, MinusCircle, Loader2, TrendingDown, DollarSign, BarChart3, Clock, Tag, ArrowUpCircle, ArrowDownCircle, Shield, Layers, Image } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { tradeEntryApi, logTemplateApi, uploadApi, type TradeEntry, type CloseTradeRequest, type LogTemplate, type TradeFieldValueRequest } from '@/lib/api';
import { getTradeGrossProfitLoss, getTradeNetProfitLoss } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CloseTradePagePage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const tradeId = params.id as string;
  
  const [trade, setTrade] = useState<TradeEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<LogTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, { textValue?: string; booleanValue?: boolean; imageUrl?: string }>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [formData, setFormData] = useState<CloseTradeRequest>({
    result: 'PROFIT',
    realisedProfitLoss: '' as any,
    serviceCharge: 0,
  });

  useEffect(() => {
    loadTrade();
  }, [tradeId]);

  const loadTrade = async () => {
    if (!token || !tradeId) return;
    try {
      const response = await tradeEntryApi.getById(token, tradeId);
      setTrade(response.data);
      setFormData(prev => ({
        ...prev,
        serviceCharge: Number(response.data.serviceCharge) || 0,
        realisedProfitLoss: Number(response.data.takeProfitAmount) || ('' as any),
      }));
      // Load template for this trade's account
      loadTemplateForTrade(response.data);
    } catch (error: any) {
      toast.error('Failed to load trade');
      router.back();
    }
  };

  const loadTemplateForTrade = async (tradeData: TradeEntry) => {
    if (!token) return;
    try {
      const res = await logTemplateApi.getTemplateForAccount(token, tradeData.tradeAccountId);
      const tmpl = res.data;
      setTemplate(tmpl);
      if (tmpl && tmpl.fields) {
        const vals: Record<string, { textValue?: string; booleanValue?: boolean; imageUrl?: string }> = {};
        tmpl.fields.forEach(f => {
          // Check for existing field values from the trade
          const existing = tradeData.fieldValues?.find(fv => fv.fieldId === f.id);
          if (existing) {
            vals[f.id] = {
              textValue: existing.textValue || '',
              booleanValue: existing.booleanValue || false,
              imageUrl: existing.imageUrl || '',
            };
          } else if (f.fieldType === 'CHECKBOX') {
            vals[f.id] = { booleanValue: f.defaultValue === 'true' };
          } else if (f.fieldType === 'IMAGE') {
            vals[f.id] = { imageUrl: '' };
          } else {
            vals[f.id] = { textValue: f.defaultValue || '' };
          }
        });
        setFieldValues(vals);
      }
    } catch {
      setTemplate(null);
    }
  };

  const handleImageUpload = async (fieldId: string, file: File) => {
    if (!token) return;
    setUploadingField(fieldId);
    try {
      const res = await uploadApi.uploadImage(token, file);
      if (res.data.url) {
        setFieldValues(prev => ({ ...prev, [fieldId]: { imageUrl: res.data.url! } }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !tradeId) return;
    setLoading(true);
    try {
      // Build field values
      const fvArr: TradeFieldValueRequest[] = [];
      if (template && template.fields) {
        template.fields.forEach(f => {
          const val = fieldValues[f.id];
          if (!val) return;
          const hasValue = (val.textValue && val.textValue.trim()) || val.booleanValue === true || (val.imageUrl && val.imageUrl.trim());
          if (hasValue) {
            fvArr.push({ fieldId: f.id, textValue: val.textValue, booleanValue: val.booleanValue, imageUrl: val.imageUrl });
          }
        });
      }
      await tradeEntryApi.close(token, tradeId, { ...formData, fieldValues: fvArr.length > 0 ? fvArr : undefined });
      toast.success('Trade closed successfully!');
      router.push(`/dashboard/accounts/${trade?.tradeAccountId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to close trade');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['realisedProfitLoss', 'serviceCharge'];
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value
    }));
  };

  // Compute balance impact
  const grossImpact = getTradeGrossProfitLoss(formData.result, formData.realisedProfitLoss) ?? 0;
  const netImpact = getTradeNetProfitLoss(formData.result, formData.realisedProfitLoss, formData.serviceCharge) ?? 0;

  if (!trade) {
    return (
      <div className="flex items-center justify-center h-96 animate-fade-in">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-green-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-text">Loading trade details...</p>
        </div>
      </div>
    );
  }

  const entryDate = new Date(trade.entryDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const entryTime = new Date(trade.entryDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full animate-fade-in">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center hover:border-green-primary/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-text" />
          </button>
          <div className="w-10 h-10 bg-red-primary/10 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-light tracking-tight">Close Trade</h1>
            <p className="text-xs text-gray-text">Finalize and record the outcome</p>
          </div>
        </div>

        {/* Trade badge — quick glance */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-light">{trade.instrument}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            trade.direction === 'BUY'
              ? 'bg-green-primary/10 text-green-primary'
              : 'bg-red-primary/10 text-red-primary'
          }`}>
            {trade.direction}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-primary/10 text-blue-primary">
            OPEN
          </span>
        </div>
      </div>

      {/* 3-Column Grid */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">

          {/* ────── LEFT: Trade Summary ────── */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-green-primary" />
                <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider">Trade Details</h3>
              </div>

              {/* Instrument header */}
              <div className="p-3 rounded-xl bg-dark-bg/60 border border-dark-border mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-light">{trade.instrument}</span>
                  <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
                    trade.direction === 'BUY'
                      ? 'bg-green-primary/10 text-green-primary'
                      : 'bg-red-primary/10 text-red-primary'
                  }`}>
                    {trade.direction === 'BUY'
                      ? <ArrowUpCircle className="w-3 h-3" />
                      : <ArrowDownCircle className="w-3 h-3" />
                    }
                    {trade.direction}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-text">
                  <Clock className="w-3 h-3" />
                  {entryDate} at {entryTime}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-dark-bg/40 border border-dark-border">
                  <p className="text-[10px] text-gray-text mb-0.5">Entry Price</p>
                  <p className="text-sm font-bold text-gray-light">
                    {trade.entryPrice ? `$${Number(trade.entryPrice).toFixed(2)}` : '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-bg/40 border border-dark-border">
                  <p className="text-[10px] text-gray-text mb-0.5">Qty / Size</p>
                  <p className="text-sm font-bold text-gray-light">
                    {trade.positionSize || '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-bg/40 border border-dark-border">
                  <p className="text-[10px] text-gray-text mb-0.5">Stop Loss</p>
                  <p className="text-sm font-bold text-red-primary">
                    ${Number(trade.stopLossAmount).toFixed(2)}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-bg/40 border border-dark-border">
                  <p className="text-[10px] text-gray-text mb-0.5">Take Profit</p>
                  <p className="text-sm font-bold text-green-primary">
                    ${Number(trade.takeProfitAmount).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Risk/Reward bar */}
              {Number(trade.stopLossAmount) > 0 && Number(trade.takeProfitAmount) > 0 && (
                <div className="mt-3 p-2.5 rounded-lg bg-dark-bg/40 border border-dark-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-gray-text uppercase tracking-wider">Risk / Reward</span>
                    <span className="text-xs font-bold text-gray-light">
                      1 : {(Number(trade.takeProfitAmount) / Number(trade.stopLossAmount)).toFixed(1)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-dark-border overflow-hidden flex">
                    <div
                      className="h-full bg-red-primary rounded-l-full"
                      style={{ width: `${(Number(trade.stopLossAmount) / (Number(trade.stopLossAmount) + Number(trade.takeProfitAmount))) * 100}%` }}
                    />
                    <div
                      className="h-full bg-green-primary rounded-r-full"
                      style={{ width: `${(Number(trade.takeProfitAmount) / (Number(trade.stopLossAmount) + Number(trade.takeProfitAmount))) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Notes if any */}
              {trade.notes && (
                <div className="mt-3 p-2.5 rounded-lg bg-dark-bg/40 border border-dark-border">
                  <p className="text-[10px] text-gray-text uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-xs text-gray-light leading-relaxed">{trade.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* ────── MIDDLE: Result & P/L Input ────── */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-green-primary" />
                <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider">Trade Result</h3>
              </div>

              {/* Result Buttons — large and clear */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    result: 'PROFIT',
                    realisedProfitLoss: Number(trade.takeProfitAmount) || ('' as any) 
                  }))}
                  className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 transition-all ${
                    formData.result === 'PROFIT'
                      ? 'bg-green-primary/10 border-green-primary text-green-primary shadow-glow-green'
                      : 'border-dark-border text-gray-text hover:border-green-primary/40'
                  }`}
                >
                  <CheckCircle className={`w-6 h-6 ${formData.result === 'PROFIT' ? '' : 'opacity-50'}`} />
                  <span className="text-xs font-bold">PROFIT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    result: 'LOSS',
                    realisedProfitLoss: Number(trade.stopLossAmount) || ('' as any) 
                  }))}
                  className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 transition-all ${
                    formData.result === 'LOSS'
                      ? 'bg-red-primary/10 border-red-primary text-red-primary shadow-glow-red'
                      : 'border-dark-border text-gray-text hover:border-red-primary/40'
                  }`}
                >
                  <XCircle className={`w-6 h-6 ${formData.result === 'LOSS' ? '' : 'opacity-50'}`} />
                  <span className="text-xs font-bold">LOSS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    result: 'BREAK_EVEN',
                    realisedProfitLoss: (!trade.entryPrice || Number(trade.entryPrice) === 0) ? ('' as any) : Number(trade.entryPrice)
                  }))}
                  className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 transition-all ${
                    formData.result === 'BREAK_EVEN'
                      ? 'bg-yellow-primary/10 border-yellow-primary text-yellow-primary'
                      : 'border-dark-border text-gray-text hover:border-yellow-primary/40'
                  }`}
                >
                  <MinusCircle className={`w-6 h-6 ${formData.result === 'BREAK_EVEN' ? '' : 'opacity-50'}`} />
                  <span className="text-xs font-bold">EVEN</span>
                </button>
              </div>

              <div className="h-px bg-dark-border mb-4" />

              {/* Realised P/L */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-light mb-1">
                  Realised Profit / Loss <span className="text-red-primary">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-text font-bold">$</span>
                  <input
                    type="number"
                    name="realisedProfitLoss"
                      value={formData.realisedProfitLoss === undefined ? '' : formData.realisedProfitLoss}
                    onChange={handleChange}
                    className="input w-full text-sm pl-7"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-text mt-1">
                  {formData.result === 'PROFIT' && 'Enter the profit amount (positive)'}
                  {formData.result === 'LOSS' && 'Enter the loss amount only. The system will apply the negative sign for you.'}
                  {formData.result === 'BREAK_EVEN' && 'Enter 0. Only charges will affect the final result.'}
                </p>
              </div>

              {/* Service Charge */}
              <div>
                <label className="block text-xs font-medium text-gray-light mb-1">
                  Service Charge / Exit Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-text font-bold">$</span>
                  <input
                    type="number"
                    name="serviceCharge"
                    value={formData.serviceCharge}
                    onChange={handleChange}
                    className="input w-full text-sm pl-7"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Template Fields */}
            {template && template.fields && template.fields.length > 0 && (
              <div className="card border-green-primary/10">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-green-primary" />
                  <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider">
                    Close Log Template
                  </h3>
                  <span className="text-[10px] text-gray-text/60 ml-auto">{template.fields.length} field{template.fields.length === 1 ? '' : 's'}</span>
                </div>
                <div className="mb-3 rounded-xl border border-green-primary/15 bg-green-primary/5 px-3 py-2.5">
                  <p className="text-[11px] font-semibold text-green-primary">Assigned template: {template.name}</p>
                  <p className="text-[10px] text-gray-text mt-1">
                    Fill these account-specific fields now so the extra data is saved directly into this closed trade log.
                  </p>
                </div>
                <div className="space-y-3">
                  {template.fields
                    .sort((a, b) => a.fieldOrder - b.fieldOrder)
                    .map(field => (
                    <div key={field.id}>
                      {field.fieldType === 'TEXT' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-light mb-1">{field.fieldName}</label>
                          <input
                            type="text"
                            value={fieldValues[field.id]?.textValue || ''}
                            onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: { textValue: e.target.value } }))}
                            className="input w-full text-sm"
                            placeholder={field.placeholder || `Enter ${field.fieldName.toLowerCase()}...`}
                          />
                        </div>
                      )}
                      {field.fieldType === 'LONG_TEXT' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-light mb-1">{field.fieldName}</label>
                          <textarea
                            value={fieldValues[field.id]?.textValue || ''}
                            onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: { textValue: e.target.value } }))}
                            className="input w-full text-sm"
                            rows={3}
                            placeholder={field.placeholder || `Enter ${field.fieldName.toLowerCase()}...`}
                          />
                        </div>
                      )}
                      {field.fieldType === 'MULTIPLE_CHOICE' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-light mb-1">{field.fieldName}</label>
                          <select
                            value={fieldValues[field.id]?.textValue || ''}
                            onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: { textValue: e.target.value } }))}
                            className="input w-full text-sm"
                          >
                            <option value="">Select an option</option>
                            {(field.fieldOptions || []).map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {field.fieldType === 'CHECKBOX' && (
                        <label className="flex items-center gap-3 p-2.5 rounded-xl bg-dark-bg/50 border border-dark-border cursor-pointer hover:border-green-primary/20 transition-colors">
                          <input
                            type="checkbox"
                            checked={fieldValues[field.id]?.booleanValue || false}
                            onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: { booleanValue: e.target.checked } }))}
                            className="w-4 h-4 rounded border-dark-border text-green-primary focus:ring-green-primary bg-dark-bg"
                          />
                          <span className="text-xs font-medium text-gray-light">{field.fieldName}</span>
                        </label>
                      )}
                      {field.fieldType === 'IMAGE' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-light mb-1">{field.fieldName}</label>
                          {fieldValues[field.id]?.imageUrl ? (
                            <div className="relative rounded-xl overflow-hidden border border-dark-border">
                              <img src={fieldValues[field.id].imageUrl} alt={field.fieldName} className="w-full h-32 object-cover" />
                              <button
                                type="button"
                                onClick={() => setFieldValues(prev => ({ ...prev, [field.id]: { imageUrl: '' } }))}
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ────── RIGHT: Impact Summary + Submit ────── */}
          <div className="col-span-12 lg:col-span-4 space-y-4">

            {/* Balance Impact Card */}
            <div className={`card border ${
              formData.result === 'PROFIT' ? 'border-green-primary/20' :
              formData.result === 'LOSS' ? 'border-red-primary/20' :
              'border-yellow-primary/20'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className={`w-4 h-4 ${
                  formData.result === 'PROFIT' ? 'text-green-primary' :
                  formData.result === 'LOSS' ? 'text-red-primary' :
                  'text-yellow-primary'
                }`} />
                <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider">Balance Impact</h3>
              </div>

              {/* Big number */}
              <div className={`text-center p-4 rounded-xl mb-3 ${
                formData.result === 'PROFIT' ? 'bg-green-primary/5' :
                formData.result === 'LOSS' ? 'bg-red-primary/5' :
                'bg-yellow-primary/5'
              }`}>
                <p className="text-[10px] text-gray-text uppercase tracking-wider mb-1">Net Change</p>
                <p className={`text-2xl font-bold ${
                  netImpact > 0 ? 'text-green-primary' :
                  netImpact < 0 ? 'text-red-primary' :
                  'text-yellow-primary'
                }`}>
                  {netImpact >= 0 ? '+' : ''}{netImpact.toFixed(2)}
                </p>
              </div>

              {/* Breakdown */}
              <div className="space-y-2 text-xs">
                {formData.result === 'PROFIT' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-text">Realised P/L</span>
                      <span className="font-semibold text-green-primary">+${grossImpact.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-text">Service Charge</span>
                      <span className="font-semibold text-red-primary">-${(formData.serviceCharge || 0).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-dark-border" />
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-light">Net Addition</span>
                      <span className="font-bold text-green-primary">${netImpact.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {formData.result === 'LOSS' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-text">Realised Loss</span>
                      <span className="font-semibold text-red-primary">-${Math.abs(grossImpact).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-text">Service Charge</span>
                      <span className="font-semibold text-red-primary">-${(formData.serviceCharge || 0).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-dark-border" />
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-light">Net Deduction</span>
                      <span className="font-bold text-red-primary">-${Math.abs(netImpact).toFixed(2)}</span>
                    </div>
                  </>
                )}
                {formData.result === 'BREAK_EVEN' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-text">Service Charge</span>
                      <span className="font-semibold text-red-primary">-${(formData.serviceCharge || 0).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-dark-border" />
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-light">Net Change</span>
                      <span className="font-bold text-yellow-primary">-${(formData.serviceCharge || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Warning note */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-dark-bg/40 border border-dark-border">
              <Shield className="w-3.5 h-3.5 text-yellow-primary flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-text leading-relaxed">
                This action is <strong className="text-gray-light">permanent</strong>. The trade will be marked as closed and your account balance will be updated immediately.
              </p>
            </div>

            {/* Submit */}
            <div className="card">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  formData.result === 'PROFIT'
                    ? 'bg-green-primary hover:bg-green-primary/90 text-dark-bg'
                    : formData.result === 'LOSS'
                      ? 'bg-red-primary hover:bg-red-primary/90 text-white'
                      : 'bg-yellow-primary hover:bg-yellow-primary/90 text-dark-bg'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Closing Trade...
                  </>
                ) : (
                  <>
                    {formData.result === 'PROFIT' && <CheckCircle className="w-4 h-4" />}
                    {formData.result === 'LOSS' && <XCircle className="w-4 h-4" />}
                    {formData.result === 'BREAK_EVEN' && <MinusCircle className="w-4 h-4" />}
                    Close as {formData.result === 'PROFIT' ? 'Profit' : formData.result === 'LOSS' ? 'Loss' : 'Break Even'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="block w-full mt-2 py-2.5 rounded-xl text-center text-xs font-medium text-gray-text hover:text-gray-light border border-dark-border hover:border-dark-border-hover transition-all"
              >
                Cancel — Keep Open
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
