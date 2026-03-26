import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  try {
    const resources = await prisma.miningResource.findMany({
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    });
    return NextResponse.json({ success: true, resources });
  } catch (error) {
    logger.error('Error fetching admin mining resources:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, slug, type } = body;

    if (!name || !slug || !type) {
      return NextResponse.json(
        { success: false, error: 'Champs requis : name, slug, type' },
        { status: 400 },
      );
    }

    const resource = await prisma.miningResource.create({
      data: {
        name: body.name,
        nameEn: body.nameEn || null,
        nameMg: body.nameMg || null,
        slug: body.slug,
        type: body.type,
        subType: body.subType || null,
        description: body.description || null,
        region: body.region || null,
        locations: body.locations ? JSON.stringify(body.locations) : null,
        discoveryYear: body.discoveryYear || null,
        exploitationStart: body.exploitationStart || null,
        productionVolume: body.productionVolume || null,
        worldRank: body.worldRank || null,
        percentWorld: body.percentWorld || null,
        operators: body.operators ? JSON.stringify(body.operators) : null,
        environmentalImpact: body.environmentalImpact || null,
        imageUrl: body.imageUrl || null,
        isFeatured: body.isFeatured || false,
      },
    });

    return NextResponse.json({ success: true, resource }, { status: 201 });
  } catch (error) {
    logger.error('Error creating mining resource:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
