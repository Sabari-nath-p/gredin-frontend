export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
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
