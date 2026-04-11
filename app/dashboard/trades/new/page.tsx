'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, TrendingUp, ArrowUpCircle, ArrowDownCircle, Lock, Unlock, Loader2, FileText, Target, DollarSign, BarChart3, Layers, Image } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { tradeAccountApi, tradeEntryApi, logTemplateApi, uploadApi, type CreateTradeEntryRequest, type TradeAccount, type LogTemplate, type TradeFieldValueRequest } from '@/lib/api';
import toast from 'react-hot-toast';

export default function NewTradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAuthStore((state) => state.token);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<TradeAccount[]>([]);
  const [tradeMode, setTradeMode] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [template, setTemplate] = useState<LogTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, { textValue?: string; booleanValue?: boolean; imageUrl?: string }>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [positionSizeInput, setPositionSizeInput] = useState('');

  const [formData, setFormData] = useState<CreateTradeEntryRequest>({
    tradeAccountId: searchParams.get('accountId') || '',
    entryDateTime: new Date().toISOString().slice(0, 16),
    instrument: '',
    direction: 'BUY',
    entryPrice: undefined,
    positionSize: undefined,
    stopLossAmount: 0,
    takeProfitAmount: 0,
    status: 'OPEN',
    serviceCharge: 0,
    notes: '',
    result: undefined,
    realisedProfitLoss: undefined,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    if (!token) return;
    try {
      const response = await tradeAccountApi.getAll(token);
      setAccounts(response.data);
      // Auto-load template if accountId from URL params
      const accountId = searchParams.get('accountId');
      if (accountId) loadTemplateForAccount(accountId);
    } catch (error) {
      toast.error('Failed to load accounts');
    }
  };

  const loadTemplateForAccount = async (accountId: string) => {
    if (!token || !accountId) {
      setTemplate(null);
      setFieldValues({});
      return;
    }
    try {
      const res = await logTemplateApi.getTemplateForAccount(token, accountId);
      const tmpl = res.data;
      setTemplate(tmpl);
      if (tmpl && tmpl.fields) {
        const defaults: Record<string, { textValue?: string; booleanValue?: boolean; imageUrl?: string }> = {};
        tmpl.fields.forEach(f => {
          if (f.fieldType === 'CHECKBOX') {
            defaults[f.id] = { booleanValue: f.defaultValue === 'true' };
          } else if (f.fieldType === 'IMAGE') {
            defaults[f.id] = { imageUrl: '' };
          } else {
            defaults[f.id] = { textValue: f.defaultValue || '' };
          }
        });
        setFieldValues(defaults);
      } else {
        setFieldValues({});
      }
    } catch {
      setTemplate(null);
      setFieldValues({});
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
        toast.error('Image upload not available (S3 not configured)');
      }
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (tradeMode === 'CLOSED') {
      if (!formData.result || formData.realisedProfitLoss === undefined) {
        toast.error('Please fill all required fields for closed trade');
        return;
      }
    }
    setLoading(true);
    try {
      // Build field values array from template fields
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
      const payload = { ...formData, status: tradeMode, fieldValues: fvArr.length > 0 ? fvArr : undefined };
      await tradeEntryApi.create(token, payload);
      toast.success(`${tradeMode === 'OPEN' ? 'Open' : 'Completed'} trade logged successfully!`);
      router.push(`/dashboard/accounts/${formData.tradeAccountId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create trade');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'positionSize') {
      setPositionSizeInput(value);
      setFormData(prev => ({
        ...prev,
        positionSize: value === '' || Number.isNaN(Number(value)) ? undefined : Number(value),
      }));
      return;
    }

    const numericFields = ['entryPrice', 'positionSize', 'stopLossAmount', 'takeProfitAmount', 'serviceCharge', 'realisedProfitLoss'];
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? (value ? parseFloat(value) : undefined) : value
    }));
    if (name === 'tradeAccountId') {
      loadTemplateForAccount(value);
    }
  };

  const handleModeChange = (mode: 'OPEN' | 'CLOSED') => {
    setTradeMode(mode);
    setFormData(prev => ({
      ...prev,
      status: mode,
      ...(mode === 'OPEN' && {
        result: undefined,
        realisedProfitLoss: undefined,
      })
    }));
  };

  const selectedAccount = accounts.find(a => a.id === formData.tradeAccountId);

  return (
    <div className="w-full animate-fade-in pb-6">
      {/* Compact Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/trades"
            className="w-9 h-9 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center hover:border-green-primary/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-text" />
          </Link>
          <div className="w-10 h-10 bg-green-primary/10 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-light tracking-tight">Log New Trade</h1>
            <p className="text-xs text-gray-text">Fill in your trade details below</p>
          </div>
        </div>

        {/* Trade Mode Toggle — inline in header */}
        <div className="flex items-center bg-dark-card border border-dark-border rounded-xl p-1 gap-1 w-full xl:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => handleModeChange('OPEN')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tradeMode === 'OPEN'
                ? 'bg-blue-primary/15 text-blue-primary border border-blue-primary/30'
                : 'text-gray-text hover:text-gray-light'
              }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            Open Trade
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('CLOSED')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tradeMode === 'CLOSED'
                ? 'bg-green-primary/15 text-green-primary border border-green-primary/30'
                : 'text-gray-text hover:text-gray-light'
              }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Completed Trade
          </button>
        </div>
      </div>

      {/* Form — Full-width multi-column layout */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-5">

          {/* ────── LEFT COLUMN: Account, Instrument, Direction ────── */}
          <div className="col-span-12 lg:col-span-5 space-y-4">

            {/* Account & Instrument Card */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-green-primary" />
                <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider">Trade Setup</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-light mb-1">
                    Account <span className="text-red-primary">*</span>
                  </label>
                  <select
                    name="tradeAccountId"
                    value={formData.tradeAccountId}
                    onChange={handleChange}
                    className="input w-full text-sm"
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.accountName} ({account.accountType})
                      </option>
                    ))}
                  </select>
                  {selectedAccount && (
                    <p className="text-[10px] text-gray-text mt-1">
                      {selectedAccount.brokerName} • Bal: {Number(selectedAccount.currentBalance).toLocaleString()} {selectedAccount.currencyCode}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-light mb-1">
                      Instrument <span className="text-red-primary">*</span>
                    </label>
                    <input
                      type="text"
                      name="instrument"
                      value={formData.instrument}
                      onChange={handleChange}
                      className="input w-full text-sm"
                      placeholder="e.g., AAPL, EURUSD"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-light mb-1">
                      Entry Date & Time <span className="text-red-primary">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="entryDateTime"
                      value={formData.entryDateTime}
                      onChange={handleChange}
                      className="input w-full text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Direction */}
            <div className="card">
              <label className="block text-xs font-medium text-gray-light mb-2">
                Direction <span className="text-red-primary">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, direction: 'BUY' }))}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all ${formData.direction === 'BUY'
                      ? 'bg-green-primary/10 border-green-primary'
                      : 'border-dark-border hover:border-green-primary/50'
                    }`}
                >
                  <ArrowUpCircle className={`w-4 h-4 ${formData.direction === 'BUY' ? 'text-green-primary' : 'text-gray-text'}`} />
                  <span className={`font-semibold text-xs ${formData.direction === 'BUY' ? 'text-green-primary' : 'text-gray-light'}`}>
                    BUY / LONG
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, direction: 'SELL' }))}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all ${formData.direction === 'SELL'
                      ? 'bg-red-primary/10 border-red-primary'
                      : 'border-dark-border hover:border-red-primary/50'
                    }`}
                >
                  <ArrowDownCircle className={`w-4 h-4 ${formData.direction === 'SELL' ? 'text-red-primary' : 'text-gray-text'}`} />
                  <span className={`font-semibold text-xs ${formData.direction === 'SELL' ? 'text-red-primary' : 'text-gray-light'}`}>
                    SELL / SHORT
                  </span>
                </button>
              </div>
            </div>

            {/* Notes — compact */}
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-green-primary" />
                <label className="text-xs font-semibold text-gray-text uppercase tracking-wider">Notes</label>
              </div>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input w-full text-sm"
                rows={4}
                placeholder="Strategy, rationale, conditions..."
              />
            </div>

            {/* Dynamic Template Fields */}
            {template && template.fields && template.fields.length > 0 && (
              <div className="card border-green-primary/10">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-green-primary" />
                  <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider">
                    {template.name}
                  </h3>
                  <span className="text-[10px] text-gray-text/60 ml-auto">All optional</span>
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

          {/* ────── MIDDLE COLUMN: Prices & Risk ────── */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="card h-full">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-green-primary" />
                <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider">Price & Risk</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-light mb-1">Entry Price</label>
                    <input
                      type="number"
                      name="entryPrice"
                      value={formData.entryPrice || ''}
                      onChange={handleChange}
                      className="input w-full text-sm"
                      placeholder="150.00"
                      step="any"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-light mb-1">Position Size</label>
                    <input
                      type="number"
                      name="positionSize"
                      value={positionSizeInput}
                      onChange={handleChange}
                      className="input w-full text-sm"
                      placeholder="0.0012"
                      step="any"
                    />
                  </div>
                </div>

                <div className="h-px bg-dark-border" />

                <div>
                  <label className="block text-xs font-medium text-red-primary mb-1">
                    Stop Loss {tradeMode === 'OPEN' && <span>*</span>}
                  </label>
                  <input
                    type="number"
                    name="stopLossAmount"
                    value={formData.stopLossAmount}
                    onChange={handleChange}
                    className="input w-full text-sm"
                    placeholder="500.00"
                    step="any"
                    required={tradeMode === 'OPEN'}
                  />
                  <p className="text-[10px] text-gray-text mt-0.5">Max loss you accept</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-green-primary mb-1">
                    Take Profit {tradeMode === 'OPEN' && <span>*</span>}
                  </label>
                  <input
                    type="number"
                    name="takeProfitAmount"
                    value={formData.takeProfitAmount}
                    onChange={handleChange}
                    className="input w-full text-sm"
                    placeholder="1000.00"
                    step="any"
                    required={tradeMode === 'OPEN'}
                  />
                  <p className="text-[10px] text-gray-text mt-0.5">Your profit target</p>
                </div>

                <div className="h-px bg-dark-border" />

                <div>
                  <label className="block text-xs font-medium text-gray-light mb-1">Service Charge</label>
                  <input
                    type="number"
                    name="serviceCharge"
                    value={formData.serviceCharge}
                    onChange={handleChange}
                    className="input w-full text-sm"
                    placeholder="0.00"
                    step="any"
                  />
                </div>

                {/* Risk/Reward visual */}
                {formData.stopLossAmount > 0 && formData.takeProfitAmount > 0 && (
                  <div className="p-3 rounded-xl bg-dark-bg/50 border border-dark-border">
                    <p className="text-[10px] text-gray-text uppercase tracking-wider mb-2">Risk / Reward</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-dark-border overflow-hidden flex">
                        <div
                          className="h-full bg-red-primary rounded-l-full"
                          style={{ width: `${(formData.stopLossAmount / (formData.stopLossAmount + formData.takeProfitAmount)) * 100}%` }}
                        />
                        <div
                          className="h-full bg-green-primary rounded-r-full"
                          style={{ width: `${(formData.takeProfitAmount / (formData.stopLossAmount + formData.takeProfitAmount)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-light whitespace-nowrap">
                        1 : {(formData.takeProfitAmount / formData.stopLossAmount).toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ────── RIGHT COLUMN: Exit/Results (if closed) + Submit ────── */}
          <div className="col-span-12 lg:col-span-3 space-y-4 lg:sticky lg:top-20 h-fit">

            {tradeMode === 'CLOSED' ? (
              <div className="card border-green-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-green-primary" />
                  <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider">Exit & Results</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-light mb-1">
                      Result <span className="text-red-primary">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          result: 'PROFIT' as const,
                          realisedProfitLoss: prev.takeProfitAmount || ('' as any)
                        }))}
                        className={`py-2 rounded-lg border-2 text-xs font-semibold transition-all ${formData.result === 'PROFIT'
                            ? 'bg-green-primary/10 border-green-primary text-green-primary'
                            : 'border-dark-border text-gray-text hover:border-dark-border-hover'
                          }`}
                      >
                        Profit
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          result: 'LOSS' as const,
                          realisedProfitLoss: prev.stopLossAmount || ('' as any)
                        }))}
                        className={`py-2 rounded-lg border-2 text-xs font-semibold transition-all ${formData.result === 'LOSS'
                            ? 'bg-red-primary/10 border-red-primary text-red-primary'
                            : 'border-dark-border text-gray-text hover:border-dark-border-hover'
                          }`}
                      >
                        Loss
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          result: 'BREAK_EVEN' as const,
                          realisedProfitLoss: (!prev.entryPrice || prev.entryPrice === 0) ? ('' as any) : prev.entryPrice
                        }))}
                        className={`py-2 rounded-lg border-2 text-xs font-semibold transition-all ${formData.result === 'BREAK_EVEN'
                            ? 'bg-yellow-primary/10 border-yellow-primary text-yellow-primary'
                            : 'border-dark-border text-gray-text hover:border-dark-border-hover'
                          }`}
                      >
                        Even
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-light mb-1">
                      Realised P/L <span className="text-red-primary">*</span>
                    </label>
                    <input
                      type="number"
                      name="realisedProfitLoss"
                      value={formData.realisedProfitLoss === undefined ? '' : formData.realisedProfitLoss}
                      onChange={handleChange}
                      className="input w-full text-sm"
                      placeholder="e.g., 1250 or -450"
                      step="any"
                      required
                    />
                    <p className="text-[10px] text-gray-text mt-0.5">
                      Enter the amount only. The selected result decides whether it is treated as profit or loss.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Open trade — show a helpful summary instead */
              <div className="card border-blue-primary/20 bg-gradient-to-br from-blue-primary/5 to-transparent">
                <div className="flex items-center gap-2 mb-3">
                  <Unlock className="w-4 h-4 text-blue-primary" />
                  <h3 className="text-xs font-semibold text-gray-text uppercase tracking-wider">Open Trade Info</h3>
                </div>
                <div className="space-y-3 text-xs text-gray-text">
                  <p>This trade will be recorded as <strong className="text-blue-primary">OPEN</strong>.</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-primary mt-0.5">•</span>
                      Close it later with actual exit data & results
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-primary mt-0.5">•</span>
                      Account balance updates only when you close
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-primary mt-0.5">•</span>
                      Stop Loss & Take Profit required for open trades
                    </li>
                  </ul>
                </div>
                {formData.instrument && (
                  <div className="mt-4 p-3 rounded-xl bg-dark-bg/50 border border-dark-border">
                    <p className="text-[10px] text-gray-text uppercase tracking-wider mb-1.5">Trade Preview</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-light">{formData.instrument || '—'}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${formData.direction === 'BUY'
                          ? 'bg-green-primary/10 text-green-primary'
                          : 'bg-red-primary/10 text-red-primary'
                        }`}>
                        {formData.direction}
                      </span>
                    </div>
                    {formData.entryPrice && (
                      <p className="text-xs text-gray-text mt-1">@ {formData.entryPrice}{formData.positionSize ? ` × ${formData.positionSize}` : ''}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Submit Section */}
            <div className="card">
              {tradeMode === 'CLOSED' && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-green-primary/5 border border-green-primary/10 mb-3">
                  <Lock className="w-3.5 h-3.5 text-green-primary flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-text leading-relaxed">
                    Trade will be <strong className="text-green-primary">closed immediately</strong>. Account balance updates right away.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${tradeMode === 'OPEN'
                    ? 'bg-blue-primary hover:bg-blue-primary/90 text-white'
                    : 'btn-primary'
                  }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  tradeMode === 'OPEN' ? 'Log Open Trade' : '✓ Log Completed Trade'
                )}
              </button>
              <Link
                href="/dashboard/trades"
                className="block w-full mt-2 py-2.5 rounded-xl text-center text-xs font-medium text-gray-text hover:text-gray-light border border-dark-border hover:border-dark-border-hover transition-all"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
