'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, Save, Plus, X, ExternalLink } from 'lucide-react';

export default function AdminFicheEditor({ id, onBack, onSaved }: { id: string; onBack: () => void; onSaved?: () => void }) {
  const [f, setF] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [newImg, setNewImg] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/establishments/${id}`);
      const json = await res.json();
      if (json.success) {
        setF(json.establishment);
        try {
          const arr = JSON.parse(json.establishment.images || '[]');
          setImages(Array.isArray(arr) ? arr : []);
        } catch {
          setImages([]);
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const set = (k: string, v: any) => setF((prev: any) => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const payload: any = {
        name: f.name, description: f.description, shortDescription: f.shortDescription,
        city: f.city, region: f.region, address: f.address,
        phone: f.phone, phone2: f.phone2, email: f.email, website: f.website,
        facebook: f.facebook, instagram: f.instagram, whatsapp: f.whatsapp,
        coverImage: f.coverImage,
        latitude: f.latitude === '' || f.latitude === null ? null : Number(f.latitude),
        longitude: f.longitude === '' || f.longitude === null ? null : Number(f.longitude),
        moderationStatus: f.moderationStatus,
        isActive: f.isActive, isFeatured: f.isFeatured,
        images,
      };
      const res = await fetch(`/api/admin/establishments/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success !== false) {
        setMsg('✅ Fiche enregistrée.');
        onSaved?.();
      } else setMsg(json.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-16 text-center text-gray-400">Chargement de la fiche…</div>;
  if (!f) return <div className="py-16 text-center text-red-500">Fiche introuvable</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-gray-500"><ChevronLeft className="w-4 h-4" /> Retour</button>
        <a href={`https://madaspot.com/${f.type === 'HOTEL' ? 'hotels' : f.type === 'RESTAURANT' ? 'restaurants' : f.type === 'ATTRACTION' ? 'attractions' : 'prestataires'}/${f.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-orange-500">
          Voir la fiche <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <h3 className="text-lg font-bold mb-1">{f.name}</h3>
      <p className="text-xs text-gray-400 mb-4">ID : {f.id} · Type : {f.type}</p>

      <div className="space-y-4">
        <Section title="Général">
          <T label="Nom" v={f.name} set={(v) => set('name', v)} />
          <TA label="Description" v={f.description} set={(v) => set('description', v)} />
          <T label="Description courte" v={f.shortDescription} set={(v) => set('shortDescription', v)} />
          <div className="grid sm:grid-cols-2 gap-3">
            <T label="Ville" v={f.city} set={(v) => set('city', v)} />
            <T label="Région" v={f.region} set={(v) => set('region', v)} />
          </div>
          <T label="Adresse" v={f.address} set={(v) => set('address', v)} />
          <div className="grid sm:grid-cols-2 gap-3">
            <T label="Latitude" v={f.latitude ?? ''} set={(v) => set('latitude', v)} />
            <T label="Longitude" v={f.longitude ?? ''} set={(v) => set('longitude', v)} />
          </div>
        </Section>

        <Section title="Contact">
          <div className="grid sm:grid-cols-2 gap-3">
            <T label="Téléphone" v={f.phone} set={(v) => set('phone', v)} />
            <T label="Téléphone 2" v={f.phone2} set={(v) => set('phone2', v)} />
            <T label="Email" v={f.email} set={(v) => set('email', v)} />
            <T label="Site web" v={f.website} set={(v) => set('website', v)} />
            <T label="Facebook" v={f.facebook} set={(v) => set('facebook', v)} />
            <T label="Instagram" v={f.instagram} set={(v) => set('instagram', v)} />
            <T label="WhatsApp" v={f.whatsapp} set={(v) => set('whatsapp', v)} />
          </div>
        </Section>

        <Section title="Photos">
          <T label="Image de couverture (URL)" v={f.coverImage} set={(v) => set('coverImage', v)} />
          <div>
            <span className="block text-xs text-gray-500 mb-1">Galerie (URLs)</span>
            <div className="space-y-1.5">
              {images.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={url} onChange={(e) => setImages((prev) => prev.map((u, j) => (j === i ? e.target.value : u)))} className="input flex-1" />
                  <button onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))} className="text-red-500 p-1"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input value={newImg} onChange={(e) => setNewImg(e.target.value)} placeholder="Nouvelle URL d'image" className="input flex-1" />
                <button onClick={() => { if (newImg.trim()) { setImages((p) => [...p, newImg.trim()]); setNewImg(''); } }} className="text-orange-500 p-1"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Statut">
          <div className="grid sm:grid-cols-2 gap-3 items-end">
            <label className="block">
              <span className="block text-xs text-gray-500 mb-1">Modération</span>
              <select value={f.moderationStatus || 'approved'} onChange={(e) => set('moderationStatus', e.target.value)} className="input">
                <option value="approved">Approuvée (en ligne)</option>
                <option value="pending_review">En attente</option>
                <option value="rejected">Refusée</option>
              </select>
            </label>
            <div className="flex gap-4 pb-2">
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active</label>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} /> Mise en avant</label>
            </div>
          </div>
        </Section>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 text-white font-semibold disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Enregistrement…' : 'Enregistrer la fiche'}
        </button>
        {msg && <span className={`text-sm ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{msg}</span>}
      </div>

      <style jsx>{`
        .input { width: 100%; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; background: transparent; }
        .input:focus { outline: none; border-color: #ff6b35; }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h4 className="font-bold text-sm mb-3">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function T({ label, v, set }: { label: string; v: any; set: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      <input value={v ?? ''} onChange={(e) => set(e.target.value)} className="input" />
      <style jsx>{`.input { width: 100%; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; background: transparent; } .input:focus { outline: none; border-color: #ff6b35; }`}</style>
    </label>
  );
}

function TA({ label, v, set }: { label: string; v: any; set: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      <textarea value={v ?? ''} onChange={(e) => set(e.target.value)} rows={4} className="input" />
      <style jsx>{`.input { width: 100%; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; background: transparent; } .input:focus { outline: none; border-color: #ff6b35; }`}</style>
    </label>
  );
}
