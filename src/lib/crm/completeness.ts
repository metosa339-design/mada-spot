// Score de complétude d'une fiche (0-100). Sert au tri public : plus la fiche est riche, plus elle remonte.

export interface CompletenessInput {
  coverImage?: string | null;
  images?: string | null; // JSON array
  description?: string | null;
  shortDescription?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
}

function imgCount(raw?: string | null): number {
  try {
    const a = JSON.parse(raw || '[]');
    return Array.isArray(a) ? a.length : 0;
  } catch {
    return 0;
  }
}

export function computeCompleteness(f: CompletenessInput): number {
  let s = 0;
  // Photos (35)
  if (f.coverImage) s += 20;
  const n = imgCount(f.images);
  s += n >= 3 ? 15 : n >= 1 ? 8 : 0;
  // Description (25)
  const desc = (f.description || '').trim().length;
  s += desc >= 200 ? 20 : desc >= 60 ? 13 : desc >= 1 ? 6 : 0;
  if ((f.shortDescription || '').trim().length >= 10) s += 5;
  // Contact (15)
  if (f.phone && f.phone.trim()) s += 8;
  if ((f.email && f.email.trim()) || (f.website && f.website.trim())) s += 7;
  // Localisation (20)
  if (f.address && f.address.trim()) s += 8;
  if (typeof f.latitude === 'number' && typeof f.longitude === 'number') s += 7;
  const city = (f.city || '').trim().toLowerCase();
  if (city && city !== 'non spécifié' && city !== 'non specifie') s += 5;
  // Réseaux sociaux (5)
  if ((f.facebook || f.instagram || f.whatsapp || '').trim()) s += 5;

  return Math.max(0, Math.min(100, s));
}
