import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { cachedQuery } from '@/lib/cache';

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' };

// GET /api/economy/exports - Get export products
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // agriculture, mining, textile, seafood, handicraft
    const slug = searchParams.get('slug');
    const featured = searchParams.get('featured') === 'true';

    // If specific product requested
    if (slug) {
      const product = await db.exportProduct.findUnique({
        where: { slug },
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(product, { headers: CACHE_HEADERS });
    }

    // Build where clause
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (featured) where.isFeatured = true;

    const cacheKey = `economy:exports:${category || 'all'}:${featured}`;
    const products: any = await cachedQuery(cacheKey, 3600, () =>
      db.exportProduct.findMany({
        where,
        orderBy: [
          { annualExportValue: 'desc' },
          { name: 'asc' },
        ],
      })
    );

    // Group by category
    const byCategory = {
      agriculture: products.filter((p: any) => p.category === 'agriculture'),
      mining: products.filter((p: any) => p.category === 'mining'),
      textile: products.filter((p: any) => p.category === 'textile'),
      seafood: products.filter((p: any) => p.category === 'seafood'),
      handicraft: products.filter((p: any) => p.category === 'handicraft'),
    };

    // Calculate totals
    const totalExportValue = products.reduce((sum: any, p: any) => sum + (p.annualExportValue || 0), 0);

    return NextResponse.json({
      products,
      byCategory,
      stats: {
        total: products.length,
        totalExportValue,
      },
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching exports:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    );
  }
}
