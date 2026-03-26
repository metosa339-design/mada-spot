'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Loader2, MessageSquare, Send, Building2, User, Shield,
  AlertTriangle, RefreshCw,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
interface ThreadParticipant {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface Thread {
  threadId: string;
  participants: ThreadParticipant[];
  establishment: { id: string; name: string } | null;
  lastMessage: string;
  lastDate: string;
  unreadCount: number;
  messageCount: number;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: ThreadParticipant;
  receiver: ThreadParticipant;
}

// ============================================================
// Main Component
// ============================================================
export default function GodModeMessaging() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [search, setSearch] = useState('');
  const [showIntervene, setShowIntervene] = useState(false);
  const [interveneContent, setInterveneContent] = useState('');
  const [interveneReason, setInterveneReason] = useState('');
  const [interveneLoading, setInterveneLoading] = useState(false);
  const [interveneTarget, setInterveneTarget] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Direct message (new conversation)
  const [showDirectMsg, setShowDirectMsg] = useState(false);
  const [directSearch, setDirectSearch] = useState('');
  const [directSearchResults, setDirectSearchResults] = useState<{ id: string; firstName: string; lastName: string; email: string | null; phone: string | null; userType: string | null }[]>([]);
  const [directSearchLoading, setDirectSearchLoading] = useState(false);
  const [directTarget, setDirectTarget] = useState<{ id: string; name: string } | null>(null);
  const [directContent, setDirectContent] = useState('');
  const [directReason, setDirectReason] = useState('');
  const [directSending, setDirectSending] = useState(false);
  const directSearchTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/messages?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const fetchMessages = async (thread: Thread) => {
    setMessagesLoading(true);
    setSelectedThread(thread);
    setShowIntervene(false);
    try {
      const res = await fetch(`/api/admin/messages?threadId=${encodeURIComponent(thread.threadId)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch { /* ignore */ }
    setMessagesLoading(false);
  };

  useEffect(() => {
    if (messages.length > 0) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleIntervene = async () => {
    if (!interveneContent.trim() || !interveneReason.trim() || !interveneTarget) return;
    setInterveneLoading(true);
    try {
      const parts = selectedThread?.threadId.split(':');
      const res = await fetch('/api/admin/messages/intervene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: interveneTarget,
          establishmentId: parts && parts[2] !== '__none__' ? parts[2] : null,
          content: interveneContent.trim(),
          reason: interveneReason.trim(),
        }),
      });
      if (res.ok) {
        setInterveneContent('');
        setInterveneReason('');
        setShowIntervene(false);
        // Refresh messages
        if (selectedThread) fetchMessages(selectedThread);
      }
    } catch { /* ignore */ }
    setInterveneLoading(false);
  };

  // Direct message: search users
  const handleDirectSearch = (query: string) => {
    setDirectSearch(query);
    if (directSearchTimeout.current) clearTimeout(directSearchTimeout.current);
    if (query.length < 2) { setDirectSearchResults([]); return; }
    directSearchTimeout.current = setTimeout(async () => {
      setDirectSearchLoading(true);
      try {
        const res = await fetch(`/api/admin/impersonate?search=${encodeURIComponent(query)}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setDirectSearchResults(data.users || []);
        }
      } catch { /* ignore */ }
      setDirectSearchLoading(false);
    }, 400);
  };

  const handleDirectSend = async () => {
    if (!directTarget || !directContent.trim() || !directReason.trim()) return;
    setDirectSending(true);
    try {
      const res = await fetch('/api/admin/messages/intervene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: directTarget.id,
          content: directContent.trim(),
          reason: directReason.trim(),
        }),
      });
      if (res.ok) {
        setShowDirectMsg(false);
        setDirectTarget(null);
        setDirectContent('');
        setDirectReason('');
        setDirectSearch('');
        setDirectSearchResults([]);
        fetchThreads();
      }
    } catch { /* ignore */ }
    setDirectSending(false);
  };

  const participantName = (p: ThreadParticipant) =>
    `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email;

  const timeAgo = (date: string): string => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'maintenant';
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
        <Shield className="w-5 h-5 text-red-400 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-red-400">Mode God — Intervention Admin</p>
          <p className="text-[10px] text-gray-500">Chaque intervention est enregistree dans l&apos;audit log. Une raison est obligatoire.</p>
        </div>
      </div>

      <div className="flex gap-4 h-[550px]">
        {/* Thread list */}
        <div className="w-80 flex-shrink-0 bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#1e1e2e]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher conversation..."
                className="w-full pl-9 pr-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-500" /></div>
            ) : threads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Aucune conversation</p>
              </div>
            ) : (
              threads.map(thread => (
                <button
                  key={thread.threadId}
                  onClick={() => fetchMessages(thread)}
                  className={`w-full text-left p-3 border-b border-[#1e1e2e] hover:bg-[#1a1a2e] transition-colors ${
                    selectedThread?.threadId === thread.threadId ? 'bg-red-500/5 border-l-2 border-l-red-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#1e1e2e] flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {thread.participants.map(p => participantName(p)).join(' ↔ ')}
                      </p>
                      {thread.establishment && (
                        <p className="text-[10px] text-blue-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />{thread.establishment.name}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-600 truncate mt-0.5">{thread.lastMessage}</p>
                      <p className="text-[9px] text-gray-700">{timeAgo(thread.lastDate)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t border-[#1e1e2e] space-y-1">
            <button
              onClick={() => setShowDirectMsg(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-[#ff6b35] bg-[#ff6b35]/10 rounded-lg hover:bg-[#ff6b35]/20 font-medium"
            >
              <Send className="w-3.5 h-3.5" /> Nouveau message
            </button>
            <button onClick={fetchThreads} className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" /> Actualiser
            </button>
          </div>
        </div>

        {/* Messages panel */}
        <div className="flex-1 bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl flex flex-col overflow-hidden">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Selectionnez une conversation</p>
                <p className="text-[10px] text-gray-600 mt-1">Vous pourrez intervenir dans la conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-3 border-b border-[#1e1e2e] flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {selectedThread.participants.map(p => participantName(p)).join(' ↔ ')}
                  </p>
                  {selectedThread.establishment && (
                    <p className="text-[10px] text-blue-400">{selectedThread.establishment.name}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowIntervene(!showIntervene)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    showIntervene
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Intervenir
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-500" /></div>
                ) : (
                  messages.map(msg => {
                    const isAdmin = msg.content.startsWith('[Admin MadaSpot]');
                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? 'justify-center' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl p-3 ${
                          isAdmin
                            ? 'bg-red-500/10 border-2 border-red-500/30'
                            : 'bg-[#1a1a2e] border border-[#2e2e3e]'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-semibold ${isAdmin ? 'text-red-400' : 'text-[#ff6b35]'}`}>
                              {isAdmin ? 'Admin MadaSpot' : participantName(msg.sender)}
                            </span>
                            <span className="text-[9px] text-gray-600">
                              {new Date(msg.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300">{isAdmin ? msg.content.replace('[Admin MadaSpot] ', '') : msg.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Intervene form */}
              {showIntervene && (
                <div className="p-4 border-t-2 border-red-500/20 bg-red-500/5 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-red-400">
                    <Shield className="w-4 h-4" />
                    <span className="font-semibold">Intervention Admin</span>
                  </div>

                  {/* Target selection */}
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Envoyer a :</label>
                    <div className="flex gap-2">
                      {selectedThread.participants.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setInterveneTarget(p.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            interveneTarget === p.id
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-[#080810] border border-[#1e1e2e] text-gray-400'
                          }`}
                        >
                          {participantName(p)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={interveneReason}
                    onChange={(e) => setInterveneReason(e.target.value)}
                    placeholder="Raison de l'intervention (obligatoire)..."
                    className="w-full p-2.5 bg-[#080810] border border-red-500/20 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/40"
                  />

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={interveneContent}
                      onChange={(e) => setInterveneContent(e.target.value)}
                      placeholder="Message admin..."
                      className="flex-1 p-2.5 bg-[#080810] border border-red-500/20 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/40"
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleIntervene(); } }}
                    />
                    <button
                      onClick={handleIntervene}
                      disabled={interveneLoading || !interveneContent.trim() || !interveneReason.trim() || !interveneTarget}
                      className="px-4 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {interveneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Direct Message Modal */}
      {showDirectMsg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowDirectMsg(false)}
        >
          <div
            className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-[#ff6b35]" />
              <h3 className="text-lg font-bold text-white">Nouveau message admin</h3>
            </div>

            {/* User search */}
            {!directTarget ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={directSearch}
                    onChange={e => handleDirectSearch(e.target.value)}
                    placeholder="Rechercher un utilisateur..."
                    className="w-full pl-10 pr-4 py-3 bg-[#080810] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35] text-sm"
                    autoFocus
                  />
                </div>
                {directSearchLoading && (
                  <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-500" /></div>
                )}
                {directSearchResults.length > 0 && (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {directSearchResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => setDirectTarget({ id: u.id, name: `${u.firstName} ${u.lastName}` })}
                        className="w-full text-left p-3 bg-[#080810] border border-[#1e1e2e] rounded-xl hover:border-[#ff6b35]/50 transition-colors"
                      >
                        <p className="text-sm font-medium text-white">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500">{u.email || u.phone || 'N/A'} {u.userType ? `· ${u.userType}` : '· Voyageur'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected user */}
                <div className="flex items-center justify-between p-3 bg-[#080810] rounded-xl">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#ff6b35]" />
                    <span className="text-sm font-medium text-white">{directTarget.name}</span>
                  </div>
                  <button onClick={() => setDirectTarget(null)} className="text-xs text-gray-500 hover:text-white">Changer</button>
                </div>

                <textarea
                  value={directContent}
                  onChange={e => setDirectContent(e.target.value)}
                  placeholder="Votre message..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#080810] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35] text-sm resize-none"
                />

                <input
                  type="text"
                  value={directReason}
                  onChange={e => setDirectReason(e.target.value)}
                  placeholder="Raison audit (obligatoire)..."
                  className="w-full px-4 py-3 bg-[#080810] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35] text-sm"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDirectMsg(false)}
                    className="flex-1 py-3 bg-[#1e1e2e] text-gray-400 rounded-xl font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDirectSend}
                    disabled={!directContent.trim() || !directReason.trim() || directSending}
                    className="flex-1 py-3 bg-[#ff6b35] text-white rounded-xl font-medium disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {directSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Envoyer</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
