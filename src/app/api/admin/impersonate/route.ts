import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/impersonate?search=... — search users for impersonation
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const userId = searchParams.get('userId');

  try {
    if (userId) {
      // Get single user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          userType: true,
          avatar: true,
          isActive: true,
          isBanned: true,
          createdAt: true,
          lastLoginAt: true,
          loyaltyPoints: true,
          _count: {
            select: {
              bookings: true,
              sentMessages: true,
              receivedMessages: true,
              establishmentReviews: true,
            },
          },
        },
      });
      if (!user) return apiError('Utilisateur introuvable', 404);
      return NextResponse.json({ success: true, user });
    }

    if (search.length < 2) return NextResponse.json({ success: true, users: [] });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        userType: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (err) {
    console.error('Impersonate search error:', err);
    return apiError('Erreur serveur', 500);
  }
}

// POST /api/admin/impersonate — log the impersonation action (audit only)
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  try {
    const { targetUserId } = await request.json();
    if (!targetUserId) return apiError('targetUserId requis', 400);

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, userType: true },
    });
    if (!target) return apiError('Utilisateur introuvable', 404);

    // Create audit log for impersonation
    await prisma.auditLog.create({
      data: {
        action: 'impersonate',
        entityType: 'user',
        entityId: targetUserId,
        userId: admin.id,
        details: JSON.stringify({
          targetName: `${target.firstName} ${target.lastName}`,
          targetEmail: target.email,
          targetRole: target.role,
          targetType: target.userType,
        }),
      },
    });

    // Return the target user's dashboard URL
    const dashboardUrl = target.role === 'ADMIN' ? '/admin' : '/dashboard';

    return NextResponse.json({
      success: true,
      message: `Impersonation logged for ${target.firstName} ${target.lastName}`,
      dashboardUrl,
      target: {
        id: target.id,
        name: `${target.firstName} ${target.lastName}`,
        role: target.role,
        userType: target.userType,
      },
    });
  } catch (err) {
    console.error('Impersonate error:', err);
    return apiError('Erreur serveur', 500);
  }
}
