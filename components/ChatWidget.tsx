"use client";

import { useEffect, useState, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/lib/store';

export default function ChatWidget() {
  const { user, token } = useAuthStore();
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string>('connecting');
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await connectSocket(token || undefined);
        socketRef.current = s;

        s.on('connect', () => {
          if (!mounted) return;
          setConnected(true);
          setStatus('connected');
          console.log('✓ Socket connected');
        });

        s.on('disconnect', () => {
          if (!mounted) return;
          setConnected(false);
          setStatus('disconnected');
          console.log('✗ Socket disconnected');
        });

        s.on('connect_error', (err: any) => {
          if (!mounted) return;
          setStatus('error');
          console.error('Socket error:', err);
        });

        s.on('chat.status', (p: any) => {
          if (!mounted) return;
          setStatus(p.status || 'idle');
          if (p.status === 'done') setLoading(false);
        });

        s.on('chat.assistantMessage', (p: any) => {
          if (!mounted) return;
          const text = p?.assistant?.content ?? p?.assistant?.message ?? p?.assistant ?? '';
          if (text) {
            setMessages(m => [...m, { role: 'assistant', text }]);
            setLoading(false);
          }
        });

        s.on('chat.error', (err: any) => {
          if (!mounted) return;
          setStatus('error');
          setLoading(false);
          const errMsg = err?.message || 'An error occurred';
          setMessages(m => [...m, { role: 'assistant', text: `⚠️ ${errMsg}` }]);
          console.error('Chat error:', errMsg);
        });
      } catch (err) {
        if (!mounted) return;
        setStatus('error');
        console.error('Connection failed:', err);
      }
    })();

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [token]);

  const send = () => {
    const s = getSocket();
    if (!s || !connected) {
      setStatus('not-connected');
      return;
    }
    if (!input.trim() || loading) return;

    const msg = input.trim();
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setInput('');
    setLoading(true);
    setStatus('sending');
    
    s.emit('chat.send', {
      userId: user?.id,
      message: msg,
      sessionId: null,
      tradeAccountId: null,
    });
  };

  const statusColor = {
    connected: 'bg-green-500',
    disconnected: 'bg-gray-500',
    error: 'bg-red-500',
    sending: 'bg-yellow-500',
    default: 'bg-blue-500',
  }[status] || 'bg-gray-500';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="w-[380px] bg-dark-card border border-dark-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-dark-bg/80 to-dark-bg/60 border-b border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
              <div className="text-sm font-semibold">AI Chat</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-lg"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-dark-bg/30">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-8">
                <div className="text-2xl mb-2">💬</div>
                <p>Start a conversation with the AI assistant</p>
                <p className="text-xs mt-2 text-gray-500">Ask about your trades or analytics</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    m.role === 'user'
                      ? 'bg-green-primary/20 text-green-primary border border-green-primary/30'
                      : 'bg-blue-primary/10 text-gray-100 border border-blue-primary/20'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-blue-primary/10 text-gray-100 px-3 py-2 rounded-lg text-sm border border-blue-primary/20">
                  <span className="animate-pulse">⏳ Processing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-dark-border bg-dark-bg/60 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={connected ? 'Ask something...' : 'Connecting...'}
              disabled={!connected || loading}
              className="flex-1 px-3 py-2 text-sm bg-dark-bg border border-dark-border rounded text-white placeholder-gray-500 focus:outline-none focus:border-green-primary disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!connected || loading || !input.trim()}
              className="px-4 py-2 text-sm bg-green-primary hover:bg-green-primary/90 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>

          {/* Status info */}
          {status && status !== 'connected' && (
            <div className="px-3 py-2 bg-dark-bg/80 border-t border-dark-border text-xs text-gray-400">
              Status: <span className="capitalize font-medium">{status}</span>
            </div>
          )}
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-green-primary hover:bg-green-primary/90 text-white rounded-full shadow-lg flex items-center justify-center text-lg font-semibold transition"
        >
          💬
        </button>
      )}
    </div>
  );
}
