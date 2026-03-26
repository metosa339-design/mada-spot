import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' };

// GET /api/discover/famous - Get famous things about Madagascar
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // fauna, flora, culture, landmark, tradition, cuisine, sport
    const slug = searchParams.get('slug');
    const featured = searchParams.get('featured') === 'true';
    const endemic = searchParams.get('endemic') === 'true';

    // If specific thing requested
    if (slug) {
      const thing = await db.famousThing.findUnique({
        where: { slug },
      });

      if (!thing) {
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(thing, { headers: CACHE_HEADERS });
    }

    // Build where clause
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (featured) where.isFeatured = true;
    if (endemic) where.endemic = true;

    const things = await db.famousThing.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    });

    // Group by category
    const byCategory = {
      fauna: things.filter((t: any) => t.category === 'fauna'),
      flora: things.filter((t: any) => t.category === 'flora'),
      culture: things.filter((t: any) => t.category === 'culture'),
      landmark: things.filter((t: any) => t.category === 'landmark'),
      tradition: things.filter((t: any) => t.category === 'tradition'),
      cuisine: things.filter((t: any) => t.category === 'cuisine'),
    };

    // Endemic species count
    const endemicCount = things.filter((t: any) => t.endemic).length;

    return NextResponse.json({
      items: things,
      byCategory,
      stats: {
        total: things.length,
        endemic: endemicCount,
      },
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching famous things:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des éléments' },
      { status: 500 }
    );
  }
}
