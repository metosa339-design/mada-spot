// Algorithme de classement automatique de Mada Spot.
// - calculateCompletenessScore : qualité/conformité d'une fiche sur 1000 points.
// - calculateRankScore : score de pertinence global (boost + complétude + note + avis + vues).
// Le rankScore est mis en cache dans Establishment.rankScore (recalculé au save + cron).

export interface RankInput {
  description?: string | null;
  coverImage?: string | null;
  images?: string | null; // JSON array (string) ou déjà nombre de photos via imagesCount
  phone?: string | null;
  phone2?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  facebook?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isVerified?: boolean | null;
  // Signaux d'engagement / boost
  rating?: number | null;
  reviewCount?: number | null;
  viewCount?: number | null;
  isFeatured?: boolean | null; // reflète un boost actif (synchronisé par syncEstablishmentFeature)
}

export interface CompletenessBreakdownItem {
  key: string;
  label: string;
  points: number;
  max: number;
  ok: boolean;
}

export interface CompletenessResult {
  score: number; // 0 - 1000
  percent: number; // 0 - 100
  breakdown: CompletenessBreakdownItem[];
  warnings: string[]; // ex: "⚠️ Manque de photos"
}

export const COMPLETENESS_MAX = 1000;

function photoCount(f: RankInput): number {
  let n = 0;
  if (f.coverImage && f.coverImage.trim()) n += 1;
  try {
    const arr = JSON.parse(f.images || '[]');
    if (Array.isArray(arr)) n += arr.filter((x) => (typeof x === 'string' ? x.trim() : x && x.url)).length;
  } catch {
    /* ignore */
  }
  return n;
}

/** Qualité & conformité d'une fiche sur 1000 points, avec détail et alertes. */
export function calculateCompletenessScore(f: RankInput): CompletenessResult {
  // Description : +200 si > 200 caractères
  const descLen = (f.description || '').trim().length;
  const descPts = descLen > 200 ? 200 : 0;

  // Photos : +250 si >= 3, sinon +80 par photo (max 250)
  const photos = photoCount(f);
  const photoPts = photos >= 3 ? 250 : Math.min(photos * 80, 250);

  // Contact : +200 si au moins 2 canaux (tel/WhatsApp, email, Facebook)
  const channels = [
    !!((f.phone && f.phone.trim()) || (f.phone2 && f.phone2.trim()) || (f.whatsapp && f.whatsapp.trim())),
    !!(f.email && f.email.trim()),
    !!(f.facebook && f.facebook.trim()),
  ].filter(Boolean).length;
  const contactPts = channels >= 2 ? 200 : 0;

  // Localisation : +150 si GPS renseigné
  const hasGps = typeof f.latitude === 'number' && typeof f.longitude === 'number' && !!f.latitude && !!f.longitude;
  const gpsPts = hasGps ? 150 : 0;

  // Statut vérifié : +200
  const verifiedPts = f.isVerified ? 200 : 0;

  const breakdown: CompletenessBreakdownItem[] = [
    { key: 'description', label: 'Description', points: descPts, max: 200, ok: descPts > 0 },
    { key: 'photos', label: 'Photos', points: photoPts, max: 250, ok: photos >= 3 },
    { key: 'contact', label: 'Contact', points: contactPts, max: 200, ok: channels >= 2 },
    { key: 'gps', label: 'Localisation GPS', points: gpsPts, max: 150, ok: hasGps },
    { key: 'verified', label: 'Vérifiée / Conforme', points: verifiedPts, max: 200, ok: !!f.isVerified },
  ];

  const score = descPts + photoPts + contactPts + gpsPts + verifiedPts;

  const warnings: string[] = [];
  if (photos < 3) warnings.push(photos === 0 ? '⚠️ Aucune photo' : '⚠️ Manque de photos');
  if (channels < 2) warnings.push('⚠️ Contact insuffisant');
  if (!hasGps) warnings.push('⚠️ GPS manquant');
  if (descPts === 0) warnings.push('⚠️ Description trop courte');
  if (!f.isVerified) warnings.push('⚠️ Non vérifiée');

  return { score, percent: Math.round((score / COMPLETENESS_MAX) * 100), breakdown, warnings };
}

/**
 * Score de pertinence global (mis en cache dans rankScore).
 * = Boost (10 000 si actif) + Complétude (0-1000) + note*100 + ln(avis+1)*150 + ln(vues+1)*50
 */
export function calculateRankScore(f: RankInput, completeness?: number): number {
  const comp = typeof completeness === 'number' ? completeness : calculateCompletenessScore(f).score;
  const boost = f.isFeatured ? 10000 : 0;
  const rating = (f.rating || 0) * 100;
  const reviews = Math.log((f.reviewCount || 0) + 1) * 150;
  const views = Math.log((f.viewCount || 0) + 1) * 50;
  return Math.round(boost + comp + rating + reviews + views);
}
