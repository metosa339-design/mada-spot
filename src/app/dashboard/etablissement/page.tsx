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
import { useTrans } from '@/i18n'

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
  gallery: { url: string; caption?: string }[]
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

// Day IDs - labels are loaded via t[`day_${key}`] at render time
const DAY_KEYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const

// Amenity IDs - labels are loaded via t[`amenity_${id}`] at render time
const AMENITY_DEFS = [
  { id: 'wifi', icon: Wifi },
  { id: 'parking', icon: Car },
  { id: 'pool', icon: Waves },
  { id: 'generator', icon: Zap },
  { id: 'tv', icon: Tv },
  { id: 'ac', icon: Wind },
  { id: 'restaurant', icon: UtensilsCrossed },
  { id: 'cafe', icon: Coffee },
  { id: 'delivery', icon: Truck },
  { id: 'card_payment', icon: CreditCard },
] as const

// Category enum values are technical; labels come from t.cat_<value> at render
const CATEGORY_VALUES = ['HOTEL', 'RESTAURANT', 'ATTRACTION', 'PROVIDER'] as const

// Cuisine type IDs and labels for menu tab (label is also the saved value)
const CUISINE_KEYS = [
  { id: 'malgache', value: 'Malgache' },
  { id: 'francais', value: 'Français' },
  { id: 'chinois', value: 'Chinois' },
  { id: 'italien', value: 'Italien' },
  { id: 'indien', value: 'Indien' },
  { id: 'japonais', value: 'Japonais' },
  { id: 'fusion', value: 'Fusion' },
  { id: 'streetfood', value: 'Street Food' },
] as const

const defaultHours = (): Record<string, { open: string; close: string; closed: boolean }> => {
  const hours: Record<string, { open: string; close: string; closed: boolean }> = {}
  DAY_KEYS.forEach(key => {
    hours[key] = { open: '08:00', close: '18:00', closed: false }
  })
  return hours
}

export default function EstablishmentPage() {
  const t = useTrans('dashboardPro')
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) || 'general'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formMsg, setFormMsg] = useState<{ type: 'error' | 'info'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingImages, setUploadingImages] = useState(false)
  const { csrfToken } = useCsrf()

  const [userType, setUserType] = useState<string | null>(null)

  const [data, setData] = useState<EstablishmentData>({
    name: '', type: 'HOTEL', description: '', shortDescription: '',
    address: '', city: '', region: '', latitude: null, longitude: null,
    phone: '', phone2: '', email: '', website: '',
    facebook: '', instagram: '', whatsapp: '',
    coverImage: '', images: [], gallery: [], amenities: [],
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
    // Validation des champs indispensables (evite les fiches fantomes invisibles)
    if (!data.name.trim()) {
      setActiveTab('general')
      setFormMsg({ type: 'error', text: "Le nom de l'établissement est requis." })
      return
    }
    if (!data.city.trim() || data.city.trim().toLowerCase() === 'non spécifié') {
      setActiveTab('general')
      setFormMsg({ type: 'error', text: 'La ville est requise pour que votre fiche soit trouvable par les voyageurs.' })
      return
    }
    setFormMsg(null)
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
        setTimeout(() => setSaved(false), 5000)
      } else {
        const j = await res.json().catch(() => ({}))
        setFormMsg({ type: 'error', text: j.error || "L'enregistrement a échoué. Vérifiez votre connexion et réessayez." })
      }
    } catch (err) {
      console.error('Error saving:', err)
      setFormMsg({ type: 'error', text: "Erreur réseau — votre fiche n'a pas été enregistrée. Réessayez." })
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
    { id: 'general', label: t.tabGeneral, icon: Building2 },
    { id: 'photos', label: t.tabPhotos, icon: Camera },
    { id: 'equipements', label: t.tabAmenities, icon: Wifi },
    { id: 'horaires', label: t.tabHours, icon: Clock },
    { id: 'contact', label: t.tabContact, icon: Phone },
    ...(data.type === 'RESTAURANT' ? [{ id: 'menu' as Tab, label: t.tabMenu, icon: UtensilsCrossed }] : []),
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-white rounded animate-pulse" />
        <div className="h-[400px] bg-white rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
            {data.id ? t.editEstablishment : t.publishEstablishment}
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            {t.completeInfo}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] hover:bg-[#F97316] text-[#0F172A] rounded-xl font-medium text-sm transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? t.saving : saved ? t.saved : t.save}
        </button>
      </div>

      {formMsg && (
        <div className={`mt-3 px-4 py-3 rounded-xl text-sm ${formMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
          {formMsg.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white border border-[#E2E8F0] rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon as React.ComponentType<{ className?: string }>;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#FF6B35] text-white'
                  : 'text-[#94A3B8] hover:text-[#0F172A] hover:bg-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-6"
        >
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">
                  {t.establishmentCategoryLabel}
                </label>
                {userType ? (
                  <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-[#FF6B35]/30 bg-[#FFF7ED] text-[#FF6B35] text-sm font-medium">
                    {(t as Record<string, string>)[`cat_${data.type.toLowerCase()}`] || data.type}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {CATEGORY_VALUES.map((value) => (
                      <button
                        key={value}
                        onClick={() => setData(prev => ({ ...prev, type: value }))}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          data.type === value
                            ? 'border-[#FF6B35] bg-[#FFF7ED] text-[#FF6B35]'
                            : 'border-[#E2E8F0] text-[#94A3B8] hover:border-[#CBD5E1]'
                        }`}
                      >
                        {(t as Record<string, string>)[`cat_${value.toLowerCase()}`]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">
                  {t.establishmentNameLabel}
                </label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t.establishmentNamePlaceholder}
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">
                  {t.descriptionLabel}
                </label>
                <textarea
                  value={data.description}
                  onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder={t.descriptionPlaceholder}
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FF6B35] resize-none"
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">
                  {t.shortDescriptionLabel}
                </label>
                <input
                  type="text"
                  value={data.shortDescription}
                  onChange={(e) => setData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder={t.shortDescriptionPlaceholder}
                  maxLength={200}
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-2">{t.cityLabel}</label>
                  <input
                    type="text"
                    value={data.city}
                    onChange={(e) => setData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder={t.cityPlaceholder}
                    className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-2">{t.regionLabel}</label>
                  <input
                    type="text"
                    value={data.region}
                    onChange={(e) => setData(prev => ({ ...prev, region: e.target.value }))}
                    placeholder={t.regionPlaceholder}
                    className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">{t.fullAddressLabel}</label>
                <input
                  type="text"
                  value={data.address}
                  onChange={(e) => setData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={t.fullAddressPlaceholder}
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              {/* Map Geolocation */}
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {t.gpsCoordsLabel}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    step="any"
                    value={data.latitude || ''}
                    onChange={(e) => setData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || null }))}
                    placeholder={t.latPlaceholder}
                    className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FF6B35]"
                  />
                  <input
                    type="number"
                    step="any"
                    value={data.longitude || ''}
                    onChange={(e) => setData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || null }))}
                    placeholder={t.lngPlaceholder}
                    className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      setFormMsg({ type: 'info', text: 'Récupération de votre position… (cela peut prendre quelques secondes)' })
                      navigator.geolocation.getCurrentPosition(
                        (pos) => { setData(prev => ({
                          ...prev,
                          latitude: pos.coords.latitude,
                          longitude: pos.coords.longitude,
                        })); setFormMsg(null) },
                        () => setFormMsg({ type: 'info', text: 'Position non récupérée. Vous pouvez saisir la latitude et la longitude manuellement dans les champs ci-dessus (facultatif).' })
                      )
                    } else {
                      setFormMsg({ type: 'info', text: "La géolocalisation n'est pas disponible sur cet appareil. Saisissez la position manuellement ci-dessus (facultatif)." })
                    }
                  }}
                  className="mt-2 text-sm text-[#FF6B35] hover:text-[#FDBA74] flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" /> {t.useCurrentPosition}
                </button>
              </div>

              {/* Hotel-specific fields */}
              {data.type === 'HOTEL' && (
                <div className="space-y-4 p-4 bg-white rounded-xl border border-[#E2E8F0]">
                  <h3 className="text-sm font-medium text-[#FF6B35]">{t.hotelInfoTitle}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-[#94A3B8] mb-1">{t.starsLabel}</label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setData(prev => ({ ...prev, starRating: star }))}
                            className={`text-lg ${star <= data.starRating ? 'text-yellow-400' : 'text-[#64748B]'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[#94A3B8] mb-1">{t.checkInLabel}</label>
                      <input
                        type="time"
                        value={data.checkInTime}
                        onChange={(e) => setData(prev => ({ ...prev, checkInTime: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] text-sm focus:outline-none focus:border-[#FF6B35]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#94A3B8] mb-1">{t.checkOutLabel}</label>
                      <input
                        type="time"
                        value={data.checkOutTime}
                        onChange={(e) => setData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] text-sm focus:outline-none focus:border-[#FF6B35]"
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
                <label className="block text-sm font-medium text-[#334155] mb-3">{t.coverImageLabel}</label>
                <div className="relative">
                  {data.coverImage ? (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden">
                      <img src={getImageUrl(data.coverImage)} alt="Cover" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setData(prev => ({ ...prev, coverImage: '' }))}
                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-lg text-[#0F172A]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#CBD5E1] rounded-xl cursor-pointer hover:border-[#FF6B35]/50 transition-colors">
                      <Upload className="w-8 h-8 text-[#94A3B8] mb-2" />
                      <p className="text-sm text-[#94A3B8]">{t.clickToUpload}</p>
                      <p className="text-xs text-[#94A3B8]">{t.imageFormatHint}</p>
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

              {/* Gallery with descriptions */}
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1">
                  {t.galleryLabel} ({data.images.length}/20)
                </label>
                <p className="text-xs text-[#94A3B8] mb-3">{t.galleryHint}</p>
                <div className="space-y-3">
                  {data.images.map((img, index) => {
                    const galleryItems = data.gallery || [];
                    const caption = galleryItems.find(g => g.url === img)?.caption || '';
                    return (
                      <div key={index} className="bg-white rounded-xl p-3">
                        <div className="flex gap-3 items-start">
                          <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0">
                            <img src={img} alt={`${t.photoIndexLabel} ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              placeholder={t.photoCaptionPlaceholder}
                              value={caption}
                              onChange={(e) => {
                                const newGallery = [...galleryItems];
                                const existingIdx = newGallery.findIndex(g => g.url === img);
                                if (existingIdx >= 0) {
                                  newGallery[existingIdx] = { ...newGallery[existingIdx], caption: e.target.value };
                                } else {
                                  newGallery.push({ url: img, caption: e.target.value });
                                }
                                setData(prev => ({ ...prev, gallery: newGallery }));
                              }}
                              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#FF6B35]"
                            />
                            <p className="text-xs text-[#64748B] mt-1">{t.photoIndexLabel} {index + 1}</p>
                          </div>
                          <button
                            onClick={() => {
                              setData(prev => {
                                const newImages = prev.images.filter((_, i) => i !== index);
                                const newGallery = (prev.gallery || []).filter(g => g.url !== img);
                                return { ...prev, images: newImages, gallery: newGallery };
                              });
                            }}
                            className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {data.images.length < 20 && (
                    <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-[#CBD5E1] rounded-xl cursor-pointer hover:border-[#FF6B35]/50 transition-colors">
                      {uploadingImages ? (
                        <div className="w-6 h-6 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5 text-[#94A3B8]" />
                          <span className="text-sm text-[#94A3B8]">{t.addPhotos}</span>
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
              <p className="text-sm text-[#94A3B8]">{t.selectAvailableAmenities}</p>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {AMENITY_DEFS.map((amenity) => {
                  const selected = data.amenities.includes(amenity.id)
                  const label = (t as Record<string, string>)[`amenity_${amenity.id}`]
                  return (
                    <button
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        selected
                          ? 'border-[#FF6B35] bg-[#FFF7ED] text-[#FF6B35]'
                          : 'border-[#E2E8F0] text-[#94A3B8] hover:border-[#CBD5E1] hover:text-[#334155]'
                      }`}
                    >
                      <amenity.icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{label}</span>
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
                <p className="text-sm text-[#94A3B8]">{t.setOpeningHours}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-[#94A3B8]">{t.openLabel}</span>
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block ml-2" />
                  <span className="text-[#94A3B8]">{t.closedLabel}</span>
                </div>
              </div>

              <div className="space-y-3">
                {DAY_KEYS.map((dayKey) => {
                  const hours = data.openingHours[dayKey] || { open: '08:00', close: '18:00', closed: false }
                  const label = (t as Record<string, string>)[`day_${dayKey}`]
                  return (
                    <div key={dayKey} className="flex items-center gap-4 p-3 bg-white rounded-xl">
                      <span className="w-24 text-sm font-medium text-[#334155]">{label}</span>

                      <button
                        onClick={() => updateHours(dayKey, 'closed', !hours.closed)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          !hours.closed ? 'bg-emerald-500' : 'bg-[#CBD5E1]'
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
                            onChange={(e) => updateHours(dayKey, 'open', e.target.value)}
                            className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] text-sm focus:outline-none focus:border-[#FF6B35]"
                          />
                          <span className="text-[#94A3B8]">{t.toSeparator}</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => updateHours(dayKey, 'close', e.target.value)}
                            className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] text-sm focus:outline-none focus:border-[#FF6B35]"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-red-400">{t.closedLabel}</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Restaurant-specific: Service Midi/Soir */}
              {data.type === 'RESTAURANT' && (
                <div className="mt-6 p-4 bg-white rounded-xl border border-[#E2E8F0]">
                  <h3 className="text-sm font-medium text-[#FF6B35] mb-3">{t.restaurantServicesTitle}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
                      <p className="text-sm font-medium text-[#0F172A] mb-1">{t.lunchService}</p>
                      <p className="text-xs text-[#94A3B8]">{t.lunchServiceHours}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
                      <p className="text-sm font-medium text-[#0F172A] mb-1">{t.dinnerService}</p>
                      <p className="text-xs text-[#94A3B8]">{t.dinnerServiceHours}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Jours fériés */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-[#334155] mb-3">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {t.holidaysTitle}
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
                      const date = prompt(t.holidayDatePrompt)
                      if (date) setData(prev => ({ ...prev, holidays: [...prev.holidays, date] }))
                    }}
                    className="px-3 py-1 border border-dashed border-[#CBD5E1] rounded-lg text-sm text-[#94A3B8] hover:text-[#0F172A] hover:border-white/40 transition-colors"
                  >
                    {t.addHolidayDate}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT TAB */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              {[
                { icon: Phone, field: 'phone' as const, label: t.contactPhoneMainLabel, placeholder: t.contactPhoneMainPlaceholder },
                { icon: Phone, field: 'phone2' as const, label: t.contactPhoneSecondLabel, placeholder: t.contactPhoneSecondPlaceholder },
                { icon: Mail, field: 'email' as const, label: t.contactEmailLabel, placeholder: t.contactEmailPlaceholder },
                { icon: Globe, field: 'website' as const, label: t.contactWebsiteLabel, placeholder: t.contactWebsitePlaceholder },
                { icon: Facebook, field: 'facebook' as const, label: t.contactFacebookLabel, placeholder: t.contactFacebookPlaceholder },
                { icon: Instagram, field: 'instagram' as const, label: t.contactInstagramLabel, placeholder: t.contactInstagramPlaceholder },
                { icon: MessageCircle, field: 'whatsapp' as const, label: t.contactWhatsappLabel, placeholder: t.contactWhatsappPlaceholder },
              ].map((item) => (
                <div key={item.field} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-[#94A3B8]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-[#94A3B8] mb-1">{item.label}</label>
                    <input
                      type="text"
                      value={data[item.field]}
                      onChange={(e) => setData(prev => ({ ...prev, [item.field]: e.target.value }))}
                      placeholder={item.placeholder}
                      className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FF6B35]"
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
                <label className="block text-sm font-medium text-[#334155] mb-3">{t.cuisineTypesLabel}</label>
                <div className="flex gap-2 flex-wrap">
                  {CUISINE_KEYS.map(({ id, value }) => {
                    const label = (t as Record<string, string>)[`cuisine_${id}`]
                    return (
                      <button
                        key={value}
                        onClick={() => {
                          setData(prev => ({
                            ...prev,
                            cuisineTypes: prev.cuisineTypes.includes(value)
                              ? prev.cuisineTypes.filter(c => c !== value)
                              : [...prev.cuisineTypes, value],
                          }))
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          data.cuisineTypes.includes(value)
                            ? 'bg-[#FFF7ED] text-[#FF6B35] border border-[#FF6B35]/30'
                            : 'bg-white text-[#94A3B8] border border-[#E2E8F0] hover:border-[#CBD5E1]'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Menu Photos */}
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-3">{t.menuPhotosLabel}</label>
                <div className="grid grid-cols-3 gap-3">
                  {data.menuImages.map((img, index) => (
                    <div key={index} className="relative aspect-[3/4] rounded-xl overflow-hidden group">
                      <img src={img} alt={`Menu ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setData(prev => ({ ...prev, menuImages: prev.menuImages.filter((_, i) => i !== index) }))}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-lg text-[#0F172A] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-[3/4] border-2 border-dashed border-[#CBD5E1] rounded-xl cursor-pointer hover:border-[#FF6B35]/50 flex flex-col items-center justify-center transition-colors">
                    <ImageIcon className="w-8 h-8 text-[#94A3B8] mb-2" />
                    <span className="text-xs text-[#94A3B8]">{t.menuPhotoLabel}</span>
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
                  { field: 'hasDelivery' as const, label: t.deliveryAvailable, icon: Truck },
                  { field: 'hasTakeaway' as const, label: t.takeawayAvailable, icon: Coffee },
                  { field: 'hasReservation' as const, label: t.onlineReservation, icon: Calendar },
                ].map((opt) => (
                  <div key={opt.field} className="flex items-center justify-between p-3 bg-white rounded-xl">
                    <div className="flex items-center gap-3">
                      <opt.icon className="w-5 h-5 text-[#94A3B8]" />
                      <span className="text-sm text-[#334155]">{opt.label}</span>
                    </div>
                    <button
                      onClick={() => setData(prev => ({ ...prev, [opt.field]: !prev[opt.field] }))}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        data[opt.field] ? 'bg-[#FF6B35]' : 'bg-[#CBD5E1]'
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
