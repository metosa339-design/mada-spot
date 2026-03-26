import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// GET /api/admin/compliance — compliance overview (registrations, docs, quality)
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorise', 401);

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get('period') || '30';
  const typeParam = searchParams.get('type') || 'all';

  const periodDays = [7, 30, 90].includes(Number(periodParam)) ? Number(periodParam) : 30;
  const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  // Build optional userType filter
  const validTypes = ['HOTEL', 'RESTAURANT', 'ATTRACTION', 'PROVIDER'] as const;
  const userTypeFilter =
    typeParam !== 'all' && validTypes.includes(typeParam as (typeof validTypes)[number])
      ? (typeParam as (typeof validTypes)[number])
      : undefined;

  try {
    // ---------------------------------------------------------------
    // 1. New registrations (pro users created within the period)
    // ---------------------------------------------------------------
    const newUsers = await prisma.user.findMany({
      where: {
        userType: userTypeFilter ? userTypeFilter : { not: null },
        createdAt: { gte: periodStart },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        emailVerified: true,
        phoneVerified: true,
        userType: true,
        createdAt: true,
        lastLoginAt: true,
        verificationDocuments: {
          select: {
            documentType: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Check which users own at least one establishment (claimed)
    const userIds = newUsers.map((u) => u.id);
    const establishmentsByUser = await prisma.establishment.groupBy({
      by: ['claimedByUserId'],
      where: {
        claimedByUserId: { in: userIds },
      },
      _count: true,
    });
    const usersWithEstablishment = new Set(
      establishmentsByUser.map((e) => e.claimedByUserId).filter(Boolean)
    );

    const newRegistrations = newUsers.map((u) => {
      // Profile completion
      let profileCompletion = 0;
      if (u.email) profileCompletion += 20;
      if (u.phone) profileCompletion += 20;
      if (u.avatar) profileCompletion += 20;
      if (u.firstName && u.lastName) profileCompletion += 20;
      if (u.emailVerified || u.phoneVerified) profileCompletion += 20;

      // Verification docs summary
      const docs = u.verificationDocuments;
      const verificationDocs = {
        total: docs.length,
        verified: docs.filter((d) => d.status === 'VERIFIED').length,
        pending: docs.filter((d) => d.status === 'PENDING').length,
        rejected: docs.filter((d) => d.status === 'REJECTED').length,
      };

      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email || '',
        phone: u.phone || '',
        userType: u.userType,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        profileCompletion,
        verificationDocs,
        hasEstablishment: usersWithEstablishment.has(u.id),
      };
    });

    // ---------------------------------------------------------------
    // 2. Document compliance (all pro users, regardless of period)
    // ---------------------------------------------------------------
    const allPros = await prisma.user.findMany({
      where: {
        userType: userTypeFilter ? userTypeFilter : { not: null },
      },
      select: {
        id: true,
        verificationDocuments: {
          select: {
            documentType: true,
            status: true,
          },
        },
      },
    });

    let withNif = 0;
    let withStat = 0;
    let withLicense = 0;
    let withIdCard = 0;
    let fullyVerified = 0;
    let noDocsSubmitted = 0;

    for (const pro of allPros) {
      const docs = pro.verificationDocuments;
      if (docs.length === 0) {
        noDocsSubmitted++;
        continue;
      }

      const hasVerified = (type: string) =>
        docs.some((d) => d.documentType === type && d.status === 'VERIFIED');
      const hasSubmitted = (type: string) =>
        docs.some((d) => d.documentType === type);

      if (hasSubmitted('nif')) withNif++;
      if (hasSubmitted('stat')) withStat++;
      if (hasSubmitted('business_license')) withLicense++;
      if (hasSubmitted('id_card')) withIdCard++;

      if (
        hasVerified('nif') &&
        hasVerified('stat') &&
        hasVerified('business_license') &&
        hasVerified('id_card')
      ) {
        fullyVerified++;
      }
    }

    const documentCompliance = {
      totalPros: allPros.length,
      withNif,
      withStat,
      withLicense,
      withIdCard,
      fullyVerified,
      noDocsSubmitted,
    };

    // ---------------------------------------------------------------
    // 3. Establishment quality (active establishments with issues)
    // ---------------------------------------------------------------
    const establishments = await prisma.establishment.findMany({
      where: {
        isActive: true,
        ...(userTypeFilter ? { type: userTypeFilter } : {}),
      },
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        coverImage: true,
        images: true,
        description: true,
        phone: true,
        latitude: true,
        longitude: true,
        claimedByUserId: true,
      },
    });

    // Collect unique claimer IDs to look up names
    const claimerIds = Array.from(
      new Set(
        establishments
          .map((e) => e.claimedByUserId)
          .filter((id): id is string => id !== null)
      )
    );
    const claimers =
      claimerIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: claimerIds } },
            select: { id: true, firstName: true, lastName: true },
          })
        : [];
    const claimerMap = new Map(claimers.map((c) => [c.id, `${c.firstName} ${c.lastName}`]));

    const establishmentQuality: Array<{
      id: string;
      name: string;
      type: string;
      city: string;
      claimedByName: string | null;
      issues: string[];
    }> = [];

    for (const est of establishments) {
      const issues: string[] = [];

      if (!est.coverImage || est.coverImage.trim() === '') {
        issues.push('no_cover');
      }

      if (!est.images || est.images === '[]' || est.images.trim() === '') {
        issues.push('no_images');
      }

      if (!est.description || est.description.length < 50) {
        issues.push('short_description');
      }

      if (est.latitude === null || est.longitude === null) {
        issues.push('no_gps');
      }

      if (!est.phone || est.phone.trim() === '') {
        issues.push('no_phone');
      }

      if (issues.length > 0) {
        establishmentQuality.push({
          id: est.id,
          name: est.name,
          type: est.type,
          city: est.city,
          claimedByName: est.claimedByUserId
            ? (claimerMap.get(est.claimedByUserId) ?? null)
            : null,
          issues,
        });
      }

      // Cap at 100 results
      if (establishmentQuality.length >= 100) break;
    }

    // ---------------------------------------------------------------
    // 4. Summary stats
    // ---------------------------------------------------------------

    // Compliance rate: percentage of pros who have at least NIF + STAT verified
    let prosWithNifAndStatVerified = 0;
    for (const pro of allPros) {
      const docs = pro.verificationDocuments;
      const nifVerified = docs.some(
        (d) => d.documentType === 'nif' && d.status === 'VERIFIED'
      );
      const statVerified = docs.some(
        (d) => d.documentType === 'stat' && d.status === 'VERIFIED'
      );
      if (nifVerified && statVerified) prosWithNifAndStatVerified++;
    }

    const complianceRate =
      allPros.length > 0
        ? Math.round((prosWithNifAndStatVerified / allPros.length) * 100)
        : 0;

    const stats = {
      totalNewRegistrations: newRegistrations.length,
      prosWithoutDocs: noDocsSubmitted,
      lowQualityEstablishments: establishmentQuality.length,
      complianceRate,
    };

    // ---------------------------------------------------------------
    // Response
    // ---------------------------------------------------------------
    return NextResponse.json({
      success: true,
      data: {
        newRegistrations,
        documentCompliance,
        establishmentQuality,
        stats,
      },
    });
  } catch (error: unknown) {
    logger.error('[ADMIN COMPLIANCE] Error:', error);
    return apiError('Erreur serveur', 500);
  }
}
