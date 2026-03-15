import type { LogTemplateField, TradeEntry, TradeFieldValue } from './api';

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const getTradeGrossProfitLoss = (
  result: string | null,
  realisedProfitLoss: number | null | undefined,
): number | null => {
  if (realisedProfitLoss === null || realisedProfitLoss === undefined || Number.isNaN(Number(realisedProfitLoss))) {
    return null;
  }

  const magnitude = Math.abs(Number(realisedProfitLoss));

  switch (result) {
    case 'PROFIT':
      return magnitude;
    case 'LOSS':
      return -magnitude;
    case 'BREAK_EVEN':
      return 0;
    default:
      return Number(realisedProfitLoss);
  }
};

export const getTradeNetProfitLoss = (
  result: string | null,
  realisedProfitLoss: number | null | undefined,
  serviceCharge = 0,
): number | null => {
  const grossProfitLoss = getTradeGrossProfitLoss(result, realisedProfitLoss);

  if (grossProfitLoss === null) {
    return null;
  }

  if (result === 'BREAK_EVEN') {
    return -Math.abs(serviceCharge || 0);
  }

  return grossProfitLoss - Math.abs(serviceCharge || 0);
};

export const formatNumber = (num: number, decimals = 2): string => {
  return num.toFixed(decimals);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRandomColor = (): string => {
  const colors = [
    '#00ff88', '#00cc6f', '#009954',
    '#3b82f6', '#6366f1', '#8b5cf6',
    '#ffd93d', '#ffb93d', '#ff9f3d',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const calculateProfitLossPercentage = (
  profitLoss: number,
  initialBalance: number
): number => {
  if (initialBalance === 0) return 0;
  return (profitLoss / initialBalance) * 100;
};

export const getTradeStatusColor = (status: string): string => {
  switch (status) {
    case 'OPEN':
      return 'text-blue-primary';
    case 'CLOSED':
      return 'text-gray-text';
    default:
      return 'text-gray-light';
  }
};

export const getResultColor = (result: string | null): string => {
  switch (result) {
    case 'PROFIT':
      return 'text-green-primary';
    case 'LOSS':
      return 'text-red-primary';
    case 'BREAK_EVEN':
      return 'text-yellow-primary';
    default:
      return 'text-gray-text';
  }
};

export const formatTradeFieldValue = (
  fieldValue: TradeFieldValue | undefined,
  field?: LogTemplateField,
): string | null => {
  if (!fieldValue) {
    return null;
  }

  const fieldType = field?.fieldType ?? fieldValue.field?.fieldType;

  if (fieldType === 'CHECKBOX') {
    return fieldValue.booleanValue === null || fieldValue.booleanValue === undefined
      ? null
      : fieldValue.booleanValue
        ? 'Yes'
        : 'No';
  }

  if (fieldType === 'IMAGE') {
    return fieldValue.imageUrl ? 'Image attached' : null;
  }

  const textValue = fieldValue.textValue?.trim();
  return textValue ? textValue : null;
};

export const getTradeTemplatePreviewItems = (
  trade: TradeEntry,
  maxItems = 2,
): Array<{ label: string; value: string }> => {
  if (!trade.fieldValues?.length) {
    return [];
  }

  return trade.fieldValues
    .map((fieldValue) => {
      const label = fieldValue.field?.fieldName?.trim();
      const value = formatTradeFieldValue(fieldValue, fieldValue.field);

      if (!label || !value) {
        return null;
      }

      return { label, value };
    })
    .filter((item): item is { label: string; value: string } => item !== null)
    .slice(0, maxItems);
};
