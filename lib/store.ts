import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from './api';

const SESSION_DURATION_MS = 180 * 24 * 60 * 60 * 1000;

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return false;
  }

  return Date.now() >= payload.exp * 1000;
};

interface AuthState {
  user: User | null;
  token: string | null;
  authAt: number | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      authAt: null,
      setAuth: (user, token) => set({ user, token, authAt: Date.now() }),
      clearAuth: () => set({ user: null, token: null, authAt: null }),
      isAuthenticated: () => {
        const { token, user, authAt } = get();

        if (!token || !user) {
          return false;
        }

        if (isTokenExpired(token)) {
          return false;
        }

        if (!authAt) {
          return false;
        }

        return Date.now() - authAt < SESSION_DURATION_MS;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state?.isAuthenticated()) {
          state?.clearAuth();
        }
      },
    }
  )
);
