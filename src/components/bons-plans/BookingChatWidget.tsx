'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCsrf } from '@/hooks/useCsrf'
import PhoneInput from '@/components/ui/PhoneInput'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck, MessageSquare, X, Send, Loader2,
  Users, ChevronLeft, ChevronRight
} from 'lucide-react'

interface Props {
  establishmentId: string
  establishmentName: string
  establishmentType: string // 'hotel' | 'restaurant' | 'attraction'
  ownerId?: string | null
  pricePerNight?: number | null
}

const WEEKDAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

export default function BookingChatWidget({ establishmentId, establishmentName, establishmentType, ownerId, pricePerNight }: Props) {
  const router = useRouter()
  const { csrfToken } = useCsrf()
  const [showBooking, setShowBooking] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [user, setUser] = useState<{ id: string; firstName: string; lastName: string; userType?: string | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Booking form
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [visitTime, setVisitTime] = useState('')
  const [guestCount, setGuestCount] = useState(1)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  // Chat
  const [chatMessage, setChatMessage] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatSent, setChatSent] = useState(false)

  // Availability calendar
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())
  const [occupiedDates, setOccupiedDates] = useState<Set<string>>(new Set())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())

  useEffect(() => {
    // Check session
    fetch('/api/auth/session', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user) {
          setUser(d.user)
          setGuestName(`${d.user.firstName} ${d.user.lastName}`)
        }
      })
      .catch(() => {})

    // Fetch availability from public API
    fetch(`/api/establishments/${establishmentId}/availability`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          if (d.blockedDates) setBlockedDates(new Set(d.blockedDates))
          if (d.occupiedDates) setOccupiedDates(new Set(d.occupiedDates))
        }
      })
      .catch(() => {})
  }, [establishmentId])

  const handleBooking = async () => {
    if (!checkIn || !guestName) {
      setError('Veuillez remplir les champs obligatoires')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          establishmentId,
          bookingType: establishmentType,
          checkIn: visitTime ? `${checkIn}T${visitTime}` : checkIn,
          checkOut: checkOut || undefined,
          guestCount,
          guestName,
          guestPhone: guestPhone || undefined,
          specialRequests: specialRequests || undefined,
          csrfToken,
        }),
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Erreur lors de la réservation')
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const handleSendChat = async () => {
    if (!chatMessage.trim() || !ownerId) return
    if (!user) {
      router.push(`/login?redirect=/bons-plans/${establishmentType}s`)
      return
    }

    setChatSending(true)
    try {
      const res = await fetch('/api/dashboard/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: ownerId,
          content: chatMessage.trim(),
          establishmentId,
        }),
      })
      if (res.ok) {
        setChatSent(true)
        setChatMessage('')
      }
    } catch { /* ignore */ }
    finally { setChatSending(false) }
  }

  // Mini calendar
  const today = new Date()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDay = (() => { const d = new Date(calYear, calMonth, 1).getDay(); return d === 0 ? 6 : d - 1 })()
  const days: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (days.length % 7 !== 0) days.push(null)

  const isBlocked = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return blockedDates.has(dateStr)
  }

  const isOccupied = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return occupiedDates.has(dateStr) && !blockedDates.has(dateStr)
  }

  const isPast = (day: number) => {
    const d = new Date(calYear, calMonth, day)
    d.setHours(23, 59, 59)
    return d < today
  }

  const toDateStr = (day: number) =>
    `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const handleDayClick = (day: number) => {
    if (isBlocked(day) || isPast(day)) return
    if (isOccupied(day)) return // occupied by another traveler
    if (user?.userType) return // providers can't book
    if (!user) { router.push('/login?redirect=/bons-plans'); return }

    const dateStr = toDateStr(day)

    if (!checkIn || (checkIn && checkOut)) {
      // First click or reset: set check-in
      setCheckIn(dateStr)
      setCheckOut('')
    } else if (dateStr > checkIn) {
      // Second click after check-in: set check-out (date range)
      setCheckOut(dateStr)
    } else {
      // Clicked before check-in: reset
      setCheckIn(dateStr)
      setCheckOut('')
    }

    setShowBooking(true)
  }

  const isSelected = (day: number) => {
    const dateStr = toDateStr(day)
    return dateStr === checkIn || dateStr === checkOut
  }

  const isInRange = (day: number) => {
    if (!checkIn || !checkOut) return false
    const dateStr = toDateStr(day)
    return dateStr > checkIn && dateStr < checkOut
  }

  return (
    <>
      {/* Sticky bottom bar on mobile / sidebar buttons on desktop */}
      <div className="space-y-3">
        {/* Price */}
        {pricePerNight && (
          <div className="text-center mb-2">
            <span className="text-2xl font-bold text-white">{pricePerNight.toLocaleString('fr-FR')} MGA</span>
            <span className="text-gray-500 text-sm"> / nuit</span>
          </div>
        )}

        {/* Booking button - hidden for providers (role isolation) */}
        {user?.userType ? (
          <div className="text-center py-2 px-3 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-xs text-gray-500">Compte prestataire - réservation non disponible</p>
          </div>
        ) : (
          <button
            onClick={() => {
              if (!user) { router.push(`/login?redirect=/bons-plans`); return }
              setShowBooking(true)
            }}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
          >
            <CalendarCheck className="w-5 h-5" />
            Réserver
          </button>
        )}

        {/* Chat button */}
        {ownerId && (
          <button
            onClick={() => {
              if (!user) { router.push(`/login?redirect=/bons-plans`); return }
              setShowChat(true)
            }}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#1a1a24] border border-[#ff6b35]/30 text-[#ff6b35] font-medium rounded-xl hover:bg-[#ff6b35]/10 transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            Discuter avec l'hôte
          </button>
        )}

        {/* Mini availability calendar */}
        <div className="bg-[#0f0f17] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) } else setCalMonth(m => m - 1) }} className="p-1 hover:bg-white/10 rounded">
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <span className="text-xs font-medium text-gray-300 capitalize">
              {new Date(calYear, calMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) } else setCalMonth(m => m + 1) }} className="p-1 hover:bg-white/10 rounded">
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map(d => <div key={d} className="text-center text-[9px] text-gray-600 py-0.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} className="aspect-square" />
              const blocked = isBlocked(day)
              const occupied = isOccupied(day)
              const past = isPast(day)
              const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()
              const sel = isSelected(day)
              const inRange = isInRange(day)
              const clickable = !blocked && !occupied && !past && !user?.userType
              return (
                <button
                  key={day}
                  type="button"
                  disabled={!clickable}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square flex items-center justify-center rounded text-[10px] transition-all ${
                    sel ? 'bg-[#ff6b35] text-white font-bold' :
                    inRange ? 'bg-[#ff6b35]/15 text-[#ff6b35]' :
                    blocked ? 'bg-red-500/10 text-red-400 line-through cursor-not-allowed' :
                    occupied ? 'bg-gray-700/40 text-gray-500 cursor-not-allowed' :
                    past ? 'text-gray-700 cursor-not-allowed' :
                    isToday ? 'bg-[#ff6b35]/20 text-[#ff6b35] font-bold hover:bg-[#ff6b35]/40 cursor-pointer' :
                    'text-gray-400 hover:bg-white/10 cursor-pointer'
                  }`}
                  title={blocked ? 'Indisponible' : occupied ? 'Déjà réservé par un autre voyageur' : sel ? (checkIn === toDateStr(day) ? 'Arrivée' : 'Départ') : 'Cliquez pour réserver'}
                >
                  {day}
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-white/5 text-[9px] text-gray-600">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/40" /> Fermé</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-600" /> Réservé</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff6b35]" /> Sélectionné</span>
          </div>
          {checkIn && (
            <p className="text-[10px] text-[#ff6b35] mt-1">
              {checkOut ? `${checkIn} → ${checkOut}` : `Arrivée: ${checkIn}`}
            </p>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowBooking(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">Réserver</h3>
                <button onClick={() => setShowBooking(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <p className="text-sm text-[#ff6b35] font-medium mb-4">{establishmentName}</p>

              {success ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CalendarCheck className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-1">Demande envoyée !</h4>
                  <p className="text-sm text-gray-400">Le prestataire va confirmer votre réservation.</p>
                  <button onClick={() => { setShowBooking(false); setSuccess(false) }} className="mt-4 px-6 py-2 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20">
                    Fermer
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Nom complet *</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#ff6b35]/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        {establishmentType === 'hotel' ? 'Arrivée' : 'Date de visite'} *
                      </label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={e => setCheckIn(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#ff6b35]/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        {establishmentType === 'hotel' ? 'Départ' : 'Fin (optionnel)'}
                      </label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={e => setCheckOut(e.target.value)}
                        min={checkIn || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#ff6b35]/50"
                      />
                    </div>
                  </div>

                  {/* Time picker for attractions & restaurants */}
                  {establishmentType !== 'hotel' && (
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Heure souhaitée</label>
                      <input
                        type="time"
                        value={visitTime}
                        onChange={e => setVisitTime(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#ff6b35]/50"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Personnes</label>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <select
                          value={guestCount}
                          onChange={e => setGuestCount(Number(e.target.value))}
                          className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Téléphone</label>
                      <PhoneInput
                        value={guestPhone}
                        onChange={setGuestPhone}
                        variant="dark"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Demandes spéciales</label>
                    <textarea
                      value={specialRequests}
                      onChange={e => setSpecialRequests(e.target.value)}
                      rows={2}
                      placeholder="Chambre avec vue, lit bébé..."
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ff6b35]/50 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
                    {loading ? 'Envoi...' : 'Envoyer la demande'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowChat(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#1a1a24] border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Discuter avec l'hôte</h3>
                <button onClick={() => setShowChat(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <p className="text-sm text-[#ff6b35] font-medium mb-4">{establishmentName}</p>

              {chatSent ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-1">Message envoyé !</h4>
                  <p className="text-sm text-gray-400">L'hôte recevra une notification.</p>
                  <button onClick={() => { setShowChat(false); setChatSent(false) }} className="mt-4 px-6 py-2 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20">
                    Fermer
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    rows={4}
                    placeholder="Bonjour, je souhaite avoir plus d'informations sur..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/50 resize-none"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatMessage.trim() || chatSending}
                    className="w-full py-3 bg-[#ff6b35] text-white font-medium rounded-xl hover:bg-[#ff6b35]/90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {chatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {chatSending ? 'Envoi...' : 'Envoyer le message'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
