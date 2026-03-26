import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;


import { logger } from '@/lib/logger';
function toCsv(headers: string[], rows: any[][]): string {
  const escape = (v: any) => {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }
  return lines.join('\n');
}

// GET /api/admin/export?type=bookings|users|establishments|reviews
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return apiError('Non autorisé', 401);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (!type) {
    return NextResponse.json({ error: 'type requis (bookings, users, establishments, reviews)' }, { status: 400 });
  }

  try {
    let csv = '';
    let filename = '';

    switch (type) {
      case 'bookings': {
        const bookings = await prisma.booking.findMany({
          include: {
            establishment: { select: { name: true, city: true } },
            user: { select: { email: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5000,
        });
        csv = toCsv(
          ['Référence', 'Établissement', 'Ville', 'Type', 'Client', 'Email', 'Téléphone', 'Check-in', 'Check-out', 'Personnes', 'Prix', 'Devise', 'Statut', 'Créé le'],
          bookings.map((b: any) => [
            b.reference, b.establishment.name, b.establishment.city, b.bookingType,
            b.guestName, b.guestEmail || b.user?.email, b.guestPhone || b.user?.phone,
            b.checkIn?.toISOString().split('T')[0], b.checkOut?.toISOString().split('T')[0] || '',
            b.guestCount, b.totalPrice || '', b.currency, b.status,
            b.createdAt.toISOString().split('T')[0],
          ])
        );
        filename = 'mada-spot-reservations.csv';
        break;
      }

      case 'users': {
        const users = await prisma.user.findMany({
          select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });
        csv = toCsv(
          ['ID', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Rôle', 'Actif', 'Inscrit le'],
          users.map((u: any) => [u.id, u.firstName, u.lastName, u.email, u.phone, u.role, u.isActive ? 'Oui' : 'Non', u.createdAt.toISOString().split('T')[0]])
        );
        filename = 'mada-spot-utilisateurs.csv';
        break;
      }

      case 'establishments': {
        const establishments = await db.establishment.findMany({
          select: { id: true, name: true, type: true, city: true, moderationStatus: true, rating: true, reviewCount: true, isFeatured: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });
        csv = toCsv(
          ['ID', 'Nom', 'Type', 'Ville', 'Statut', 'Note', 'Nb Avis', 'Recommandé', 'Créé le'],
          establishments.map((e: any) => [e.id, e.name, e.type, e.city, e.moderationStatus, e.rating || '', e.reviewCount, e.isFeatured ? 'Oui' : 'Non', e.createdAt.toISOString().split('T')[0]])
        );
        filename = 'mada-spot-etablissements.csv';
        break;
      }

      case 'reviews': {
        const reviews = await prisma.establishmentReview.findMany({
          select: {
            id: true, authorName: true, rating: true, comment: true, isPublished: true, createdAt: true,
            establishment: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });
        csv = toCsv(
          ['ID', 'Établissement', 'Auteur', 'Note', 'Commentaire', 'Publié', 'Créé le'],
          reviews.map((r: any) => [r.id, r.establishment.name, r.authorName, r.rating, r.comment, r.isPublished ? 'Oui' : 'Non', r.createdAt.toISOString().split('T')[0]])
        );
        filename = 'mada-spot-avis.csv';
        break;
      }

      default:
        return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    logger.error('[ADMIN EXPORT] Error:', error);
    return apiError('Erreur serveur', 500);
  }
}
