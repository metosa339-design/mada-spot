'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Loader2, MessageSquare, Building2, User, RefreshCw,
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
export default function AdminSupportInbox() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const participantName = (p: ThreadParticipant) =>
    `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email;

  const timeAgo = (date: string): string => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'maintenant';
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  };

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Thread list */}
      <div className="w-80 flex-shrink-0 bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-[#1e1e2e]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ff6b35]/50"
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
                  selectedThread?.threadId === thread.threadId ? 'bg-[#1a1a2e]' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1e1e2e] flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium truncate">
                        {thread.participants.map(p => participantName(p)).join(' ↔ ')}
                      </p>
                      {thread.unreadCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-[#ff6b35] rounded-full text-[9px] font-bold text-white flex-shrink-0">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                    {thread.establishment && (
                      <p className="text-[10px] text-blue-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />{thread.establishment.name}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-600 truncate mt-0.5">{thread.lastMessage}</p>
                    <p className="text-[9px] text-gray-700 mt-0.5">{timeAgo(thread.lastDate)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-2 border-t border-[#1e1e2e]">
          <button onClick={fetchThreads} className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Actualiser
          </button>
        </div>
      </div>

      {/* Messages panel */}
      <div className="flex-1 bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl flex flex-col overflow-hidden">
        {!selectedThread ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Selectionnez une conversation</p>
              <p className="text-[10px] text-gray-600 mt-1">Vue lecture seule des messages entre utilisateurs</p>
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
              <span className="text-[10px] text-gray-600">{selectedThread.messageCount} messages</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-500" /></div>
              ) : messages.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">Aucun message</p>
              ) : (
                messages.map(msg => {
                  const isAdmin = msg.content.startsWith('[Admin MadaSpot]');
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-center' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl p-3 ${
                        isAdmin
                          ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                          : 'bg-[#1a1a2e] border border-[#2e2e3e]'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold" style={{ color: isAdmin ? '#ef4444' : '#ff6b35' }}>
                            {isAdmin ? 'Admin' : participantName(msg.sender)}
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
          </>
        )}
      </div>
    </div>
  );
}
