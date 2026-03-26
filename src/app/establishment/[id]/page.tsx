'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { getImageUrl } from '@/lib/image-url';
import {
  ArrowLeft, Save, Loader2, Star, Eye, MessageCircle,
  Building2, Hotel, UtensilsCrossed, Compass, MapPin,
  Plus, X, Trash2, Image as _ImageIcon, Send, Calendar,
} from 'lucide-react';
import { useCsrf } from '@/hooks/useCsrf';

// ============================================================
// Types
// ============================================================
interface ReviewData {
  id: string;
  authorName: string | null;
  rating: number;
  title: string | null;
  comment: string;
  ownerResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
}

// ============================================================
// Helpers
// ============================================================
function safeJsonParse(val: any, fallback: any = []) {
  if (Array.isArray(val)) return val;
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

const HOTEL_AMENITIES = ['wifi', 'parking', 'pool', 'restaurant', 'spa', 'ac', 'tv', 'generator', 'gym', 'minibar'];
const CUISINE_TYPES = ['malgache', 'francais', 'chinois', 'italien', 'indien', 'japonais', 'africain', 'fast_food', 'pizza', 'fruits_de_mer'];

// ============================================================
// Main Page
// ============================================================
export default function EstablishmentDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { csrfToken } = useCsrf();
  const [establishment, setEstablishment] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editable form state
  const [form, setForm] = useState<any>({});
  const [newImageUrl, setNewImageUrl] = useState('');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [respondLoading, setRespondLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/establishments/${id}/manage`, { credentials: 'include' });
      const data = await res.json();
      if (!data.success) {
        if (data.error?.includes('Non autorisé') || data.error?.includes('Session')) router.push('/login');
        else if (data.error?.includes('propriétaire')) router.push('/establishment');
        return;
      }
      setEstablishment(data.establishment);
      setStats(data.stats);

      const est = data.establishment;
      setForm({
        description: est.description || '',
        shortDescription: est.shortDescription || '',
        nameEn: est.nameEn || '',
        descriptionEn: est.descriptionEn || '',
        address: est.address || '',
        phone: est.phone || '',
        phone2: est.phone2 || '',
        email: est.email || '',
        website: est.website || '',
        facebook: est.facebook || '',
        instagram: est.instagram || '',
        whatsapp: est.whatsapp || '',
        coverImage: est.coverImage || '',
        images: safeJsonParse(est.images),
        latitude: est.latitude?.toString() || '',
        longitude: est.longitude?.toString() || '',
        // Hotel
        hotel: est.hotel ? {
          amenities: safeJsonParse(est.hotel.amenities),
          checkInTime: est.hotel.checkInTime || '14:00',
          checkOutTime: est.hotel.checkOutTime || '11:00',
          roomTypes: (est.hotel.roomTypes || []).map((r: any) => ({
            name: r.name, description: r.description || '', capacity: r.capacity,
            pricePerNight: r.pricePerNight, priceWeekend: r.priceWeekend, isAvailable: r.isAvailable,
          })),
        } : null,
        // Restaurant
        restaurant: est.restaurant ? {
          cuisineTypes: safeJsonParse(est.restaurant.cuisineTypes),
          specialties: safeJsonParse(est.restaurant.specialties),
          menuPdfUrl: est.restaurant.menuPdfUrl || '',
          avgMainCourse: est.restaurant.avgMainCourse?.toString() || '',
          avgBeer: est.restaurant.avgBeer?.toString() || '',
          hasDelivery: est.restaurant.hasDelivery,
          hasTakeaway: est.restaurant.hasTakeaway,
          hasReservation: est.restaurant.hasReservation,
          hasParking: est.restaurant.hasParking,
          hasWifi: est.restaurant.hasWifi,
          hasGenerator: est.restaurant.hasGenerator,
        } : null,
        // Attraction
        attraction: est.attraction ? {
          entryFeeForeign: est.attraction.entryFeeForeign?.toString() || '',
          entryFeeLocal: est.attraction.entryFeeLocal?.toString() || '',
          visitDuration: est.attraction.visitDuration || '',
          bestSeason: est.attraction.bestSeason || '',
          highlights: safeJsonParse(est.attraction.highlights),
          isAccessible: est.attraction.isAccessible,
          hasGuide: est.attraction.hasGuide,
          hasParking: est.attraction.hasParking,
          hasRestaurant: est.attraction.hasRestaurant,
        } : null,
      });
    } catch { setMessage({ type: 'error', text: 'Erreur de chargement' }); }
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/establishments/${id}/manage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Modifications enregistrées !' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur' });
      }
    } catch { setMessage({ type: 'error', text: 'Erreur réseau' }); }
    setSaving(false);
  };

  const handleRespondReview = async (reviewId: string) => {
    if (!responseText.trim()) return;
    setRespondLoading(true);
    try {
      const res = await fetch(`/api/establishments/${id}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        credentials: 'include',
        body: JSON.stringify({ ownerResponse: responseText }),
      });
      const data = await res.json();
      if (data.success) {
        setRespondingTo(null);
        setResponseText('');
        fetchData();
      }
    } catch {}
    setRespondLoading(false);
  };

  const updateField = (field: string, value: any) => setForm((prev: any) => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060610] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="min-h-screen bg-[#060610] flex items-center justify-center text-white">
        <p>Établissement non trouvé ou accès refusé.</p>
      </div>
    );
  }

  const typeIcons: Record<string, any> = { HOTEL: Hotel, RESTAURANT: UtensilsCrossed, ATTRACTION: Compass };
  const TypeIcon = typeIcons[establishment.type] || Building2;
  const reviews: ReviewData[] = establishment.reviews || [];

  const TABS = [
    { id: 'overview', label: 'Aperçu' },
    { id: 'info', label: 'Informations' },
    { id: 'media', label: 'Photos' },
    { id: 'specific', label: establishment.type === 'HOTEL' ? 'Chambres & Tarifs' : establishment.type === 'RESTAURANT' ? 'Menu & Services' : 'Tarifs & Infos' },
    { id: 'reviews', label: `Avis (${reviews.length})` },
    { id: 'bookings', label: 'Réservations' },
  ];

  return (
    <div className="min-h-screen bg-[#060610] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/establishment" className="p-2 rounded-xl bg-[#080810] border border-[#1e1e2e] hover:bg-[#1e1e2e]">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <TypeIcon className="w-5 h-5 text-[#ff6b35]" /> {establishment.name}
              </h1>
              <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {establishment.city}</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#e55a2b] disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-xl text-sm font-medium mb-4 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[#080810] border border-[#1e1e2e] rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-[#ff6b35] text-white' : 'text-gray-400 hover:text-white'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW ===== */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Eye, label: 'Vues', value: stats.viewCount, color: '#3b82f6' },
                { icon: Star, label: 'Note moyenne', value: stats.avgRating.toFixed(1), color: '#eab308' },
                { icon: MessageCircle, label: 'Avis', value: stats.reviewCount, color: '#10b981' },
              ].map((stat, i) => (
                <div key={i} className="p-5 bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl">
                  <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
            {establishment.coverImage && (
              <div className="relative rounded-2xl overflow-hidden border border-[#1e1e2e] h-48">
                <NextImage src={getImageUrl(establishment.coverImage)} alt={establishment.name || 'Établissement'} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
              </div>
            )}
          </div>
        )}

        {/* ===== INFO ===== */}
        {activeTab === 'info' && (
          <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
              <textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={4}
                className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Description courte</label>
              <input value={form.shortDescription} onChange={e => updateField('shortDescription', e.target.value)}
                className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Adresse</label>
                <input value={form.address} onChange={e => updateField('address', e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Téléphone</label>
                <input value={form.phone} onChange={e => updateField('phone', e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                <input value={form.email} onChange={e => updateField('email', e.target.value)} type="email"
                  className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Site web</label>
                <input value={form.website} onChange={e => updateField('website', e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Facebook</label>
                <input value={form.facebook} onChange={e => updateField('facebook', e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Instagram</label>
                <input value={form.instagram} onChange={e => updateField('instagram', e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">WhatsApp</label>
                <input value={form.whatsapp} onChange={e => updateField('whatsapp', e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* ===== MEDIA ===== */}
        {activeTab === 'media' && (
          <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Image de couverture (URL)</label>
              <input value={form.coverImage} onChange={e => updateField('coverImage', e.target.value)}
                className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" placeholder="https://..." />
              {form.coverImage && <div className="relative mt-2 w-48 h-32 rounded-xl overflow-hidden border border-[#1e1e2e]"><NextImage src={getImageUrl(form.coverImage)} alt="Aperçu image de couverture" fill sizes="192px" className="object-cover" /></div>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Galerie</label>
              <div className="flex gap-2 mb-3">
                <input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="URL de l'image..."
                  className="flex-1 px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none"
                  onKeyDown={e => { if (e.key === 'Enter' && newImageUrl.trim()) { updateField('images', [...form.images, newImageUrl.trim()]); setNewImageUrl(''); } }} />
                <button onClick={() => { if (newImageUrl.trim()) { updateField('images', [...form.images, newImageUrl.trim()]); setNewImageUrl(''); } }}
                  className="px-3 py-2 bg-[#ff6b35] text-white rounded-xl"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {form.images?.map((img: string, idx: number) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#1e1e2e] aspect-video">
                    <NextImage src={img} alt={`Photo ${idx + 1} de la galerie`} fill sizes="25vw" className="object-cover" />
                    <button onClick={() => updateField('images', form.images.filter((_: any, i: number) => i !== idx))}
                      className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== SPECIFIC (Hotel/Restaurant/Attraction) ===== */}
        {activeTab === 'specific' && (
          <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-6 space-y-4">

            {/* HOTEL */}
            {establishment.type === 'HOTEL' && form.hotel && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Check-in</label>
                    <input type="time" value={form.hotel.checkInTime} onChange={e => setForm((p: any) => ({ ...p, hotel: { ...p.hotel, checkInTime: e.target.value } }))}
                      className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Check-out</label>
                    <input type="time" value={form.hotel.checkOutTime} onChange={e => setForm((p: any) => ({ ...p, hotel: { ...p.hotel, checkOutTime: e.target.value } }))}
                      className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Équipements</label>
                  <div className="flex flex-wrap gap-2">
                    {HOTEL_AMENITIES.map(a => (
                      <button key={a} onClick={() => {
                        const list = form.hotel.amenities.includes(a) ? form.hotel.amenities.filter((x: string) => x !== a) : [...form.hotel.amenities, a];
                        setForm((p: any) => ({ ...p, hotel: { ...p.hotel, amenities: list } }));
                      }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.hotel.amenities.includes(a) ? 'bg-[#ff6b35] text-white' : 'bg-[#080810] border border-[#1e1e2e] text-gray-400'}`}>
                        {a.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Room Types */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">Chambres & Tarifs</label>
                    <button onClick={() => setForm((p: any) => ({ ...p, hotel: { ...p.hotel, roomTypes: [...p.hotel.roomTypes, { name: '', description: '', capacity: 2, pricePerNight: 0, priceWeekend: null, isAvailable: true }] } }))}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#ff6b35]/10 border border-[#ff6b35]/20 rounded-lg text-xs text-[#ff6b35]">
                      <Plus className="w-3 h-3" /> Ajouter
                    </button>
                  </div>
                  {form.hotel.roomTypes.map((room: any, idx: number) => (
                    <div key={idx} className="p-4 bg-[#080810] border border-[#1e1e2e] rounded-xl mb-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Chambre #{idx + 1}</span>
                        <button onClick={() => setForm((p: any) => ({ ...p, hotel: { ...p.hotel, roomTypes: p.hotel.roomTypes.filter((_: any, i: number) => i !== idx) } }))}
                          className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <input value={room.name} onChange={e => { const r = [...form.hotel.roomTypes]; r[idx].name = e.target.value; setForm((p: any) => ({ ...p, hotel: { ...p.hotel, roomTypes: r } })); }}
                          placeholder="Nom" className="px-3 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
                        <input type="number" value={room.pricePerNight} onChange={e => { const r = [...form.hotel.roomTypes]; r[idx].pricePerNight = parseFloat(e.target.value) || 0; setForm((p: any) => ({ ...p, hotel: { ...p.hotel, roomTypes: r } })); }}
                          placeholder="Prix/nuit (MGA)" className="px-3 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
                        <input type="number" value={room.capacity} onChange={e => { const r = [...form.hotel.roomTypes]; r[idx].capacity = parseInt(e.target.value) || 2; setForm((p: any) => ({ ...p, hotel: { ...p.hotel, roomTypes: r } })); }}
                          placeholder="Capacité" className="px-3 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* RESTAURANT */}
            {establishment.type === 'RESTAURANT' && form.restaurant && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Prix plat moyen (MGA)</label>
                    <input type="number" value={form.restaurant.avgMainCourse} onChange={e => setForm((p: any) => ({ ...p, restaurant: { ...p.restaurant, avgMainCourse: e.target.value } }))}
                      className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Prix bière moyenne (MGA)</label>
                    <input type="number" value={form.restaurant.avgBeer} onChange={e => setForm((p: any) => ({ ...p, restaurant: { ...p.restaurant, avgBeer: e.target.value } }))}
                      className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Types de cuisine</label>
                  <div className="flex flex-wrap gap-2">
                    {CUISINE_TYPES.map(c => (
                      <button key={c} onClick={() => {
                        const list = form.restaurant.cuisineTypes.includes(c) ? form.restaurant.cuisineTypes.filter((x: string) => x !== c) : [...form.restaurant.cuisineTypes, c];
                        setForm((p: any) => ({ ...p, restaurant: { ...p.restaurant, cuisineTypes: list } }));
                      }} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${form.restaurant.cuisineTypes.includes(c) ? 'bg-[#ff6b35] text-white' : 'bg-[#080810] border border-[#1e1e2e] text-gray-400'}`}>
                        {c.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Services</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'hasDelivery', label: 'Livraison' }, { key: 'hasTakeaway', label: 'À emporter' },
                      { key: 'hasReservation', label: 'Réservation' }, { key: 'hasParking', label: 'Parking' },
                      { key: 'hasWifi', label: 'WiFi' }, { key: 'hasGenerator', label: 'Générateur' },
                    ].map(({ key, label }) => (
                      <button key={key} onClick={() => setForm((p: any) => ({ ...p, restaurant: { ...p.restaurant, [key]: !p.restaurant[key] } }))}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs ${form.restaurant[key] ? 'bg-[#ff6b35]/10 border border-[#ff6b35]/20 text-[#ff6b35]' : 'bg-[#080810] border border-[#1e1e2e] text-gray-400'}`}>
                        <div className={`w-3 h-3 rounded-full ${form.restaurant[key] ? 'bg-[#ff6b35]' : 'bg-[#1e1e2e]'}`} /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ATTRACTION */}
            {establishment.type === 'ATTRACTION' && form.attraction && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Tarif résidents (MGA)</label>
                    <input type="number" value={form.attraction.entryFeeLocal} onChange={e => setForm((p: any) => ({ ...p, attraction: { ...p.attraction, entryFeeLocal: e.target.value } }))}
                      className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Tarif étrangers (MGA)</label>
                    <input type="number" value={form.attraction.entryFeeForeign} onChange={e => setForm((p: any) => ({ ...p, attraction: { ...p.attraction, entryFeeForeign: e.target.value } }))}
                      className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Durée de visite</label>
                    <input value={form.attraction.visitDuration} onChange={e => setForm((p: any) => ({ ...p, attraction: { ...p.attraction, visitDuration: e.target.value } }))}
                      placeholder="2-3 heures" className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Meilleure saison</label>
                    <input value={form.attraction.bestSeason} onChange={e => setForm((p: any) => ({ ...p, attraction: { ...p.attraction, bestSeason: e.target.value } }))}
                      placeholder="avril-octobre" className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'isAccessible', label: 'Accessible PMR' }, { key: 'hasGuide', label: 'Guide disponible' },
                    { key: 'hasParking', label: 'Parking' }, { key: 'hasRestaurant', label: 'Restaurant sur place' },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setForm((p: any) => ({ ...p, attraction: { ...p.attraction, [key]: !p.attraction[key] } }))}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs ${form.attraction[key] ? 'bg-[#ff6b35]/10 border border-[#ff6b35]/20 text-[#ff6b35]' : 'bg-[#080810] border border-[#1e1e2e] text-gray-400'}`}>
                      <div className={`w-3 h-3 rounded-full ${form.attraction[key] ? 'bg-[#ff6b35]' : 'bg-[#1e1e2e]'}`} /> {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== REVIEWS ===== */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl">
                <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">Aucun avis pour le moment</p>
              </div>
            ) : reviews.map((review: ReviewData) => (
              <div key={review.id} className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{review.authorName || 'Anonyme'}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className="w-3.5 h-3.5" fill={s <= review.rating ? '#eab308' : 'none'} stroke={s <= review.rating ? '#eab308' : '#4b5563'} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                {review.title && <p className="text-sm font-medium mb-1">{review.title}</p>}
                <p className="text-sm text-gray-300">{review.comment}</p>

                {/* Owner Response */}
                {review.ownerResponse ? (
                  <div className="mt-3 p-3 bg-[#080810] border border-[#1e1e2e] rounded-xl">
                    <p className="text-[10px] text-[#ff6b35] font-medium mb-1">Votre réponse</p>
                    <p className="text-xs text-gray-300">{review.ownerResponse}</p>
                  </div>
                ) : (
                  <div className="mt-3">
                    {respondingTo === review.id ? (
                      <div className="flex gap-2">
                        <input value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Votre réponse..."
                          className="flex-1 px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none"
                          onKeyDown={e => { if (e.key === 'Enter') handleRespondReview(review.id); }} />
                        <button onClick={() => handleRespondReview(review.id)} disabled={respondLoading}
                          className="px-3 py-2 bg-[#ff6b35] text-white rounded-xl disabled:opacity-50">
                          {respondLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                        <button onClick={() => { setRespondingTo(null); setResponseText(''); }}
                          className="px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-xl"><X className="w-4 h-4 text-gray-400" /></button>
                      </div>
                    ) : (
                      <button onClick={() => setRespondingTo(review.id)}
                        className="text-xs text-[#ff6b35] hover:underline">Répondre</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <OwnerBookingsTab establishmentId={establishment.id} csrfToken={csrfToken} />
        )}
      </div>
    </div>
  );
}

/* ============================================ */
/* Composant inline pour les réservations owner */
/* ============================================ */
function OwnerBookingsTab({ establishmentId, csrfToken }: { establishmentId: string; csrfToken: string | null }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/establishments/${establishmentId}/bookings?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
        setStats(data.stats);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [establishmentId, filter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleAction = async (bookingId: string, action: string) => {
    setActionLoading(bookingId);
    try {
      await fetch(`/api/establishments/${establishmentId}/bookings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        credentials: 'include',
        body: JSON.stringify({ bookingId, action }),
      });
      fetchBookings();
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
    completed: 'bg-blue-500/20 text-blue-400',
    no_show: 'bg-gray-500/20 text-gray-400',
  };
  const STATUS_LABELS: Record<string, string> = {
    pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé', completed: 'Terminé', no_show: 'No Show',
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'En attente', value: stats.pending, color: 'text-yellow-400' },
            { label: 'Confirmées', value: stats.confirmed, color: 'text-green-400' },
            { label: 'Terminées', value: stats.completed, color: 'text-blue-400' },
          ].map((s) => (
            <div key={s.label} className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${filter === f ? 'bg-[#ff6b35] text-white' : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-400 hover:text-white'}`}>
            {f === 'all' ? 'Toutes' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#ff6b35]" /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl">
          <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Aucune réservation</p>
        </div>
      ) : (
        bookings.map((b: any) => (
          <div key={b.id} className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-[#ff6b35]">{b.reference}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[b.status] || ''}`}>
                    {STATUS_LABELS[b.status] || b.status}
                  </span>
                </div>
                <p className="text-sm font-medium">{b.guestName}</p>
                <p className="text-xs text-gray-500">
                  {new Date(b.checkIn).toLocaleDateString('fr-FR')}
                  {b.checkOut ? ` → ${new Date(b.checkOut).toLocaleDateString('fr-FR')}` : ''}
                  {' · '}{b.guestCount} pers.
                  {b.totalPrice ? ` · ${b.totalPrice.toLocaleString()} ${b.currency}` : ''}
                </p>
                {b.user && <p className="text-[10px] text-gray-600 mt-1">{b.user.email || b.user.phone}</p>}
                {b.specialRequests && <p className="text-[10px] text-gray-500 italic mt-1">"{b.specialRequests}"</p>}
              </div>
              <div className="flex gap-1.5 shrink-0">
                {b.status === 'pending' && (
                  <>
                    <button onClick={() => handleAction(b.id, 'confirm')} disabled={actionLoading === b.id}
                      className="px-2.5 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50">
                      {actionLoading === b.id ? '...' : 'Confirmer'}
                    </button>
                    <button onClick={() => handleAction(b.id, 'cancel')} disabled={actionLoading === b.id}
                      className="px-2.5 py-1 bg-red-600/20 text-red-400 rounded-lg text-xs hover:bg-red-600/30 disabled:opacity-50">
                      Refuser
                    </button>
                  </>
                )}
                {b.status === 'confirmed' && (
                  <button onClick={() => handleAction(b.id, 'complete')} disabled={actionLoading === b.id}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50">
                    Terminer
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
