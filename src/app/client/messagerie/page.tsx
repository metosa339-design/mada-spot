'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Loader2 } from 'lucide-react'
import ChatInterface from '@/components/chat/ChatInterface'

export default function ClientMessageriePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadHint, setUnreadHint] = useState(0)

  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(d => {
        if (!d?.user) throw new Error()
        setUserId(d.user.id)
      })
      .catch(() => router.push('/login?redirect=/client/messagerie'))
      .finally(() => setLoading(false))
  }, [router])

  // Fetch thread count hint for subtitle
  useEffect(() => {
    if (!userId) return
    fetch('/api/dashboard/messages', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.threads) setUnreadHint(d.threads.filter((t: any) => t.unreadCount > 0).length)
      })
      .catch(() => {})
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    )
  }

  if (!userId) return null

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/client" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-[#ff6b35]" />
                Mes messages
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {unreadHint > 0
                  ? `${unreadHint} conversation${unreadHint > 1 ? 's' : ''} non lue${unreadHint > 1 ? 's' : ''}`
                  : 'Toutes vos conversations avec les prestataires'
                }
              </p>
            </div>
          </div>
        </div>

        <ChatInterface userId={userId} variant="client" />
      </div>
    </div>
  )
}
