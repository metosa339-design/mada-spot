import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { getAuthUser } from '@/lib/auth/middleware';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// GET /api/events/[slug] - Get single approved event by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, 'read');
    if (!rateLimit.success) {
      return apiError('Trop de requêtes', 429);
    }

    const { slug } = await params;

    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        establishment: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            coverImage: true,
            city: true,
          },
        },
      },
    });

    if (!event || event.status !== 'APPROVED') {
      return apiError('Événement non trouvé', 404);
    }

    // Auto-expiration: hide events where endDate has passed
    if (event.endDate && new Date(event.endDate) < new Date()) {
      return apiError('Cet événement est terminé', 410);
    }

    // Target audience check
    if (event.targetAudience !== 'ALL') {
      const user = await getAuthUser(request);
      if (!user) {
        return apiError('Événement non trouvé', 404);
      }
      const isProvider = !!user.userType;
      if (event.targetAudience === 'PROVIDERS' && !isProvider) {
        return apiError('Événement non trouvé', 404);
      }
      if (event.targetAudience === 'TRAVELERS' && isProvider) {
        return apiError('Événement non trouvé', 404);
      }
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    logger.error('Error fetching event:', error);
    return apiError('Erreur serveur', 500);
  }
}
