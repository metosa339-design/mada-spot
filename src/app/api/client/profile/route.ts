import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { verifyCsrfToken } from '@/lib/csrf';

import { logger } from '@/lib/logger';
// GET /api/client/profile - Get client profile
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return apiError('Non autorisé', 401);

    const session = await verifySession(token);
    if (!session || session.role !== 'CLIENT') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { clientProfile: true },
    });

    if (!user) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });

    return NextResponse.json({
      success: true,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        isVerified: user.isVerified,
        city: user.clientProfile?.city || '',
        district: user.clientProfile?.district || '',
        address: user.clientProfile?.address || '',
        preferredContact: user.clientProfile?.preferredContact || 'email',
        companyName: user.clientProfile?.companyName || '',
      },
    });
  } catch (error) {
    logger.error('Error fetching client profile:', error);
    return apiError('Erreur serveur', 500);
  }
}

// PUT /api/client/profile - Update client profile
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return apiError('Non autorisé', 401);

    const session = await verifySession(token);
    if (!session || session.role !== 'CLIENT') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const data = await request.json().catch(() => null);

    if (data === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    // CSRF verification (mandatory)
    if (!data.csrfToken || !verifyCsrfToken(data.csrfToken)) {
      return NextResponse.json({ error: 'Token CSRF invalide ou manquant' }, { status: 403 });
    }

    // Update user base fields
    const userUpdate: any = {};
    if (data.firstName !== undefined) userUpdate.firstName = data.firstName;
    if (data.lastName !== undefined) userUpdate.lastName = data.lastName;
    if (data.phone !== undefined) userUpdate.phone = data.phone;
    if (data.avatar !== undefined) userUpdate.avatar = data.avatar;

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id: session.id }, data: userUpdate });
    }

    // Update client profile
    const profileUpdate: any = {};
    if (data.city !== undefined) profileUpdate.city = data.city || null;
    if (data.district !== undefined) profileUpdate.district = data.district || null;
    if (data.address !== undefined) profileUpdate.address = data.address || null;
    if (data.preferredContact !== undefined) profileUpdate.preferredContact = data.preferredContact;
    if (data.companyName !== undefined) profileUpdate.companyName = data.companyName || null;

    if (Object.keys(profileUpdate).length > 0) {
      await prisma.clientProfile.upsert({
        where: { userId: session.id },
        update: profileUpdate,
        create: { userId: session.id, ...profileUpdate },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating client profile:', error);
    return apiError('Erreur serveur', 500);
  }
}
