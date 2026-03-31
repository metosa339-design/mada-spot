'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Lock, X, Phone,
  MessageCircle, Users, Calendar, Hash, Loader2, BedDouble,
  Check, Plus, Ban
} from 'lucide-react'
import ReservationTable from '@/components/dashboard/ReservationTable'
import RoomTypeLegend from '@/components/dashboard/RoomTypeLegend'
import { buildRoomTypeColorMap } from '@/lib/data/room-type-colors'

// ----- Types -----
interface RoomType {
  id: string
  name: string
  capacity: number
  pricePerNight: number
  isAvailable: boolean
}

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

interface EstInfo {
  id: string
  name: string
  type: string
}

// ----- Constants -----
const ACCENT = '#0891b2'
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/80',
  confirmed: 'bg-cyan-600',
  completed: 'bg-blue-500',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  completed: 'Terminée',
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

// ----- Main Component -----
export default function CalendrierPage() {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [bookings, setBookings] = useState<CalBooking[]>([])
  const [blockedDates, setBlockedDates] = useState<Record<string, string | null>>({})
  const [establishment, setEstablishment] = useState<EstInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<CalBooking | null>(null)
  const [blockingDate, setBlockingDate] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ dateStr: string; roomTypeId: string | null; x: number; y: number } | null>(null)

  // Quick-add booking modal state
  const [quickAdd, setQuickAdd] = useState<{ dateStr: string; roomTypeId: string | null } | null>(null)
  const [qaName, setQaName] = useState('')
  const [qaPhone, setQaPhone] = useState('')
  const [qaGuests, setQaGuests] = useState(1)
  const [qaCheckOut, setQaCheckOut] = useState('')
  const [qaRoomTypeId, setQaRoomTypeId] = useState<string | null>(null)
  const [qaLoading, setQaLoading] = useState(false)
  const [qaError, setQaError] = useState('')

  const [tableActionLoading, setTableActionLoading] = useState<string | null>(null)

  const daysInMonth = getDaysInMonth(year, month)

  const roomTypeColorMap = useMemo(() => buildRoomTypeColorMap(roomTypes), [roomTypes])

  const fetchCalendar = useCallback(async () => {
    setLoading(true)
    try {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
      const res = await fetch(`/api/dashboard/calendar?month=${monthStr}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setRoomTypes(data.roomTypes || [])
        setBookings(data.bookings || [])
        setBlockedDates(data.blockedDates || {})
        if (data.establishment) setEstablishment(data.establishment)
      }
    } catch { /* */ } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchCalendar() }, [fetchCalendar])

  // Scroll to today on mount
  useEffect(() => {
    if (!loading && scrollRef.current) {
      const todayCol = scrollRef.current.querySelector('[data-today="true"]')
      if (todayCol) {
        todayCol.scrollIntoView({ inline: 'center', behavior: 'smooth' })
      }
    }
  }, [loading])

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextMenu])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Quick block/unblock a date
  const toggleBlock = async (dateStr: string) => {
    if (!establishment || blockingDate) return
    setBlockingDate(true)
    setContextMenu(null)
    const isBlocked = dateStr in blockedDates
    try {
      if (isBlocked) {
        await fetch('/api/dashboard/availability', {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ establishmentId: establishment.id, date: dateStr }),
        })
      } else {
        await fetch('/api/dashboard/availability', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ establishmentId: establishment.id, date: dateStr, isBlocked: true }),
        })
      }
      fetchCalendar()
    } catch { /* */ } finally {
      setBlockingDate(false)
    }
  }

  // Accept / Refuse booking from modal
  const handleBookingAction = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/dashboard/reservations', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      })
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b))
        setSelectedBooking(prev => prev ? { ...prev, status } : null)
      }
    } catch { /* */ } finally {
      setActionLoading(false)
    }
  }

  // Quick-add booking
  const openQuickAdd = (dateStr: string, roomTypeId: string | null) => {
    setContextMenu(null)
    setQuickAdd({ dateStr, roomTypeId })
    setQaName('')
    setQaPhone('')
    setQaGuests(1)
    setQaCheckOut('')
    setQaRoomTypeId(roomTypeId)
    setQaError('')
  }

  // Table: status change (accept / refuse)
  const handleTableStatusChange = useCallback(async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    setTableActionLoading(bookingId)
    try {
      const res = await fetch('/api/dashboard/reservations', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      })
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b))
      }
    } catch { /* */ } finally {
      setTableActionLoading(null)
    }
  }, [])

  // Table: reschedule
  const handleTableReschedule = useCallback(async (bookingId: string, checkIn: string, checkOut?: string) => {
    setTableActionLoading(bookingId)
    try {
      const res = await fetch('/api/dashboard/reservations', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          status: 'rescheduled',
          proposedDate: checkIn,
          proposedCheckOut: checkOut,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setBookings(prev =>
          prev.map(b => b.id === bookingId ? {
            ...b,
            status: 'pending',
            checkIn: data.booking.checkIn,
            checkOut: data.booking.checkOut,
          } : b)
        )
      }
    } catch { /* */ } finally {
      setTableActionLoading(null)
    }
  }, [])

  const submitQuickAdd = async () => {
    if (!qaName.trim()) { setQaError('Le nom du client est requis'); return }
    if (!quickAdd) return
    setQaLoading(true)
    setQaError('')
    try {
      const res = await fetch('/api/dashboard/reservations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: qaName.trim(),
          guestPhone: qaPhone || undefined,
          guestCount: qaGuests,
          checkIn: quickAdd.dateStr,
          checkOut: qaCheckOut || undefined,
          roomTypeId: qaRoomTypeId || undefined,
        }),
      })
      if (res.ok) {
        setQuickAdd(null)
        fetchCalendar()
      } else {
        const data = await res.json().catch(() => ({}))
        setQaError(data.error || 'Erreur lors de la création')
      }
    } catch {
      setQaError('Erreur réseau')
    } finally {
      setQaLoading(false)
    }
  }

  // Handle empty cell click — show context menu
  const handleEmptyCellClick = (e: React.MouseEvent, dateStr: string, roomTypeId: string | null) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setContextMenu({
      dateStr,
      roomTypeId,
      x: rect.left,
      y: rect.bottom + 4,
    })
  }

  // Get bookings for a specific row
  const getRowBookings = (roomTypeId: string | null) => {
    return bookings.filter(b => {
      if (roomTypeId === null) return !b.roomTypeId
      return b.roomTypeId === roomTypeId
    })
  }

  // Check if a booking spans a given day
  const getBookingForDay = (booking: CalBooking, day: number): 'start' | 'middle' | 'end' | 'single' | null => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const checkIn = booking.checkIn.split('T')[0]
    const checkOut = booking.checkOut?.split('T')[0] || checkIn

    if (dateStr < checkIn || dateStr > checkOut) return null
    if (checkIn === checkOut) return 'single'
    if (dateStr === checkIn) return 'start'
    if (dateStr === checkOut) return 'end'
    return 'middle'
  }

  // Build the rows
  const rows: { id: string | null; label: string; capacity?: number; price?: number }[] =
    roomTypes.length > 0
      ? roomTypes.map(r => ({ id: r.id, label: r.name, capacity: r.capacity, price: r.pricePerNight }))
      : [{ id: null, label: 'Général' }]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
      </div>
    )
  }

  if (!establishment) {
    return (
      <div className="bg-white border border-white/10 rounded-2xl p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Aucun établissement trouvé</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 sm:w-7 h-6 sm:h-7" style={{ color: ACCENT }} />
            Calendrier
          </h1>
          <p className="text-gray-400 text-sm mt-1">{establishment.name}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-gray-900">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base sm:text-lg font-semibold text-gray-900 min-w-[140px] sm:min-w-[160px] text-center capitalize">
            {MONTHS_FR[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-gray-900">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="bg-white border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto" ref={scrollRef}>
          <div style={{ minWidth: `${daysInMonth * 48 + 180}px` }}>
            {/* Day headers */}
            <div className="flex border-b border-white/10 sticky top-0 bg-white z-10">
              <div className="w-[180px] flex-shrink-0 p-3 border-r border-white/10">
                <span className="text-xs text-gray-500 font-medium">Chambres</span>
              </div>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isToday = dateStr === todayStr
                const dayOfWeek = new Date(year, month, day).getDay()
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                const isBlocked = dateStr in blockedDates

                return (
                  <div
                    key={day}
                    data-today={isToday || undefined}
                    className={`w-12 flex-shrink-0 text-center py-2 border-r border-white/5 ${
                      isToday ? 'bg-cyan-500/10' : isWeekend ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <div className={`text-[10px] font-medium ${isToday ? 'text-cyan-400' : 'text-gray-500'}`}>
                      {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][dayOfWeek]}
                    </div>
                    <div className={`text-sm font-bold ${isToday ? 'text-cyan-400' : isBlocked ? 'text-red-400' : 'text-gray-300'}`}>
                      {day}
                    </div>
                    {isBlocked && <Lock className="w-2.5 h-2.5 text-red-400 mx-auto" />}
                  </div>
                )
              })}
            </div>

            {/* Room rows */}
            {rows.map((row) => {
              const rowBookings = getRowBookings(row.id)

              return (
                <div key={row.id || 'general'} className="flex border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  {/* Room label */}
                  <div className="w-[180px] flex-shrink-0 p-3 border-r border-white/10 flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{row.label}</p>
                      {row.capacity && (
                        <p className="text-[10px] text-gray-500">
                          {row.capacity} pers. {row.price ? `· ${row.price.toLocaleString('fr-FR')} Ar` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const isToday = dateStr === todayStr
                    const isPast = new Date(dateStr) < new Date(todayStr)
                    const isBlocked = dateStr in blockedDates

                    // Find booking for this cell
                    let cellBooking: CalBooking | null = null
                    let cellPosition: string | null = null
                    for (const b of rowBookings) {
                      const pos = getBookingForDay(b, day)
                      if (pos) {
                        cellBooking = b
                        cellPosition = pos
                        break
                      }
                    }

                    const statusColor = cellBooking ? (STATUS_COLORS[cellBooking.status] || 'bg-cyan-600') : ''

                    return (
                      <div
                        key={day}
                        className={`w-12 flex-shrink-0 h-14 border-r border-white/5 relative ${
                          isToday ? 'bg-cyan-500/5' : ''
                        } ${isPast && !cellBooking ? 'opacity-40' : ''}`}
                      >
                        {/* Blocked indicator */}
                        {isBlocked && !cellBooking && (
                          <button
                            onClick={() => !isPast && toggleBlock(dateStr)}
                            className="absolute inset-0 bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                            title="Débloquer cette date"
                          >
                            <Lock className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        )}

                        {/* Booking block */}
                        {cellBooking && cellPosition && (
                          <button
                            onClick={() => setSelectedBooking(cellBooking)}
                            className={`absolute top-1 bottom-1 ${statusColor} flex items-center overflow-hidden cursor-pointer hover:brightness-110 transition-all ${
                              cellPosition === 'start' ? 'left-0.5 right-0 rounded-l-lg' :
                              cellPosition === 'end' ? 'left-0 right-0.5 rounded-r-lg' :
                              cellPosition === 'single' ? 'left-0.5 right-0.5 rounded-lg' :
                              'left-0 right-0'
                            }`}
                            title={`${cellBooking.guestName} — ${STATUS_LABELS[cellBooking.status] || cellBooking.status}`}
                          >
                            {(cellPosition === 'start' || cellPosition === 'single') && (
                              <span className="text-[10px] font-medium text-gray-900 px-1.5 truncate whitespace-nowrap">
                                {cellBooking.guestName.split(' ')[0]}
                              </span>
                            )}
                          </button>
                        )}

                        {/* Empty cell — click to show context menu */}
                        {!cellBooking && !isBlocked && !isPast && (
                          <button
                            onClick={(e) => handleEmptyCellClick(e, dateStr, row.id)}
                            className="absolute inset-0 hover:bg-gray-50 transition-colors group"
                            title="Ajouter une réservation ou bloquer"
                          >
                            <Plus className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity mx-auto" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 p-4 border-t border-white/10 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm bg-cyan-600" /> Confirmée</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm bg-amber-500/80" /> En attente</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm bg-blue-500" /> Terminée</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm bg-red-500/30" /><Lock className="w-3 h-3 text-red-400" /> Bloquée</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm border border-cyan-500/30" style={{ backgroundColor: `${ACCENT}10` }} /> Aujourd&apos;hui</span>
        </div>
      </div>

      {/* Reservation Table */}
      <div className="bg-white border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: ACCENT }} />
            Réservations du mois
          </h2>
          {roomTypes.length > 0 && (
            <RoomTypeLegend roomTypes={roomTypes} colorMap={roomTypeColorMap} />
          )}
        </div>
        <ReservationTable
          bookings={bookings}
          roomTypes={roomTypes}
          colorMap={roomTypeColorMap}
          onStatusChange={handleTableStatusChange}
          onReschedule={handleTableReschedule}
          actionLoading={tableActionLoading}
        />
      </div>

      {/* Context Menu (empty cell) */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 bg-white border border-white/10 rounded-xl shadow-2xl shadow-black/40 py-1 min-w-[200px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={e => e.stopPropagation()}
          >
            <p className="px-3 py-1.5 text-[10px] text-gray-500 font-medium border-b border-white/5">
              {new Date(contextMenu.dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </p>
            <button
              onClick={() => openQuickAdd(contextMenu.dateStr, contextMenu.roomTypeId)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              Ajouter une réservation
            </button>
            <button
              onClick={() => toggleBlock(contextMenu.dateStr)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <Ban className="w-4 h-4 text-red-400" />
              Bloquer cette date
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick-Add Booking Modal */}
      <AnimatePresence>
        {quickAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setQuickAdd(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-white/10 rounded-2xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5" style={{ color: ACCENT }} />
                  Nouvelle réservation
                </h3>
                <button onClick={() => setQuickAdd(null)} className="p-1 text-gray-400 hover:text-gray-900 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {qaError && (
                  <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{qaError}</p>
                )}

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Nom du client *</label>
                  <input
                    type="text"
                    value={qaName}
                    onChange={e => setQaName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={qaPhone}
                    onChange={e => setQaPhone(e.target.value)}
                    placeholder="+261 34 00 000 00"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Arrivée *</label>
                    <input
                      type="date"
                      value={quickAdd.dateStr}
                      readOnly
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 focus:outline-none opacity-70"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Départ</label>
                    <input
                      type="date"
                      value={qaCheckOut}
                      onChange={e => setQaCheckOut(e.target.value)}
                      min={quickAdd.dateStr}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Personnes</label>
                    <select
                      value={qaGuests}
                      onChange={e => setQaGuests(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  {roomTypes.length > 0 && (
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Chambre</label>
                      <select
                        value={qaRoomTypeId || ''}
                        onChange={e => setQaRoomTypeId(e.target.value || null)}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 focus:outline-none"
                      >
                        <option value="">— Aucune —</option>
                        {roomTypes.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <button
                  onClick={submitQuickAdd}
                  disabled={qaLoading}
                  className="w-full py-3 text-gray-900 font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: ACCENT }}
                >
                  {qaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {qaLoading ? 'Création...' : 'Créer la réservation'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-white/10 rounded-2xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedBooking.guestName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-gray-900 ${STATUS_COLORS[selectedBooking.status] || 'bg-gray-500'}`}>
                      {STATUS_LABELS[selectedBooking.status] || selectedBooking.status}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {selectedBooking.reference}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="p-1 text-gray-400 hover:text-gray-900 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedBooking.checkIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {selectedBooking.checkOut && (
                        <> → {new Date(selectedBooking.checkOut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</>
                      )}
                    </p>
                    {selectedBooking.checkOut && (
                      <p className="text-xs text-gray-500">
                        {Math.ceil((new Date(selectedBooking.checkOut).getTime() - new Date(selectedBooking.checkIn).getTime()) / 86400000)} nuit(s)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-900">{selectedBooking.guestCount} personne{selectedBooking.guestCount > 1 ? 's' : ''}</span>
                </div>

                {selectedBooking.totalPrice != null && (
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <span className="text-sm font-bold" style={{ color: ACCENT }}>
                      {selectedBooking.totalPrice.toLocaleString('fr-FR')} MGA
                    </span>
                  </div>
                )}

                {selectedBooking.guestPhone && (
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <Phone className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-gray-900">{selectedBooking.guestPhone}</span>
                  </div>
                )}
              </div>

              {/* Accept / Refuse for pending bookings */}
              {selectedBooking.status === 'pending' && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => handleBookingAction(selectedBooking.id, 'confirmed')}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium rounded-xl hover:bg-emerald-500/20 transition-colors text-sm disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Accepter
                  </button>
                  <button
                    onClick={() => handleBookingAction(selectedBooking.id, 'cancelled')}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 font-medium rounded-xl hover:bg-red-500/20 transition-colors text-sm disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Refuser
                  </button>
                </div>
              )}

              {/* Contact Actions */}
              <div className="flex gap-2">
                {selectedBooking.guestPhone && (
                  <a
                    href={`https://wa.me/${selectedBooking.guestPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${selectedBooking.guestName}, concernant votre réservation ${selectedBooking.reference} chez ${establishment.name}...`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
                <a
                  href="/dashboard/messagerie"
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-900 font-medium rounded-xl hover:opacity-90 transition-opacity text-sm"
                  style={{ backgroundColor: ACCENT }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Messagerie
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
