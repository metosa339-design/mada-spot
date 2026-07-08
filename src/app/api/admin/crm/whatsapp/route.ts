import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { resolveSegment, SegmentFilter } from '@/lib/crm/segment';

export const dynamic = 'force-dynamic';

// Normalise un numéro malgache en format international (261XXXXXXXXX), sans '+'.
function normalizeMg(raw: string): string | null {
  let d = (raw || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('261')) {
    /* déjà international */
  } else if (d.startsWith('0')) {
    d = '261' + d.slice(1);
  } else if (d.length === 9) {
    d = '261' + d; // numéro local sans le 0
  }
  if (d.length < 11 || d.length > 13) return null; // 261 + 9/10 chiffres
  return d;
}

// POST /api/admin/crm/whatsapp — liste des destinataires WhatsApp d'un segment (avec téléphone)
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
  const withPhone = recipients
    .map((r) => ({ ...r, phoneIntl: r.phone ? normalizeMg(r.phone) : null }))
    .filter((r) => r.phoneIntl)
    .map((r) => ({
      firstName: r.firstName,
      phone: r.phone,
      phoneIntl: r.phoneIntl,
      establishmentName: r.establishmentName,
      city: r.city,
      typeLabel: r.typeLabel,
    }));

  return apiSuccess({
    total: recipients.length,
    withPhone: withPhone.length,
    recipients: withPhone,
  });
}
