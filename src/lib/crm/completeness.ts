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

/**
 * Une URL correspond-elle à une VRAIE photo (uploadée pour cet établissement) ?
 * - /uploads/… (upload VPS) ou res.cloudinary.com/… (upload Cloudinary) => vraie photo
 * - /images/… (packs génériques/IA bundlés) ou unsplash => générique, PAS une vraie photo
 * - autre URL distante => considérée réelle
 */
function isRealPhotoUrl(u?: string | null): boolean {
  if (!u) return false;
  const s = u.trim();
  if (!s) return false;
  if (s.startsWith('/uploads/')) return true;
  if (s.includes('res.cloudinary.com')) return true;
  if (s.startsWith('/images/')) return false;
  if (s.includes('unsplash')) return false;
  if (/^https?:\/\//.test(s)) return true;
  return false;
}

/**
 * La fiche a-t-elle au moins une vraie photo uploadée (cover ou galerie) ?
 * Sert au tri public : les fiches avec vraie photo remontent avant les images
 * IA/génériques (que les visiteurs jugent peu crédibles).
 */
export function hasRealPhoto(f: Pick<CompletenessInput, 'coverImage' | 'images'>): boolean {
  if (isRealPhotoUrl(f.coverImage)) return true;
  try {
    const arr = JSON.parse(f.images || '[]');
    if (Array.isArray(arr)) {
      for (const item of arr) {
        const url = item && typeof item === 'object' ? item.url : item;
        if (typeof url === 'string' && isRealPhotoUrl(url)) return true;
      }
    }
  } catch {
    /* ignore */
  }
  return false;
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
