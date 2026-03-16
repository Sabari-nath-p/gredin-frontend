'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, Info, Loader2, Server } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { tradeAccountApi, mt5SyncApi, type CreateTradeAccountRequest } from '@/lib/api';
import toast from 'react-hot-toast';

const marketSegments = [
  { value: 'STOCK', label: 'Stock Market', icon: '📈' },
  { value: 'AUCTION', label: 'Auction', icon: '🔨' },
  { value: 'FUTURES', label: 'Futures', icon: '📊' },
  { value: 'OPTIONS', label: 'Options', icon: '⚡' },
  { value: 'FOREX', label: 'Forex', icon: '💱' },
  { value: 'CRYPTO', label: 'Cryptocurrency', icon: '₿' },
  { value: 'COMMODITIES', label: 'Commodities', icon: '🛢️' },
];

const accountTypes = [
  { value: 'DEMO' as const, label: 'Demo', desc: 'Practice account', color: 'blue' },
  { value: 'LIVE' as const, label: 'Live', desc: 'Real money account', color: 'green' },
  { value: 'FUNDED' as const, label: 'Funded', desc: 'Prop firm account', color: 'yellow' },
];

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD'];

export default function NewAccountPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateTradeAccountRequest>({
    accountName: '',
    brokerName: '',
    marketSegment: 'STOCK',
    currencyCode: 'USD',
    initialBalance: 0,
    accountType: 'DEMO',
  });

  const [connectMt5, setConnectMt5] = useState(false);
  const [mt5Form, setMt5Form] = useState({ mt5Login: '', mt5Password: '', mt5Server: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    try {
      const payload: CreateTradeAccountRequest = { ...formData };
      
      // Inject MT5 fields directly into creation payload if toggled
      if (connectMt5 && mt5Form.mt5Login) {
        payload.mt5Login = mt5Form.mt5Login;
        payload.mt5Password = mt5Form.mt5Password;
        payload.mt5Server = mt5Form.mt5Server;
      }

      await tradeAccountApi.create(token, payload);
      toast.success('Account created successfully!');
      router.push('/dashboard/accounts');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'initialBalance' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/accounts"
          className="inline-flex items-center gap-2 text-sm text-gray-text hover:text-green-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Accounts
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-primary/10 rounded-2xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-green-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-light tracking-tight">Create Trading Account</h1>
            <p className="text-sm text-gray-text">Set up a new account for trade logging</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Details */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-text uppercase tracking-wider mb-4">Account Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-light mb-2">
                Account Name <span className="text-red-primary">*</span>
              </label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                className="input w-full"
                placeholder="e.g., My Growth Account"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-light mb-2">
                Broker Name <span className="text-red-primary">*</span>
              </label>
              <input
                type="text"
                name="brokerName"
                value={formData.brokerName}
                onChange={handleChange}
                className="input w-full"
                placeholder="e.g., Interactive Brokers, Zerodha"
                required
              />
            </div>
          </div>
        </div>

        {/* Account Type */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-text uppercase tracking-wider mb-4">Account Type</h3>
          <div className="grid grid-cols-3 gap-3">
            {accountTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, accountType: type.value }))}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  formData.accountType === type.value
                    ? type.color === 'green' ? 'border-green-primary bg-green-primary/10' :
                      type.color === 'blue' ? 'border-blue-primary bg-blue-primary/10' :
                      'border-yellow-primary bg-yellow-primary/10'
                    : 'border-dark-border hover:border-dark-border-hover'
                }`}
              >
                <span className={`text-sm font-bold ${
                  formData.accountType === type.value
                    ? type.color === 'green' ? 'text-green-primary' :
                      type.color === 'blue' ? 'text-blue-primary' :
                      'text-yellow-primary'
                    : 'text-gray-light'
                }`}>{type.label}</span>
                <p className="text-[10px] text-gray-text mt-0.5">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Market & Currency */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-text uppercase tracking-wider mb-4">Market Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-light mb-2">
                Market Segment <span className="text-red-primary">*</span>
              </label>
              <select
                name="marketSegment"
                value={formData.marketSegment}
                onChange={handleChange}
                className="input w-full"
                required
              >
                {marketSegments.map(segment => (
                  <option key={segment.value} value={segment.value}>
                    {segment.icon} {segment.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-light mb-2">
                Currency
              </label>
              <select
                name="currencyCode"
                value={formData.currencyCode}
                onChange={handleChange}
                className="input w-full"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-light mb-2">
                Initial Balance <span className="text-red-primary">*</span>
              </label>
              <input
                type="number"
                name="initialBalance"
                value={formData.initialBalance}
                onChange={handleChange}
                className="input w-full"
                placeholder="10000"
                step="0.01"
                min="0"
                required
              />
              <p className="text-xs text-gray-text mt-1.5">Starting balance cannot be changed later</p>
            </div>
          </div>
        </div>

        {/* MT5 Integration */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-gray-light">MT5 Integration (Optional)</h2>
            </div>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={connectMt5}
                  onChange={(e) => setConnectMt5(e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${connectMt5 ? 'bg-blue-500' : 'bg-dark-border'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${connectMt5 ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
          
          {connectMt5 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dark-border animate-fade-in">
              <div>
                <label className="block text-sm font-semibold text-gray-light mb-1.5">MT5 Login ID</label>
                <input
                  type="text"
                  value={mt5Form.mt5Login}
                  onChange={e => setMt5Form({ ...mt5Form, mt5Login: e.target.value })}
                  className="input w-full"
                  placeholder="MT5 Account Number"
                  required={connectMt5}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-light mb-1.5">MT5 Password</label>
                <input
                  type="password"
                  value={mt5Form.mt5Password}
                  onChange={e => setMt5Form({ ...mt5Form, mt5Password: e.target.value })}
                  className="input w-full"
                  placeholder="Auto-sync password"
                  required={connectMt5}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-light mb-1.5">Server Name</label>
                <input
                  type="text"
                  value={mt5Form.mt5Server}
                  onChange={e => setMt5Form({ ...mt5Form, mt5Server: e.target.value })}
                  className="input w-full"
                  placeholder="e.g. MetaQuotes-Demo"
                  required={connectMt5}
                />
                <p className="text-xs text-gray-text mt-1.5">Trades will automatically sync every 5 minutes</p>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 p-4 bg-green-primary/5 border border-green-primary/20 rounded-xl">
          <Info className="w-4 h-4 text-green-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-text space-y-1">
            <p>• Account balance will be automatically updated based on your trades</p>
            <p>• You can create multiple accounts for different strategies</p>
            <p>• All fields can be updated later except initial balance</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Account'
            )}
          </button>
          <Link href="/dashboard/accounts" className="btn-secondary flex-1 text-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
