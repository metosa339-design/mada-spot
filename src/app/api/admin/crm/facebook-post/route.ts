import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { postToFacebook, PostInput } from '@/lib/crm/facebook';
import { logAudit, getRequestMeta } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/crm/facebook-post — publie sur la page FB (ou renvoie le texte à copier)
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  let body: PostInput;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }
  if (!body?.title?.trim()) return apiError('Titre requis', 400);

  const result = await postToFacebook(body);

  const meta = getRequestMeta(request);
  await logAudit({
    userId: admin.id,
    action: result.posted ? 'facebook_post' : 'facebook_post_failed',
    entityType: 'facebook',
    entityId: result.postId || 'n/a',
    details: { title: body.title, posted: result.posted, reason: result.reason },
    ...meta,
  }).catch(() => {});

  return apiSuccess(result);
}
