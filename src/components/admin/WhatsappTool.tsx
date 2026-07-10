'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Users, RefreshCw, Save, Copy, Check } from 'lucide-react';

interface Filter {
  audience: 'users' | 'prospects';
  userType: string;
  ficheStatus: string;
  city: string;
  prospectStatus: string;
  excludeUnsubscribed: boolean;
}

const emptyFilter: Filter = {
  audience: 'users',
  userType: 'any',
  ficheStatus: 'without',
  city: '',
  prospectStatus: 'any',
  excludeUnsubscribed: true,
};

const DEFAULT_MSG =
  "Bonjour {{prenom}} 👋 C'est Metosaela de Mada Spot. Votre {{type}} n'a pas encore de fiche en ligne — c'est la haute saison ! Créez-la en 5 min (gratuit) : https://madaspot.com/dashboard/etablissement";

function personalize(t: string, r: any): string {
  return t
    .replace(/\{\{\s*prenom\s*\}\}/gi, r.firstName || '')
    .replace(/\{\{\s*type\s*\}\}/gi, r.typeLabel || 'établissement')
    .replace(/\{\{\s*ville\s*\}\}/gi, r.city || '')
    .replace(/\{\{\s*etablissement\s*\}\}/gi, r.establishmentName || 'votre établissement');
}

export default function WhatsappTool() {
  const [filter, setFilter] = useState<Filter>(emptyFilter);
  const [message, setMessage] = useState(DEFAULT_MSG);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ total: number; withPhone: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<any[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const set = (patch: Partial<Filter>) => setFilter((f) => ({ ...f, ...patch }));

  const loadSaved = useCallback(async () => {
    const res = await fetch('/api/admin/crm/segments');
    const json = await res.json();
    if (json.success) setSaved(json.data.items);
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/whatsapp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(filter),
      });
      const json = await res.json();
      if (json.success) {
        setRecipients(json.data.recipients);
        setMeta({ total: json.data.total, withPhone: json.data.withPhone });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSegment = async () => {
    const name = prompt('Nom du segment à enregistrer :');
    if (!name) return;
    await fetch('/api/admin/crm/segments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, filter: JSON.stringify(filter) }),
    });
    loadSaved();
  };

  const applySaved = (raw: string) => {
    try {
      setFilter({ ...emptyFilter, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  };

  const copyMsg = (idx: number, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="max-w-3xl space-y-5">
      {/* Segment */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Cible</h4>
          <div className="flex items-center gap-2">
            {saved.length > 0 && (
              <select onChange={(e) => e.target.value && applySaved(e.target.value)} className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-transparent">
                <option value="">Segment enregistré…</option>
                {saved.map((s) => (
                  <option key={s.id} value={s.filter}>{s.name}</option>
                ))}
              </select>
            )}
            <button onClick={saveSegment} className="text-xs inline-flex items-center gap-1 text-gray-500"><Save className="w-3.5 h-3.5" /> Enregistrer</button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={filter.audience} onChange={(e) => set({ audience: e.target.value as any })} className="input">
            <option value="users">Inscrits (pros)</option>
            <option value="prospects">Prospects</option>
          </select>
          {filter.audience === 'users' && (
            <>
              <select value={filter.userType} onChange={(e) => set({ userType: e.target.value })} className="input">
                <option value="any">Tous types</option>
                <option value="HOTEL">Hôtels</option>
                <option value="RESTAURANT">Restaurants</option>
                <option value="ATTRACTION">Activités</option>
                <option value="PROVIDER">Prestataires</option>
              </select>
              <select value={filter.ficheStatus} onChange={(e) => set({ ficheStatus: e.target.value })} className="input">
                <option value="any">Fiche : peu importe</option>
                <option value="without">Sans fiche</option>
                <option value="with">Avec fiche</option>
                <option value="pending">Fiche en attente</option>
              </select>
            </>
          )}
          {filter.audience === 'prospects' && (
            <select value={filter.prospectStatus} onChange={(e) => set({ prospectStatus: e.target.value })} className="input">
              <option value="any">Tous statuts</option>
              <option value="NEW">Nouveau</option>
              <option value="CONTACTED">Contacté</option>
              <option value="ENGAGED">Engagé</option>
              <option value="QUALIFIED">Qualifié</option>
            </select>
          )}
          <input value={filter.city} onChange={(e) => set({ city: e.target.value })} placeholder="Ville (option)" className="input" />
        </div>
        <button onClick={fetchRecipients} className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500 text-gray-900 text-sm font-semibold">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Charger les contacts
        </button>
        {meta && (
          <p className="text-sm mt-2 text-gray-600 dark:text-gray-700">
            <strong className="text-orange-600">{meta.withPhone}</strong> contact(s) avec téléphone sur {meta.total} dans le segment.
          </p>
        )}
      </div>

      {/* Message */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="font-bold text-sm mb-2">Message — variables : {'{{prenom}} {{type}} {{ville}} {{etablissement}}'}</h4>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="input font-mono text-xs" />
        <p className="text-xs text-gray-400 mt-2">
          À envoyer depuis <strong>ton propre numéro</strong> (l&apos;envoi API à froid fait bannir). Clique « Ouvrir WhatsApp » : le message pré-rempli s&apos;ouvre, tu n&apos;as qu&apos;à valider. 30–40/jour recommandé.
        </p>
      </div>

      {/* Liste */}
      {recipients.length > 0 && (
        <div className="space-y-2">
          {recipients.map((r, i) => {
            const text = personalize(message, r);
            const wa = `https://wa.me/${r.phoneIntl}?text=${encodeURIComponent(text)}`;
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{r.firstName || r.establishmentName || r.phoneIntl}</div>
                  <div className="text-xs text-gray-400">+{r.phoneIntl}{r.city ? ` · ${r.city}` : ''}</div>
                </div>
                <button onClick={() => copyMsg(i, text)} title="Copier le message" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                  {copiedIdx === i ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-gray-900 text-sm font-semibold">
                  <MessageCircle className="w-4 h-4" /> Ouvrir WhatsApp
                </a>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .input { width: 100%; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; background: transparent; }
        .input:focus { outline: none; border-color: #ff6b35; }
      `}</style>
    </div>
  );
}
