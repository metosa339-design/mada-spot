'use client';

import { useState } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';

export default function AdminFicheCreate({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const [f, setF] = useState<any>({ type: 'HOTEL', name: '', city: '', region: '', address: '', phone: '', email: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((p: any) => ({ ...p, [k]: v }));

  const create = async () => {
    if (!f.name.trim() || !f.city.trim()) {
      setErr('Nom et ville obligatoires');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin/establishments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(f),
      });
      const json = await res.json();
      const id = json?.establishment?.id || json?.data?.id || json?.id;
      if ((json.success !== false) && id) onCreated(id);
      else setErr(json.error || 'Erreur à la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-gray-500 mb-4"><ChevronLeft className="w-4 h-4" /> Retour</button>
      <h3 className="text-lg font-bold mb-4">Nouvelle fiche établissement</h3>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1">Type *</span>
            <select value={f.type} onChange={(e) => set('type', e.target.value)} className="input">
              <option value="HOTEL">Hôtel</option>
              <option value="RESTAURANT">Restaurant</option>
              <option value="ATTRACTION">Activité</option>
              <option value="PROVIDER">Prestataire</option>
            </select>
          </label>
          <F label="Nom *" v={f.name} set={(v) => set('name', v)} />
          <F label="Ville *" v={f.city} set={(v) => set('city', v)} />
          <F label="Région" v={f.region} set={(v) => set('region', v)} />
          <F label="Adresse" v={f.address} set={(v) => set('address', v)} />
          <F label="Téléphone" v={f.phone} set={(v) => set('phone', v)} />
          <F label="Email" v={f.email} set={(v) => set('email', v)} />
        </div>
        <label className="block">
          <span className="block text-xs text-gray-500 mb-1">Description</span>
          <textarea value={f.description} onChange={(e) => set('description', e.target.value)} rows={3} className="input" />
        </label>
      </div>

      {err && <p className="text-red-500 text-sm mt-3">{err}</p>}
      <div className="flex gap-3 mt-4">
        <button onClick={create} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 text-gray-900 font-semibold disabled:opacity-50">
          <Plus className="w-4 h-4" /> {saving ? 'Création…' : 'Créer la fiche'}
        </button>
        <button onClick={onBack} className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700">Annuler</button>
      </div>

      <style jsx>{`.input { width: 100%; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; background: transparent; } .input:focus { outline: none; border-color: #ff6b35; }`}</style>
    </div>
  );
}

function F({ label, v, set }: { label: string; v: string; set: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      <input value={v} onChange={(e) => set(e.target.value)} className="input" />
      <style jsx>{`.input { width: 100%; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; background: transparent; } .input:focus { outline: none; border-color: #ff6b35; }`}</style>
    </label>
  );
}
