'use client';

import type { Socket } from 'socket.io-client';

let socket: Socket | null = null;

function resolveBackendUrl() {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '';
  }

  const explicitUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (explicitUrl) {
    try {
      const parsedUrl = new URL(explicitUrl);
      const isExplicitLocalhost = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
      const isDifferentHost = parsedUrl.hostname !== window.location.hostname;

      if (!isLocalhost && isExplicitLocalhost) {
        return window.location.origin;
      }

      // In production, prefer same-origin unless API host is the same host.
      if (!isLocalhost && isDifferentHost) {
        return window.location.origin;
      }

      return parsedUrl.origin;
    } catch {
      return isLocalhost ? `${window.location.protocol}//${window.location.hostname}:3001` : window.location.origin;
    }
  }

  return isLocalhost ? `${window.location.protocol}//${window.location.hostname}:3001` : window.location.origin;
}

export async function connectSocket(token?: string): Promise<Socket> {
  if (typeof window === 'undefined') {
    throw new Error('Socket can only be used in the browser');
  }

  if (socket && socket.connected) return socket;

  const mod = await import('socket.io-client');
  const io = mod.io ?? mod.default ?? mod;

  const backendUrl = resolveBackendUrl();

  socket = io(`${backendUrl}/chat`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  }) as Socket;

  console.log(`🔌 Socket connecting to: ${backendUrl}/chat`);

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
