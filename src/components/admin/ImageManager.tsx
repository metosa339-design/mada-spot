'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-url';
import { useToast } from '@/contexts/ToastContext';
import {
  Search, Loader2, RefreshCw, ImageIcon, Trash2, Star, Plus, X,
} from 'lucide-react';

interface AttractionImage {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  type: string;
  coverImage: string | null;
  gallery: string[];
  totalImages: number;
  hasRealImages: boolean;
}

export default function ImageManager() {
  const { error: toastError } = useToast();
  const [attractions, setAttractions] = useState<AttractionImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AttractionImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'no_images' | 'has_images'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'images_asc' | 'images_desc'>('name');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ATTRACTION' | 'HOTEL' | 'RESTAURANT'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttractions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await fetch(`/api/admin/attraction-images?${params.toString()}`);
      const data = await res.json();
      setAttractions(data.attractions || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [search, typeFilter]);

  useEffect(() => { fetchAttractions(); }, [fetchAttractions]);

  const refreshSelected = useCallback(async (slug: string) => {
    try {
      const res = await fetch(`/api/admin/attraction-images?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (data.attractions?.length > 0) {
        setSelected(data.attractions[0]);
      }
    } catch { /* ignore */ }
  }, []);

  const handleUpload = async (file: File, setAsCover: boolean = false) => {
    if (!selected) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('attractionId', selected.id);
      if (setAsCover) formData.append('setAsCover', 'true');

      const res = await fetch('/api/admin/attraction-images', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        await refreshSelected(selected.slug);
        fetchAttractions();
      } else {
        toastError(data.error || 'Erreur upload');
      }
    } catch { toastError('Erreur reseau'); }
    setUploading(false);
  };

  const handleDelete = async (imagePath: string) => {
    if (!selected || !confirm('Supprimer cette image ?')) return;
    setActionLoading(imagePath);
    try {
      const res = await fetch(
        `/api/admin/attraction-images?attractionId=${selected.id}&imagePath=${encodeURIComponent(imagePath)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        await refreshSelected(selected.slug);
        fetchAttractions();
      }
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleSetCover = async (imagePath: string) => {
    if (!selected) return;
    setActionLoading(imagePath);
    try {
      const res = await fetch('/api/admin/attraction-images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attractionId: selected.id, action: 'set_cover', imagePath }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshSelected(selected.slug);
        fetchAttractions();
      }
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0 && selected) {
      handleUpload(files[0]);
    }
  };

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/sync-assets', { method: 'POST' });
      const data = await res.json();
      setSyncResult(data.message || 'Sync termine');
      fetchAttractions();
      if (selected) refreshSelected(selected.slug);
    } catch { setSyncResult('Erreur sync'); }
    setSyncLoading(false);
  };

  // ---- Detail view ----
  if (selected) {
    const allImages = [
      ...(selected.coverImage ? [{ path: selected.coverImage, isCover: true }] : []),
      ...selected.gallery.map(p => ({ path: p, isCover: false })),
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelected(null)}
            className="p-2 bg-[#080810] border border-[#1e1e2e] rounded-xl hover:bg-[#1e1e2e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h4 className="text-lg font-bold">{selected.name}</h4>
            <p className="text-xs text-gray-500">{selected.city} — {selected.slug}</p>
          </div>
          <span className="ml-auto text-sm text-gray-400">{selected.totalImages} image{selected.totalImages !== 1 ? 's' : ''}</span>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-[#ff6b35] bg-[#ff6b35]/5'
              : 'border-[#1e1e2e] hover:border-[#ff6b35]/50 hover:bg-[#080810]'
          }`}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#ff6b35]" />
          ) : (
            <>
              <Plus className="w-8 h-8 mx-auto text-gray-500 mb-2" />
              <p className="text-sm text-gray-400">Glisser une image ici ou cliquer pour parcourir</p>
              <p className="text-xs text-gray-600 mt-1">JPG, PNG, WebP, GIF — Max 10 Mo</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = '';
            }}
          />
        </div>

        {/* Images grid */}
        {allImages.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Aucune image pour cette attraction</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allImages.map(({ path: imgPath, isCover }) => (
              <div
                key={imgPath}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                  isCover ? 'border-[#ff6b35]' : 'border-[#1e1e2e] hover:border-[#2e2e3e]'
                }`}
              >
                <div className="aspect-[4/3] relative">
                  <Image src={imgPath} alt={selected.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                  {isCover && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#ff6b35] text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> Couverture
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {actionLoading === imgPath ? (
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      <>
                        {!isCover && (
                          <button
                            onClick={() => handleSetCover(imgPath)}
                            title="Definir comme couverture"
                            className="p-2 bg-[#ff6b35]/90 rounded-xl hover:bg-[#ff6b35] transition-colors"
                          >
                            <Star className="w-4 h-4 text-white" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(imgPath)}
                          title="Supprimer"
                          className="p-2 bg-red-500/90 rounded-xl hover:bg-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-[#080810]">
                  <p className="text-[10px] text-gray-500 truncate">{imgPath.split('/').pop()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- Filtered & sorted list ----
  const stats = {
    total: attractions.length,
    withImages: attractions.filter(a => a.hasRealImages).length,
    noImages: attractions.filter(a => !a.hasRealImages).length,
    totalPhotos: attractions.reduce((sum, a) => sum + a.totalImages, 0),
  };

  const filtered = attractions
    .filter(a => {
      if (filter === 'no_images') return !a.hasRealImages;
      if (filter === 'has_images') return a.hasRealImages;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'images_asc') return a.totalImages - b.totalImages;
      if (sortBy === 'images_desc') return b.totalImages - a.totalImages;
      return a.name.localeCompare(b.name);
    });

  // ---- List view ----
  return (
    <div className="space-y-4">
      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Attractions</p>
          </div>
          <div className="p-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-center">
            <p className="text-2xl font-bold text-green-400">{stats.withImages}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avec images</p>
          </div>
          <div className="p-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-center">
            <p className="text-2xl font-bold text-red-400">{stats.noImages}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Sans images</p>
          </div>
          <div className="p-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-center">
            <p className="text-2xl font-bold text-[#ff6b35]">{stats.totalPhotos}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Photos total</p>
          </div>
        </div>
      )}

      {/* Search + sync */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une attraction..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#ff6b35]/50"
          />
        </div>
        <button
          onClick={handleSync}
          disabled={syncLoading}
          className="px-4 py-2.5 bg-[#ff6b35]/10 border border-[#ff6b35]/20 text-[#ff6b35] rounded-xl text-sm font-medium hover:bg-[#ff6b35]/20 transition-colors flex items-center gap-2"
        >
          {syncLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync dossiers
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-1.5">
        {([
          { key: 'all', label: 'Tous', color: '#ff6b35' },
          { key: 'ATTRACTION', label: 'Attractions', color: '#10b981' },
          { key: 'HOTEL', label: 'Hotels', color: '#3b82f6' },
          { key: 'RESTAURANT', label: 'Restaurants', color: '#f97316' },
        ] as const).map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              typeFilter === key
                ? 'text-white'
                : 'bg-[#080810] text-gray-400 border border-[#1e1e2e] hover:text-white'
            }`}
            style={typeFilter === key ? { backgroundColor: `${color}20`, color, borderColor: `${color}40`, border: `1px solid ${color}40` } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {([
            { key: 'all', label: `Tous (${stats.total})` },
            { key: 'no_images', label: `Sans images (${stats.noImages})` },
            { key: 'has_images', label: `Avec images (${stats.withImages})` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === key
                  ? key === 'no_images' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30'
                  : 'bg-[#080810] text-gray-400 border border-[#1e1e2e] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          {([
            { key: 'name', label: 'A-Z' },
            { key: 'images_asc', label: 'Moins de photos' },
            { key: 'images_desc', label: 'Plus de photos' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sortBy === key
                  ? 'bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30'
                  : 'bg-[#080810] text-gray-400 border border-[#1e1e2e] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {syncResult && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-400">
          {syncResult}
        </div>
      )}

      {/* Attractions list */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Aucune attraction trouvee</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className={`w-full flex items-center gap-4 p-3 border rounded-xl hover:border-[#ff6b35]/30 transition-all text-left ${
                a.totalImages === 0
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-[#0c0c16] border-[#1e1e2e]'
              }`}
            >
              {a.coverImage ? (
                <div className="relative w-14 h-14 rounded-lg flex-shrink-0">
                  <Image src={getImageUrl(a.coverImage)} alt={a.name || 'Image'} fill sizes="56px" className="rounded-lg object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-[#080810] flex items-center justify-center flex-shrink-0 border border-red-500/20">
                  <ImageIcon className="w-5 h-5 text-red-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{a.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0" style={{
                    backgroundColor: a.type === 'HOTEL' ? '#3b82f620' : a.type === 'RESTAURANT' ? '#f9731620' : '#10b98120',
                    color: a.type === 'HOTEL' ? '#3b82f6' : a.type === 'RESTAURANT' ? '#f97316' : '#10b981',
                  }}>
                    {a.type === 'HOTEL' ? 'Hotel' : a.type === 'RESTAURANT' ? 'Restaurant' : 'Attraction'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{a.city || 'Ville inconnue'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: a.hasRealImages ? '#10b981' : '#ef4444' }}>
                  {a.totalImages}
                </p>
                <p className="text-[10px] text-gray-600">{a.hasRealImages ? '' : 'pas de '}photo{a.totalImages !== 1 ? 's' : ''}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
