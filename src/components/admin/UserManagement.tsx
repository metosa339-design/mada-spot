'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, ShieldBan, UserX, UserCheck, MessageSquare,
  TrendingUp, Hotel, UtensilsCrossed, MapPin, Briefcase,
  Plane, Loader2, Ban, CheckCircle, Send
} from 'lucide-react'

interface UserItem {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  avatar: string | null
  role: string
  userType: string | null
  isActive: boolean
  isBanned: boolean
  banReason: string | null
  createdAt: string
  lastLoginAt: string | null
  loyaltyPoints: number
  _count: {
    bookings: number
    sentMessages: number
    establishmentReviews: number
    verificationDocuments: number
  }
  verifiedDocsCount: number
}

interface Stats {
  total: number
  voyageurs: number
  hotels: number
  restaurants: number
  attractions: number
  providers: number
  banned: number
  newThisWeek: number
}

const TYPE_TABS = [
  { id: 'all', label: 'Tous', icon: Users },
  { id: 'voyageur', label: 'Voyageurs', icon: Plane },
  { id: 'HOTEL', label: 'Hôtels', icon: Hotel },
  { id: 'RESTAURANT', label: 'Restaurants', icon: UtensilsCrossed },
  { id: 'ATTRACTION', label: 'Attractions', icon: MapPin },
  { id: 'PROVIDER', label: 'Prestataires', icon: Briefcase },
]

const getTabCount = (id: string, stats: Stats) => {
  switch (id) {
    case 'all': return stats.total
    case 'voyageur': return stats.voyageurs
    case 'HOTEL': return stats.hotels
    case 'RESTAURANT': return stats.restaurants
    case 'ATTRACTION': return stats.attractions
    case 'PROVIDER': return stats.providers
    default: return 0
  }
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, voyageurs: 0, hotels: 0, restaurants: 0, attractions: 0, providers: 0, banned: 0, newThisWeek: 0 })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showBanModal, setShowBanModal] = useState<UserItem | null>(null)
  const [banReason, setBanReason] = useState('')
  const [showMessageModal, setShowMessageModal] = useState<UserItem | null>(null)
  const [messageContent, setMessageContent] = useState('')
  const [messageReason, setMessageReason] = useState('')
  const [messageSending, setMessageSending] = useState(false)
  const limit = 50

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab !== 'all') params.set('userType', activeTab)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      params.set('limit', String(limit))
      params.set('offset', String(offset))

      const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        setStats(data.stats || stats)
        setTotal(data.total || 0)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [activeTab, statusFilter, search, offset])

  useEffect(() => { setOffset(0) }, [activeTab, statusFilter, search])
  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleAction = async (userId: string, action: 'ban' | 'unban' | 'deactivate' | 'activate', reason?: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, action, reason }),
      })
      if (res.ok) {
        setShowBanModal(null)
        setBanReason('')
        fetchUsers()
      }
    } catch { /* ignore */ }
    finally { setActionLoading(null) }
  }

  const handleSendMessage = async () => {
    if (!showMessageModal || !messageContent.trim() || !messageReason.trim()) return
    setMessageSending(true)
    try {
      const res = await fetch('/api/admin/messages/intervene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: showMessageModal.id,
          content: messageContent.trim(),
          reason: messageReason.trim(),
        }),
      })
      if (res.ok) {
        setShowMessageModal(null)
        setMessageContent('')
        setMessageReason('')
      }
    } catch { /* ignore */ }
    finally { setMessageSending(false) }
  }

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Utilisateurs', value: stats.total, icon: Users, color: 'text-blue-400' },
          { label: 'Nouveaux (7j)', value: stats.newThisWeek, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Bannis', value: stats.banned, icon: ShieldBan, color: 'text-red-400' },
          { label: 'Prestataires', value: stats.hotels + stats.restaurants + stats.attractions + stats.providers, icon: Briefcase, color: 'text-[#ff6b35]' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TYPE_TABS.map(tab => {
          const count = getTabCount(tab.id, stats)
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#ff6b35] text-white'
                  : 'bg-[#0c0c16] text-gray-400 border border-[#1e1e2e] hover:border-[#ff6b35]/50'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-[#1e1e2e]'
              }`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Search + Status Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35] text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-gray-300 text-sm focus:outline-none focus:border-[#ff6b35]"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="banned">Bannis</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      {/* User List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#ff6b35] animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-[#0c0c16] border rounded-xl p-4 transition-all ${
                user.isBanned
                  ? 'border-red-500/30 bg-red-500/5'
                  : !user.isActive
                  ? 'border-gray-600/30 opacity-60'
                  : 'border-[#1e1e2e] hover:border-[#ff6b35]/30'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b35]/30 to-orange-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-[#ff6b35]">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">{user.firstName} {user.lastName}</span>
                    {user.isBanned && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">Banni</span>
                    )}
                    {!user.isActive && !user.isBanned && (
                      <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">Inactif</span>
                    )}
                    {user.userType && (
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full text-xs">
                        {user.userType === 'HOTEL' ? 'Hôtel' : user.userType === 'RESTAURANT' ? 'Restaurant' : user.userType === 'ATTRACTION' ? 'Attraction' : user.userType === 'PROVIDER' ? 'Prestataire' : user.userType}
                      </span>
                    )}
                    {!user.userType && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">Voyageur</span>}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{user.email || user.phone || 'N/A'}</p>
                </div>

                {/* Stats */}
                <div className="hidden lg:flex items-center gap-6 text-xs text-gray-500">
                  <div className="text-center">
                    <p className="text-white font-medium">{user._count.bookings}</p>
                    <p>Résa.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">{user._count.establishmentReviews}</p>
                    <p>Avis</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">{user._count.sentMessages}</p>
                    <p>Msgs</p>
                  </div>
                  {user.userType && (
                    <div className="text-center">
                      <p className={`font-medium ${user.verifiedDocsCount >= 2 ? 'text-emerald-400' : user.verifiedDocsCount > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                        {user.verifiedDocsCount}/4
                      </p>
                      <p>Docs</p>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="hidden md:block text-right text-xs text-gray-500 flex-shrink-0">
                  <p>Inscrit le</p>
                  <p className="text-gray-400">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setShowMessageModal(user)}
                    className="p-2 rounded-lg text-gray-400 hover:text-[#ff6b35] hover:bg-[#1e1e2e] transition-colors"
                    title="Envoyer un message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  {user.isBanned ? (
                    <button
                      onClick={() => handleAction(user.id, 'unban')}
                      disabled={actionLoading === user.id}
                      className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Débannir"
                    >
                      {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  ) : (
                    <button
                      onClick={() => { setShowBanModal(user); setBanReason('') }}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Bannir"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                  {!user.isActive ? (
                    <button
                      onClick={() => handleAction(user.id, 'activate')}
                      disabled={actionLoading === user.id}
                      className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Activer"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(user.id, 'deactivate')}
                      disabled={actionLoading === user.id}
                      className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors"
                      title="Désactiver"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Ban reason */}
              {user.isBanned && user.banReason && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400">Raison : {user.banReason}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-lg text-gray-400 disabled:opacity-30 hover:border-[#ff6b35]/50 text-sm"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-400">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-lg text-gray-400 disabled:opacity-30 hover:border-[#ff6b35]/50 text-sm"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Ban Modal */}
      <AnimatePresence>
        {showBanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowBanModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-2">Bannir l&apos;utilisateur</h3>
              <p className="text-sm text-gray-400 mb-4">
                {showBanModal.firstName} {showBanModal.lastName} ({showBanModal.email || showBanModal.phone})
              </p>
              <textarea
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                placeholder="Raison du bannissement (obligatoire)..."
                rows={3}
                className="w-full px-4 py-3 bg-[#080810] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-500 text-sm resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBanModal(null)}
                  className="flex-1 py-3 bg-[#1e1e2e] text-gray-400 rounded-xl font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleAction(showBanModal.id, 'ban', banReason)}
                  disabled={!banReason.trim() || actionLoading === showBanModal.id}
                  className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-xl font-medium disabled:opacity-40"
                >
                  {actionLoading === showBanModal.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmer le ban'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Message Modal */}
      <AnimatePresence>
        {showMessageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowMessageModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-2">Envoyer un message</h3>
              <p className="text-sm text-gray-400 mb-4">
                À : {showMessageModal.firstName} {showMessageModal.lastName}
              </p>
              <div className="space-y-4 mb-4">
                <textarea
                  value={messageContent}
                  onChange={e => setMessageContent(e.target.value)}
                  placeholder="Votre message..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#080810] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35] text-sm resize-none"
                />
                <input
                  type="text"
                  value={messageReason}
                  onChange={e => setMessageReason(e.target.value)}
                  placeholder="Raison audit (obligatoire)..."
                  className="w-full px-4 py-3 bg-[#080810] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35] text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMessageModal(null)}
                  className="flex-1 py-3 bg-[#1e1e2e] text-gray-400 rounded-xl font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || !messageReason.trim() || messageSending}
                  className="flex-1 py-3 bg-[#ff6b35] text-white rounded-xl font-medium disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {messageSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Envoyer</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
