import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/stats/heatmap — aggregate views by city with coordinates
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return apiError('Non autorisé', 401);

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30d';
  const periodDays = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  try {
    // Get all active establishments with their view counts in the period
    const establishments = await prisma.establishment.findMany({
      where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
      select: {
        id: true,
        city: true,
        region: true,
        latitude: true,
        longitude: true,
        type: true,
        _count: {
          select: {
            views: { where: { createdAt: { gte: periodStart } } },
          },
        },
      },
    });

    // Aggregate by city
    const cityMap = new Map<string, {
      city: string;
      region: string | null;
      lat: number;
      lng: number;
      viewCount: number;
      establishmentCount: number;
      types: Record<string, number>;
    }>();

    for (const est of establishments) {
      const key = est.city.toLowerCase().trim();
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          city: est.city,
          region: est.region,
          lat: est.latitude!,
          lng: est.longitude!,
          viewCount: 0,
          establishmentCount: 0,
          types: {},
        });
      }
      const entry = cityMap.get(key)!;
      entry.viewCount += est._count.views;
      entry.establishmentCount += 1;
      entry.types[est.type] = (entry.types[est.type] || 0) + 1;
    }

    const zones = Array.from(cityMap.values())
      .filter(z => z.viewCount > 0 || z.establishmentCount > 0)
      .sort((a, b) => b.viewCount - a.viewCount);

    return NextResponse.json({ success: true, zones });
  } catch (err) {
    console.error('Heatmap error:', err);
    return apiError('Erreur serveur', 500);
  }
}
