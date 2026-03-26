'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Loader2, Save, ArrowLeft, Plus, Trash2, X,
  Hotel, UtensilsCrossed, Compass, Building2,
  Star, MapPin,
  Globe, Phone, Image as ImageIcon, FileText,
} from 'lucide-react';
import NextImage from 'next/image';
import { getImageUrl } from '@/lib/image-url';

// ============================================================
// TYPES
// ============================================================
interface RoomTypeData {
  id?: string;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  priceWeekend: number | null;
  amenities: string[];
  isAvailable: boolean;
}

interface EstablishmentFormData {
  // Base
  type: string;
  name: string;
  description: string;
  shortDescription: string;
  nameEn: string;
  descriptionEn: string;
  shortDescriptionEn: string;
  // Location
  address: string;
  city: string;
  district: string;
  region: string;
  latitude: string;
  longitude: string;
  // Contact
  phone: string;
  phone2: string;
  email: string;
  website: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
  // Media
  coverImage: string;
  images: string[];
  // Status
  isActive: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  moderationStatus: string;
  moderationNote: string;
  // SEO
  metaTitle: string;
  metaDescription: string;
  // Hotel specific
  hotel: {
    starRating: number | null;
    hotelType: string;
    amenities: string[];
    checkInTime: string;
    checkOutTime: string;
    roomTypes: RoomTypeData[];
  };
  // Restaurant specific
  restaurant: {
    category: string;
    priceRange: string;
    cuisineTypes: string[];
    specialties: string[];
    menuPdfUrl: string;
    avgMainCourse: string;
    avgBeer: string;
    hasDelivery: boolean;
    hasTakeaway: boolean;
    hasReservation: boolean;
    hasParking: boolean;
    hasWifi: boolean;
    hasGenerator: boolean;
  };
  // Attraction specific
  attraction: {
    attractionType: string;
    isFree: boolean;
    entryFeeForeign: string;
    entryFeeLocal: string;
    visitDuration: string;
    bestSeason: string;
    bestTimeToVisit: string;
    highlights: string[];
    isAccessible: boolean;
    hasGuide: boolean;
    hasParking: boolean;
    hasRestaurant: boolean;
  };
}

// ============================================================
// CONSTANTS
// ============================================================
const HOTEL_AMENITIES = ['wifi', 'parking', 'pool', 'restaurant', 'spa', 'ac', 'tv', 'generator', 'gym', 'minibar', 'room_service', 'laundry'];
const CUISINE_TYPES = ['malgache', 'francais', 'chinois', 'italien', 'indien', 'japonais', 'africain', 'fast_food', 'pizza', 'fruits_de_mer'];
const ATTRACTION_TYPES = ['park', 'museum', 'beach', 'waterfall', 'historical', 'viewpoint', 'reserve', 'mountain', 'island', 'cave'];
const HOTEL_TYPES = ['hotel', 'boutique', 'resort', 'guesthouse', 'auberge', 'lodge', 'villa', 'bungalow', 'ecolodge'];
const CITIES = ['Antananarivo', 'Nosy Be', 'Toamasina', 'Mahajanga', 'Antsirabe', 'Fianarantsoa', 'Toliara', 'Diego Suarez', 'Morondava', 'Sainte-Marie', 'Fort Dauphin', 'Mananjary', 'Ambositra'];

const INITIAL_FORM: EstablishmentFormData = {
  type: 'HOTEL', name: '', description: '', shortDescription: '',
  nameEn: '', descriptionEn: '', shortDescriptionEn: '',
  address: '', city: '', district: '', region: '', latitude: '', longitude: '',
  phone: '', phone2: '', email: '', website: '', facebook: '', instagram: '', whatsapp: '',
  coverImage: '', images: [], isActive: true, isFeatured: false, isPremium: false,
  moderationStatus: 'approved', moderationNote: '', metaTitle: '', metaDescription: '',
  hotel: { starRating: null, hotelType: '', amenities: [], checkInTime: '14:00', checkOutTime: '11:00', roomTypes: [] },
  restaurant: { category: 'RESTAURANT', priceRange: 'MODERATE', cuisineTypes: [], specialties: [], menuPdfUrl: '', avgMainCourse: '', avgBeer: '', hasDelivery: false, hasTakeaway: false, hasReservation: false, hasParking: false, hasWifi: false, hasGenerator: false },
  attraction: { attractionType: 'park', isFree: false, entryFeeForeign: '', entryFeeLocal: '', visitDuration: '', bestSeason: '', bestTimeToVisit: '', highlights: [], isAccessible: false, hasGuide: false, hasParking: false, hasRestaurant: false },
};

function safeJsonParse(val: any, fallback: any = []) {
  if (Array.isArray(val)) return val;
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function EstablishmentEditor({ establishmentId, onClose }: { establishmentId: string | null; onClose: () => void }) {
  const isNew = !establishmentId;
  const [form, setForm] = useState<EstablishmentFormData>({ ...INITIAL_FORM });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newHighlight, setNewHighlight] = useState('');
  const [_newCuisine, _setNewCuisine] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Load existing establishment
  useEffect(() => {
    if (!establishmentId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/establishments/${establishmentId}`);
        const data = await res.json();
        if (data.success && data.establishment) {
          const est = data.establishment;
          setForm({
            type: est.type, name: est.name || '', description: est.description || '',
            shortDescription: est.shortDescription || '', nameEn: est.nameEn || '',
            descriptionEn: est.descriptionEn || '', shortDescriptionEn: est.shortDescriptionEn || '',
            address: est.address || '', city: est.city || '', district: est.district || '',
            region: est.region || '', latitude: est.latitude?.toString() || '', longitude: est.longitude?.toString() || '',
            phone: est.phone || '', phone2: est.phone2 || '', email: est.email || '',
            website: est.website || '', facebook: est.facebook || '', instagram: est.instagram || '',
            whatsapp: est.whatsapp || '', coverImage: est.coverImage || '',
            images: safeJsonParse(est.images), isActive: est.isActive, isFeatured: est.isFeatured,
            isPremium: est.isPremium, moderationStatus: est.moderationStatus || 'approved',
            moderationNote: est.moderationNote || '', metaTitle: est.metaTitle || '', metaDescription: est.metaDescription || '',
            hotel: est.hotel ? {
              starRating: est.hotel.starRating, hotelType: est.hotel.hotelType || '',
              amenities: safeJsonParse(est.hotel.amenities), checkInTime: est.hotel.checkInTime || '14:00',
              checkOutTime: est.hotel.checkOutTime || '11:00',
              roomTypes: (est.hotel.roomTypes || []).map((r: any) => ({
                id: r.id, name: r.name, description: r.description || '', capacity: r.capacity,
                pricePerNight: r.pricePerNight, priceWeekend: r.priceWeekend, amenities: safeJsonParse(r.amenities), isAvailable: r.isAvailable,
              })),
            } : { ...INITIAL_FORM.hotel },
            restaurant: est.restaurant ? {
              category: est.restaurant.category, priceRange: est.restaurant.priceRange,
              cuisineTypes: safeJsonParse(est.restaurant.cuisineTypes), specialties: safeJsonParse(est.restaurant.specialties),
              menuPdfUrl: est.restaurant.menuPdfUrl || '', avgMainCourse: est.restaurant.avgMainCourse?.toString() || '',
              avgBeer: est.restaurant.avgBeer?.toString() || '', hasDelivery: est.restaurant.hasDelivery,
              hasTakeaway: est.restaurant.hasTakeaway, hasReservation: est.restaurant.hasReservation,
              hasParking: est.restaurant.hasParking, hasWifi: est.restaurant.hasWifi, hasGenerator: est.restaurant.hasGenerator,
            } : { ...INITIAL_FORM.restaurant },
            attraction: est.attraction ? {
              attractionType: est.attraction.attractionType, isFree: est.attraction.isFree,
              entryFeeForeign: est.attraction.entryFeeForeign?.toString() || '', entryFeeLocal: est.attraction.entryFeeLocal?.toString() || '',
              visitDuration: est.attraction.visitDuration || '', bestSeason: est.attraction.bestSeason || '',
              bestTimeToVisit: est.attraction.bestTimeToVisit || '', highlights: safeJsonParse(est.attraction.highlights),
              isAccessible: est.attraction.isAccessible, hasGuide: est.attraction.hasGuide,
              hasParking: est.attraction.hasParking, hasRestaurant: est.attraction.hasRestaurant,
            } : { ...INITIAL_FORM.attraction },
          });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Erreur de chargement' });
      }
      setLoading(false);
    };
    load();
  }, [establishmentId]);

  const handleSave = async () => {
    if (!form.name || !form.city) {
      setMessage({ type: 'error', text: 'Le nom et la ville sont requis' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const url = isNew ? '/api/admin/establishments' : `/api/admin/establishments/${establishmentId}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success || data.establishment) {
        setMessage({ type: 'success', text: isNew ? 'Établissement créé !' : 'Modifications enregistrées !' });
        if (isNew) closeTimerRef.current = setTimeout(() => onClose(), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la sauvegarde' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    }
    setSaving(false);
  };

  // ---- Helpers ----
  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));
  const updateHotel = (field: string, value: any) => setForm(prev => ({ ...prev, hotel: { ...prev.hotel, [field]: value } }));
  const updateRestaurant = (field: string, value: any) => setForm(prev => ({ ...prev, restaurant: { ...prev.restaurant, [field]: value } }));
  const updateAttraction = (field: string, value: any) => setForm(prev => ({ ...prev, attraction: { ...prev.attraction, [field]: value } }));

  const addImage = () => {
    if (newImageUrl.trim()) {
      setForm(prev => ({ ...prev, images: [...prev.images, newImageUrl.trim()] }));
      setNewImageUrl('');
    }
  };
  const removeImage = (idx: number) => setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

  const addRoomType = () => {
    updateHotel('roomTypes', [...form.hotel.roomTypes, { name: '', description: '', capacity: 2, pricePerNight: 0, priceWeekend: null, amenities: [], isAvailable: true }]);
  };
  const updateRoom = (idx: number, field: string, value: any) => {
    const rooms = [...form.hotel.roomTypes];
    (rooms[idx] as any)[field] = value;
    updateHotel('roomTypes', rooms);
  };
  const removeRoom = (idx: number) => updateHotel('roomTypes', form.hotel.roomTypes.filter((_, i) => i !== idx));

  const toggleAmenity = (amenity: string) => {
    const list = form.hotel.amenities.includes(amenity)
      ? form.hotel.amenities.filter(a => a !== amenity)
      : [...form.hotel.amenities, amenity];
    updateHotel('amenities', list);
  };

  const typeIcons: Record<string, any> = { HOTEL: Hotel, RESTAURANT: UtensilsCrossed, ATTRACTION: Compass };
  const typeColors: Record<string, string> = { HOTEL: '#3b82f6', RESTAURANT: '#f97316', ATTRACTION: '#10b981' };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  const TABS = [
    { id: 'general', label: 'Général', icon: FileText },
    { id: 'location', label: 'Localisation', icon: MapPin },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'media', label: 'Médias', icon: ImageIcon },
    { id: 'specific', label: form.type === 'HOTEL' ? 'Hôtel' : form.type === 'RESTAURANT' ? 'Restaurant' : 'Attraction', icon: typeIcons[form.type] || Building2 },
    { id: 'seo', label: 'SEO & Status', icon: Globe },
  ];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-xl bg-[#080810] border border-[#1e1e2e] hover:bg-[#1e1e2e] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-lg font-bold">{isNew ? 'Nouvel Établissement' : `Modifier : ${form.name}`}</h3>
            <p className="text-xs text-gray-500">{isNew ? 'Créer un nouvel établissement' : establishmentId}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#e55a2b] transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Type selector (only for new) */}
      {isNew && (
        <div className="flex gap-3">
          {(['HOTEL', 'RESTAURANT', 'ATTRACTION'] as const).map(t => {
            const Icon = typeIcons[t];
            const color = typeColors[t];
            return (
              <button key={t} onClick={() => updateField('type', t)}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${form.type === t ? 'border-[#ff6b35] bg-[#ff6b35]/10' : 'border-[#1e1e2e] bg-[#080810] hover:bg-[#0c0c16]'}`}>
                <Icon className="w-5 h-5" style={{ color }} />
                <span className="text-sm font-medium">{t === 'HOTEL' ? 'Hôtel' : t === 'RESTAURANT' ? 'Restaurant' : 'Attraction'}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#080810] border border-[#1e1e2e] rounded-xl p-1 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-[#ff6b35] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1e1e2e]'}`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-6 space-y-5">

        {/* ===== GENERAL ===== */}
        {activeTab === 'general' && (
          <>
            <InputField label="Nom *" value={form.name} onChange={v => updateField('name', v)} placeholder="Nom de l'établissement" />
            <TextareaField label="Description" value={form.description} onChange={v => updateField('description', v)} placeholder="Description complète..." rows={4} />
            <InputField label="Description courte" value={form.shortDescription} onChange={v => updateField('shortDescription', v)} placeholder="Pour les cartes et aperçus" />
            <div className="border-t border-[#1e1e2e] pt-4 mt-4">
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1"><Globe className="w-3 h-3" /> Version anglaise</p>
              <div className="space-y-4">
                <InputField label="Name (EN)" value={form.nameEn} onChange={v => updateField('nameEn', v)} placeholder="English name" />
                <TextareaField label="Description (EN)" value={form.descriptionEn} onChange={v => updateField('descriptionEn', v)} placeholder="English description..." rows={3} />
                <InputField label="Short Description (EN)" value={form.shortDescriptionEn} onChange={v => updateField('shortDescriptionEn', v)} placeholder="For cards and previews" />
              </div>
            </div>
          </>
        )}

        {/* ===== LOCATION ===== */}
        {activeTab === 'location' && (
          <>
            <InputField label="Adresse" value={form.address} onChange={v => updateField('address', v)} placeholder="Adresse complète" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Ville *</label>
                <select value={form.city} onChange={e => updateField('city', e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none">
                  <option value="">Sélectionner...</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <InputField label="Quartier / District" value={form.district} onChange={v => updateField('district', v)} />
            </div>
            <InputField label="Région" value={form.region} onChange={v => updateField('region', v)} placeholder="ex: Analamanga" />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Latitude" value={form.latitude} onChange={v => updateField('latitude', v)} placeholder="-18.9137" type="number" />
              <InputField label="Longitude" value={form.longitude} onChange={v => updateField('longitude', v)} placeholder="47.5361" type="number" />
            </div>
          </>
        )}

        {/* ===== CONTACT ===== */}
        {activeTab === 'contact' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Téléphone" value={form.phone} onChange={v => updateField('phone', v)} placeholder="+261 34 00 000 00" />
              <InputField label="Téléphone 2" value={form.phone2} onChange={v => updateField('phone2', v)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Email" value={form.email} onChange={v => updateField('email', v)} type="email" />
              <InputField label="Site web" value={form.website} onChange={v => updateField('website', v)} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <InputField label="Facebook" value={form.facebook} onChange={v => updateField('facebook', v)} placeholder="URL Facebook" />
              <InputField label="Instagram" value={form.instagram} onChange={v => updateField('instagram', v)} placeholder="@compte" />
              <InputField label="WhatsApp" value={form.whatsapp} onChange={v => updateField('whatsapp', v)} placeholder="+261..." />
            </div>
          </>
        )}

        {/* ===== MEDIA ===== */}
        {activeTab === 'media' && (
          <>
            <InputField label="Image de couverture (URL)" value={form.coverImage} onChange={v => updateField('coverImage', v)} placeholder="https://..." />
            {form.coverImage && (
              <div className="relative w-40 h-28 rounded-xl overflow-hidden border border-[#1e1e2e]">
                <NextImage src={getImageUrl(form.coverImage)} alt="Image de couverture" fill sizes="160px" className="object-cover" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Galerie d'images</label>
              <div className="flex gap-2 mb-3">
                <input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="URL de l'image..."
                  className="flex-1 px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())} />
                <button onClick={addImage} className="px-3 py-2 bg-[#ff6b35] text-white rounded-xl text-sm hover:bg-[#e55a2b]">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#1e1e2e] aspect-video">
                    <NextImage src={img} alt={`Photo ${idx + 1} de la galerie`} fill sizes="25vw" className="object-cover" />
                    <button onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
              {form.images.length === 0 && <p className="text-xs text-gray-600">Aucune image dans la galerie</p>}
            </div>
          </>
        )}

        {/* ===== SPECIFIC: HOTEL ===== */}
        {activeTab === 'specific' && form.type === 'HOTEL' && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Étoiles</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => updateHotel('starRating', form.hotel.starRating === s ? null : s)}
                      className={`p-1.5 rounded-lg transition-colors ${form.hotel.starRating && form.hotel.starRating >= s ? 'text-yellow-400' : 'text-gray-600'}`}>
                      <Star className="w-5 h-5" fill={form.hotel.starRating && form.hotel.starRating >= s ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Type d'hôtel</label>
                <select value={form.hotel.hotelType} onChange={e => updateHotel('hotelType', e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none">
                  <option value="">Sélectionner...</option>
                  {HOTEL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Check-in" value={form.hotel.checkInTime} onChange={v => updateHotel('checkInTime', v)} type="time" />
                <InputField label="Check-out" value={form.hotel.checkOutTime} onChange={v => updateHotel('checkOutTime', v)} type="time" />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Équipements</label>
              <div className="flex flex-wrap gap-2">
                {HOTEL_AMENITIES.map(a => (
                  <button key={a} onClick={() => toggleAmenity(a)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.hotel.amenities.includes(a) ? 'bg-[#ff6b35] text-white' : 'bg-[#080810] border border-[#1e1e2e] text-gray-400 hover:text-white'}`}>
                    {a.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Types */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-gray-400">Chambres & Tarifs</label>
                <button onClick={addRoomType} className="flex items-center gap-1 px-3 py-1.5 bg-[#ff6b35]/10 border border-[#ff6b35]/20 rounded-lg text-xs text-[#ff6b35] hover:bg-[#ff6b35]/20">
                  <Plus className="w-3 h-3" /> Ajouter
                </button>
              </div>
              <div className="space-y-3">
                {form.hotel.roomTypes.map((room, idx) => (
                  <div key={idx} className="p-4 bg-[#080810] border border-[#1e1e2e] rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Chambre #{idx + 1}</span>
                      <button onClick={() => removeRoom(idx)} className="p-1 text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label="Nom" value={room.name} onChange={v => updateRoom(idx, 'name', v)} placeholder="Chambre Double" />
                      <InputField label="Capacité" value={room.capacity.toString()} onChange={v => updateRoom(idx, 'capacity', parseInt(v) || 2)} type="number" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label="Prix/nuit (MGA)" value={room.pricePerNight.toString()} onChange={v => updateRoom(idx, 'pricePerNight', parseFloat(v) || 0)} type="number" />
                      <InputField label="Prix week-end (MGA)" value={room.priceWeekend?.toString() || ''} onChange={v => updateRoom(idx, 'priceWeekend', v ? parseFloat(v) : null)} type="number" />
                    </div>
                    <InputField label="Description" value={room.description} onChange={v => updateRoom(idx, 'description', v)} />
                    <ToggleField label="Disponible" value={room.isAvailable} onChange={v => updateRoom(idx, 'isAvailable', v)} />
                  </div>
                ))}
                {form.hotel.roomTypes.length === 0 && <p className="text-xs text-gray-600 text-center py-4">Aucune chambre configurée</p>}
              </div>
            </div>
          </>
        )}

        {/* ===== SPECIFIC: RESTAURANT ===== */}
        {activeTab === 'specific' && form.type === 'RESTAURANT' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Catégorie</label>
                <select value={form.restaurant.category} onChange={e => updateRestaurant('category', e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none">
                  {['GARGOTE', 'RESTAURANT', 'LOUNGE', 'CAFE', 'FAST_FOOD', 'STREET_FOOD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Gamme de prix</label>
                <select value={form.restaurant.priceRange} onChange={e => updateRestaurant('priceRange', e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none">
                  <option value="BUDGET">Budget (&lt;20 000 MGA)</option>
                  <option value="MODERATE">Modéré (20-50k MGA)</option>
                  <option value="UPSCALE">Haut de gamme (50-150k MGA)</option>
                  <option value="LUXURY">Luxe (&gt;150k MGA)</option>
                </select>
              </div>
            </div>

            {/* Cuisine types */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Types de cuisine</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {CUISINE_TYPES.map(c => (
                  <button key={c} onClick={() => {
                    const list = form.restaurant.cuisineTypes.includes(c)
                      ? form.restaurant.cuisineTypes.filter(x => x !== c)
                      : [...form.restaurant.cuisineTypes, c];
                    updateRestaurant('cuisineTypes', list);
                  }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.restaurant.cuisineTypes.includes(c) ? 'bg-[#ff6b35] text-white' : 'bg-[#080810] border border-[#1e1e2e] text-gray-400 hover:text-white'}`}>
                    {c.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Spécialités</label>
              <div className="flex gap-2 mb-2">
                <input value={newSpecialty} onChange={e => setNewSpecialty(e.target.value)} placeholder="Ajouter une spécialité..."
                  className="flex-1 px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newSpecialty.trim()) { updateRestaurant('specialties', [...form.restaurant.specialties, newSpecialty.trim()]); setNewSpecialty(''); } } }} />
                <button onClick={() => { if (newSpecialty.trim()) { updateRestaurant('specialties', [...form.restaurant.specialties, newSpecialty.trim()]); setNewSpecialty(''); } }}
                  className="px-3 py-2 bg-[#ff6b35] text-white rounded-xl text-sm"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.restaurant.specialties.map((s, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-[#080810] border border-[#1e1e2e] rounded-lg text-xs text-gray-300">
                    {s} <button onClick={() => updateRestaurant('specialties', form.restaurant.specialties.filter((_, idx) => idx !== i))}><X className="w-3 h-3 text-gray-500 hover:text-red-400" /></button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField label="Prix plat moyen (MGA)" value={form.restaurant.avgMainCourse} onChange={v => updateRestaurant('avgMainCourse', v)} type="number" />
              <InputField label="Prix bière moyenne (MGA)" value={form.restaurant.avgBeer} onChange={v => updateRestaurant('avgBeer', v)} type="number" />
            </div>
            <InputField label="URL Menu PDF" value={form.restaurant.menuPdfUrl} onChange={v => updateRestaurant('menuPdfUrl', v)} placeholder="https://..." />

            {/* Service toggles */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Services</label>
              <div className="grid grid-cols-3 gap-3">
                <ToggleField label="Livraison" value={form.restaurant.hasDelivery} onChange={v => updateRestaurant('hasDelivery', v)} />
                <ToggleField label="À emporter" value={form.restaurant.hasTakeaway} onChange={v => updateRestaurant('hasTakeaway', v)} />
                <ToggleField label="Réservation" value={form.restaurant.hasReservation} onChange={v => updateRestaurant('hasReservation', v)} />
                <ToggleField label="Parking" value={form.restaurant.hasParking} onChange={v => updateRestaurant('hasParking', v)} />
                <ToggleField label="WiFi" value={form.restaurant.hasWifi} onChange={v => updateRestaurant('hasWifi', v)} />
                <ToggleField label="Générateur" value={form.restaurant.hasGenerator} onChange={v => updateRestaurant('hasGenerator', v)} />
              </div>
            </div>
          </>
        )}

        {/* ===== SPECIFIC: ATTRACTION ===== */}
        {activeTab === 'specific' && form.type === 'ATTRACTION' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Type d'attraction</label>
                <select value={form.attraction.attractionType} onChange={e => updateAttraction('attractionType', e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none">
                  {ATTRACTION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <InputField label="Durée de visite" value={form.attraction.visitDuration} onChange={v => updateAttraction('visitDuration', v)} placeholder="2-3 heures" />
            </div>

            {/* Pricing */}
            <div className="p-4 bg-[#080810] border border-[#1e1e2e] rounded-xl space-y-3">
              <ToggleField label="Entrée gratuite" value={form.attraction.isFree} onChange={v => updateAttraction('isFree', v)} />
              {!form.attraction.isFree && (
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Tarif résidents (MGA)" value={form.attraction.entryFeeLocal} onChange={v => updateAttraction('entryFeeLocal', v)} type="number" placeholder="25 000" />
                  <InputField label="Tarif étrangers (MGA)" value={form.attraction.entryFeeForeign} onChange={v => updateAttraction('entryFeeForeign', v)} type="number" placeholder="75 000" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField label="Meilleure saison" value={form.attraction.bestSeason} onChange={v => updateAttraction('bestSeason', v)} placeholder="avril-octobre" />
              <InputField label="Meilleur moment" value={form.attraction.bestTimeToVisit} onChange={v => updateAttraction('bestTimeToVisit', v)} placeholder="Saison sèche" />
            </div>

            {/* Highlights */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Points forts</label>
              <div className="flex gap-2 mb-2">
                <input value={newHighlight} onChange={e => setNewHighlight(e.target.value)} placeholder="Ajouter un point fort..."
                  className="flex-1 px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newHighlight.trim()) { updateAttraction('highlights', [...form.attraction.highlights, newHighlight.trim()]); setNewHighlight(''); } } }} />
                <button onClick={() => { if (newHighlight.trim()) { updateAttraction('highlights', [...form.attraction.highlights, newHighlight.trim()]); setNewHighlight(''); } }}
                  className="px-3 py-2 bg-[#ff6b35] text-white rounded-xl text-sm"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.attraction.highlights.map((h, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-[#080810] border border-[#1e1e2e] rounded-lg text-xs text-gray-300">
                    {h} <button onClick={() => updateAttraction('highlights', form.attraction.highlights.filter((_, idx) => idx !== i))}><X className="w-3 h-3 text-gray-500 hover:text-red-400" /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Feature toggles */}
            <div className="grid grid-cols-2 gap-3">
              <ToggleField label="Accessible PMR" value={form.attraction.isAccessible} onChange={v => updateAttraction('isAccessible', v)} />
              <ToggleField label="Guide disponible" value={form.attraction.hasGuide} onChange={v => updateAttraction('hasGuide', v)} />
              <ToggleField label="Parking" value={form.attraction.hasParking} onChange={v => updateAttraction('hasParking', v)} />
              <ToggleField label="Restaurant sur place" value={form.attraction.hasRestaurant} onChange={v => updateAttraction('hasRestaurant', v)} />
            </div>
          </>
        )}

        {/* ===== SEO & STATUS ===== */}
        {activeTab === 'seo' && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <ToggleField label="Actif" value={form.isActive} onChange={v => updateField('isActive', v)} />
              <ToggleField label="Featured" value={form.isFeatured} onChange={v => updateField('isFeatured', v)} />
              <ToggleField label="Premium" value={form.isPremium} onChange={v => updateField('isPremium', v)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Statut de modération</label>
              <div className="flex gap-2">
                {[
                  { value: 'approved', label: 'Approuvé', color: 'green' },
                  { value: 'pending_review', label: 'En attente', color: 'yellow' },
                  { value: 'rejected', label: 'Rejeté', color: 'red' },
                ].map(s => (
                  <button key={s.value} onClick={() => updateField('moderationStatus', s.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${form.moderationStatus === s.value
                      ? `bg-${s.color}-500/10 border-${s.color}-500/30 text-${s.color}-400`
                      : 'bg-[#080810] border-[#1e1e2e] text-gray-500 hover:text-white'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <TextareaField label="Note de modération" value={form.moderationNote} onChange={v => updateField('moderationNote', v)} placeholder="Note interne..." rows={2} />

            <div className="border-t border-[#1e1e2e] pt-4 mt-4">
              <p className="text-xs text-gray-500 mb-3">SEO</p>
              <InputField label="Meta Title" value={form.metaTitle} onChange={v => updateField('metaTitle', v)} placeholder="Titre pour les moteurs de recherche" />
              <div className="mt-3">
                <TextareaField label="Meta Description" value={form.metaDescription} onChange={v => updateField('metaDescription', v)} placeholder="Description pour les moteurs de recherche" rows={2} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// FORM FIELD COMPONENTS
// ============================================================
function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white placeholder-gray-600 focus:border-[#ff6b35] focus:outline-none transition-colors" />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white placeholder-gray-600 focus:border-[#ff6b35] focus:outline-none transition-colors resize-none" />
    </div>
  );
}

function ToggleField({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#080810] transition-colors w-full text-left">
      <div className={`w-8 h-4.5 rounded-full relative transition-colors ${value ? 'bg-[#ff6b35]' : 'bg-[#1e1e2e]'}`}>
        <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${value ? 'left-[18px]' : 'left-0.5'}`} />
      </div>
      <span className="text-xs text-gray-300">{label}</span>
    </button>
  );
}
