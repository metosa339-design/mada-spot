// API Route - Inscription
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createSession, getSessionCookieConfig, cleanExpiredSessions } from '@/lib/auth';
import { registerSchema } from '@/lib/validations/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyCsrfToken } from '@/lib/csrf';
import { sendOTPToUser } from '@/lib/otp';

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
      return NextResponse.json({ success: false, error: 'Token CSRF invalide ou manquant' }, { status: 403 });
    }

    // Validation
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données invalides',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, phone, password, firstName, lastName, role, userType } = validationResult.data;

    // Vérifier si l'email existe déjà
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: 'Cet email est déjà utilisé' },
          { status: 409 }
        );
      }
    }

    // Vérifier si le téléphone existe déjà
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return NextResponse.json(
          { success: false, error: 'Ce numéro de téléphone est déjà utilisé' },
          { status: 409 }
        );
      }
    }

    // Hash du mot de passe
    const passwordHash = await hashPassword(password);

    // Création de l'utilisateur avec transaction
    const user = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const newUser = await tx.user.create({
        data: {
          email: email || null,
          phone: phone || null,
          password: passwordHash,
          firstName,
          lastName,
          role,
          userType: userType || null,
        },
      });

      // Créer le profil client
      if (role === 'CLIENT') {
        await tx.clientProfile.create({
          data: {
            userId: newUser.id,
          },
        });
      }

      return newUser;
    });

    // Créer une session + nettoyer les sessions expirées en arrière-plan
    const deviceInfo = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const sessionToken = await createSession(user.id, deviceInfo, ipAddress);
    cleanExpiredSessions().catch(() => {});

    // Envoyer le code OTP de vérification par email (best-effort)
    let needsVerification = false;
    if (user.email) {
      const otpResult = await sendOTPToUser(user.id, user.email, user.firstName).catch((err) => {
        console.error('[REGISTER] ❌ Échec envoi OTP:', err);
        logger.error('[REGISTER] OTP send failed:', err);
        return { success: false, error: 'OTP send failed' };
      });
      needsVerification = true;
      if (!otpResult.success) {
        logger.error('[REGISTER] OTP non envoyé:', otpResult.error);
      }
    }

    // Préparer la réponse
    const response = NextResponse.json(
      {
        success: true,
        message: needsVerification
          ? 'Inscription réussie. Vérifiez votre email pour activer votre compte.'
          : 'Inscription réussie',
        needsVerification,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: false,
        },
      },
      { status: 201 }
    );

    // Définir le cookie de session
    const cookieConfig = getSessionCookieConfig(sessionToken);
    response.cookies.set(cookieConfig);

    return response;
  } catch (error) {
    logger.error('Erreur inscription:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de l\'inscription' },
      { status: 500 }
    );
  }
}
