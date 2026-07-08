import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { TYPE_LABELS } from '@/lib/crm/segment';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET /api/admin/crm/contacts?kind=all|clients|prospects&search=
// Liste unifiée des contacts (ID lisible, email, localisation, service).
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const sp = new URL(request.url).searchParams;
  const kind = sp.get('kind') || 'all';
  const search = sp.get('search')?.trim().toLowerCase() || '';

  const rows: any[] = [];

  if (kind === 'all' || kind === 'clients') {
    const users = await prisma.user.findMany({
      where: { userType: { not: null } },
      select: { id: true, refCode: true, email: true, phone: true, firstName: true, lastName: true, userType: true, createdAt: true },
    });
    // localisation via établissement possédé
    const est = await prisma.establishment.findMany({
      select: { name: true, city: true, claimedByUserId: true, createdByUserId: true },
    });
    const ownerInfo = new Map<string, { name: string | null; city: string | null }>();
    for (const e of est) {
      const o = e.claimedByUserId || e.createdByUserId;
      if (o && !ownerInfo.has(o)) ownerInfo.set(o, { name: e.name, city: e.city });
    }
    for (const u of users) {
      const info = ownerInfo.get(u.id);
      rows.push({
        kind: 'client',
        id: u.id,
        refCode: u.refCode,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || info?.name || u.email,
        email: u.email,
        phone: u.phone,
        city: info?.city || null,
        service: u.userType ? TYPE_LABELS[u.userType] || 'établissement' : null,
        createdAt: u.createdAt,
      });
    }
  }

  if (kind === 'all' || kind === 'prospects') {
    const prospects = await prisma.prospect.findMany({
      select: { id: true, refCode: true, email: true, phone: true, firstName: true, lastName: true, company: true, city: true, status: true, createdAt: true },
    });
    for (const p of prospects) {
      rows.push({
        kind: 'prospect',
        id: p.id,
        refCode: p.refCode,
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.company || p.email,
        email: p.email,
        phone: p.phone,
        city: p.city,
        service: 'Prospect',
        status: p.status,
        createdAt: p.createdAt,
      });
    }
  }

  let filtered = rows;
  if (search) {
    filtered = rows.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(search) ||
        (r.email || '').toLowerCase().includes(search) ||
        (r.refCode || '').toLowerCase().includes(search) ||
        (r.city || '').toLowerCase().includes(search)
    );
  }

  // Tri : par refCode (numérique) si présent, sinon par date
  filtered.sort((a, b) => {
    const na = a.refCode ? parseInt(a.refCode.replace(/\D/g, ''), 10) : Infinity;
    const nb = b.refCode ? parseInt(b.refCode.replace(/\D/g, ''), 10) : Infinity;
    if (na !== nb) return na - nb;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return apiSuccess({
    total: rows.length,
    count: filtered.length,
    withId: rows.filter((r) => r.refCode).length,
    items: filtered.slice(0, 500),
  });
}
