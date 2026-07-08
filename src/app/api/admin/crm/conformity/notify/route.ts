import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { evaluateFiche, buildConformityEmail } from '@/lib/crm/conformity';
import { sendBrevoEmail } from '@/lib/crm/brevo';
import { logAudit, getRequestMeta } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/crm/conformity/notify  body: { establishmentId, preview?: boolean }
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }
  const { establishmentId, preview } = body || {};
  if (!establishmentId) return apiError('establishmentId requis', 400);

  const est = await prisma.establishment.findUnique({
    where: { id: establishmentId },
    select: {
      id: true, name: true, description: true, city: true, address: true, latitude: true, longitude: true,
      phone: true, email: true, website: true, coverImage: true, images: true,
      claimedByUserId: true, createdByUserId: true,
    },
  });
  if (!est) return apiError('Fiche introuvable', 404);

  const { failing, conforme } = evaluateFiche(est);
  if (conforme) return apiError('Cette fiche est déjà conforme', 400);

  // Destinataire
  const ownerId = est.claimedByUserId || est.createdByUserId;
  const owner = ownerId
    ? await prisma.user.findUnique({ where: { id: ownerId }, select: { email: true, firstName: true } })
    : null;
  const to = owner?.email || est.email;
  if (!to) return apiError('Aucun e-mail pour cette fiche', 400);

  const { subject, html } = buildConformityEmail(est.name, owner?.firstName || null, failing);

  // Mode aperçu : ne pas envoyer
  if (preview) return apiSuccess({ to, subject, html, failing: failing.map((f) => f.label) });

  const result = await sendBrevoEmail({
    to,
    subject,
    html,
    senderName: 'Metosaela RANDRIAMAZAORO — Mada Spot',
    senderEmail: 'contact@madaspot.com',
    tag: 'conformite-crm',
  });

  if (!result.ok) {
    return apiError(result.ipBlocked ? 'IP Brevo non autorisée — autorisez-la dans Brevo > Sécurité.' : `Échec envoi : ${result.error}`, 502);
  }

  const meta = getRequestMeta(request);
  await logAudit({
    userId: admin.id,
    action: 'conformity_notify',
    entityType: 'establishment',
    entityId: est.id,
    details: { to, failing: failing.map((f) => f.key) },
    ...meta,
  }).catch(() => {});

  return apiSuccess({ sent: true, to, failing: failing.map((f) => f.label) });
}
