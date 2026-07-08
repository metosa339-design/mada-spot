import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { resolveSegment, SegmentFilter } from '@/lib/crm/segment';

export const dynamic = 'force-dynamic';

// POST /api/admin/crm/segment-count — compte + échantillon pour un filtre de segment
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  let filter: SegmentFilter;
  try {
    filter = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }

  const recipients = await resolveSegment(filter);
  return apiSuccess({
    count: recipients.length,
    sample: recipients.slice(0, 8).map((r) => ({
      email: r.email,
      firstName: r.firstName,
      establishmentName: r.establishmentName,
      city: r.city,
    })),
  });
}
