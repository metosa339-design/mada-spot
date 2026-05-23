import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logAudit, getRequestMeta } from '@/lib/audit';

interface ImportRow {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  city?: string;
  country?: string;
  source?: string;
  sourceNote?: string;
}

// POST /api/admin/crm/prospects/import
// Body: { rows: ImportRow[], defaultSource?: string }
// OU: importer tous les abonnés newsletter non-prospects: { fromNewsletter: true }
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }

  let rows: ImportRow[] = Array.isArray(body?.rows) ? body.rows : [];
  const defaultSource = body?.defaultSource || 'CSV_IMPORT';

  if (body?.fromNewsletter === true) {
    const existingEmails = (await prisma.prospect.findMany({
      where: { email: { not: null } },
      select: { email: true },
    })).map(p => p.email!);

    const subs = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true, email: { notIn: existingEmails } },
      orderBy: { subscribedAt: 'desc' },
    });
    rows = subs.map(s => ({ email: s.email, source: 'NEWSLETTER' }));
  }

  if (!rows.length) return apiError('Aucune ligne à importer', 400);

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const r of rows) {
    const email = (r.email || '').trim().toLowerCase();
    const phone = (r.phone || '').trim();
    if (!email && !phone) {
      skipped++;
      continue;
    }
    try {
      if (email) {
        const exists = await prisma.prospect.findUnique({ where: { email } });
        if (exists) {
          skipped++;
          continue;
        }
      }
      await prisma.prospect.create({
        data: {
          email: email || null,
          phone: phone || null,
          firstName: r.firstName || null,
          lastName: r.lastName || null,
          company: r.company || null,
          city: r.city || null,
          country: r.country || null,
          source: (r.source as any) || (defaultSource as any),
          sourceNote: r.sourceNote || null,
          status: 'NEW',
          ownerId: admin.id,
        },
      });
      created++;
    } catch (e) {
      errors.push(`${email || phone}: ${e instanceof Error ? e.message : 'erreur'}`);
    }
  }

  const meta = getRequestMeta(request);
  await logAudit({
    userId: admin.id,
    action: 'import',
    entityType: 'prospect',
    details: { created, skipped, errors: errors.slice(0, 20), totalRows: rows.length },
    ...meta,
  }).catch(() => {});

  return apiSuccess({ created, skipped, errors });
}
