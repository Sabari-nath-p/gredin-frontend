// API Service for SSR and Client-side requests
import axios, { AxiosInstance } from 'axios';

const handleUnauthorizedClientResponse = () => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('auth-storage');

  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
};

// Server-side API client (for SSR)
export const createServerApiClient = (token?: string): AxiosInstance => {
  const baseURL = process.env.BACKEND_URL || 'http://localhost:3000/api';

  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
};

// Client-side API client
export const createClientApiClient = (token?: string): AxiosInstance => {
  const client = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;

      if (status === 401) {
        handleUnauthorizedClientResponse();
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Types
export interface SendOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface TradeAccount {
  id: string;
  userId: string;
  accountName: string;
  brokerName: string;
  marketSegment: string;
  currencyCode: string;
  initialBalance: number;
  currentBalance: number;
  accountType: string;
  isActive: boolean;
  logTemplateId?: string | null;
  mt5Login?: string | null;
  mt5Server?: string | null;
  lastSyncTime?: string | null;
  logTemplate?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTradeAccountRequest {
  accountName: string;
  brokerName: string;
  marketSegment: 'STOCK' | 'AUCTION' | 'FUTURES' | 'OPTIONS' | 'FOREX' | 'CRYPTO' | 'COMMODITIES';
  currencyCode?: string;
  initialBalance: number;
  accountType: 'DEMO' | 'LIVE' | 'FUNDED';
  mt5Login?: string;
  mt5Password?: string;
  mt5Server?: string;
}

export interface UpdateTradeAccountRequest {
  accountName?: string;
  brokerName?: string;
  isActive?: boolean;
}

// Log Template Types
export type FieldType = 'TEXT' | 'LONG_TEXT' | 'CHECKBOX' | 'IMAGE' | 'MULTIPLE_CHOICE' | 'SCORECARD' | 'SCORED_CHOICE';

export interface ScorecardOption {
  label: string;
  score: number; // 0-100
}

export interface ScorecardConfig {
  weight?: number; // optional; when omitted for all questions, backend auto-distributes to 100%
  options: ScorecardOption[];
}

export interface LogTemplateField {
  id: string;
  templateId: string;
  fieldName: string;
  fieldType: FieldType;
  fieldOrder: number;
  placeholder: string | null;
  defaultValue: string | null;
  fieldOptions: string[];
  scorecard?: ScorecardConfig | null;
}

export interface LogTemplate {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  fields: LogTemplateField[];
  accounts?: TradeAccount[];
  _count?: { accounts: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateFieldRequest {
  fieldName: string;
  fieldType: FieldType;
  fieldOrder: number;
  placeholder?: string;
  defaultValue?: string;
  fieldOptions?: string[];
  scorecard?: ScorecardConfig;
}

export interface CreateLogTemplateRequest {
  name: string;
  description?: string;
  fields: CreateTemplateFieldRequest[];
}

export interface UpdateTemplateFieldRequest {
  id?: string;
  fieldName?: string;
  fieldType?: FieldType;
  fieldOrder?: number;
  placeholder?: string;
  defaultValue?: string;
  fieldOptions?: string[];
  scorecard?: ScorecardConfig;
}

export interface UpdateLogTemplateRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  fields?: UpdateTemplateFieldRequest[];
}

export interface TradeFieldValue {
  id: string;
  tradeEntryId: string;
  fieldId: string;
  textValue: string | null;
  booleanValue: boolean | null;
  imageUrl: string | null;
  selectedOption?: string | null;
  selectedScore?: number | null;
  questionWeight?: number | null;
  contribution?: number | null;
  field?: LogTemplateField;
}

export interface TradeFieldValueRequest {
  fieldId: string;
  textValue?: string;
  booleanValue?: boolean;
  imageUrl?: string;
}

export interface TradeEntry {
  id: string;
  tradeAccountId: string;
  entryDateTime: string;
  instrument: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number | null;
  positionSize: number | null;
  stopLossAmount: number;
  takeProfitAmount: number;
  status: 'OPEN' | 'CLOSED';
  result: 'PROFIT' | 'LOSS' | 'BREAK_EVEN' | null;
  realisedProfitLoss: number | null;
  serviceCharge: number;
  notes: string | null;
  tradeScore?: number | null;
  fieldValues?: TradeFieldValue[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTradeEntryRequest {
  tradeAccountId: string;
  entryDateTime: string;
  instrument: string;
  direction: 'BUY' | 'SELL';
  entryPrice?: number;
  positionSize?: number;
  stopLossAmount: number;
  takeProfitAmount: number;
  status?: 'OPEN' | 'CLOSED';
  result?: 'PROFIT' | 'LOSS' | 'BREAK_EVEN';
  realisedProfitLoss?: number;
  serviceCharge?: number;
  notes?: string;
  fieldValues?: TradeFieldValueRequest[];
}

export interface UpdateTradeEntryRequest {
  instrument?: string;
  entryDateTime?: string;
  entryPrice?: number;
  positionSize?: number;
  stopLossAmount?: number;
  takeProfitAmount?: number;
  notes?: string;
  fieldValues?: TradeFieldValueRequest[];
}

export interface CloseTradeRequest {
  result: 'PROFIT' | 'LOSS' | 'BREAK_EVEN';
  realisedProfitLoss: number;
  serviceCharge?: number;
  fieldValues?: TradeFieldValueRequest[];
}

export interface TradeStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  totalProfit: number;
  totalLoss: number;
  netProfitLoss: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
}

// Auth API
export const authApi = {
  sendOtp: async (data: SendOtpRequest, isClient = true) => {
    const api = isClient ? createClientApiClient() : createServerApiClient();
    return api.post('/auth/send-otp', data);
  },

  verifyOtp: async (data: VerifyOtpRequest, isClient = true) => {
    const api = isClient ? createClientApiClient() : createServerApiClient();
    return api.post<AuthResponse>('/auth/verify-otp', data);
  },
};

// User API
export const userApi = {
  getProfile: async (token: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.get<User>('/users/profile');
  },

  updateProfile: async (token: string, data: UpdateProfileRequest, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.put<User>('/users/profile', data);
  },
};

// Trade Account API
export const tradeAccountApi = {
  getAll: async (token: string, page = 1, limit = 100, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    const res = await api.get<PaginatedResponse<TradeAccount>>(`/trade-accounts?page=${page}&limit=${limit}`);
    // Return compatible format - data is the array, meta is available
    return { data: res.data.data, meta: res.data.meta };
  },

  getById: async (token: string, id: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.get<TradeAccount>(`/trade-accounts/${id}`);
  },

  create: async (token: string, data: CreateTradeAccountRequest, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.post<TradeAccount>('/trade-accounts', data);
  },

  update: async (token: string, id: string, data: UpdateTradeAccountRequest, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.put<TradeAccount>(`/trade-accounts/${id}`, data);
  },

  delete: async (token: string, id: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.delete(`/trade-accounts/${id}`);
  },
};

// Trade Entry API
export const tradeEntryApi = {
  getByAccount: async (token: string, accountId: string, page = 1, limit = 500, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    const res = await api.get<PaginatedResponse<TradeEntry>>(`/trade-entries/account/${accountId}?page=${page}&limit=${limit}`);
    // Return compatible format - data is the array, meta is available
    return { data: res.data.data, meta: res.data.meta };
  },

  getStats: async (token: string, accountId: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.get<TradeStats>(`/trade-entries/account/${accountId}/stats`);
  },

  getById: async (token: string, id: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.get<TradeEntry>(`/trade-entries/${id}`);
  },

  create: async (token: string, data: CreateTradeEntryRequest, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.post<TradeEntry>('/trade-entries', data);
  },

  update: async (token: string, id: string, data: UpdateTradeEntryRequest, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.put<TradeEntry>(`/trade-entries/${id}`, data);
  },

  close: async (token: string, id: string, data: CloseTradeRequest, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.put<TradeEntry>(`/trade-entries/${id}/close`, data);
  },

  delete: async (token: string, id: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.delete(`/trade-entries/${id}`);
  },
};

// Log Template API
export const logTemplateApi = {
  getAll: async (token: string, page = 1, limit = 20, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    const res = await api.get<PaginatedResponse<LogTemplate>>(`/log-templates?page=${page}&limit=${limit}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  getById: async (token: string, id: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.get<LogTemplate>(`/log-templates/${id}`);
  },

  create: async (token: string, data: CreateLogTemplateRequest, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.post<LogTemplate>('/log-templates', data);
  },

  update: async (token: string, id: string, data: UpdateLogTemplateRequest, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.put<LogTemplate>(`/log-templates/${id}`, data);
  },

  delete: async (token: string, id: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.delete(`/log-templates/${id}`);
  },

  assignToAccount: async (token: string, templateId: string, accountId: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.put(`/log-templates/${templateId}/assign/${accountId}`);
  },

  unassignFromAccount: async (token: string, accountId: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.delete(`/log-templates/account/${accountId}/template`);
  },

  getTemplateForAccount: async (token: string, accountId: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.get<LogTemplate | null>(`/log-templates/account/${accountId}/template`);
  },
};

// MT5 Sync API
export const mt5SyncApi = {
  linkAccount: async (token: string, accountId: string, data: { mt5Login: string; mt5Password: string; mt5Server: string }, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.post(`/mt5/link/${accountId}`, data);
  },

  unlinkAccount: async (token: string, accountId: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.delete(`/mt5/link/${accountId}`);
  },

  syncAccount: async (token: string, accountId: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.post<{ added: number; message: string }>(`/mt5/sync/${accountId}`);
  }
};

// Upload API
export const uploadApi = {
  uploadImage: async (token: string, file: File, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string | null; message: string }>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Chat / AI Agent Types ───

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sqlQuery?: string | null;
  sqlResult?: string | null;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  tradeAccountId: string | null;
  tradeAccount?: { id: string; accountName: string; brokerName: string } | null;
  messages?: ChatMessage[];
  _count?: { messages: number };
  createdAt: string;
  updatedAt: string;
}

export interface SendChatMessageRequest {
  message: string;
  sessionId?: string;
  tradeAccountId?: string;
}

export interface SendChatMessageResponse {
  sessionId: string;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

// ─── Admin Types ───

export interface AdminOverview {
  users: {
    total: number;
    active: number;
    inactive: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    byRole: { role: string; count: number }[];
    byProvider: { provider: string; count: number }[];
  };
  accounts: {
    total: number;
    byType: { type: string; count: number }[];
    bySegment: { segment: string; count: number }[];
    totalCurrentBalance: number;
    totalInitialBalance: number;
  };
  trades: {
    total: number;
    open: number;
    closed: number;
    winningTrades: number;
    losingTrades: number;
    breakEvenTrades: number;
    winRate: number;
    netProfitLoss: number;
    totalGrossProfit: number;
    totalGrossLoss: number;
    profitFactor: number;
  };
  engagement: {
    totalTemplates: number;
    totalChatSessions: number;
    totalChatMessages: number;
  };
  recentSignups: AdminUserListItem[];
}

export interface AdminGrowthPoint {
  date: string;
  newUsers: number;
  trades: number;
  netPL: number;
}

export interface AdminUserListItem {
  id: string;
  name: string | null;
  email: string;
  role: string;
  authProvider: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { tradeAccounts: number; logTemplates: number; chatSessions: number };
}

export interface AdminUserDetail {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    authProvider: string;
    googleId: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    totalAccounts: number;
    totalTemplates: number;
    totalChatSessions: number;
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
    winningTrades: number;
    losingTrades: number;
    breakEvenTrades: number;
    winRate: number;
    netProfitLoss: number;
  };
  tradeAccounts: (TradeAccount & { _count?: { tradeEntries: number } })[];
  recentTrades: (TradeEntry & { tradeAccount?: { accountName: string; brokerName: string } })[];
}

export interface AdminUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'SUPER_ADMIN' | 'USER';
  status?: 'active' | 'inactive';
  sort?: 'newest' | 'oldest' | 'name';
}

// Admin API
export const adminApi = {
  getOverview: async (token: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.get<AdminOverview>('/admin/overview');
  },

  getGrowth: async (token: string, days = 30, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.get<AdminGrowthPoint[]>(`/admin/growth?days=${days}`);
  },

  getUsers: async (token: string, query: AdminUsersQuery = {}, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.role) params.set('role', query.role);
    if (query.status) params.set('status', query.status);
    if (query.sort) params.set('sort', query.sort);
    const res = await api.get<PaginatedResponse<AdminUserListItem>>(`/admin/users?${params.toString()}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  getUserDetail: async (token: string, id: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.get<AdminUserDetail>(`/admin/users/${id}`);
  },

  setUserStatus: async (token: string, id: string, isActive: boolean, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.put<User>(`/admin/users/${id}/status`, { isActive });
  },

  setUserRole: async (token: string, id: string, role: 'SUPER_ADMIN' | 'USER', isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.put<User>(`/admin/users/${id}/role`, { role });
  },
};

// Chat API
export const chatApi = {
  getSessions: async (token: string, page = 1, limit = 20, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    const res = await api.get<PaginatedResponse<ChatSession>>(`/chat/sessions?page=${page}&limit=${limit}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  getSession: async (token: string, sessionId: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.get<ChatSession>(`/chat/sessions/${sessionId}`);
  },

  sendMessage: async (token: string, data: SendChatMessageRequest, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.post<SendChatMessageResponse>('/chat/send', data);
  },

  updateTitle: async (token: string, sessionId: string, title: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.put(`/chat/sessions/${sessionId}/title`, { title });
  },

  deleteSession: async (token: string, sessionId: string, isClient = true) => {
    const api = isClient ? createClientApiClient(token) : createServerApiClient(token);
    return api.delete(`/chat/sessions/${sessionId}`);
  },
};
