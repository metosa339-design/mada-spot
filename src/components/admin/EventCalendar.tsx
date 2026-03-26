'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-url';
import {
  Loader2, ChevronLeft, ChevronRight, CalendarDays, CheckCircle,
  XCircle, Trash2, MapPin, Clock, X, Plus, Pin, Sparkles,
  ExternalLink, Users, Eye, Megaphone, Tag, Save, TimerOff,
  Crown, Link2, Package, Zap,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  city: string;
  region: string | null;
  category: string;
  coverImage: string | null;
  organizer: string | null;
  status: string;
  eventType: string;
  badge: string | null;
  isPinned: boolean;
  targetAudience: string;
  ctaLabel: string | null;
  ctaLink: string | null;
  isPromotion: boolean;
  priorityScore: number;
  linkedProductType: string | null;
  linkedProductId: string | null;
  establishment: { id: string; name: string; slug: string } | null;
  createdAt: string;
}

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  city: string;
  region: string;
  category: string;
  coverImage: string;
  organizer: string;
  eventType: string;
  badge: string;
  isPinned: boolean;
  targetAudience: string;
  ctaLabel: string;
  ctaLink: string;
  isPromotion: boolean;
  priorityScore: number;
  linkedProductType: string;
  linkedProductId: string;
}

const EMPTY_FORM: EventFormData = {
  title: '', description: '', startDate: '', endDate: '', location: '',
  city: '', region: '', category: 'FESTIVAL', coverImage: '', organizer: '',
  eventType: 'EVENT', badge: '', isPinned: false, targetAudience: 'ALL',
  ctaLabel: '', ctaLink: '', isPromotion: false, priorityScore: 0,
  linkedProductType: '', linkedProductId: '',
};

const PRODUCT_TYPES = [
  { value: '', label: 'Aucun', icon: Package },
  { value: 'LOCATION_VOITURE', label: 'Location voiture', icon: Package },
  { value: 'RESTAURANT', label: 'Restaurant', icon: Package },
  { value: 'HOTEL', label: 'Hôtel', icon: Package },
  { value: 'ATTRACTION', label: 'Attraction', icon: Package },
];

const CATEGORY_COLORS: Record<string, string> = {
  FESTIVAL: '#f97316', CULTURAL: '#8b5cf6', SPORT: '#3b82f6',
  NATURE: '#10b981', MARKET: '#f59e0b', OTHER: '#6b7280',
};

const CATEGORY_LABELS: Record<string, string> = {
  FESTIVAL: 'Festival', CULTURAL: 'Culturel', SPORT: 'Sport',
  NATURE: 'Nature', MARKET: 'Marché', OTHER: 'Autre',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444',
};

const EVENT_TYPE_LABELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  EVENT: { label: 'Événement', icon: CalendarDays },
  PROMOTION: { label: 'Promotion', icon: Tag },
  ADVERTISEMENT: { label: 'Publicité', icon: Megaphone },
};

const BADGE_OPTIONS = [
  { value: '', label: 'Aucun', color: '' },
  { value: 'NOUVEAU', label: 'NOUVEAU', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { value: 'PROMO', label: 'PROMO', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  { value: 'EXCLUSIF', label: 'EXCLUSIF', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
  { value: 'OFFICIEL', label: 'OFFICIEL', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
];

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'Tous', icon: Users },
  { value: 'TRAVELERS', label: 'Voyageurs', icon: Eye },
  { value: 'PROVIDERS', label: 'Prestataires', icon: Megaphone },
];

// ============================================================
// Calendar grid helpers
// ============================================================
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// ============================================================
// Main Component
// ============================================================
export default function EventCalendar() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Calendar state
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // View mode: calendar | create | edit
  const [viewMode, setViewMode] = useState<'calendar' | 'create' | 'edit'>('calendar');
  const [form, setForm] = useState<EventFormData>(EMPTY_FORM);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/events?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ---- ACTIONS ----
  const handleAction = async (eventId: string, status: string) => {
    setActionLoading(eventId);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchEvents();
        if (selectedEvent?.id === eventId) {
          setSelectedEvent(prev => prev ? { ...prev, status } : null);
        }
      }
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleTogglePin = async (eventId: string, currentlyPinned: boolean) => {
    setActionLoading(eventId);
    try {
      await fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPinned: !currentlyPinned }),
      });
      fetchEvents();
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(prev => prev ? { ...prev, isPinned: !currentlyPinned } : null);
      }
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Supprimer cet événement ?')) return;
    setActionLoading(eventId);
    try {
      await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE', credentials: 'include' });
      setSelectedEvent(null);
      fetchEvents();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  // ---- CREATE / EDIT ----
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setViewMode('create');
    setSelectedEvent(null);
  };

  const openEdit = (ev: EventItem) => {
    setForm({
      title: ev.title,
      description: ev.description || '',
      startDate: ev.startDate ? new Date(ev.startDate).toISOString().slice(0, 16) : '',
      endDate: ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 16) : '',
      location: ev.location || '',
      city: ev.city,
      region: ev.region || '',
      category: ev.category,
      coverImage: ev.coverImage || '',
      organizer: ev.organizer || '',
      eventType: ev.eventType || 'EVENT',
      badge: ev.badge || '',
      isPinned: ev.isPinned || false,
      targetAudience: ev.targetAudience || 'ALL',
      ctaLabel: ev.ctaLabel || '',
      ctaLink: ev.ctaLink || '',
      isPromotion: ev.isPromotion || false,
      priorityScore: ev.priorityScore || 0,
      linkedProductType: ev.linkedProductType || '',
      linkedProductId: ev.linkedProductId || '',
    });
    setViewMode('edit');
    setSelectedEvent(ev);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.startDate || !form.city.trim()) {
      alert('Titre, date de début et ville sont requis');
      return;
    }
    setSaving(true);
    try {
      if (viewMode === 'create') {
        // Fetch CSRF token
        const csrfRes = await fetch('/api/csrf', { credentials: 'include' });
        const csrfData = await csrfRes.json();

        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...form,
            badge: form.badge || null,
            endDate: form.endDate || null,
            linkedProductType: form.linkedProductType || null,
            linkedProductId: form.linkedProductId || null,
            csrfToken: csrfData.token,
          }),
        });
        if (res.ok) {
          setViewMode('calendar');
          fetchEvents();
        } else {
          const data = await res.json();
          alert(data.error || 'Erreur lors de la création');
        }
      } else if (viewMode === 'edit' && selectedEvent) {
        const res = await fetch(`/api/admin/events/${selectedEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...form,
            badge: form.badge || null,
            endDate: form.endDate || null,
            linkedProductType: form.linkedProductType || null,
            linkedProductId: form.linkedProductId || null,
          }),
        });
        if (res.ok) {
          setViewMode('calendar');
          setSelectedEvent(null);
          fetchEvents();
        } else {
          const data = await res.json();
          alert(data.error || 'Erreur lors de la mise à jour');
        }
      }
    } catch {
      alert('Erreur réseau');
    }
    setSaving(false);
  };

  // Navigate months
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  // Filter events by category
  const filteredEvents = events.filter(e => {
    if (categoryFilter && e.category !== categoryFilter) return false;
    return true;
  });

  // Build calendar grid data
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const eventsByDay = new Map<number, EventItem[]>();
  for (const ev of filteredEvents) {
    const start = new Date(ev.startDate);
    if (start.getFullYear() === year && start.getMonth() === month) {
      const day = start.getDate();
      if (!eventsByDay.has(day)) eventsByDay.set(day, []);
      eventsByDay.get(day)!.push(ev);
    }
    if (ev.endDate) {
      const end = new Date(ev.endDate);
      const s = new Date(ev.startDate);
      for (let d = new Date(Math.max(s.getTime(), new Date(year, month, 1).getTime())); d <= end && d.getMonth() === month && d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
        const day = d.getDate();
        if (!eventsByDay.has(day)) eventsByDay.set(day, []);
        const existing = eventsByDay.get(day)!;
        if (!existing.find(e => e.id === ev.id)) existing.push(ev);
      }
    }
  }

  const dayEvents = selectedDay ? (eventsByDay.get(selectedDay) || []) : [];
  const pendingCount = events.filter(e => e.status === 'PENDING').length;
  const pinnedCount = events.filter(e => e.isPinned).length;
  const expiredCount = events.filter(e => e.endDate && new Date(e.endDate) < new Date()).length;

  const isEventExpired = (ev: EventItem) => ev.endDate && new Date(ev.endDate) < new Date();

  if (loading) {
    return <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" /></div>;
  }

  // ============================================================
  // EVENT FORM (Create / Edit)
  // ============================================================
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            {viewMode === 'create' ? <Plus className="w-5 h-5 text-orange-400" /> : <Save className="w-5 h-5 text-orange-400" />}
            {viewMode === 'create' ? 'Créer un événement / promo' : 'Modifier l\'événement'}
          </h3>
          <button onClick={() => { setViewMode('calendar'); setSelectedEvent(null); }}
            className="p-2 rounded-lg hover:bg-[#1e1e2e] text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT - Main fields */}
          <div className="space-y-4">
            {/* Event Type selector */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Type de contenu</label>
              <div className="flex gap-2">
                {Object.entries(EVENT_TYPE_LABELS).map(([key, { label, icon: Icon }]) => (
                  <button key={key}
                    onClick={() => setForm(f => ({ ...f, eventType: key }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                      form.eventType === key
                        ? 'bg-[#ff6b35]/15 text-[#ff6b35] border-[#ff6b35]/30'
                        : 'bg-[#080810] border-[#1e1e2e] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Titre *</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Festival Donia à Nosy Be"
                className="w-full px-4 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white placeholder-gray-600 focus:border-[#ff6b35]/50 focus:outline-none" />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Description de l'événement..."
                className="w-full px-4 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white placeholder-gray-600 focus:border-[#ff6b35]/50 focus:outline-none resize-none" />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Date début *</label>
                <input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35]/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Date fin</label>
                <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35]/50 focus:outline-none" />
              </div>
            </div>

            {/* Location / City */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Ville *</label>
                <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="Nosy Be" className="w-full px-4 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white placeholder-gray-600 focus:border-[#ff6b35]/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Lieu</label>
                <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Hôtel XYZ" className="w-full px-4 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white placeholder-gray-600 focus:border-[#ff6b35]/50 focus:outline-none" />
              </div>
            </div>

            {/* Region / Organizer */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Région</label>
                <input type="text" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                  placeholder="Diana" className="w-full px-4 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white placeholder-gray-600 focus:border-[#ff6b35]/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Organisateur</label>
                <input type="text" value={form.organizer} onChange={e => setForm(f => ({ ...f, organizer: e.target.value }))}
                  placeholder="Office du Tourisme" className="w-full px-4 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white placeholder-gray-600 focus:border-[#ff6b35]/50 focus:outline-none" />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Catégorie *</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <button key={key}
                    onClick={() => setForm(f => ({ ...f, category: key }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      form.category === key ? 'text-white' : 'bg-[#080810] border-[#1e1e2e] text-gray-400 hover:text-white'
                    }`}
                    style={form.category === key ? { backgroundColor: `${CATEGORY_COLORS[key]}20`, borderColor: `${CATEGORY_COLORS[key]}40`, color: CATEGORY_COLORS[key] } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT - Promo & Media fields */}
          <div className="space-y-4">
            {/* Cover image */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Image de couverture (URL)</label>
              <input type="url" value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white placeholder-gray-600 focus:border-[#ff6b35]/50 focus:outline-none" />
              {form.coverImage && (
                <div className="mt-2 relative w-full aspect-video rounded-xl overflow-hidden border border-[#1e1e2e]">
                  <Image src={getImageUrl(form.coverImage)} alt="Preview" fill className="object-cover" unoptimized />
                </div>
              )}
            </div>

            {/* Badge selector */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Badge personnalisé</label>
              <div className="flex flex-wrap gap-2">
                {BADGE_OPTIONS.map(b => (
                  <button key={b.value}
                    onClick={() => setForm(f => ({ ...f, badge: b.value }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                      form.badge === b.value
                        ? (b.color || 'bg-[#ff6b35]/15 text-[#ff6b35] border-[#ff6b35]/30')
                        : 'bg-[#080810] border-[#1e1e2e] text-gray-400 hover:text-white'
                    }`}
                  >
                    {b.value && <Sparkles className="w-3 h-3" />}
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pin to top toggle */}
            <div className="flex items-center justify-between p-3 bg-[#080810] border border-[#1e1e2e] rounded-xl">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-orange-400" />
                <div>
                  <span className="text-sm text-white font-medium">Mettre en avant</span>
                  <p className="text-[10px] text-gray-500">Épingler dans le carrousel Hero</p>
                </div>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, isPinned: !f.isPinned }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.isPinned ? 'bg-orange-500' : 'bg-[#1e1e2e]'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.isPinned ? 'left-5.5 translate-x-0' : 'left-0.5'}`}
                  style={{ left: form.isPinned ? '22px' : '2px' }} />
              </button>
            </div>

            {/* Target Audience */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Ciblage</label>
              <div className="flex gap-2">
                {AUDIENCE_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button key={value}
                    onClick={() => setForm(f => ({ ...f, targetAudience: value }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                      form.targetAudience === value
                        ? 'bg-[#ff6b35]/15 text-[#ff6b35] border-[#ff6b35]/30'
                        : 'bg-[#080810] border-[#1e1e2e] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA fields */}
            <div className="p-4 bg-[#080810] border border-[#1e1e2e] rounded-xl space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <ExternalLink className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-white font-medium">Bouton d&apos;action (CTA)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Libellé</label>
                  <input type="text" value={form.ctaLabel} onChange={e => setForm(f => ({ ...f, ctaLabel: e.target.value }))}
                    placeholder="S'inscrire" className="w-full px-3 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-lg text-xs text-white placeholder-gray-600 focus:border-[#ff6b35]/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Lien</label>
                  <input type="url" value={form.ctaLink} onChange={e => setForm(f => ({ ...f, ctaLink: e.target.value }))}
                    placeholder="https://..." className="w-full px-3 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-lg text-xs text-white placeholder-gray-600 focus:border-[#ff6b35]/50 focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Régie Pub - Promotion & Priority */}
            <div className="p-4 bg-[#080810] border border-[#1e1e2e] rounded-xl space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white font-medium">Régie Publicitaire</span>
              </div>

              {/* isPromotion toggle */}
              <div className="flex items-center justify-between p-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <div>
                    <span className="text-sm text-white font-medium">Promotion</span>
                    <p className="text-[10px] text-gray-500">Marquer comme contenu promotionnel</p>
                  </div>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, isPromotion: !f.isPromotion }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${form.isPromotion ? 'bg-orange-500' : 'bg-[#1e1e2e]'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform`}
                    style={{ left: form.isPromotion ? '22px' : '2px' }} />
                </button>
              </div>

              {/* Priority Score */}
              <div>
                <label className="text-[10px] text-gray-500 mb-1.5 block">Priorité d&apos;affichage (0-10)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0} max={10}
                    value={form.priorityScore}
                    onChange={e => setForm(f => ({ ...f, priorityScore: parseInt(e.target.value) }))}
                    className="flex-1 h-2 rounded-full appearance-none bg-[#1e1e2e] accent-orange-500"
                  />
                  <span className={`text-sm font-bold min-w-[2rem] text-center ${
                    form.priorityScore >= 5 ? 'text-amber-400' : form.priorityScore > 0 ? 'text-orange-400' : 'text-gray-500'
                  }`}>
                    {form.priorityScore}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-gray-600">Normal</span>
                  <span className="text-[9px] text-amber-400/60">VIP (carte large)</span>
                </div>
              </div>
            </div>

            {/* Lien Produit */}
            <div className="p-4 bg-[#080810] border border-[#1e1e2e] rounded-xl space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Link2 className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white font-medium">Lien avec un produit</span>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1.5 block">Type de produit</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRODUCT_TYPES.map(pt => (
                    <button key={pt.value}
                      onClick={() => setForm(f => ({ ...f, linkedProductType: pt.value, linkedProductId: pt.value ? f.linkedProductId : '' }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        form.linkedProductType === pt.value
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                          : 'bg-[#0c0c16] border-[#1e1e2e] text-gray-400 hover:text-white'
                      }`}>
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>
              {form.linkedProductType && (
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">ID du produit lié</label>
                  <input type="text" value={form.linkedProductId} onChange={e => setForm(f => ({ ...f, linkedProductId: e.target.value }))}
                    placeholder="ID ou slug du produit..."
                    className="w-full px-3 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-lg text-xs text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none" />
                </div>
              )}
            </div>

            {/* Preview badge result */}
            {(form.badge || form.isPinned) && (
              <div className="p-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl">
                <p className="text-[10px] text-gray-500 mb-2">Aperçu des tags</p>
                <div className="flex flex-wrap gap-2">
                  {form.isPinned && (
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center gap-1">
                      <Pin className="w-2.5 h-2.5" /> ÉPINGLÉ
                    </span>
                  )}
                  {form.badge && (
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                      BADGE_OPTIONS.find(b => b.value === form.badge)?.color || ''
                    }`}>
                      <Sparkles className="w-2.5 h-2.5" /> {form.badge}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#1e1e2e]">
          <button onClick={() => { setViewMode('calendar'); setSelectedEvent(null); }}
            className="px-5 py-2.5 bg-[#080810] border border-[#1e1e2e] text-gray-400 text-sm rounded-xl hover:text-white transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-[#ff6b35] hover:bg-[#ff6b35]/80 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {viewMode === 'create' ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // CALENDAR VIEW
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Stats & Create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">Total : <strong className="text-white">{events.length}</strong></span>
          {pendingCount > 0 && (
            <span className="text-xs px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400">
              {pendingCount} en attente
            </span>
          )}
          {pinnedCount > 0 && (
            <span className="text-xs px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 flex items-center gap-1">
              <Pin className="w-3 h-3" /> {pinnedCount} épinglé{pinnedCount > 1 ? 's' : ''}
            </span>
          )}
          {expiredCount > 0 && (
            <span className="text-xs px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 flex items-center gap-1">
              <TimerOff className="w-3 h-3" /> {expiredCount} expiré{expiredCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#ff6b35] hover:bg-[#ff6b35]/80 text-white text-xs font-medium rounded-xl transition-colors">
          <Plus className="w-4 h-4" />
          Nouveau
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1.5">
          {[
            { value: '', label: 'Tous' },
            { value: 'PENDING', label: 'En attente' },
            { value: 'APPROVED', label: 'Approuvés' },
            { value: 'REJECTED', label: 'Refusés' },
          ].map(s => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s.value
                  ? 'bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30'
                  : 'bg-[#080810] border border-[#1e1e2e] text-gray-400 hover:text-white'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => setCategoryFilter(categoryFilter === key ? '' : key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === key ? 'text-white border' : 'bg-[#080810] border border-[#1e1e2e] text-gray-400 hover:text-white'
              }`}
              style={categoryFilter === key ? { backgroundColor: `${CATEGORY_COLORS[key]}20`, borderColor: `${CATEGORY_COLORS[key]}40`, color: CATEGORY_COLORS[key] } : {}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            <h4 className="text-base font-semibold">{MONTH_NAMES[month]} {year}</h4>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(d => (
              <div key={d} className="text-center text-[10px] text-gray-600 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayEvts = eventsByDay.get(day) || [];
              const isSelected = selectedDay === day;
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const hasPinned = dayEvts.some(e => e.isPinned);
              return (
                <button key={day} onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-start p-1 transition-all relative ${
                    isSelected ? 'bg-[#ff6b35]/10 border border-[#ff6b35]/30' :
                    isToday ? 'bg-[#1a1a2e] border border-[#2e2e3e]' :
                    'hover:bg-[#1a1a2e] border border-transparent'
                  }`}>
                  <span className={`text-xs ${isToday ? 'text-[#ff6b35] font-bold' : isSelected ? 'text-white font-medium' : 'text-gray-400'}`}>
                    {day}
                  </span>
                  {dayEvts.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayEvts.slice(0, 3).map(ev => (
                        <span key={ev.id} className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[ev.status] || '#6b7280' }} />
                      ))}
                      {dayEvts.length > 3 && (
                        <span className="text-[8px] text-gray-500">+{dayEvts.length - 3}</span>
                      )}
                    </div>
                  )}
                  {hasPinned && (
                    <Pin className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-orange-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5 max-h-[600px] overflow-y-auto">
          {selectedEvent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Détail</h4>
                <button onClick={() => setSelectedEvent(null)} className="p-1 rounded hover:bg-[#1e1e2e]">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              {selectedEvent.coverImage && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                  <Image src={getImageUrl(selectedEvent.coverImage)} alt={selectedEvent.title} fill className="object-cover" />
                </div>
              )}
              <div>
                <h5 className="text-base font-bold">{selectedEvent.title}</h5>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${CATEGORY_COLORS[selectedEvent.category]}20`, color: CATEGORY_COLORS[selectedEvent.category] }}>
                    {CATEGORY_LABELS[selectedEvent.category] || selectedEvent.category}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${STATUS_COLORS[selectedEvent.status]}20`, color: STATUS_COLORS[selectedEvent.status] }}>
                    {selectedEvent.status === 'PENDING' ? 'En attente' : selectedEvent.status === 'APPROVED' ? 'Approuvé' : 'Refusé'}
                  </span>
                  {selectedEvent.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> {selectedEvent.badge}
                    </span>
                  )}
                  {selectedEvent.isPinned && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-orange-500/10 text-orange-400 flex items-center gap-0.5">
                      <Pin className="w-2.5 h-2.5" /> Épinglé
                    </span>
                  )}
                  {isEventExpired(selectedEvent) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-0.5">
                      <TimerOff className="w-2.5 h-2.5" /> Expiré
                    </span>
                  )}
                </div>
              </div>
              {selectedEvent.description && (
                <p className="text-xs text-gray-400">{selectedEvent.description}</p>
              )}
              <div className="space-y-1.5 text-xs text-gray-500">
                <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />
                  {new Date(selectedEvent.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {selectedEvent.endDate && ` — ${new Date(selectedEvent.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
                </p>
                <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />
                  {selectedEvent.location || selectedEvent.city}
                </p>
                {selectedEvent.organizer && <p>Organisateur: {selectedEvent.organizer}</p>}
                {selectedEvent.ctaLabel && (
                  <p className="flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" />
                    CTA: {selectedEvent.ctaLabel} → {selectedEvent.ctaLink}
                  </p>
                )}
                <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />
                  Audience: {selectedEvent.targetAudience === 'ALL' ? 'Tous' : selectedEvent.targetAudience === 'TRAVELERS' ? 'Voyageurs' : 'Prestataires'}
                </p>
                {selectedEvent.priorityScore > 0 && (
                  <p className="flex items-center gap-1.5"><Crown className="w-3.5 h-3.5 text-amber-400" />
                    Priorité: <strong className="text-amber-400">{selectedEvent.priorityScore}</strong>/10
                    {selectedEvent.priorityScore >= 5 && <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">VIP</span>}
                  </p>
                )}
                {selectedEvent.isPromotion && (
                  <p className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-orange-400" />
                    Promotion active
                  </p>
                )}
                {selectedEvent.linkedProductType && (
                  <p className="flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5 text-purple-400" />
                    Produit lié: {selectedEvent.linkedProductType}
                    {selectedEvent.linkedProductId && ` → ${selectedEvent.linkedProductId}`}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  {selectedEvent.status !== 'APPROVED' && (
                    <button onClick={() => handleAction(selectedEvent.id, 'APPROVED')} disabled={actionLoading === selectedEvent.id}
                      className="flex-1 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded-xl hover:bg-green-500/20 flex items-center justify-center gap-1.5">
                      {actionLoading === selectedEvent.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approuver
                    </button>
                  )}
                  {selectedEvent.status !== 'REJECTED' && (
                    <button onClick={() => handleAction(selectedEvent.id, 'REJECTED')} disabled={actionLoading === selectedEvent.id}
                      className="flex-1 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl hover:bg-red-500/20 flex items-center justify-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" /> Rejeter
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleTogglePin(selectedEvent.id, selectedEvent.isPinned)} disabled={actionLoading === selectedEvent.id}
                    className={`flex-1 py-2 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 border ${
                      selectedEvent.isPinned
                        ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
                        : 'bg-[#080810] border-[#1e1e2e] text-gray-400 hover:text-orange-400'
                    }`}>
                    <Pin className="w-3.5 h-3.5" />
                    {selectedEvent.isPinned ? 'Désépingler' : 'Épingler'}
                  </button>
                  <button onClick={() => openEdit(selectedEvent)}
                    className="flex-1 py-2 bg-[#080810] border border-[#1e1e2e] text-gray-400 text-xs font-medium rounded-xl hover:text-white flex items-center justify-center gap-1.5">
                    <Save className="w-3.5 h-3.5" /> Modifier
                  </button>
                  <button onClick={() => handleDelete(selectedEvent.id)} disabled={actionLoading === selectedEvent.id}
                    className="py-2 px-3 bg-[#080810] border border-[#1e1e2e] text-gray-500 text-xs rounded-xl hover:bg-red-500/10 hover:text-red-400 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : selectedDay ? (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">{selectedDay} {MONTH_NAMES[month]}</h4>
              {dayEvents.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">Aucun événement ce jour</p>
              ) : (
                dayEvents.map(ev => (
                  <button key={ev.id} onClick={() => setSelectedEvent(ev)}
                    className="w-full text-left p-3 rounded-xl border border-[#1e1e2e] hover:border-[#ff6b35]/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: isEventExpired(ev) ? '#ef4444' : STATUS_COLORS[ev.status] }} />
                      <p className={`text-sm font-medium truncate ${isEventExpired(ev) ? 'line-through text-gray-600' : ''}`}>{ev.title}</p>
                      {ev.isPinned && <Pin className="w-3 h-3 text-orange-400 flex-shrink-0" />}
                      {isEventExpired(ev) && <TimerOff className="w-3 h-3 text-red-400 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${CATEGORY_COLORS[ev.category]}20`, color: CATEGORY_COLORS[ev.category] }}>
                        {CATEGORY_LABELS[ev.category] || ev.category}
                      </span>
                      {ev.badge && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-orange-500/10 text-orange-400 font-bold">
                          {ev.badge}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-600">{ev.city}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sélectionnez un jour</p>
              <p className="text-[10px] text-gray-600 mt-1">Les points indiquent des événements</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
