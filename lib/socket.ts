'use client';

import type { Socket } from 'socket.io-client';

let socket: Socket | null = null;

export async function connectSocket(token?: string): Promise<Socket> {
  if (typeof window === 'undefined') {
    throw new Error('Socket can only be used in the browser');
  }

  if (socket) return socket;

  const mod = await import('socket.io-client');
  const io = mod.io ?? mod.default ?? mod;

  socket = io(window.location.origin + '/chat', {
    auth: { token },
    transports: ['websocket'],
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
