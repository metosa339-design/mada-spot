import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { apiError } from '@/lib/api-response';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';
import { generateCSV } from '@/lib/import/csv-parser';

// GET /api/admin/import/template?type=RESTAURANT - Download CSV template
export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionId) return apiError('Non autorisé', 401);
  const user = await getSession(sessionId);
  if (!user) return apiError('Non autorisé', 401);
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'RESTAURANT';

  const baseHeaders = [
    'type', 'name', 'description', 'shortDescription', 'address', 'city', 'district',
    'region', 'latitude', 'longitude', 'phone', 'email', 'website', 'facebook',
    'whatsapp', 'coverImage', 'sourceUrl', 'sourceAttribution',
  ];

  let headers: string[] = [];
  let exampleRow: string[] = [];

  switch (type.toUpperCase()) {
    case 'HOTEL':
      headers = [
        ...baseHeaders, 'starRating', 'hotelType', 'amenities', 'checkInTime', 'checkOutTime',
      ];
      exampleRow = [
        'HOTEL', 'Hôtel Carlton', 'Un hôtel historique au coeur de Tana', 'Hôtel 5 étoiles à Antananarivo',
        'Rue de l\'Indépendance', 'Antananarivo', 'Analakely', 'Analamanga',
        '-18.9100', '47.5235', '+261 20 22 260 60', 'info@carlton.mg',
        'https://carlton.mg', '', '', '', '', '',
        '5', 'hotel', '["wifi","parking","pool","restaurant","spa","ac"]', '14:00', '11:00',
      ];
      break;

    case 'ATTRACTION':
      headers = [
        ...baseHeaders, 'attractionType', 'isFree', 'entryFeeForeign', 'entryFeeLocal',
        'visitDuration', 'bestTimeToVisit',
      ];
      exampleRow = [
        'ATTRACTION', 'Parc National d\'Andasibe', 'Réserve naturelle abritant des lémuriens',
        'Parc national avec lémuriens Indri Indri', 'Route Nationale 2',
        'Moramanga', 'Andasibe', 'Alaotra-Mangoro',
        '-18.9333', '48.4167', '+261 34 00 000 00', '', '', '', '', '', '', '',
        'park', 'false', '55000', '25000', '2-4 heures', 'Saison sèche (Avril-Octobre)',
      ];
      break;

    default: // RESTAURANT
      headers = [
        ...baseHeaders, 'category', 'cuisineTypes', 'priceRange', 'openingHours',
        'hasDelivery', 'hasTakeaway', 'hasReservation', 'hasParking', 'hasWifi',
        'hasGenerator', 'avgMainCourse', 'avgBeer',
      ];
      exampleRow = [
        'RESTAURANT', 'Chez Mariette', 'Gargote malgache traditionnelle avec plats du jour',
        'Gargote malgache authentique', 'Lot IB 123 Analakely', 'Antananarivo', 'Analakely',
        'Analamanga', '-18.9107', '47.5235', '+261 34 12 345 67', '',
        '', 'chez.mariette.tana', '', '', '', '',
        'GARGOTE', 'malgache,street food', 'BUDGET',
        '{"monday":{"open":"06:30","close":"15:00"},"tuesday":{"open":"06:30","close":"15:00"},"wednesday":{"open":"06:30","close":"15:00"},"thursday":{"open":"06:30","close":"15:00"},"friday":{"open":"06:30","close":"15:00"},"saturday":{"open":"07:00","close":"14:00"},"sunday":{"closed":true}}',
        'false', 'true', 'false', 'false', 'false', 'false', '5000', '4000',
      ];
      break;
  }

  const csv = generateCSV(headers, [exampleRow]);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="template-${type.toLowerCase()}.csv"`,
    },
  });
}
