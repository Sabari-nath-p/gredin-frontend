'use client';

import type { Socket } from 'socket.io-client';

let socket: Socket | null = null;

export async function connectSocket(token?: string): Promise<Socket> {
  if (typeof window === 'undefined') {
    throw new Error('Socket can only be used in the browser');
  }

  if (socket && socket.connected) return socket;

  const mod = await import('socket.io-client');
  const io = mod.io ?? mod.default ?? mod;

  // Determine backend URL
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  socket = io(`${backendUrl}/chat`, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  }) as Socket;

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
