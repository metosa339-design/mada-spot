'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMessageChannel } from '@/hooks/useMessageChannel'
import type { Thread, ChatMessage, PresenceState } from './types'

const POLL_INTERVAL = 3_000
const POLL_INTERVAL_HIDDEN = 15_000
const THREAD_POLL_INTERVAL = 10_000
const PRESENCE_INTERVAL = 15_000
const TYPING_DEBOUNCE = 2_000

export function useChatMessages(userId: string) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [presence, setPresence] = useState<PresenceState | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const selectedThreadRef = useRef<Thread | null>(null)
  const messagesPollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const threadsPollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const presenceRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSentRef = useRef(0)

  useEffect(() => { selectedThreadRef.current = selectedThread }, [selectedThread])

  // BroadcastChannel: instant refresh on new message
  const { broadcast } = useMessageChannel((event) => {
    if (event.type === 'new-message' || event.type === 'message-sent') {
      const t = selectedThreadRef.current
      if (t) fetchMessages(t.id)
      fetchThreads()
    } else if (event.type === 'messages-read') {
      const t = selectedThreadRef.current
      if (t) fetchMessages(t.id)
    }
  })

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/messages', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setThreads(data.threads || [])
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  // Fetch messages for a thread
  const fetchMessages = useCallback(async (threadId: string) => {
    try {
      const res = await fetch(`/api/dashboard/messages?threadId=${threadId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const msgs = data.messages || []
        setMessages(prev => {
          if (JSON.stringify(prev.map(m => m.id)) !== JSON.stringify(msgs.map((m: ChatMessage) => m.id))) {
            return msgs
          }
          // Update readAt on existing messages
          const updated = prev.map((m: ChatMessage) => {
            const newM = msgs.find((nm: ChatMessage) => nm.id === m.id)
            return newM && newM.readAt !== m.readAt ? { ...m, readAt: newM.readAt } : m
          })
          return updated
        })
        if (data.presence) setPresence(data.presence)
      }
    } catch { /* ignore */ }
  }, [])

  // Send presence heartbeat
  const sendHeartbeat = useCallback(async () => {
    const t = selectedThreadRef.current
    if (!t) return
    try {
      const res = await fetch('/api/messages/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ partnerId: t.participantId, threadId: t.id }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.partner) setPresence(data.partner)
      }
    } catch { /* ignore */ }
  }, [])

  // Send typing indicator (debounced)
  const sendTyping = useCallback((isTyping: boolean) => {
    const t = selectedThreadRef.current
    if (!t) return

    const now = Date.now()
    if (isTyping && now - lastTypingSentRef.current < TYPING_DEBOUNCE) return
    lastTypingSentRef.current = now

    fetch('/api/messages/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ threadId: t.id, isTyping }),
    }).catch(() => {})

    // Auto-clear typing after 5s
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        fetch('/api/messages/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ threadId: selectedThreadRef.current?.id, isTyping: false }),
        }).catch(() => {})
      }, 5000)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchThreads()
    return () => {
      if (messagesPollingRef.current) clearInterval(messagesPollingRef.current)
      if (threadsPollingRef.current) clearInterval(threadsPollingRef.current)
      if (presenceRef.current) clearInterval(presenceRef.current)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [fetchThreads])

  // Thread list polling
  useEffect(() => {
    if (threadsPollingRef.current) clearInterval(threadsPollingRef.current)
    threadsPollingRef.current = setInterval(fetchThreads, THREAD_POLL_INTERVAL)
    return () => { if (threadsPollingRef.current) clearInterval(threadsPollingRef.current) }
  }, [fetchThreads])

  // Message polling when thread selected (visibility-aware)
  useEffect(() => {
    if (messagesPollingRef.current) clearInterval(messagesPollingRef.current)
    if (presenceRef.current) clearInterval(presenceRef.current)

    if (selectedThread) {
      const startPolling = (interval: number) => {
        if (messagesPollingRef.current) clearInterval(messagesPollingRef.current)
        messagesPollingRef.current = setInterval(() => {
          const t = selectedThreadRef.current
          if (t) fetchMessages(t.id)
        }, interval)
      }

      startPolling(POLL_INTERVAL)

      // Presence heartbeat
      sendHeartbeat()
      presenceRef.current = setInterval(sendHeartbeat, PRESENCE_INTERVAL)

      // Visibility-aware
      const handleVisibility = () => {
        if (document.hidden) {
          startPolling(POLL_INTERVAL_HIDDEN)
        } else {
          const t = selectedThreadRef.current
          if (t) fetchMessages(t.id)
          startPolling(POLL_INTERVAL)
        }
      }
      document.addEventListener('visibilitychange', handleVisibility)

      return () => {
        if (messagesPollingRef.current) clearInterval(messagesPollingRef.current)
        if (presenceRef.current) clearInterval(presenceRef.current)
        document.removeEventListener('visibilitychange', handleVisibility)
      }
    }

    return undefined
  }, [selectedThread, fetchMessages, sendHeartbeat])

  // Select a thread
  const selectThread = useCallback(async (thread: Thread) => {
    setSelectedThread(thread)
    setMessagesLoading(true)
    setMessages([])
    setPresence(null)
    try {
      const res = await fetch(`/api/dashboard/messages?threadId=${thread.id}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        if (data.presence) setPresence(data.presence)
      }
      setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, unreadCount: 0 } : t))
    } catch { /* ignore */ }
    finally { setMessagesLoading(false) }
  }, [])

  // Send a message
  const sendMsg = useCallback(async () => {
    const content = imagePreview
      ? `[IMAGE]${imagePreview}[/IMAGE]${newMessage.trim() ? '\n' + newMessage.trim() : ''}`
      : newMessage.trim()
    if (!content || !selectedThread || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/dashboard/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ threadId: selectedThread.id, content }),
      })
      if (res.ok) {
        const data = await res.json()
        const sentMsg: ChatMessage = data.message || {
          id: Date.now().toString(),
          senderId: userId,
          content,
          isRead: false,
          readAt: null,
          createdAt: new Date().toISOString(),
        }
        setMessages(prev => [...prev, sentMsg])
        setThreads(prev =>
          prev.map(t =>
            t.id === selectedThread.id
              ? { ...t, lastMessage: content.slice(0, 80), lastMessageAt: new Date().toISOString() }
              : t
          )
        )
        setNewMessage('')
        setImagePreview(null)
        sendTyping(false)
        broadcast({ type: 'message-sent', threadId: selectedThread.id })
      }
    } catch { /* ignore */ }
    finally { setSending(false) }
  }, [newMessage, selectedThread, sending, imagePreview, userId, broadcast, sendTyping])

  // Handle input changes (with typing indicator)
  const handleInputChange = useCallback((value: string) => {
    setNewMessage(value)
    if (value.trim()) sendTyping(true)
  }, [sendTyping])

  // Handle image selection
  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  // Deselect thread
  const deselectThread = useCallback(() => {
    setSelectedThread(null)
    setMessages([])
    setPresence(null)
  }, [])

  return {
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
    sendMessage: sendMsg,
    handleInputChange,
    handleImageSelect,
  }
}
