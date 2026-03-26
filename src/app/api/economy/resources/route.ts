import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cachedQuery } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { safeJsonParse } from '@/lib/api-response';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const slug = searchParams.get('slug');
    const featured = searchParams.get('featured') === 'true';

    // Single resource by slug
    if (slug) {
      const resource = await prisma.miningResource.findUnique({ where: { slug } });
      if (!resource) {
        return NextResponse.json({ error: 'Ressource non trouvée' }, { status: 404 });
      }
      return NextResponse.json({
        ...resource,
        locations: safeJsonParse(resource.locations, []),
        operators: safeJsonParse(resource.operators, []),
      }, { headers: CACHE_HEADERS });
    }

    // List with filters
    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;
    if (featured) where.isFeatured = true;

    const cacheKey = `economy:resources:${type || 'all'}:${featured}`;
    const resources = await cachedQuery(cacheKey, 3600, () =>
      prisma.miningResource.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { worldRank: 'asc' }, { name: 'asc' }],
      })
    ) as Array<Record<string, unknown>>;

    // Group by type
    const byType = {
      precious_stones: resources.filter(r => r.type === 'precious_stone'),
      minerals: resources.filter(r => r.type === 'mineral'),
      metals: resources.filter(r => r.type === 'metal'),
      energy: resources.filter(r => r.type === 'energy'),
    };

    // Unique regions
    const regions = [...new Set(resources.map(r => r.region).filter(Boolean))] as string[];

    return NextResponse.json({
      resources,
      byType,
      regions,
      total: resources.length,
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching mining resources:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des ressources' },
      { status: 500 },
    );
  }
}
