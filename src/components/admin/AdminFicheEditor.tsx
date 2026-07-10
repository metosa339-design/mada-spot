'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeft, Save, X, ExternalLink, Upload, Loader2, FileText, CheckCircle2, AlertTriangle, Eye, Star, Image as ImageIcon } from 'lucide-react';
import { evaluateFiche } from '@/lib/crm/conformity';

const LocationPicker = dynamic(() => import('./LocationPicker'), { ssr: false, loading: () => <div className="h-64 rounded-xl bg-gray-100 animate-pulse" /> });

const DOC_TYPES = ['NIF', 'STAT', "Licence d'exploitation", 'CIN du gérant', 'Carte statistique', 'Assurance', 'Registre du commerce', 'RIB / coordonnées bancaires', 'Autorisation touristique', 'Autre'];

async function uploadFiles(files: FileList): Promise<{ url: string; type: string; name: string }[]> {
  const csrf = (await (await fetch('/api/csrf', { credentials: 'include' })).json())?.token || '';
  const fd = new FormData();
  Array.from(files).slice(0, 5).forEach((f) => fd.append('files', f));
  fd.append('csrfToken', csrf);
  const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Upload échoué');
  return (data?.files || []).map((f: any) => ({ url: f.url, type: f.mimeType || f.type || '', name: f.name }));
}

export default function AdminFicheEditor({ id, onBack, onSaved }: { id: string; onBack: () => void; onSaved?: () => void }) {
  const [f, setF] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [documents, setDocuments] = useState<{ url: string; type: string; name: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upBusy, setUpBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/establishments/${id}`);
      const json = await res.json();
      if (json.success) {
        setF(json.establishment);
        try { const a = JSON.parse(json.establishment.images || '[]'); setImages(Array.isArray(a) ? a : []); } catch { setImages([]); }
        try { const d = JSON.parse(json.establishment.documents || '[]'); setDocuments(Array.isArray(d) ? d : []); } catch { setDocuments([]); }
      }
      setLoading(false);
    })();
  }, [id]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const doUpload = async (files: FileList | null, mode: 'cover' | 'gallery' | { doc: string }) => {
    if (!files || files.length === 0) return;
    setUpBusy(typeof mode === 'string' ? mode : mode.doc);
    setMsg(null);
    try {
      const up = await uploadFiles(files);
      if (mode === 'cover') set('coverImage', up[0].url);
      else if (mode === 'gallery') setImages((prev) => [...prev, ...up.map((u) => u.url)]);
      else setDocuments((prev) => [...prev, ...up.map((u) => ({ ...u, label: mode.doc }))]);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Upload échoué');
    } finally {
      setUpBusy(null);
    }
  };

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const payload: any = {
        name: f.name, description: f.description, shortDescription: f.shortDescription,
        city: f.city, region: f.region, address: f.address,
        phone: f.phone, phone2: f.phone2, email: f.email, website: f.website,
        facebook: f.facebook, instagram: f.instagram, whatsapp: f.whatsapp,
        coverImage: f.coverImage,
        latitude: f.latitude === '' || f.latitude === null ? null : Number(f.latitude),
        longitude: f.longitude === '' || f.longitude === null ? null : Number(f.longitude),
        moderationStatus: f.moderationStatus, isActive: f.isActive, isFeatured: f.isFeatured,
        images, documents,
      };
      const res = await fetch(`/api/admin/establishments/${id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.success !== false) { setMsg('✅ Fiche enregistrée.'); onSaved?.(); }
      else setMsg(json.error || 'Erreur');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="py-16 text-center text-gray-400">Chargement de la fiche…</div>;
  if (!f) return <div className="py-16 text-center text-red-500">Fiche introuvable</div>;

  const conf = evaluateFiche({ ...f, images: JSON.stringify(images) });
  const typeUrl = f.type === 'HOTEL' ? 'hotels' : f.type === 'RESTAURANT' ? 'restaurants' : f.type === 'ATTRACTION' ? 'attractions' : 'prestataires';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-gray-500"><ChevronLeft className="w-4 h-4" /> Retour</button>
        <div className="flex items-center gap-3">
          <a href={`https://madaspot.com/${typeUrl}/${f.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-orange-500">Voir en ligne <ExternalLink className="w-3.5 h-3.5" /></a>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-gray-900 text-sm font-semibold disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </div>
      <h3 className="text-lg font-bold">{f.name}</h3>
      <p className="text-xs text-gray-400 mb-4">ID : {f.id} · Type : {f.type}</p>
      {msg && <p className={`text-sm mb-3 ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}

      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        {/* Colonne édition */}
        <div className="space-y-4">
          <Section title="Général">
            <T label="Nom" v={f.name} set={(v) => set('name', v)} />
            <TA label="Description" v={f.description} set={(v) => set('description', v)} />
            <T label="Description courte" v={f.shortDescription} set={(v) => set('shortDescription', v)} />
          </Section>

          <Section title="Localisation">
            <LocationPicker
              lat={typeof f.latitude === 'number' ? f.latitude : (f.latitude ? Number(f.latitude) : null)}
              lng={typeof f.longitude === 'number' ? f.longitude : (f.longitude ? Number(f.longitude) : null)}
              onChange={({ lat, lng, city, address }) => setF((p: any) => ({ ...p, latitude: lat, longitude: lng, ...(city ? { city } : {}), ...(address && !p.address ? { address } : {}) }))}
            />
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <T label="Ville" v={f.city} set={(v) => set('city', v)} />
              <T label="Région" v={f.region} set={(v) => set('region', v)} />
            </div>
            <T label="Adresse" v={f.address} set={(v) => set('address', v)} />
          </Section>

          <Section title="Photos">
            <div className="flex items-center gap-3 mb-2">
              {f.coverImage ? <img src={f.coverImage} alt="" className="h-16 w-24 object-cover rounded-lg" /> : <div className="h-16 w-24 bg-gray-100 rounded-lg flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-700" /></div>}
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm cursor-pointer hover:bg-gray-50">
                {upBusy === 'cover' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Parcourir (couverture)
                <input type="file" accept="image/*" className="hidden" onChange={(e) => doUpload(e.target.files, 'cover')} />
              </label>
              {f.coverImage && <button onClick={() => set('coverImage', '')} className="text-red-500 text-xs">retirer</button>}
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm cursor-pointer hover:bg-gray-50">
              {upBusy === 'gallery' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Ajouter des photos (galerie)
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => doUpload(e.target.files, 'gallery')} />
            </label>
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {images.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="h-16 w-20 object-cover rounded-lg" />
                    <button onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-gray-900 rounded-full w-4 h-4 flex items-center justify-center"><X className="w-2.5 h-2.5" /></button>
                  </div>
                ))}
              </div>
            )}
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

          <Section title="Documents à fournir (facultatif)">
            <p className="text-xs text-gray-400 mb-2">Ajoutez tout justificatif utile (PDF ou image). Aucun n&apos;est obligatoire.</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {DOC_TYPES.map((label) => {
                const has = documents.filter((d) => d.label === label);
                return (
                  <div key={label} className="border border-gray-200 rounded-lg p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">{label}</span>
                      <label className="inline-flex items-center gap-1 text-xs text-orange-600 cursor-pointer">
                        {upBusy === label ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Parcourir
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => doUpload(e.target.files, { doc: label })} />
                      </label>
                    </div>
                    {has.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs mt-1 text-gray-600">
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline truncate"><FileText className="w-3 h-3" /> {d.name || 'fichier'}</a>
                        <button onClick={() => setDocuments((p) => p.filter((x) => x !== d))} className="text-red-500">✕</button>
                      </div>
                    ))}
                  </div>
                );
              })}
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

        {/* Colonne aperçu + conformité + stats */}
        <div className="space-y-4 lg:sticky lg:top-4 self-start">
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Aperçu client</div>
            <div>
              {f.coverImage ? <img src={f.coverImage} alt="" className="w-full h-32 object-cover" /> : <div className="w-full h-32 bg-gray-100 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-700" /></div>}
              <div className="p-3">
                <div className="font-bold text-sm">{f.name || 'Sans nom'}</div>
                <div className="text-xs text-gray-500">{f.city || 'Ville ?'} · {f.type}</div>
                <div className="text-xs text-yellow-600 mt-1">{'★'.repeat(Math.round(f.rating || 0))}<span className="text-gray-700">{'★'.repeat(5 - Math.round(f.rating || 0))}</span> <span className="text-gray-400">({f.reviewCount || 0})</span></div>
                {f.shortDescription && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{f.shortDescription}</p>}
                <div className="text-[10px] text-gray-400 mt-1">{images.length + (f.coverImage ? 1 : 0)} photo(s)</div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border p-3 ${conf.conforme ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="text-sm font-bold mb-2 flex items-center gap-1">
              {conf.conforme ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-500" />} Conformité {conf.score}%
            </div>
            <div className="space-y-1">
              {conf.rules.map((r) => (
                <div key={r.key} className="flex items-center gap-2 text-xs">
                  {r.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                  <span className={r.ok ? 'text-gray-600' : 'text-red-600 font-medium'}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <div className="text-xs font-semibold text-gray-500 mb-2">Statistiques</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><div className="text-lg font-bold">{f.viewCount || 0}</div><div className="text-[10px] text-gray-400">vues</div></div>
              <div><div className="text-lg font-bold">{f.reviewCount || 0}</div><div className="text-[10px] text-gray-400">avis</div></div>
              <div><div className="text-lg font-bold inline-flex items-center gap-0.5">{(f.rating || 0).toFixed?.(1) ?? f.rating}<Star className="w-3 h-3 text-yellow-500" /></div><div className="text-[10px] text-gray-400">note</div></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`.input { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: #fff; } .input:focus { outline: none; border-color: #ff6b35; }`}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
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
      <style jsx>{`.input { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: #fff; } .input:focus { outline: none; border-color: #ff6b35; }`}</style>
    </label>
  );
}

function TA({ label, v, set }: { label: string; v: any; set: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      <textarea value={v ?? ''} onChange={(e) => set(e.target.value)} rows={4} className="input" />
      <style jsx>{`.input { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: #fff; } .input:focus { outline: none; border-color: #ff6b35; }`}</style>
    </label>
  );
}
