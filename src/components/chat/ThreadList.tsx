'use client'

import { Search, Inbox } from 'lucide-react'
import type { Thread } from './types'

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return date.toLocaleDateString('fr-FR', { weekday: 'short' })
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

interface ThreadListProps {
  threads: Thread[]
  selectedThread: Thread | null
  searchQuery: string
  onSearchChange: (q: string) => void
  onSelectThread: (thread: Thread) => void
  emptyText: string
  emptySubtext: string
  hidden?: boolean
}

export function ThreadList({
  threads,
  selectedThread,
  searchQuery,
  onSearchChange,
  onSelectThread,
  emptyText,
  emptySubtext,
  hidden,
}: ThreadListProps) {
  const filtered = threads.filter(t =>
    t.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={`w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col flex-shrink-0 ${hidden ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length > 0 ? (
          filtered.map((thread) => (
            <button
              key={thread.id}
              onClick={() => onSelectThread(thread)}
              className={`w-full text-left p-4 flex items-start gap-3 transition-colors border-b border-white/5 ${
                selectedThread?.id === thread.id
                  ? 'bg-[#ff6b35]/10 border-l-2 border-l-[#ff6b35]'
                  : 'hover:bg-white/[0.03]'
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#ff6b35] to-pink-500 flex items-center justify-center flex-shrink-0">
                {thread.participantAvatar ? (
                  <img src={thread.participantAvatar} alt="" className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-bold">
                    {thread.participantName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm truncate ${thread.unreadCount > 0 ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>
                    {thread.participantName}
                  </p>
                  <span className="text-[10px] text-gray-500 flex-shrink-0">
                    {formatTime(thread.lastMessageAt)}
                  </span>
                </div>
                {thread.establishmentName && (
                  <p className="text-[10px] text-[#ff6b35] truncate">{thread.establishmentName}</p>
                )}
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className={`text-xs truncate ${thread.unreadCount > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
                    {thread.lastMessage}
                  </p>
                  {thread.unreadCount > 0 && (
                    <span className="flex-shrink-0 bg-[#ff6b35] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="p-8 text-center">
            <Inbox className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {searchQuery ? 'Aucun résultat' : emptyText}
            </p>
            <p className="text-xs text-gray-600 mt-1">{emptySubtext}</p>
          </div>
        )}
      </div>
    </div>
  )
}
