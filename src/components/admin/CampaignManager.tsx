'use client';

import { useEffect, useState, useCallback } from 'react';
import { Megaphone, Users, Send, RefreshCw, Trash2, Plus, ChevronLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  channel: string;
  dailyLimit: number;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

interface SegmentFilter {
  audience: 'users' | 'prospects';
  userType: string;
  ficheStatus: string;
  city: string;
  prospectStatus: string;
  excludeUnsubscribed: boolean;
}

const DEFAULT_HTML = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
  <p>Bonjour {{prenom}},</p>
  <p>Des voyageurs cherchent un {{type}} à Madagascar en ce moment. Votre établissement mérite d'être visible.</p>
  <p style="text-align:center;margin:26px 0">
    <a href="https://madaspot.com/dashboard/etablissement" style="background:#ff6b35;color:#fff;padding:14px 30px;border-radius:10px;text-decoration:none;font-weight:700">Créer / compléter ma fiche →</a>
  </p>
  <p>Bien à vous,<br>Metosaela — Mada Spot</p>
  <p style="font-size:11px;color:#94a3b8">Répondez STOP pour ne plus recevoir ces messages.</p>
</div>`;

const emptyFilter: SegmentFilter = {
  audience: 'users',
  userType: 'any',
  ficheStatus: 'without',
  city: '',
  prospectStatus: 'any',
  excludeUnsubscribed: true,
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  READY: 'bg-blue-100 text-blue-700',
  SENDING: 'bg-orange-100 text-orange-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
};

export default function CampaignManager() {
  const [list, setList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/campaigns');
      const json = await res.json();
      if (json.success) setList(json.data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  if (view === 'create') {
    return <CreateCampaign onCancel={() => setView('list')} onCreated={(id) => { loadList(); setSelectedId(id); setView('detail'); }} />;
  }
  if (view === 'detail' && selectedId) {
    return <CampaignDetail id={selectedId} onBack={() => { setView('list'); loadList(); }} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={loadList} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
        </button>
        <button onClick={() => setView('create')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600">
          <Plus className="w-4 h-4" /> Nouvelle campagne
        </button>
      </div>

      {list.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-40" />
          Aucune campagne. Créez-en une pour cibler un segment.
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((c) => (
            <button
              key={c.id}
              onClick={() => { setSelectedId(c.id); setView('detail'); }}
              className="w-full text-left flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50/30"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{c.name}</div>
                <div className="text-xs text-gray-500 truncate">{c.subject}</div>
              </div>
              <div className="text-xs text-gray-500 text-right shrink-0">
                <div>{c.sentCount}/{c.totalRecipients} envoyés</div>
                {c.failedCount > 0 && <div className="text-red-500">{c.failedCount} échecs</div>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${STATUS_BADGE[c.status] || 'bg-gray-100'}`}>{c.status}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateCampaign({ onCancel, onCreated }: { onCancel: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState(DEFAULT_HTML);
  const [dailyLimit, setDailyLimit] = useState(300);
  const [filter, setFilter] = useState<SegmentFilter>(emptyFilter);
  const [count, setCount] = useState<number | null>(null);
  const [sample, setSample] = useState<any[]>([]);
  const [counting, setCounting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedSegments, setSavedSegments] = useState<any[]>([]);

  const loadSegments = useCallback(async () => {
    const res = await fetch('/api/admin/crm/segments');
    const json = await res.json();
    if (json.success) setSavedSegments(json.data.items);
  }, []);

  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

  const applySaved = (raw: string) => {
    try {
      setFilter((f) => ({ ...f, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  };

  const saveSegment = async () => {
    const segName = prompt('Nom du segment à enregistrer :');
    if (!segName) return;
    await fetch('/api/admin/crm/segments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: segName, filter: JSON.stringify(filter) }),
    });
    loadSegments();
  };

  const countSegment = useCallback(async () => {
    setCounting(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin/crm/segment-count', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(filter),
      });
      const json = await res.json();
      if (json.success) {
        setCount(json.data.count);
        setSample(json.data.sample);
      } else setErr(json.error);
    } finally {
      setCounting(false);
    }
  }, [filter]);

  useEffect(() => {
    countSegment();
  }, [countSegment]);

  const save = async () => {
    if (!name || !subject || !htmlBody) {
      setErr('Nom, objet et contenu requis');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin/crm/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, subject, htmlBody, dailyLimit, segment: JSON.stringify(filter) }),
      });
      const json = await res.json();
      if (json.success) onCreated(json.data.id);
      else setErr(json.error);
    } finally {
      setSaving(false);
    }
  };

  const set = (patch: Partial<SegmentFilter>) => setFilter((f) => ({ ...f, ...patch }));

  return (
    <div className="max-w-3xl">
      <button onClick={onCancel} className="inline-flex items-center gap-1 text-sm text-gray-500 mb-4"><ChevronLeft className="w-4 h-4" /> Retour</button>

      {/* Segment */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm flex items-center gap-2"><Users className="w-4 h-4" /> 1. Cible (segment)</h4>
          <div className="flex items-center gap-2">
            {savedSegments.length > 0 && (
              <select onChange={(e) => e.target.value && applySaved(e.target.value)} className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-transparent">
                <option value="">Charger un segment…</option>
                {savedSegments.map((s) => (
                  <option key={s.id} value={s.filter}>{s.name}</option>
                ))}
              </select>
            )}
            <button type="button" onClick={saveSegment} className="text-xs text-gray-500 underline">Enregistrer</button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Audience">
            <select value={filter.audience} onChange={(e) => set({ audience: e.target.value as any })} className="input">
              <option value="users">Comptes inscrits (prestataires)</option>
              <option value="prospects">Prospects (non inscrits)</option>
            </select>
          </Field>
          {filter.audience === 'users' && (
            <>
              <Field label="Type">
                <select value={filter.userType} onChange={(e) => set({ userType: e.target.value })} className="input">
                  <option value="any">Tous</option>
                  <option value="HOTEL">Hôtels</option>
                  <option value="RESTAURANT">Restaurants</option>
                  <option value="ATTRACTION">Activités</option>
                  <option value="PROVIDER">Prestataires</option>
                </select>
              </Field>
              <Field label="État de la fiche">
                <select value={filter.ficheStatus} onChange={(e) => set({ ficheStatus: e.target.value })} className="input">
                  <option value="any">Peu importe</option>
                  <option value="without">Sans fiche</option>
                  <option value="with">Avec fiche</option>
                  <option value="pending">Fiche en attente de validation</option>
                </select>
              </Field>
            </>
          )}
          {filter.audience === 'prospects' && (
            <Field label="Statut prospect">
              <select value={filter.prospectStatus} onChange={(e) => set({ prospectStatus: e.target.value })} className="input">
                <option value="any">Tous</option>
                <option value="NEW">Nouveau</option>
                <option value="CONTACTED">Contacté</option>
                <option value="ENGAGED">Engagé</option>
                <option value="QUALIFIED">Qualifié</option>
                <option value="UNRESPONSIVE">Sans réponse</option>
              </select>
            </Field>
          )}
          <Field label="Ville (optionnel)">
            <input value={filter.city} onChange={(e) => set({ city: e.target.value })} placeholder="ex. Nosy Be" className="input" />
          </Field>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={countSegment} className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 inline-flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${counting ? 'animate-spin' : ''}`} /> Compter
          </button>
          <span className="text-sm font-bold text-orange-600">
            {count === null ? '…' : `${count} destinataire${count > 1 ? 's' : ''}`}
          </span>
        </div>
        {sample.length > 0 && (
          <div className="mt-2 text-xs text-gray-400">
            Aperçu : {sample.map((s) => s.email).slice(0, 4).join(', ')}{count && count > 4 ? '…' : ''}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <h4 className="font-bold text-sm mb-3">2. Message</h4>
        <div className="space-y-3">
          <Field label="Nom interne de la campagne">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. Relance sans-fiche juillet" className="input" />
          </Field>
          <Field label="Objet de l'e-mail">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="{{prenom}}, votre {{type}} mérite d'être vu" className="input" />
          </Field>
          <Field label="Contenu HTML — variables : {{prenom}} {{type}} {{ville}} {{etablissement}}">
            <textarea value={htmlBody} onChange={(e) => setHtmlBody(e.target.value)} rows={10} className="input font-mono text-xs" />
          </Field>
          <Field label="Plafond / jour">
            <input type="number" value={dailyLimit} onChange={(e) => setDailyLimit(parseInt(e.target.value, 10) || 300)} className="input w-32" />
          </Field>
        </div>
      </div>

      {err && <p className="text-red-500 text-sm mb-3">{err}</p>}
      <div className="flex gap-3">
        <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-lg bg-orange-500 text-white font-semibold disabled:opacity-50">
          {saving ? 'Création…' : 'Créer la campagne'}
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700">Annuler</button>
      </div>

      <style jsx>{`
        .input { width: 100%; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; background: transparent; }
        .input:focus { outline: none; border-color: #ff6b35; }
      `}</style>
    </div>
  );
}

function CampaignDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [batch, setBatch] = useState(40);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/crm/campaigns/${id}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const buildRecipients = async () => {
    setMsg(null);
    setSending(true);
    try {
      const res = await fetch(`/api/admin/crm/campaigns/${id}/recipients`, { method: 'POST' });
      const json = await res.json();
      setMsg(json.success ? `${json.data.totalRecipients} destinataires calculés.` : json.error);
      load();
    } finally {
      setSending(false);
    }
  };

  const sendBatch = async () => {
    setMsg(null);
    setSending(true);
    try {
      const res = await fetch(`/api/admin/crm/campaigns/${id}/send`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ batch }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg(
          json.data.error
            ? `⚠️ ${json.data.error}`
            : `Lot envoyé : ${json.data.sent} OK, ${json.data.failed} échecs. Restant : ${json.data.remaining}.${json.data.done ? ' Campagne terminée ✅' : ''}`
        );
      } else setMsg(json.error);
      load();
    } finally {
      setSending(false);
    }
  };

  const retryFailed = async () => {
    setMsg(null);
    setSending(true);
    try {
      const res = await fetch(`/api/admin/crm/campaigns/${id}/retry`, { method: 'POST' });
      const json = await res.json();
      setMsg(json.success ? `${json.data.reset} échec(s) remis en attente. Cliquez « Envoyer un lot ».` : json.error);
      load();
    } finally {
      setSending(false);
    }
  };

  const del = async () => {
    if (!confirm('Supprimer cette campagne ?')) return;
    await fetch(`/api/admin/crm/campaigns/${id}`, { method: 'DELETE' });
    onBack();
  };

  if (loading) return <div className="py-16 text-center text-gray-400">Chargement…</div>;
  if (!data) return <div className="py-16 text-center text-red-500">Introuvable</div>;

  const c = data.campaign;
  const s = data.stats;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-gray-500"><ChevronLeft className="w-4 h-4" /> Retour</button>
        <button onClick={del} className="inline-flex items-center gap-1 text-sm text-red-500"><Trash2 className="w-4 h-4" /> Supprimer</button>
      </div>

      <h3 className="text-xl font-bold">{c.name}</h3>
      <p className="text-sm text-gray-500 mb-4">{c.subject}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat label="Destinataires" value={c.totalRecipients} />
        <Stat label="Envoyés" value={s.SENT} color="text-green-600" />
        <Stat label="En attente" value={s.PENDING} color="text-orange-500" />
        <Stat label="Échecs" value={s.FAILED} color="text-red-500" />
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 space-y-3">
        {c.status === 'DRAFT' && (
          <button onClick={buildRecipients} disabled={sending} className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold disabled:opacity-50">
            {sending ? 'Calcul…' : 'Calculer les destinataires'}
          </button>
        )}
        {(c.status === 'READY' || c.status === 'SENDING') && (
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-gray-500">Taille du lot</label>
            <input type="number" value={batch} onChange={(e) => setBatch(Math.min(parseInt(e.target.value, 10) || 40, 100))} className="w-20 px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent" />
            <button onClick={sendBatch} disabled={sending || s.PENDING === 0} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold disabled:opacity-50">
              <Send className="w-4 h-4" /> {sending ? 'Envoi…' : `Envoyer un lot (${Math.min(batch, s.PENDING)})`}
            </button>
            <button onClick={buildRecipients} disabled={sending} className="text-sm text-gray-500 underline">Recalculer</button>
          </div>
        )}
        {c.status === 'DONE' && s.PENDING === 0 && s.FAILED === 0 && (
          <p className="text-sm text-green-600 inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Campagne terminée.</p>
        )}
        {s.FAILED > 0 && (
          <button onClick={retryFailed} disabled={sending} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold disabled:opacity-50">
            Réessayer les {s.FAILED} échec(s)
          </button>
        )}
        <p className="text-xs text-gray-400">
          L&apos;envoi se fait par lots pour préserver la délivrabilité (max 100/lot). Relancez « Envoyer un lot » jusqu&apos;à épuisement.
        </p>
      </div>

      {msg && (
        <p className={`text-sm mb-4 ${msg.startsWith('⚠️') ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
          {msg.startsWith('⚠️') && <AlertTriangle className="w-4 h-4 inline mr-1" />}
          {msg}
        </p>
      )}

      {data.recent?.length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-2">Derniers envois</h4>
          <div className="space-y-1 text-xs">
            {data.recent.map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-gray-500">
                <span className={`w-2 h-2 rounded-full ${r.status === 'SENT' ? 'bg-green-500' : r.status === 'FAILED' ? 'bg-red-500' : 'bg-gray-300'}`} />
                <span className="flex-1 truncate">{r.email}</span>
                {r.error && <span className="text-red-400 truncate max-w-[200px]">{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
      <div className={`text-xl font-bold ${color || ''}`}>{value ?? 0}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
