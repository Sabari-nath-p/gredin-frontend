"use client";

import { useEffect, useState, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/lib/store';

export default function ChatWidget() {
  const { user, token } = useAuthStore();
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await connectSocket(token || undefined);
        socketRef.current = s;

        s.on('connect', () => { if (!mounted) return; setConnected(true); setStatus('connected'); });
        s.on('disconnect', () => { if (!mounted) return; setConnected(false); setStatus('disconnected'); });
        s.on('chat.status', (p: any) => { if (!mounted) return; setStatus(p.status); });
        s.on('chat.assistantMessage', (p: any) => {
          if (!mounted) return;
          const text = p?.assistant?.content ?? p?.assistant?.message ?? p?.assistant ?? '';
          setMessages(m => [...m, { role: 'assistant', text }]);
        });
        s.on('chat.error', (err: any) => { if (!mounted) return; setStatus('error'); setMessages(m => [...m, { role: 'assistant', text: err?.message || 'Error' }]); });
      } catch (err) {
        setStatus('error');
      }
    })();

    return () => { mounted = false; disconnectSocket(); };
  }, [token]);

  const send = () => {
    const s = getSocket();
    if (!s) return setStatus('not-connected');
    if (!input.trim()) return;

    const msg = input.trim();
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setInput('');
    s.emit('chat.send', { userId: user?.id, message: msg, sessionId: null, tradeAccountId: null });
    setStatus('sending');
  };

  return (
    <div className="fixed bottom-6 right-6 w-[360px] z-50">
      <div className="bg-dark-card border border-dark-border rounded-xl shadow-lg overflow-hidden">
        <div className="px-3 py-2 bg-dark-bg/60 border-b border-dark-border flex items-center justify-between">
          <div className="text-sm font-semibold">AI Chat</div>
          <div className="text-xs text-gray-text">{status}</div>
        </div>
        <div className="p-3 h-56 overflow-y-auto space-y-2">
          {messages.length === 0 && <div className="text-xs text-gray-text">Say something to the assistant…</div>}
          {messages.map((m, i) => (
            <div key={i} className={`p-2 rounded-md ${m.role === 'user' ? 'bg-green-primary/10 self-end text-right' : 'bg-dark-bg/20'}`}>
              <div className="text-sm">{m.text}</div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-dark-border flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="Ask about your trades"
            className="input flex-1 text-sm"
          />
          <button onClick={send} className="btn-primary px-3 py-2 text-sm">Send</button>
        </div>
      </div>
    </div>
  );
}
