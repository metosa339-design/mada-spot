'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCsrf } from '@/hooks/useCsrf'
import { motion, AnimatePresence } from 'framer-motion'
import { getImageUrl } from '@/lib/image-url'
import {
  Building2, Camera, MapPin, Clock, Wifi, Car, Waves, Zap, Tv, Wind,
  UtensilsCrossed, Coffee, Truck, CreditCard, Save, Plus, X, Calendar,
  Image as ImageIcon, Upload, CheckCircle, AlertCircle, Globe, Phone,
  Mail, Instagram, Facebook, MessageCircle
} from 'lucide-react'

type Tab = 'general' | 'photos' | 'equipements' | 'horaires' | 'contact' | 'menu'

interface EstablishmentData {
  id?: string
  name: string
  type: string
  description: string
  shortDescription: string
  address: string
  city: string
  region: string
  latitude: number | null
  longitude: number | null
  phone: string
  phone2: string
  email: string
  website: string
  facebook: string
  instagram: string
  whatsapp: string
  coverImage: string
  images: string[]
  amenities: string[]
  openingHours: Record<string, { open: string; close: string; closed: boolean }>
  holidays: string[]
  // Restaurant specific
  cuisineTypes: string[]
  menuImages: string[]
  hasDelivery: boolean
  hasTakeaway: boolean
  hasReservation: boolean
  // Hotel specific
  starRating: number
  checkInTime: string
  checkOutTime: string
}

const DAYS = [
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi', label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' },
]

const AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'pool', label: 'Piscine', icon: Waves },
  { id: 'generator', label: 'Groupe électrogène', icon: Zap },
  { id: 'tv', label: 'TV', icon: Tv },
  { id: 'ac', label: 'Climatisation', icon: Wind },
  { id: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed },
  { id: 'cafe', label: 'Café/Bar', icon: Coffee },
  { id: 'delivery', label: 'Livraison', icon: Truck },
  { id: 'card_payment', label: 'Paiement CB', icon: CreditCard },
]

const CATEGORIES = [
  { value: 'HOTEL', label: 'Hôtel / Hébergement' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'ATTRACTION', label: 'Attraction / Loisir' },
  { value: 'PROVIDER', label: 'Prestataire de service' },
]

const defaultHours = (): Record<string, { open: string; close: string; closed: boolean }> => {
  const hours: Record<string, { open: string; close: string; closed: boolean }> = {}
  DAYS.forEach(d => {
    hours[d.key] = { open: '08:00', close: '18:00', closed: false }
  })
  return hours
}

export default function EstablishmentPage() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) || 'general'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingImages, setUploadingImages] = useState(false)
  const { csrfToken } = useCsrf()

  const [userType, setUserType] = useState<string | null>(null)

  const [data, setData] = useState<EstablishmentData>({
    name: '', type: 'HOTEL', description: '', shortDescription: '',
    address: '', city: '', region: '', latitude: null, longitude: null,
    phone: '', phone2: '', email: '', website: '',
    facebook: '', instagram: '', whatsapp: '',
    coverImage: '', images: [], amenities: [],
    openingHours: defaultHours(), holidays: [],
    cuisineTypes: [], menuImages: [],
    hasDelivery: false, hasTakeaway: false, hasReservation: false,
    starRating: 3, checkInTime: '14:00', checkOutTime: '11:00',
  })

  useEffect(() => {
    fetchEstablishment()
  }, [])

  const fetchEstablishment = async () => {
    try {
      const [estRes, sessionRes] = await Promise.all([
        fetch('/api/dashboard/establishment'),
        fetch('/api/auth/session'),
      ])
      if (estRes.ok) {
        const json = await estRes.json()
        if (json.establishment) {
          setData(prev => ({ ...prev, ...json.establishment }))
        }
      }
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json()
        const ut = sessionData.user?.userType || null
        setUserType(ut)
        // Lock the type to the user's registered type
        if (ut) {
          setData(prev => ({ ...prev, type: prev.id ? prev.type : ut }))
        }
      }
    } catch (err) {
      console.error('Error fetching establishment:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/dashboard/establishment', {
        method: data.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.establishment?.id) {
          setData(prev => ({ ...prev, id: json.establishment.id }))
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = useCallback(async (files: FileList, field: 'coverImage' | 'images' | 'menuImages') => {
    if (!csrfToken) return
    setUploadingImages(true)
    try {
      const fileArray = Array.from(files)
      // Process in batches of 5 (API limit)
      const allUrls: string[] = []
      for (let i = 0; i < fileArray.length; i += 5) {
        const batch = fileArray.slice(i, i + 5)
        const formData = new FormData()
        batch.forEach(f => formData.append('files', f))
        formData.append('csrfToken', csrfToken)
        const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          const urls = (json.files as { url: string }[]).map(f => f.url)
          allUrls.push(...urls)
        }
      }
      if (field === 'coverImage' && allUrls[0]) {
        setData(prev => ({ ...prev, coverImage: allUrls[0] }))
      } else {
        setData(prev => ({ ...prev, [field]: [...(prev[field] as string[]), ...allUrls] }))
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploadingImages(false)
    }
  }, [csrfToken])

  const toggleAmenity = (id: string) => {
    setData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter(a => a !== id)
        : [...prev.amenities, id],
    }))
  }

  const updateHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: { ...prev.openingHours[day], [field]: value },
      },
    }))
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'Général', icon: Building2 },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'equipements', label: 'Équipements', icon: Wifi },
    { id: 'horaires', label: 'Horaires', icon: Clock },
    { id: 'contact', label: 'Contact', icon: Phone },
    ...(data.type === 'RESTAURANT' ? [{ id: 'menu' as Tab, label: 'Carte & Menu', icon: UtensilsCrossed }] : []),
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-white/5 rounded animate-pulse" />
        <div className="h-[400px] bg-white rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {data.id ? 'Modifier mon établissement' : 'Publier un établissement'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Complétez les informations pour une meilleure visibilité
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#ff6b35] hover:bg-[#e55a2b] text-gray-900 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white border border-white/10 rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-[#ff6b35] text-white'
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white border border-white/10 rounded-2xl p-6"
        >
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Catégorie d&apos;établissement
                </label>
                {userType ? (
                  <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-[#ff6b35]/30 bg-[#ff6b35]/10 text-[#ff6b35] text-sm font-medium">
                    {CATEGORIES.find(c => c.value === data.type)?.label || data.type}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setData(prev => ({ ...prev, type: cat.value }))}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          data.type === cat.value
                            ? 'border-[#ff6b35] bg-[#ff6b35]/10 text-[#ff6b35]'
                            : 'border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom de l&apos;établissement *
                </label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Hôtel Les Flamboyants"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={data.description}
                  onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Décrivez votre établissement..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/50 resize-none"
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description courte (pour les aperçus)
                </label>
                <input
                  type="text"
                  value={data.shortDescription}
                  onChange={(e) => setData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="En une phrase..."
                  maxLength={200}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/50"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ville *</label>
                  <input
                    type="text"
                    value={data.city}
                    onChange={(e) => setData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Antananarivo"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Région</label>
                  <input
                    type="text"
                    value={data.region}
                    onChange={(e) => setData(prev => ({ ...prev, region: e.target.value }))}
                    placeholder="Analamanga"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Adresse complète</label>
                <input
                  type="text"
                  value={data.address}
                  onChange={(e) => setData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Lot 123, Rue..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/50"
                />
              </div>

              {/* Map Geolocation */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Coordonnées GPS
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    step="any"
                    value={data.latitude || ''}
                    onChange={(e) => setData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || null }))}
                    placeholder="Latitude (ex: -18.9137)"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/50"
                  />
                  <input
                    type="number"
                    step="any"
                    value={data.longitude || ''}
                    onChange={(e) => setData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || null }))}
                    placeholder="Longitude (ex: 47.5361)"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/50"
                  />
                </div>
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => setData(prev => ({
                          ...prev,
                          latitude: pos.coords.latitude,
                          longitude: pos.coords.longitude,
                        })),
                        () => alert('Impossible de récupérer la position')
                      )
                    }
                  }}
                  className="mt-2 text-sm text-[#ff6b35] hover:text-orange-400 flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" /> Utiliser ma position actuelle
                </button>
              </div>

              {/* Hotel-specific fields */}
              {data.type === 'HOTEL' && (
                <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-sm font-medium text-[#ff6b35]">Informations hôtel</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Étoiles</label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setData(prev => ({ ...prev, starRating: star }))}
                            className={`text-lg ${star <= data.starRating ? 'text-yellow-400' : 'text-gray-600'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Check-in</label>
                      <input
                        type="time"
                        value={data.checkInTime}
                        onChange={(e) => setData(prev => ({ ...prev, checkInTime: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-[#ff6b35]/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Check-out</label>
                      <input
                        type="time"
                        value={data.checkOutTime}
                        onChange={(e) => setData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-[#ff6b35]/50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PHOTOS TAB */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Image de couverture</label>
                <div className="relative">
                  {data.coverImage ? (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden">
                      <img src={getImageUrl(data.coverImage)} alt="Cover" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setData(prev => ({ ...prev, coverImage: '' }))}
                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-lg text-gray-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#ff6b35]/50 transition-colors">
                      <Upload className="w-8 h-8 text-gray-500 mb-2" />
                      <p className="text-sm text-gray-400">Cliquez pour uploader</p>
                      <p className="text-xs text-gray-500">JPG, PNG (max 5MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files, 'coverImage')}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Gallery */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Galerie photos ({data.images.length}/20)
                </label>
                <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
                  {data.images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={img} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-lg text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {data.images.length < 20 && (
                    <label className="aspect-square border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#ff6b35]/50 flex flex-col items-center justify-center transition-colors">
                      {uploadingImages ? (
                        <div className="w-6 h-6 border-2 border-[#ff6b35] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-6 h-6 text-gray-500" />
                          <span className="text-xs text-gray-500 mt-1">Ajouter</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files, 'images')}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* EQUIPEMENTS TAB */}
          {activeTab === 'equipements' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Sélectionnez les équipements disponibles</p>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {AMENITIES.map((amenity) => {
                  const selected = data.amenities.includes(amenity.id)
                  return (
                    <button
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        selected
                          ? 'border-[#ff6b35] bg-[#ff6b35]/10 text-[#ff6b35]'
                          : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                      }`}
                    >
                      <amenity.icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{amenity.label}</span>
                      {selected && <CheckCircle className="w-4 h-4" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* HORAIRES TAB */}
          {activeTab === 'horaires' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Définissez vos horaires d&apos;ouverture</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-gray-400">Ouvert</span>
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block ml-2" />
                  <span className="text-gray-400">Fermé</span>
                </div>
              </div>

              <div className="space-y-3">
                {DAYS.map((day) => {
                  const hours = data.openingHours[day.key] || { open: '08:00', close: '18:00', closed: false }
                  return (
                    <div key={day.key} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                      <span className="w-24 text-sm font-medium text-gray-300">{day.label}</span>

                      <button
                        onClick={() => updateHours(day.key, 'closed', !hours.closed)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          !hours.closed ? 'bg-emerald-500' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                          !hours.closed ? 'left-6' : 'left-0.5'
                        }`} />
                      </button>

                      {!hours.closed ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) => updateHours(day.key, 'open', e.target.value)}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-[#ff6b35]/50"
                          />
                          <span className="text-gray-500">à</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => updateHours(day.key, 'close', e.target.value)}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-[#ff6b35]/50"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-red-400">Fermé</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Restaurant-specific: Service Midi/Soir */}
              {data.type === 'RESTAURANT' && (
                <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-sm font-medium text-[#ff6b35] mb-3">Services Restaurant</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-sm font-medium text-gray-900 mb-1">Service Midi</p>
                      <p className="text-xs text-gray-400">11h30 - 14h30</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-sm font-medium text-gray-900 mb-1">Service Soir</p>
                      <p className="text-xs text-gray-400">18h30 - 22h00</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Jours fériés */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Jours fériés / Fermetures exceptionnelles
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {data.holidays.map((holiday, i) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-sm">
                      {holiday}
                      <button onClick={() => setData(prev => ({ ...prev, holidays: prev.holidays.filter((_, idx) => idx !== i) }))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      const date = prompt('Date de fermeture (JJ/MM/AAAA) :')
                      if (date) setData(prev => ({ ...prev, holidays: [...prev.holidays, date] }))
                    }}
                    className="px-3 py-1 border border-dashed border-white/20 rounded-lg text-sm text-gray-400 hover:text-gray-900 hover:border-white/40 transition-colors"
                  >
                    + Ajouter une date
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT TAB */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              {[
                { icon: Phone, field: 'phone' as const, label: 'Téléphone principal', placeholder: '+261 34 00 000 00' },
                { icon: Phone, field: 'phone2' as const, label: 'Téléphone secondaire', placeholder: '+261 33 00 000 00' },
                { icon: Mail, field: 'email' as const, label: 'Email', placeholder: 'contact@monhotel.mg' },
                { icon: Globe, field: 'website' as const, label: 'Site web', placeholder: 'https://www.monhotel.mg' },
                { icon: Facebook, field: 'facebook' as const, label: 'Facebook', placeholder: 'https://facebook.com/monhotel' },
                { icon: Instagram, field: 'instagram' as const, label: 'Instagram', placeholder: '@monhotel' },
                { icon: MessageCircle, field: 'whatsapp' as const, label: 'WhatsApp', placeholder: '+261 34 00 000 00' },
              ].map((item) => (
                <div key={item.field} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">{item.label}</label>
                    <input
                      type="text"
                      value={data[item.field]}
                      onChange={(e) => setData(prev => ({ ...prev, [item.field]: e.target.value }))}
                      placeholder={item.placeholder}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-900 text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/50"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MENU TAB (Restaurant only) */}
          {activeTab === 'menu' && data.type === 'RESTAURANT' && (
            <div className="space-y-6">
              {/* Cuisine Types */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Types de cuisine</label>
                <div className="flex gap-2 flex-wrap">
                  {['Malgache', 'Français', 'Chinois', 'Italien', 'Indien', 'Japonais', 'Fusion', 'Street Food'].map((cuisine) => (
                    <button
                      key={cuisine}
                      onClick={() => {
                        setData(prev => ({
                          ...prev,
                          cuisineTypes: prev.cuisineTypes.includes(cuisine)
                            ? prev.cuisineTypes.filter(c => c !== cuisine)
                            : [...prev.cuisineTypes, cuisine],
                        }))
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        data.cuisineTypes.includes(cuisine)
                          ? 'bg-[#ff6b35]/10 text-[#ff6b35] border border-[#ff6b35]/30'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Photos du menu / carte</label>
                <div className="grid grid-cols-3 gap-3">
                  {data.menuImages.map((img, index) => (
                    <div key={index} className="relative aspect-[3/4] rounded-xl overflow-hidden group">
                      <img src={img} alt={`Menu ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setData(prev => ({ ...prev, menuImages: prev.menuImages.filter((_, i) => i !== index) }))}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-lg text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-[3/4] border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#ff6b35]/50 flex flex-col items-center justify-center transition-colors">
                    <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                    <span className="text-xs text-gray-500">Photo menu</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files, 'menuImages')}
                    />
                  </label>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {[
                  { field: 'hasDelivery' as const, label: 'Livraison disponible', icon: Truck },
                  { field: 'hasTakeaway' as const, label: 'Vente à emporter', icon: Coffee },
                  { field: 'hasReservation' as const, label: 'Réservation en ligne', icon: Calendar },
                ].map((opt) => (
                  <div key={opt.field} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <opt.icon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-300">{opt.label}</span>
                    </div>
                    <button
                      onClick={() => setData(prev => ({ ...prev, [opt.field]: !prev[opt.field] }))}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        data[opt.field] ? 'bg-[#ff6b35]' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                        data[opt.field] ? 'left-6' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
