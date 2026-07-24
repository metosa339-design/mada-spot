'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Camera, FileText, MapPin, Phone, Building2, CheckCircle2, ArrowRight, Sparkles, PartyPopper,
} from 'lucide-react';
import { evaluateFiche } from '@/lib/crm/conformity';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fiche = any;

const EDIT = '/dashboard/etablissement';

// Métadonnées d'affichage par critère (aligné sur evaluateFiche : photo,
// description, city, phone, location). Chaque étape pointe vers le bon onglet.
const STEP_META: Record<string, { icon: React.ComponentType<{ className?: string }>; href: string; cta: string }> = {
  photo: { icon: Camera, href: `${EDIT}?tab=photos`, cta: 'Ajouter une photo' },
  description: { icon: FileText, href: `${EDIT}?tab=general`, cta: 'Rédiger la description' },
  city: { icon: Building2, href: `${EDIT}?tab=general`, cta: 'Renseigner la ville' },
  location: { icon: MapPin, href: `${EDIT}?tab=general`, cta: 'Ajouter la localisation' },
  phone: { icon: Phone, href: `${EDIT}?tab=contact`, cta: 'Ajouter le téléphone' },
};
// Ordre d'affichage : photo et description d'abord (le plus visible pour le voyageur).
const ORDER = ['photo', 'description', 'location', 'city', 'phone'];

export default function OnboardingGuide({ firstName }: { firstName?: string | null }) {
  const [loading, setLoading] = useState(true);
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [hasFiche, setHasFiche] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/dashboard/establishment');
        const data = await res.json();
        if (!alive) return;
        setFiche(data.establishment || null);
        setHasFiche(!!data.establishment);
      } catch {
        /* silencieux */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading || dismissed) return null;

  const hello = firstName ? `Bonjour ${firstName} ! ` : '';

  // --- Cas 1 : aucune fiche encore créée ---
  if (!hasFiche) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#FF6B35]/25 bg-gradient-to-br from-[#FFF7ED] to-white p-6 mb-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#FF6B35]/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[17px] font-bold text-[#0F172A]">{hello}Créons votre fiche 🚀</h3>
            <p className="text-[14px] text-[#475569] mt-1 leading-relaxed">
              Vous n&apos;êtes pas encore visible sur Mada Spot. En quelques minutes, créez votre fiche
              avec l&apos;essentiel : <strong>au moins une photo</strong>, une <strong>bonne description</strong> et
              votre <strong>localisation</strong>. C&apos;est ce qui donne envie aux voyageurs de vous choisir.
            </p>
            <Link
              href={EDIT}
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#FF6B35] hover:bg-[#e55a2b] text-white rounded-xl text-[14px] font-semibold transition-colors"
            >
              Créer ma fiche <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // --- Cas 2 : fiche existante → évaluation des 5 critères ---
  const { rules, score, conforme } = evaluateFiche({
    coverImage: fiche.coverImage,
    images: JSON.stringify(fiche.images || []),
    description: fiche.description,
    city: fiche.city,
    address: fiche.address,
    latitude: fiche.latitude,
    longitude: fiche.longitude,
    phone: fiche.phone,
  });
  const doneCount = rules.filter((r) => r.ok).length;
  const ordered = [...rules].sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));

  // --- Cas 2b : tout est complet → petit message de félicitations ---
  if (conforme) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 mb-6 flex items-center gap-4"
      >
        <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <PartyPopper className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-bold text-[#0F172A]">{hello}Votre fiche est complète 🎉</h3>
          <p className="text-[13px] text-[#475569] mt-0.5">
            Elle est visible auprès des voyageurs. Pensez à ajouter d&apos;autres photos et à garder vos infos à jour.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-[12px] text-[#94A3B8] hover:text-[#475569] shrink-0"
        >
          Masquer
        </button>
      </motion.div>
    );
  }

  // --- Cas 2a : fiche incomplète → tutoriel pas à pas ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#FF6B35]/25 bg-white p-6 mb-6"
    >
      <div className="flex items-center justify-between gap-4 mb-1">
        <h3 className="text-[17px] font-bold text-[#0F172A] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#FF6B35]" />
          {hello}Complétez votre fiche
        </h3>
        <span className="text-[15px] font-bold text-[#FF6B35] shrink-0">{score}%</span>
      </div>
      <p className="text-[13px] text-[#64748B] mb-3">
        {doneCount}/{rules.length} étapes — une fiche complète est bien mieux référencée et rassure les voyageurs.
      </p>
      <div className="w-full bg-[#F1F5F9] rounded-full h-2 mb-5">
        <div className="h-2 rounded-full bg-[#FF6B35] transition-all" style={{ width: `${score}%` }} />
      </div>

      <ol className="space-y-2.5">
        {ordered.map((rule, i) => {
          const meta = STEP_META[rule.key] || { icon: FileText, href: EDIT, cta: 'Compléter' };
          const Icon = meta.icon;
          return (
            <li
              key={rule.key}
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                rule.ok ? 'border-emerald-100 bg-emerald-50/40' : 'border-[#E2E8F0] bg-white'
              }`}
            >
              {rule.ok ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#FFF7ED] text-[#FF6B35] text-[12px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
              )}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${rule.ok ? 'text-emerald-500' : 'text-[#64748B]'}`} />
                <div className="min-w-0">
                  <p className={`text-[13.5px] font-medium ${rule.ok ? 'text-[#94A3B8] line-through' : 'text-[#0F172A]'}`}>
                    {rule.label}
                  </p>
                  {!rule.ok && <p className="text-[12px] text-[#94A3B8] truncate">{rule.hint}</p>}
                </div>
              </div>
              {!rule.ok && (
                <Link
                  href={meta.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6B35] hover:bg-[#e55a2b] text-white rounded-lg text-[12.5px] font-semibold transition-colors shrink-0"
                >
                  {meta.cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </motion.div>
  );
}
