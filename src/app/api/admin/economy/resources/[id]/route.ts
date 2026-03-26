import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  try {
    const { id } = await params;
    const resource = await prisma.miningResource.findUnique({ where: { id } });
    if (!resource) {
      return NextResponse.json({ success: false, error: 'Ressource non trouvée' }, { status: 404 });
    }
    return NextResponse.json({ success: true, resource });
  } catch (error) {
    logger.error('Error fetching mining resource:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.nameEn !== undefined) data.nameEn = body.nameEn || null;
    if (body.nameMg !== undefined) data.nameMg = body.nameMg || null;
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.type !== undefined) data.type = body.type;
    if (body.subType !== undefined) data.subType = body.subType || null;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.region !== undefined) data.region = body.region || null;
    if (body.locations !== undefined) data.locations = body.locations ? JSON.stringify(body.locations) : null;
    if (body.discoveryYear !== undefined) data.discoveryYear = body.discoveryYear || null;
    if (body.exploitationStart !== undefined) data.exploitationStart = body.exploitationStart || null;
    if (body.productionVolume !== undefined) data.productionVolume = body.productionVolume || null;
    if (body.worldRank !== undefined) data.worldRank = body.worldRank || null;
    if (body.percentWorld !== undefined) data.percentWorld = body.percentWorld || null;
    if (body.operators !== undefined) data.operators = body.operators ? JSON.stringify(body.operators) : null;
    if (body.environmentalImpact !== undefined) data.environmentalImpact = body.environmentalImpact || null;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null;
    if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const resource = await prisma.miningResource.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    logger.error('Error updating mining resource:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.miningResource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting mining resource:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
