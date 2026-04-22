import { prisma } from '@/lib/db';
import { cachedQuery } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// Warm up cache on first health check (server start)
let warmedUp = false;
async function warmUpCache() {
  if (warmedUp) return;
  warmedUp = true;

  try {
    // Pre-load the 4 most popular listing pages into cache
    await Promise.all([
      cachedQuery('attractions::::false::rating:20:0', 600, () =>
        Promise.all([
          prisma.establishment.findMany({
            where: { isActive: true, type: 'ATTRACTION', moderationStatus: 'approved', attraction: { isNot: null } },
            select: { id: true, name: true, slug: true, city: true, coverImage: true, rating: true, reviewCount: true, isFeatured: true },
            orderBy: [{ displayOrder: 'desc' }, { isFeatured: 'desc' }, { rating: 'desc' }],
            take: 20,
          }),
          prisma.establishment.count({ where: { isActive: true, type: 'ATTRACTION', moderationStatus: 'approved', attraction: { isNot: null } } }),
        ])
      ),
      cachedQuery('hotels:::::::rating:20:0', 600, () =>
        Promise.all([
          prisma.establishment.findMany({
            where: { isActive: true, type: 'HOTEL', moderationStatus: 'approved', hotel: { isNot: null } },
            select: { id: true, name: true, slug: true, city: true, coverImage: true, rating: true, reviewCount: true, isFeatured: true },
            orderBy: [{ displayOrder: 'desc' }, { isFeatured: 'desc' }, { rating: 'desc' }],
            take: 20,
          }),
          prisma.establishment.count({ where: { isActive: true, type: 'HOTEL', moderationStatus: 'approved', hotel: { isNot: null } } }),
        ])
      ),
      cachedQuery('restaurants:::::::rating:20:0', 600, () =>
        Promise.all([
          prisma.establishment.findMany({
            where: { isActive: true, type: 'RESTAURANT', moderationStatus: 'approved', restaurant: { isNot: null } },
            select: { id: true, name: true, slug: true, city: true, coverImage: true, rating: true, reviewCount: true, isFeatured: true },
            orderBy: [{ displayOrder: 'desc' }, { isFeatured: 'desc' }, { rating: 'desc' }],
            take: 20,
          }),
          prisma.establishment.count({ where: { isActive: true, type: 'RESTAURANT', moderationStatus: 'approved', restaurant: { isNot: null } } }),
        ])
      ),
      cachedQuery('providers::::20:0', 600, () =>
        Promise.all([
          prisma.establishment.findMany({
            where: { isActive: true, type: 'PROVIDER', moderationStatus: 'approved', provider: { isNot: null } },
            select: { id: true, name: true, slug: true, city: true, coverImage: true, rating: true, reviewCount: true, isFeatured: true },
            orderBy: [{ displayOrder: 'desc' }, { isFeatured: 'desc' }, { rating: 'desc' }],
            take: 20,
          }),
          prisma.establishment.count({ where: { isActive: true, type: 'PROVIDER', moderationStatus: 'approved', provider: { isNot: null } } }),
        ])
      ),
    ]);
  } catch {
    // Silent fail — cache warm-up is best-effort
  }
}

export async function GET() {
  const start = Date.now();
  let dbStatus = 'ok';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }

  // Warm up cache in background on first call
  warmUpCache().catch(() => {});

  const healthy = dbStatus === 'ok';

  return Response.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      db: dbStatus,
      uptime: Math.floor(process.uptime()),
      latency: Date.now() - start,
      timestamp: new Date().toISOString(),
      cacheWarmed: warmedUp,
    },
    { status: healthy ? 200 : 503 }
  );
}
