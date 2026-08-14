'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Wallet } from 'lucide-react';
import type { TradeAccount } from '@/lib/api';

interface AccountMultiSelectProps {
  accounts: TradeAccount[];
  /** Empty array means "all accounts". */
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export default function AccountMultiSelect({ accounts, selectedIds, onChange, disabled }: AccountMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAll = selectedIds.length === 0;

  const toggleAccount = (id: string) => {
    if (isAll) {
      // Switching from "all" to a single explicit selection.
      onChange([id]);
      return;
    }
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((accId) => accId !== id)
        : [...selectedIds, id],
    );
  };

  const summaryLabel = (() => {
    if (isAll) return 'All accounts';
    if (selectedIds.length === 1) {
      return accounts.find((a) => a.id === selectedIds[0])?.accountName || '1 account';
    }
    return `${selectedIds.length} accounts selected`;
  })();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="input w-full text-sm flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-1.5 truncate">
          <Wallet className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="truncate">{summaryLabel}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-slate-300 rounded-xl shadow-lg py-1.5 max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange([]); setOpen(false); }}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium text-slate-900">All accounts</span>
            {isAll && <Check className="w-4 h-4 text-green-primary flex-shrink-0" />}
          </button>

          {accounts.length > 0 && <div className="border-t border-slate-200 my-1" />}

          {accounts.map((account) => {
            const checked = !isAll && selectedIds.includes(account.id);
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => toggleAccount(account.id)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors text-left"
              >
                <span className="min-w-0">
                  <span className="block text-slate-900 font-medium truncate">{account.accountName}</span>
                  <span className="block text-xs text-slate-500 truncate">{account.brokerName} • {account.accountType}</span>
                </span>
                {checked && <Check className="w-4 h-4 text-green-primary flex-shrink-0" />}
              </button>
            );
          })}

          {accounts.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-500">No trade accounts yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
