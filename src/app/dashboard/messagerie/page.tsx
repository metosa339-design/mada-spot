'use client'

import { useEffect, useState } from 'react'
import ChatInterface from '@/components/chat/ChatInterface'

export default function MessageriePage() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) setUserId(d.user.id) })
      .catch(() => {})
  }, [])

  if (!userId) {
    return (
      <div className="max-w-7xl">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse mb-6" />
        <div className="bg-[#1a1a24] rounded-2xl h-[calc(100vh-200px)] animate-pulse" />
      </div>
    )
  }

  return <ChatInterface userId={userId} variant="dashboard" />
}
