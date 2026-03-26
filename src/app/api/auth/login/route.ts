// API Route - Connexion
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  verifyPassword,
  createSession,
  updateLastLogin,
  getSessionCookieConfig,
  cleanExpiredSessions,
} from '@/lib/auth';
import { loginSchema } from '@/lib/validations/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyCsrfToken } from '@/lib/csrf';

import { logger } from '@/lib/logger';
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = checkRateLimit(clientId, 'auth');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trop de tentatives. Réessayez plus tard.',
          retryAfter: rateLimitResult.resetIn,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);

    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    // CSRF verification (mandatory)
    if (!body.csrfToken || !verifyCsrfToken(body.csrfToken)) {
      return NextResponse.json(
        { success: false, error: 'Token CSRF invalide ou manquant. Rafraîchissez la page.' },
        { status: 403 }
      );
    }

    // Validation
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Identifiants invalides',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { identifier, password } = validationResult.data;

    // Rechercher l'utilisateur par email ou téléphone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier.replace(/\s/g, '') },
        ],
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        password: true,
        isActive: true,
        isBanned: true,
        banReason: true,
        userType: true,
        isVerified: true,
        clientProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Ce compte a été désactivé' },
        { status: 403 }
      );
    }

    // Vérifier si le compte est banni
    if (user.isBanned) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ce compte a été suspendu',
          reason: user.banReason || 'Contactez le support pour plus d\'informations',
        },
        { status: 403 }
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Rotation de session : supprimer les anciennes sessions de cet utilisateur sur cet appareil
    const deviceInfo = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;

    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        deviceInfo: deviceInfo || undefined,
      },
    });

    // Créer une nouvelle session
    const sessionToken = await createSession(user.id, deviceInfo, ipAddress);

    // Mettre à jour la dernière connexion + nettoyer les sessions expirées en arrière-plan
    await updateLastLogin(user.id);
    cleanExpiredSessions().catch(() => {});

    // Préparer les données du profil
    const profileData = {
      profileId: user.clientProfile?.id,
    };

    // Préparer la réponse
    const response = NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        userType: user.userType || null,
        isVerified: user.isVerified,
        ...profileData,
      },
    });

    // Définir le cookie de session
    const cookieConfig = getSessionCookieConfig(sessionToken);
    response.cookies.set(cookieConfig);

    return response;
  } catch (error) {
    logger.error('Erreur connexion:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la connexion' },
      { status: 500 }
    );
  }
}
