'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageSquare, Send, Plus, Trash2, Loader2,
  Wallet, ChevronDown, Bot, User, Sparkles,
  PanelLeftClose, PanelLeftOpen, Database, X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import {
  chatApi, tradeAccountApi,
  type ChatSession, type ChatMessage as ChatMsg, type TradeAccount,
} from '@/lib/api';
import toast from 'react-hot-toast';

// ── Simple markdown-ish renderer (bold, lists, code) ──
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    key++;
    if (line.startsWith('### ')) {
      elements.push(<h4 key={key} className="text-sm font-bold text-gray-light mt-3 mb-1">{processInline(line.slice(4))}</h4>);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={key} className="text-base font-bold text-gray-light mt-3 mb-1">{processInline(line.slice(3))}</h3>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={key} className="flex gap-2 ml-1">
          <span className="text-green-primary mt-0.5 flex-shrink-0">•</span>
          <span>{processInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        elements.push(
          <div key={key} className="flex gap-2 ml-1">
            <span className="text-green-primary font-semibold flex-shrink-0">{match[1]}.</span>
            <span>{processInline(match[2])}</span>
          </div>
        );
      }
    } else if (line.trim() === '') {
      elements.push(<div key={key} className="h-2" />);
    } else {
      elements.push(<p key={key}>{processInline(line)}</p>);
    }
  }
  return elements;
}

function processInline(text: string): React.ReactNode {
  // Process **bold**, `code`, and *italic*
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let k = 0;

  while (remaining.length > 0) {
    k++;
    // Bold
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    // Code
    const codeMatch = remaining.match(/`(.*?)`/);

    // Pick the earliest match
    type MatchInfo = { idx: number; len: number; node: React.ReactNode };
    const candidates: MatchInfo[] = [];

    if (boldMatch && boldMatch.index !== undefined) {
      candidates.push({
        idx: boldMatch.index,
        len: boldMatch[0].length,
        node: <strong key={`b${k}`} className="font-semibold text-gray-light">{boldMatch[1]}</strong>,
      });
    }
    if (codeMatch && codeMatch.index !== undefined) {
      candidates.push({
        idx: codeMatch.index,
        len: codeMatch[0].length,
        node: <code key={`c${k}`} className="px-1.5 py-0.5 rounded bg-dark-bg/80 text-green-primary text-[11px] font-mono">{codeMatch[1]}</code>,
      });
    }

    if (candidates.length === 0) {
      parts.push(remaining);
      break;
    }

    candidates.sort((a, b) => a.idx - b.idx);
    const best = candidates[0];

    if (best.idx > 0) {
      parts.push(remaining.slice(0, best.idx));
    }
    parts.push(best.node);
    remaining = remaining.slice(best.idx + best.len);
  }

  return <>{parts}</>;
}

export default function ChatPage() {
  const token = useAuthStore((state) => state.token);

  // Sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  // Input
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // Accounts
  const [accounts, setAccounts] = useState<TradeAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  // UI
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Load sessions & accounts ──
  useEffect(() => {
    if (!token) return;
    loadSessions();
    loadAccounts();
  }, [token]);

  const loadSessions = async () => {
    if (!token) return;
    setLoadingSessions(true);
    try {
      const res = await chatApi.getSessions(token, 1, 50);
      setSessions(res.data);
    } catch { /* ignore */ } finally {
      setLoadingSessions(false);
    }
  };

  const loadAccounts = async () => {
    if (!token) return;
    try {
      const res = await tradeAccountApi.getAll(token);
      setAccounts(res.data);
    } catch { /* ignore */ }
  };

  // ── Load messages for a session ──
  const loadSession = useCallback(async (sessionId: string) => {
    if (!token) return;
    setActiveSessionId(sessionId);
    setLoadingMessages(true);
    try {
      const res = await chatApi.getSession(token, sessionId);
      setMessages(res.data.messages || []);
      if (res.data.tradeAccountId) {
        setSelectedAccountId(res.data.tradeAccountId);
      }
    } catch {
      toast.error('Failed to load chat');
    } finally {
      setLoadingMessages(false);
    }
  }, [token]);

  // ── Scroll to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── New chat ──
  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setSelectedAccountId('');
    inputRef.current?.focus();
  };

  // ── Send message ──
  const handleSend = async () => {
    if (!token || !input.trim() || sending) return;

    const userText = input.trim();
    setInput('');
    setSending(true);

    // Optimistic: show user message immediately
    const tempUserMsg: ChatMsg = {
      id: `temp-${Date.now()}`,
      sessionId: activeSessionId || '',
      role: 'USER',
      content: userText,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await chatApi.sendMessage(token, {
        message: userText,
        sessionId: activeSessionId || undefined,
        tradeAccountId: selectedAccountId || undefined,
      });

      const { sessionId, userMessage, assistantMessage } = res.data;

      // Replace temp user message with real one & add assistant reply
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        userMessage,
        assistantMessage,
      ]);

      // If this was a new chat, set the session and refresh sidebar
      if (!activeSessionId) {
        setActiveSessionId(sessionId);
        loadSessions();
      } else {
        // Update session in sidebar (move to top)
        setSessions(prev => {
          const updated = prev.map(s =>
            s.id === sessionId ? { ...s, updatedAt: new Date().toISOString() } : s
          );
          return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send message');
      // Remove optimistic message
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      setInput(userText);
    } finally {
      setSending(false);
    }
  };

  // ── Delete session ──
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await chatApi.deleteSession(token, sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        startNewChat();
      }
      toast.success('Chat deleted');
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  // ── Keyboard handling ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="flex h-[calc(100vh-57px)] -m-4 lg:-m-8 overflow-hidden">

      {/* ════════ SIDEBAR ════════ */}
      <div
        className={`${
          sidebarOpen ? 'w-[280px]' : 'w-0'
        } flex-shrink-0 transition-all duration-300 overflow-hidden border-r border-dark-border bg-dark-card/50`}
      >
        <div className="w-[280px] h-full flex flex-col">
          {/* Sidebar header */}
          <div className="p-3 border-b border-dark-border">
            <button
              onClick={startNewChat}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-green-primary/30 text-green-primary hover:bg-green-primary/5 transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-gray-text animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MessageSquare className="w-8 h-8 text-gray-text/30 mx-auto mb-2" />
                <p className="text-xs text-gray-text">No conversations yet</p>
              </div>
            ) : (
              sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={`w-full group flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all ${
                    activeSessionId === session.id
                      ? 'bg-green-primary/10 border border-green-primary/20'
                      : 'hover:bg-dark-bg/60 border border-transparent'
                  }`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${
                    activeSessionId === session.id ? 'text-green-primary' : 'text-gray-text/50'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${
                      activeSessionId === session.id ? 'text-green-primary' : 'text-gray-light'
                    }`}>
                      {session.title}
                    </p>
                    {session.tradeAccount && (
                      <p className="text-[10px] text-gray-text truncate">
                        {session.tradeAccount.accountName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-text hover:text-red-primary transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ════════ MAIN CHAT AREA ════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Chat header ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-border bg-dark-card/30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-dark-bg/60 text-gray-text hover:text-gray-light transition-colors"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-primary/10 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-green-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-light">Trading AI Assistant</h2>
              <p className="text-[10px] text-gray-text">Powered by Gemini · Analyses your trade data</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Account Picker */}
            <div className="relative">
              <button
                onClick={() => setShowAccountPicker(!showAccountPicker)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  selectedAccountId
                    ? 'border-green-primary/30 bg-green-primary/5 text-green-primary'
                    : 'border-dark-border bg-dark-bg/50 text-gray-text hover:border-dark-border-hover'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">
                  {activeAccount ? activeAccount.accountName : 'All Accounts'}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showAccountPicker && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowAccountPicker(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden">
                    <button
                      onClick={() => { setSelectedAccountId(''); setShowAccountPicker(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-dark-bg/60 transition-colors ${
                        !selectedAccountId ? 'text-green-primary bg-green-primary/5' : 'text-gray-light'
                      }`}
                    >
                      <Database className="w-3.5 h-3.5 text-gray-text" />
                      All Accounts
                    </button>
                    {accounts.map(acc => (
                      <button
                        key={acc.id}
                        onClick={() => { setSelectedAccountId(acc.id); setShowAccountPicker(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-dark-bg/60 transition-colors ${
                          selectedAccountId === acc.id ? 'text-green-primary bg-green-primary/5' : 'text-gray-light'
                        }`}
                      >
                        <Wallet className="w-3.5 h-3.5 text-gray-text" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{acc.accountName}</p>
                          <p className="text-[10px] text-gray-text">{acc.brokerName} · {acc.marketSegment}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Messages area ── */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !loadingMessages ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <div className="w-20 h-20 bg-green-primary/5 rounded-3xl flex items-center justify-center mb-6 border border-green-primary/10">
                <Sparkles className="w-10 h-10 text-green-primary/60" />
              </div>
              <h3 className="text-lg font-bold text-gray-light mb-2">Trading AI Assistant</h3>
              <p className="text-sm text-gray-text max-w-md mb-8">
                Ask me anything about your trading performance. I can analyse your trades,
                calculate win rates, find patterns, and provide insights.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                {[
                  'What is my win rate this month?',
                  'Show my top 5 most profitable trades',
                  'Which instrument am I most profitable in?',
                  'How many open trades do I have?',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="text-left px-4 py-3 rounded-xl border border-dark-border hover:border-green-primary/30 hover:bg-green-primary/5 transition-all text-xs text-gray-text hover:text-gray-light"
                  >
                    &ldquo;{q}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          ) : loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-green-primary animate-spin" />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === 'USER' ? (
                    /* ── User bubble ── */
                    <div className="flex justify-end mb-4">
                      <div className="max-w-[80%] flex items-start gap-2.5">
                        <div className="bg-green-primary/10 border border-green-primary/20 rounded-2xl rounded-tr-md px-4 py-3">
                          <p className="text-sm text-gray-light whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <div className="w-7 h-7 bg-green-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5 text-green-primary" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── Assistant bubble ── */
                    <div className="flex justify-start mb-4">
                      <div className="max-w-[85%] flex items-start gap-2.5">
                        <div className="w-7 h-7 bg-dark-card border border-dark-border rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5 text-green-primary" />
                        </div>
                        <div className="space-y-2">
                          <div className="bg-dark-card/80 border border-dark-border/50 rounded-2xl rounded-tl-md px-4 py-3">
                            <div className="text-sm text-gray-text/90 space-y-1 leading-relaxed">
                              {renderMarkdown(msg.content)}
                            </div>
                          </div>
                          {msg.sqlQuery && (
                            <details className="group">
                              <summary className="flex items-center gap-1.5 text-[10px] text-gray-text/50 cursor-pointer hover:text-gray-text transition-colors ml-1">
                                <Database className="w-3 h-3" />
                                SQL query used
                              </summary>
                              <div className="mt-1 ml-1 p-2.5 rounded-lg bg-dark-bg/80 border border-dark-border/30">
                                <pre className="text-[10px] text-green-primary/70 font-mono whitespace-pre-wrap break-all">{msg.sqlQuery}</pre>
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 bg-dark-card border border-dark-border rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-green-primary" />
                    </div>
                    <div className="bg-dark-card/80 border border-dark-border/50 rounded-2xl rounded-tl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 text-green-primary animate-spin" />
                        <span className="text-xs text-gray-text">Analysing your data...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input bar ── */}
        <div className="border-t border-dark-border bg-dark-card/30 p-3">
          {selectedAccountId && activeAccount && (
            <div className="flex items-center gap-2 mb-2 ml-1">
              <span className="text-[10px] text-gray-text">Scoped to:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-primary/10 border border-green-primary/20 text-[10px] text-green-primary font-medium">
                <Wallet className="w-2.5 h-2.5" />
                {activeAccount.accountName}
                <button
                  onClick={() => setSelectedAccountId('')}
                  className="ml-0.5 hover:text-red-primary transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            </div>
          )}
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your trading performance..."
                rows={1}
                className="w-full resize-none bg-dark-bg/80 border border-dark-border rounded-xl px-4 py-3 pr-12 text-sm text-gray-light placeholder:text-gray-text/40 focus:outline-none focus:border-green-primary/50 transition-colors"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onInput={(e) => {
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="w-10 h-10 rounded-xl bg-green-primary text-dark-bg flex items-center justify-center hover:bg-green-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-text/30 mt-2">
            AI may make mistakes. Always verify data-driven insights.
          </p>
        </div>
      </div>
    </div>
  );
}
