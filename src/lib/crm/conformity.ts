// Règles de conformité d'une fiche établissement + génération du mail auto.

export interface FicheLike {
  name?: string | null;
  description?: string | null;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  coverImage?: string | null;
  images?: string | null; // JSON array
}

export interface Rule {
  key: string;
  label: string;
  ok: boolean;
  hint: string;
}

function hasPhoto(f: FicheLike): boolean {
  if (f.coverImage) return true;
  try {
    const arr = JSON.parse(f.images || '[]');
    return Array.isArray(arr) && arr.length > 0;
  } catch {
    return false;
  }
}

export function evaluateFiche(f: FicheLike): { rules: Rule[]; score: number; conforme: boolean; failing: Rule[] } {
  const city = (f.city || '').trim().toLowerCase();
  const rules: Rule[] = [
    { key: 'photo', label: 'Au moins une photo', ok: hasPhoto(f), hint: 'Ajoutez une photo de couverture et quelques photos dans l\'onglet Photos.' },
    { key: 'description', label: 'Description (min. 20 caractères)', ok: (f.description || '').trim().length >= 20, hint: 'Rédigez une description qui présente votre établissement.' },
    { key: 'city', label: 'Ville renseignée', ok: !!city && city !== 'non spécifié' && city !== 'non specifie', hint: 'Indiquez la ville de votre établissement.' },
    { key: 'phone', label: 'Téléphone', ok: !!(f.phone && f.phone.trim()), hint: 'Ajoutez un numéro de téléphone dans l\'onglet Contact.' },
    { key: 'location', label: 'Localisation (adresse ou GPS)', ok: !!(f.address && f.address.trim()) || (typeof f.latitude === 'number' && typeof f.longitude === 'number'), hint: 'Renseignez une adresse ou positionnez votre établissement sur la carte.' },
  ];
  const passed = rules.filter((r) => r.ok).length;
  const score = Math.round((passed / rules.length) * 100);
  const failing = rules.filter((r) => !r.ok);
  return { rules, score, conforme: failing.length === 0, failing };
}

/** Mail auto-rédigé listant ce qui manque (ton : le prestataire corrige lui-même). */
export function buildConformityEmail(name: string | null, firstName: string | null, failing: Rule[]): { subject: string; html: string } {
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,';
  const nom = name ? `<strong>${name}</strong>` : 'votre établissement';
  const subject = `Votre fiche ${name || 'Mada Spot'} — quelques éléments à compléter`;
  const items = failing
    .map(
      (r) =>
        `<li style="margin-bottom:8px"><strong>${r.label}</strong><br><span style="color:#64748b;font-size:14px">${r.hint}</span></li>`
    )
    .join('');
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
  <div style="padding:24px 0;text-align:center"><img src="https://madaspot.com/logo.png" width="46" height="46" style="border-radius:11px" alt="Mada Spot"></div>
  <div style="padding:0 24px">
    <p style="font-size:16px;line-height:1.7">${greeting}</p>
    <p style="font-size:16px;line-height:1.7">Merci d'être sur Mada Spot. Pour que ${nom} ressorte pleinement auprès des voyageurs, il reste quelques éléments à compléter sur votre fiche :</p>
    <ul style="font-size:16px;line-height:1.6;padding-left:20px;margin:16px 0">${items}</ul>
    <p style="font-size:15px;line-height:1.7;color:#334155">Vous pouvez tout mettre à jour vous-même en quelques minutes depuis votre espace — vous gardez le contrôle total de votre fiche.</p>
    <div style="text-align:center;margin:26px 0">
      <a href="https://madaspot.com/dashboard/etablissement" style="display:inline-block;padding:15px 34px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:11px;font-weight:700;font-size:16px">Compléter ma fiche →</a>
    </div>
    <p style="font-size:16px;line-height:1.7">Bien à vous,<br><strong>Metosaela RANDRIAMAZAORO</strong><br><span style="color:#64748b;font-size:14px">Business Developer — Mada Spot</span></p>
  </div>
  <div style="margin-top:28px;padding:14px 24px;border-top:1px solid #eef2f7"><p style="font-size:11px;color:#94a3b8;text-align:center;margin:0">Répondez STOP pour ne plus recevoir ces messages.</p></div>
</div>`;
  return { subject, html };
}

const USER_TYPE_LABEL: Record<string, string> = {
  HOTEL: 'votre hôtel',
  RESTAURANT: 'votre restaurant',
  ATTRACTION: 'votre site ou activité',
  PROVIDER: 'votre activité',
};

/**
 * Mail de bienvenue envoyé à un nouveau professionnel dès son inscription.
 * À ce stade la fiche n'existe pas encore : on l'invite à la créer et la
 * compléter lui-même (mêmes 5 critères que la conformité). Ton : auto-création.
 */
export function buildWelcomeProEmail(
  firstName: string | null,
  userType?: string | null,
  email?: string | null,
): { subject: string; html: string } {
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,';
  const what = (userType && USER_TYPE_LABEL[userType]) || 'votre établissement';
  // Lien vers la connexion avec l'email pré-rempli (gain de temps) + redirection
  // vers l'espace pro après connexion. La page /login lit ?email= et ?redirect=.
  const ctaHref = `https://madaspot.com/login?email=${encodeURIComponent(email || '')}&redirect=${encodeURIComponent('/dashboard')}`;
  const subject = 'Bienvenue sur Mada Spot — créez et complétez votre fiche';
  // Les 5 critères d'une fiche complète (alignés sur evaluateFiche).
  const checklist = evaluateFiche({})
    .rules.map(
      (r) =>
        `<li style="margin-bottom:8px"><strong>${r.label}</strong><br><span style="color:#64748b;font-size:14px">${r.hint}</span></li>`,
    )
    .join('');
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
  <div style="padding:24px 0;text-align:center"><img src="https://madaspot.com/logo.png" width="46" height="46" style="border-radius:11px" alt="Mada Spot"></div>
  <div style="padding:0 24px">
    <p style="font-size:16px;line-height:1.7">${greeting}</p>
    <p style="font-size:16px;line-height:1.7">Bienvenue sur Mada Spot, et merci de nous avoir rejoints. Pour que ${what} soit visible auprès des voyageurs, il ne reste qu'une étape : <strong>créer votre fiche</strong> et la compléter avec ces éléments essentiels :</p>
    <ul style="font-size:16px;line-height:1.6;padding-left:20px;margin:16px 0">${checklist}</ul>
    <p style="font-size:15px;line-height:1.7;color:#334155">Tout se fait vous-même en quelques minutes depuis votre espace — vous gardez le contrôle total de votre fiche.</p>
    <div style="text-align:center;margin:26px 0">
      <a href="${ctaHref}" style="display:inline-block;padding:15px 34px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:11px;font-weight:700;font-size:16px">Créer ma fiche →</a>
    </div>
    <p style="font-size:16px;line-height:1.7">Bien à vous,<br><strong>Metosaela RANDRIAMAZAORO</strong><br><span style="color:#64748b;font-size:14px">Business Developer — Mada Spot</span></p>
  </div>
  <div style="margin-top:28px;padding:14px 24px;border-top:1px solid #eef2f7"><p style="font-size:11px;color:#94a3b8;text-align:center;margin:0">Répondez STOP pour ne plus recevoir ces messages.</p></div>
</div>`;
  return { subject, html };
}
