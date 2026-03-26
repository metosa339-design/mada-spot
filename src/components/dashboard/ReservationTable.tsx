'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Check, X, Clock, BedDouble, UtensilsCrossed, Users,
  Hash, Loader2, CalendarClock
} from 'lucide-react'
import type { RoomTypeColor } from '@/lib/data/room-type-colors'

interface CalBooking {
  id: string
  reference: string
  guestName: string
  guestPhone: string | null
  guestCount: number
  checkIn: string
  checkOut: string | null
  status: string
  totalPrice: number | null
  bookingType: string
  roomTypeId: string | null
}

interface RoomType {
  id: string
  name: string
}

interface ReservationTableProps {
  bookings: CalBooking[]
  roomTypes: RoomType[]
  colorMap: Map<string, RoomTypeColor>
  onStatusChange: (bookingId: string, status: 'confirmed' | 'cancelled') => Promise<void>
  onReschedule: (bookingId: string, checkIn: string, checkOut?: string) => Promise<void>
  actionLoading: string | null
}

type TabKey = 'all' | 'today' | 'pending' | 'confirmed'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'today', label: "Aujourd'hui" },
  { key: 'pending', label: 'En attente' },
  { key: 'confirmed', label: 'Confirmées' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  no_show: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
  completed: 'Terminée',
  no_show: 'No-show',
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

export default function ReservationTable({
  bookings, roomTypes, colorMap, onStatusChange, onReschedule, actionLoading,
}: ReservationTableProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [proposedDate, setProposedDate] = useState('')
  const [proposedCheckOut, setProposedCheckOut] = useState('')

  const today = new Date()

  const roomTypeNameMap = new Map<string, string>()
  roomTypes.forEach(rt => roomTypeNameMap.set(rt.id, rt.name))

  const handleReschedule = useCallback(async (bookingId: string) => {
    if (!proposedDate) return
    await onReschedule(bookingId, proposedDate, proposedCheckOut || undefined)
    setRescheduleId(null)
    setProposedDate('')
    setProposedCheckOut('')
  }, [proposedDate, proposedCheckOut, onReschedule])

  const filtered = bookings.filter(b => {
    if (activeTab === 'today') return isSameDay(new Date(b.checkIn), today)
    if (activeTab === 'pending') return b.status === 'pending'
    if (activeTab === 'confirmed') return b.status === 'confirmed'
    return true
  })

  const getRoomColor = (roomTypeId: string | null): RoomTypeColor | undefined => {
    if (!roomTypeId) return colorMap.get('__general__')
    return colorMap.get(roomTypeId)
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-2 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-cyan-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.key === 'pending' && bookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                {bookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="px-4 pb-2 text-xs text-gray-500">
        {filtered.length} réservation{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Booking rows */}
      <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((booking, i) => {
              const roomColor = getRoomColor(booking.roomTypeId)
              const roomName = booking.roomTypeId ? roomTypeNameMap.get(booking.roomTypeId) : null

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  className="p-4 hover:bg-white/[0.03] transition-colors"
                  style={roomColor ? { borderLeft: `4px solid ${roomColor.hex}` } : undefined}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      {booking.bookingType === 'hotel' ? <BedDouble className="w-5 h-5 text-cyan-400" /> :
                       booking.bookingType === 'restaurant' ? <UtensilsCrossed className="w-5 h-5 text-cyan-400" /> :
                       <Users className="w-5 h-5 text-cyan-400" />}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold text-white truncate">{booking.guestName}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          STATUS_COLORS[booking.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {STATUS_LABELS[booking.status] || booking.status}
                        </span>
                        {roomName && roomColor && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${roomColor.bg} ${roomColor.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${roomColor.dot}`} />
                            {roomName}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(booking.checkIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {booking.checkOut && ` — ${new Date(booking.checkOut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {booking.guestCount} pers.
                        </span>
                        {booking.totalPrice != null && (
                          <span className="font-medium text-white">
                            {booking.totalPrice.toLocaleString('fr-FR')} MGA
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-gray-500">
                          <Hash className="w-3 h-3" />
                          {booking.reference}
                        </span>
                      </div>
                    </div>

                    {/* Actions for pending */}
                    {booking.status === 'pending' && (
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => onStatusChange(booking.id, 'confirmed')}
                          disabled={actionLoading === booking.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {actionLoading === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Accepter
                        </button>
                        <button
                          onClick={() => setRescheduleId(rescheduleId === booking.id ? null : booking.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors"
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                          Proposer
                        </button>
                        <button
                          onClick={() => onStatusChange(booking.id, 'cancelled')}
                          disabled={actionLoading === booking.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {actionLoading === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reschedule form */}
                  <AnimatePresence>
                    {rescheduleId === booking.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl overflow-hidden"
                      >
                        <p className="text-xs text-blue-400 font-medium mb-2">Proposer une nouvelle date</p>
                        <div className="flex flex-wrap items-end gap-2">
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-1">Arrivée</label>
                            <input
                              type="date"
                              value={proposedDate}
                              onChange={e => setProposedDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500/50"
                            />
                          </div>
                          {booking.checkOut && (
                            <div>
                              <label className="text-[10px] text-gray-500 block mb-1">Départ</label>
                              <input
                                type="date"
                                value={proposedCheckOut}
                                onChange={e => setProposedCheckOut(e.target.value)}
                                min={proposedDate || new Date().toISOString().split('T')[0]}
                                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500/50"
                              />
                            </div>
                          )}
                          <button
                            onClick={() => handleReschedule(booking.id)}
                            disabled={!proposedDate || actionLoading === booking.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                          >
                            {actionLoading === booking.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CalendarClock className="w-3 h-3" />}
                            Envoyer
                          </button>
                          <button
                            onClick={() => { setRescheduleId(null); setProposedDate(''); setProposedCheckOut('') }}
                            className="px-3 py-1.5 text-gray-400 hover:text-white text-xs transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center"
            >
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Aucune réservation trouvée</p>
              <p className="text-xs text-gray-600 mt-1">Les réservations apparaîtront ici</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
