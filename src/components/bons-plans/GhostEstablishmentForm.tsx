'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Tag, Star, MessageSquare, Loader2, Send } from 'lucide-react'
import { useCsrf } from '@/hooks/useCsrf'

const CATEGORIES = [
  { value: 'HOTEL', label: 'Hôtel / Hébergement' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'ATTRACTION', label: 'Attraction / Loisir' },
  { value: 'PROVIDER', label: 'Prestataire de service' },
]

interface GhostEstablishmentFormProps {
  initialName: string
  onSuccess: (data: { id: string; slug: string; name: string }) => void
  onCancel: () => void
}

export default function GhostEstablishmentForm({ initialName, onSuccess, onCancel }: GhostEstablishmentFormProps) {
  const { csrfToken } = useCsrf()
  const [name, setName] = useState(initialName)
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [type, setType] = useState('HOTEL')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim() || name.trim().length < 2) { setError('Le nom doit contenir au moins 2 caractères'); return }
    if (!city.trim() || city.trim().length < 2) { setError('La ville est requise'); return }
    if (!rating) { setError('Veuillez donner une note'); return }
    if (!comment.trim() || comment.trim().length < 10) { setError('Le commentaire doit contenir au moins 10 caractères'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/establishments/ghost', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csrfToken,
          name: name.trim(),
          city: city.trim(),
          region: region.trim() || undefined,
          type,
          rating,
          comment: comment.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        onSuccess(data.establishment)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Erreur lors de la création')
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a24] border border-violet-500/20 rounded-2xl p-6 space-y-5"
    >
      <div className="text-center mb-2">
        <h3 className="text-lg font-bold text-white">Ajouter un lieu</h3>
        <p className="text-xs text-gray-500 mt-1">Enrichissez la carte de Madagascar en ajoutant un lieu que vous connaissez</p>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Name */}
      <div>
        <label className="text-xs text-gray-400 block mb-1.5">Nom du lieu *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
        />
      </div>

      {/* City + Region */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Ville *
          </label>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Ex: Antananarivo"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Région</label>
          <input
            type="text"
            value={region}
            onChange={e => setRegion(e.target.value)}
            placeholder="Ex: Analamanga"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
          <Tag className="w-3 h-3" /> Catégorie *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setType(cat.value)}
              className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                type === cat.value
                  ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                  : 'border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
          <Star className="w-3 h-3" /> Votre note *
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  n <= (hoverRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-600'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-sm text-gray-400 ml-2 self-center">{rating}/5</span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" /> Votre avis * <span className="text-gray-600">(min. 10 caractères)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Partagez votre expérience dans ce lieu..."
          rows={4}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 resize-none"
        />
        <p className="text-[10px] text-gray-600 mt-1">{comment.length} / 10 caractères minimum</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 text-gray-400 hover:text-white text-sm font-medium rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? 'Création...' : 'Créer et publier mon avis'}
        </button>
      </div>
    </motion.div>
  )
}
