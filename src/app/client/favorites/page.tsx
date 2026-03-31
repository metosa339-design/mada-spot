'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getImageUrl } from '@/lib/image-url'
import {
  ArrowLeft,
  Heart,
  MapPin,
  Star,
  Building2,
  UtensilsCrossed,
  Mountain,
  Trash2,
  Loader2,
} from 'lucide-react'

interface Favorite {
  id: string
  addedAt: string
  establishment: {
    id: string
    name: string
    slug: string
    type: string
    city: string
    coverImage: string | null
    rating: number
    reviewCount: number
    shortDescription: string | null
    isFeatured: boolean
  }
}

const typeIcons: Record<string, any> = {
  HOTEL: Building2,
  RESTAURANT: UtensilsCrossed,
  ATTRACTION: Mountain,
}
const typeLabels: Record<string, string> = {
  HOTEL: 'Hôtel',
  RESTAURANT: 'Restaurant',
  ATTRACTION: 'Attraction',
  PROVIDER: 'Prestataire',
}
const typeColors: Record<string, string> = {
  HOTEL: 'bg-blue-500/10 text-blue-400',
  RESTAURANT: 'bg-orange-500/10 text-orange-400',
  ATTRACTION: 'bg-green-500/10 text-green-400',
  PROVIDER: 'bg-purple-500/10 text-purple-400',
}
const typePaths: Record<string, string> = {
  HOTEL: 'hotels',
  RESTAURANT: 'restaurants',
  ATTRACTION: 'attractions',
  PROVIDER: 'prestataires',
}

export default function ClientFavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/client/favorites')
      if (res.status === 401) {
        router.push('/login?redirect=/client/favorites')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setFavorites(data.favorites || [])
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (establishmentId: string) => {
    setRemovingId(establishmentId)
    try {
      const res = await fetch(`/api/client/favorites?establishmentId=${establishmentId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.establishment.id !== establishmentId))
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-lg transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Mes favoris</h1>
              <p className="text-sm text-gray-500">
                {favorites.length} établissement{favorites.length > 1 ? 's' : ''} sauvegardé{favorites.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun favori
            </h3>
            <p className="text-gray-400 mb-6">
              Parcourez les établissements et ajoutez vos préférés pour les retrouver facilement.
            </p>
            <Link
              href="/bons-plans"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6b35] text-white rounded-xl hover:bg-[#e55a2b] transition-colors"
            >
              Découvrir les établissements
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((fav) => {
              const est = fav.establishment
              const TypeIcon = typeIcons[est.type] || Building2
              const href = typePaths[est.type]
                ? `/bons-plans/${typePaths[est.type]}/${est.slug}`
                : `/bons-plans`

              return (
                <div
                  key={fav.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#ff6b35]/30 transition-all"
                >
                  <div className="flex items-stretch">
                    {/* Image */}
                    <Link href={href} className="relative w-32 sm:w-44 shrink-0">
                      {est.coverImage ? (
                        <Image
                          src={getImageUrl(est.coverImage)}
                          alt={est.name}
                          fill
                          sizes="176px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                          <TypeIcon className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                      {est.isFeatured && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 text-[10px] font-medium rounded-full">
                          Recommandé
                        </span>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColors[est.type] || 'bg-gray-500/10 text-gray-400'}`}>
                            {typeLabels[est.type] || est.type}
                          </span>
                        </div>
                        <Link href={href}>
                          <h3 className="font-semibold text-gray-900 hover:text-[#ff6b35] transition-colors truncate">
                            {est.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {est.city}
                        </p>
                        {est.shortDescription && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {est.shortDescription}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {est.rating?.toFixed(1) || '—'}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({est.reviewCount} avis)
                          </span>
                        </div>
                        <button
                          onClick={() => removeFavorite(est.id)}
                          disabled={removingId === est.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {removingId === est.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Retirer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
