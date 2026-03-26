import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { logger } from '@/lib/logger';

// GET /api/admin/users — List users with filters and pagination
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorise', 401);

  const { searchParams } = new URL(request.url);
  const userType = searchParams.get('userType') || 'all';
  const status = searchParams.get('status') || 'all';
  const search = searchParams.get('search') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
  const sort = searchParams.get('sort') || 'newest';

  try {
    // Build where clause
    const where: any = {};

    // User type filter
    if (userType === 'voyageur') {
      where.role = 'CLIENT';
      where.userType = null;
    } else if (userType !== 'all') {
      where.userType = userType;
    }

    // Status filter
    if (status === 'active') {
      where.isActive = true;
      where.isBanned = false;
    } else if (status === 'banned') {
      where.isBanned = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Search filter (name, email, phone)
    if (search.trim()) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    // Sort order
    let orderBy: any;
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'name':
        orderBy = [{ firstName: 'asc' }, { lastName: 'asc' }];
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Fetch users and total count in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          firstName: true,
          lastName: true,
          avatar: true,
          emailVerified: true,
          phoneVerified: true,
          isActive: true,
          isBanned: true,
          banReason: true,
          userType: true,
          loyaltyPoints: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              bookings: true,
              sentMessages: true,
              establishmentReviews: true,
              verificationDocuments: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    // Enrich users with verified doc count
    const userIds = users.map((u) => u.id);
    const verifiedDocCounts = await prisma.verificationDocument.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        status: 'VERIFIED',
      },
      _count: { id: true },
    });

    const verifiedDocMap = new Map(
      verifiedDocCounts.map((d) => [d.userId, d._count.id])
    );

    const enrichedUsers = users.map((user) => ({
      ...user,
      verifiedDocCount: verifiedDocMap.get(user.id) || 0,
    }));

    // Compute global stats
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      statsTotal,
      voyageurs,
      hotels,
      restaurants,
      attractions,
      providers,
      banned,
      newThisWeek,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CLIENT', userType: null } }),
      prisma.user.count({ where: { userType: 'HOTEL' } }),
      prisma.user.count({ where: { userType: 'RESTAURANT' } }),
      prisma.user.count({ where: { userType: 'ATTRACTION' } }),
      prisma.user.count({ where: { userType: 'PROVIDER' } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    ]);

    return NextResponse.json({
      users: enrichedUsers,
      total,
      stats: {
        total: statsTotal,
        voyageurs,
        hotels,
        restaurants,
        attractions,
        providers,
        banned,
        newThisWeek,
      },
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    return apiError('Erreur serveur', 500);
  }
}

// PUT /api/admin/users — Admin actions on a user (ban, unban, deactivate, activate)
export async function PUT(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorise', 401);

  try {
    const body = await request.json().catch(() => null);
    if (!body) return apiError('Corps de requete JSON invalide', 400);

    const { userId, action, reason } = body;

    if (!userId || !action) {
      return apiError('userId et action requis', 400);
    }

    const validActions = ['ban', 'unban', 'deactivate', 'activate'];
    if (!validActions.includes(action)) {
      return apiError(`Action invalide. Actions valides : ${validActions.join(', ')}`, 400);
    }

    // Check user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, userType: true },
    });
    if (!existingUser) return apiError('Utilisateur introuvable', 404);

    // Prevent admin from banning/deactivating themselves
    if (userId === admin.id) {
      return apiError('Impossible de modifier votre propre compte', 400);
    }

    // Build update data based on action
    let updateData: any = {};
    let notificationTitle = '';
    let notificationMessage = '';

    switch (action) {
      case 'ban':
        updateData = { isBanned: true, banReason: reason || null };
        notificationTitle = 'Compte suspendu';
        notificationMessage = reason
          ? `Votre compte a ete suspendu. Raison : ${reason}`
          : 'Votre compte a ete suspendu. Contactez le support pour plus d\'informations.';
        break;
      case 'unban':
        updateData = { isBanned: false, banReason: null };
        notificationTitle = 'Compte reactif';
        notificationMessage = 'Votre compte a ete reactif. Vous pouvez desormais utiliser la plateforme normalement.';
        break;
      case 'deactivate':
        updateData = { isActive: false };
        break;
      case 'activate':
        updateData = { isActive: true };
        break;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        firstName: true,
        lastName: true,
        avatar: true,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
        isBanned: true,
        banReason: true,
        userType: true,
        loyaltyPoints: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    // Create notification for ban/unban actions
    if (action === 'ban' || action === 'unban') {
      await prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM',
          title: notificationTitle,
          message: notificationMessage,
          entityType: 'user',
          entityId: userId,
        },
      });
    }

    // Audit log
    const meta = getRequestMeta(request);
    await logAudit({
      userId: admin.id,
      action: `user_${action}`,
      entityType: 'user',
      entityId: userId,
      details: {
        targetName: `${existingUser.firstName} ${existingUser.lastName}`,
        targetEmail: existingUser.email || '',
        targetRole: existingUser.role,
        targetType: existingUser.userType,
        reason: reason || null,
      },
      ...meta,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    logger.error('Error moderating user:', error);
    return apiError('Erreur serveur', 500);
  }
}
