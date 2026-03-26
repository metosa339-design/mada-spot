'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Ticket, Loader2, ChevronDown, ChevronUp, Send,
  Clock, AlertCircle, CheckCircle, MessageSquare, Filter
} from 'lucide-react'

interface TicketSummary {
  id: string
  reference: string
  subject: string
  email: string
  category: string
  status: string
  priority: string
  assignedTo: string | null
  createdAt: string
  user: { id: string; firstName: string; lastName: string; email: string | null; avatar: string | null } | null
  _count: { replies: number }
}

interface TicketReply {
  id: string
  authorId: string | null
  authorType: string
  content: string
  createdAt: string
}

interface TicketDetail extends TicketSummary {
  description: string
  replies: TicketReply[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Ouvert', color: 'bg-blue-500/20 text-blue-400' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-amber-500/20 text-amber-400' },
  WAITING_USER: { label: 'Attente', color: 'bg-purple-500/20 text-purple-400' },
  RESOLVED: { label: 'Résolu', color: 'bg-emerald-500/20 text-emerald-400' },
  CLOSED: { label: 'Fermé', color: 'bg-gray-500/20 text-gray-400' },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Faible', color: 'bg-gray-500/20 text-gray-400' },
  MEDIUM: { label: 'Moyen', color: 'bg-blue-500/20 text-blue-400' },
  HIGH: { label: 'Haute', color: 'bg-orange-500/20 text-orange-400' },
  URGENT: { label: 'Urgent', color: 'bg-red-500/20 text-red-400' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}j`
}

export default function SupportTicketManager() {
  const [tickets, setTickets] = useState<TicketSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<TicketDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [setWaiting, setSetWaiting] = useState(false)
  const [replying, setReplying] = useState(false)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (priorityFilter) params.set('priority', priorityFilter)
      params.set('limit', '50')
      const res = await fetch(`/api/admin/support/tickets?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
        setTotal(data.total || 0)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [statusFilter, priorityFilter])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const openDetail = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    setDetailLoading(true)
    setReplyContent('')
    setSetWaiting(false)
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setDetail(data.ticket)
      }
    } catch { /* ignore */ }
    finally { setDetailLoading(false) }
  }

  const updateTicket = async (id: string, updates: Record<string, string>) => {
    await fetch(`/api/admin/support/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    })
    await fetchTickets()
    if (expandedId === id) await openDetail(id)
  }

  const sendReply = async () => {
    if (!expandedId || !replyContent.trim()) return
    setReplying(true)
    try {
      await fetch(`/api/admin/support/tickets/${expandedId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: replyContent, setWaiting }),
      })
      setReplyContent('')
      setSetWaiting(false)
      await openDetail(expandedId)
      await fetchTickets()
    } catch { /* ignore */ }
    finally { setReplying(false) }
  }

  const stats = {
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ouverts', value: stats.open, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: AlertCircle },
          { label: 'En cours', value: stats.inProgress, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
          { label: 'Résolus', value: stats.resolved, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`${kpi.bg} border border-[#1e1e2e] rounded-xl p-4`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{kpi.label}</p>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
              <kpi.icon className={`w-8 h-8 ${kpi.color} opacity-40`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-500" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-gray-300 text-sm focus:outline-none focus:border-[#ff6b35]">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-3 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-gray-300 text-sm focus:outline-none focus:border-[#ff6b35]">
          <option value="">Toutes les priorités</option>
          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-500">{total} tickets</span>
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#ff6b35] animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Ticket className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucun ticket</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              {/* Ticket row */}
              <button
                onClick={() => openDetail(ticket.id)}
                className="w-full bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-3 hover:border-[#ff6b35]/20 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <Ticket className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500">{ticket.reference}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_CONFIG[ticket.status]?.color || ''}`}>
                        {STATUS_CONFIG[ticket.status]?.label || ticket.status}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${PRIORITY_CONFIG[ticket.priority]?.color || ''}`}>
                        {PRIORITY_CONFIG[ticket.priority]?.label || ticket.priority}
                      </span>
                    </div>
                    <p className="text-sm text-white truncate mt-0.5">{ticket.subject}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-600 mt-0.5">
                      <span>{ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : ticket.email}</span>
                      <span>·</span>
                      <span>{timeAgo(ticket.createdAt)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{ticket._count.replies}</span>
                    </div>
                  </div>
                  {expandedId === ticket.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </button>

              {/* Expanded detail */}
              <AnimatePresence>
                {expandedId === ticket.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#080810] border border-[#1e1e2e] border-t-0 rounded-b-xl p-4 space-y-4">
                      {detailLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#ff6b35] animate-spin" /></div>
                      ) : detail ? (
                        <>
                          {/* Description */}
                          <div className="p-3 bg-[#0c0c16] rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Description</p>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{detail.description}</p>
                          </div>

                          {/* Status/Priority controls */}
                          <div className="flex gap-3">
                            <select
                              value={detail.status}
                              onChange={e => updateTicket(detail.id, { status: e.target.value })}
                              className="px-3 py-1.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-lg text-gray-300 text-xs focus:outline-none focus:border-[#ff6b35]"
                            >
                              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                            <select
                              value={detail.priority}
                              onChange={e => updateTicket(detail.id, { priority: e.target.value })}
                              className="px-3 py-1.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-lg text-gray-300 text-xs focus:outline-none focus:border-[#ff6b35]"
                            >
                              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          </div>

                          {/* Replies thread */}
                          {detail.replies.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-500">Réponses ({detail.replies.length})</p>
                              {detail.replies.map(reply => (
                                <div
                                  key={reply.id}
                                  className={`p-3 rounded-lg text-sm ${
                                    reply.authorType === 'admin'
                                      ? 'bg-[#ff6b35]/10 border border-[#ff6b35]/20 ml-6'
                                      : 'bg-[#0c0c16] border border-[#1e1e2e]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${reply.authorType === 'admin' ? 'bg-[#ff6b35]/20 text-[#ff6b35]' : 'bg-cyan-500/20 text-cyan-400'}`}>
                                      {reply.authorType === 'admin' ? 'Admin' : 'Utilisateur'}
                                    </span>
                                    <span className="text-[10px] text-gray-600">{timeAgo(reply.createdAt)}</span>
                                  </div>
                                  <p className="text-gray-300 whitespace-pre-wrap">{reply.content}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply form */}
                          <div className="space-y-2">
                            <textarea
                              value={replyContent}
                              onChange={e => setReplyContent(e.target.value)}
                              placeholder="Écrire une réponse..."
                              rows={3}
                              className="w-full px-3 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-lg text-white text-sm resize-none focus:outline-none focus:border-[#ff6b35] placeholder-gray-600"
                            />
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={setWaiting}
                                  onChange={e => setSetWaiting(e.target.checked)}
                                  className="rounded border-[#1e1e2e] bg-[#080810] text-[#ff6b35] focus:ring-[#ff6b35]"
                                />
                                Mettre en attente utilisateur
                              </label>
                              <button
                                onClick={sendReply}
                                disabled={!replyContent.trim() || replying}
                                className="flex items-center gap-2 px-4 py-2 bg-[#ff6b35] text-white rounded-lg text-sm hover:bg-[#ff6b35]/90 disabled:opacity-50 transition-colors"
                              >
                                {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Envoyer
                              </button>
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
