import { prisma } from '@/lib/db';

export interface SegmentFilter {
  audience: 'users' | 'prospects';
  userType?: 'any' | 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'PROVIDER';
  ficheStatus?: 'any' | 'with' | 'without' | 'pending';
  city?: string;
  prospectStatus?: string; // 'any' | ProspectStatus
  excludeUnsubscribed?: boolean;
}

export interface Recipient {
  email: string;
  phone: string | null;
  firstName: string | null;
  establishmentName: string | null;
  city: string | null;
  typeLabel: string | null;
}

export const TYPE_LABELS: Record<string, string> = {
  HOTEL: 'hôtel',
  RESTAURANT: 'restaurant',
  ATTRACTION: 'activité',
  PROVIDER: 'prestataire',
};

/**
 * Résout un filtre de segment en liste de destinataires dédupliqués (par email).
 * Lecture seule.
 */
export async function resolveSegment(filter: SegmentFilter): Promise<Recipient[]> {
  const city = (filter.city || '').trim().toLowerCase();

  if (filter.audience === 'prospects') {
    const where: any = { email: { not: null } };
    if (filter.excludeUnsubscribed !== false) {
      where.optInEmail = true;
      where.unsubscribedAt = null;
    }
    if (filter.prospectStatus && filter.prospectStatus !== 'any') where.status = filter.prospectStatus;
    const prospects = await prisma.prospect.findMany({
      where,
      select: { email: true, phone: true, firstName: true, company: true, city: true },
    });
    const seen = new Set<string>();
    const out: Recipient[] = [];
    for (const p of prospects) {
      const email = (p.email || '').trim().toLowerCase();
      if (!email || seen.has(email)) continue;
      if (city && (p.city || '').toLowerCase() !== city) continue;
      seen.add(email);
      out.push({ email, phone: p.phone, firstName: p.firstName, establishmentName: p.company, city: p.city, typeLabel: null });
    }
    return out;
  }

  // audience = users (prestataires)
  const est = await prisma.establishment.findMany({
    select: {
      name: true,
      city: true,
      moderationStatus: true,
      claimedByUserId: true,
      createdByUserId: true,
    },
  });

  // owner -> infos établissement (on garde le 1er trouvé) + ensembles de statut
  const ownerInfo = new Map<string, { name: string | null; city: string | null }>();
  const ownersAll = new Set<string>();
  const ownersPending = new Set<string>();
  for (const e of est) {
    const owner = e.claimedByUserId || e.createdByUserId;
    if (!owner) continue;
    ownersAll.add(owner);
    if (!ownerInfo.has(owner)) ownerInfo.set(owner, { name: e.name, city: e.city });
    if (e.moderationStatus === 'pending_review') ownersPending.add(owner);
  }

  const where: any = { email: { not: null } };
  if (filter.userType && filter.userType !== 'any') where.userType = filter.userType;
  else where.userType = { not: null };

  const users = await prisma.user.findMany({
    where,
    select: { id: true, email: true, phone: true, firstName: true, userType: true },
  });

  const ficheStatus = filter.ficheStatus || 'any';
  const seen = new Set<string>();
  const out: Recipient[] = [];

  for (const u of users) {
    const email = (u.email || '').trim().toLowerCase();
    if (!email || seen.has(email)) continue;

    const hasFiche = ownersAll.has(u.id);
    if (ficheStatus === 'with' && !hasFiche) continue;
    if (ficheStatus === 'without' && hasFiche) continue;
    if (ficheStatus === 'pending' && !ownersPending.has(u.id)) continue;

    const info = ownerInfo.get(u.id);
    if (city) {
      const uCity = (info?.city || '').toLowerCase();
      if (uCity !== city) continue;
    }

    seen.add(email);
    out.push({
      email,
      phone: u.phone,
      firstName: u.firstName,
      establishmentName: info?.name || null,
      city: info?.city || null,
      typeLabel: u.userType ? TYPE_LABELS[u.userType] || 'établissement' : null,
    });
  }
  return out;
}

/** Remplace les variables {{prenom}}, {{type}}, {{ville}}, {{etablissement}} dans un texte. */
export function personalize(template: string, r: Recipient): string {
  return template
    .replace(/\{\{\s*prenom\s*\}\}/gi, r.firstName || '')
    .replace(/\{\{\s*type\s*\}\}/gi, r.typeLabel || 'établissement')
    .replace(/\{\{\s*ville\s*\}\}/gi, r.city || '')
    .replace(/\{\{\s*etablissement\s*\}\}/gi, r.establishmentName || 'votre établissement');
}
