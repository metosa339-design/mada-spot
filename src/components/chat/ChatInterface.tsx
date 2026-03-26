'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare, Send, Image as ImageIcon,
  Loader2, ArrowLeft, X
} from 'lucide-react'
import { useChatMessages } from './useChatMessages'
import { ThreadList } from './ThreadList'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { OnlineStatus } from './OnlineStatus'

interface ChatInterfaceProps {
  userId: string
  variant: 'dashboard' | 'client'
}

export default function ChatInterface({ userId, variant }: ChatInterfaceProps) {
  const {
    threads,
    messages,
    selectedThread,
    presence,
    searchQuery,
    setSearchQuery,
    newMessage,
    imagePreview,
    setImagePreview,
    loading,
    messagesLoading,
    sending,
    selectThread,
    deselectThread,
    sendMessage,
    handleInputChange,
    handleImageSelect,
  } = useChatMessages(userId)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageSelect(file)
    e.target.value = ''
  }

  const unreadCount = threads.filter(t => t.unreadCount > 0).length

  const emptyText = variant === 'dashboard' ? 'Aucune conversation' : 'Aucune conversation'
  const emptySubtext = variant === 'dashboard'
    ? 'Les messages des clients apparaîtront ici'
    : 'Vos échanges avec les prestataires apparaîtront ici'

  if (loading) {
    if (variant === 'dashboard') {
      return (
        <div className="max-w-7xl">
          <div className="h-8 w-48 bg-white/5 rounded animate-pulse mb-6" />
          <div className="bg-[#1a1a24] rounded-2xl h-[calc(100vh-200px)] animate-pulse" />
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    )
  }

  const chatHeight = variant === 'dashboard'
    ? 'calc(100vh - 240px)'
    : 'calc(100vh - 220px)'

  return (
    <div className={variant === 'dashboard' ? 'space-y-6 max-w-7xl' : ''}>
      {/* Header */}
      {variant === 'dashboard' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Messagerie</h1>
          <p className="text-gray-400 mt-1">
            {unreadCount} conversation{unreadCount !== 1 ? 's' : ''} non lue{unreadCount !== 1 ? 's' : ''}
          </p>
        </motion.div>
      )}

      {/* Chat container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden flex"
        style={{ height: chatHeight, minHeight: '500px' }}
      >
        {/* Thread list */}
        <ThreadList
          threads={threads}
          selectedThread={selectedThread}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectThread={selectThread}
          emptyText={emptyText}
          emptySubtext={emptySubtext}
          hidden={!!selectedThread}
        />

        {/* Chat panel */}
        <div className={`flex-1 flex flex-col ${selectedThread ? 'flex' : 'hidden md:flex'}`}>
          {selectedThread ? (
            <>
              {/* Thread header */}
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <button onClick={deselectThread} className="md:hidden p-1 hover:bg-white/10 rounded-lg">
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b35] to-pink-500 flex items-center justify-center flex-shrink-0">
                  {selectedThread.participantAvatar ? (
                    <img src={selectedThread.participantAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {selectedThread.participantName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{selectedThread.participantName}</p>
                  {selectedThread.establishmentName && (
                    <p className="text-xs text-[#ff6b35] truncate">{selectedThread.establishmentName}</p>
                  )}
                </div>
                <div className="ml-auto">
                  <OnlineStatus presence={presence} />
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 text-[#ff6b35] animate-spin" />
                  </div>
                ) : messages.length > 0 ? (
                  <>
                    {messages.map((msg, i) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isMe={msg.senderId !== selectedThread.participantId}
                        index={i}
                      />
                    ))}
                    {presence?.typing && (
                      <TypingIndicator name={selectedThread.participantName.split(' ')[0]} />
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Début de la conversation</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Image preview */}
              {imagePreview && (
                <div className="px-4 py-2 border-t border-white/5">
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="preview" className="h-20 rounded-lg" />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* Input area */}
              <div className="p-4 border-t border-white/10">
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-colors"
                    title="Envoyer une photo"
                  >
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Écrire un message..."
                      rows={1}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/50 resize-none"
                      style={{ minHeight: '42px', maxHeight: '120px' }}
                    />
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && !imagePreview) || sending}
                    className="p-2.5 bg-[#ff6b35] hover:bg-[#ff6b35]/80 disabled:bg-white/5 disabled:text-gray-600 text-white rounded-xl transition-colors"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {variant === 'dashboard' ? 'Messagerie' : 'Messages'}
                </h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Sélectionnez une conversation pour afficher les messages
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
