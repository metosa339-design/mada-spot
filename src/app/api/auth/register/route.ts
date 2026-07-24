// API Route - Inscription (directe, sans vérification email)
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { hashPassword, createSession, getSessionCookieConfig } from '@/lib/auth';
import { registerSchema } from '@/lib/validations/auth';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { verifyCsrfToken } from '@/lib/csrf';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId, 'auth');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Trop de tentatives. Réessayez plus tard.', retryAfter: rateLimitResult.resetIn },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    if (!body.csrfToken || !verifyCsrfToken(body.csrfToken)) {
      return NextResponse.json({ success: false, error: 'Token CSRF invalide ou manquant' }, { status: 403 });
    }

    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, phone, password, firstName, lastName, role, userType } = validationResult.data;

    const passwordHash = await hashPassword(password);

    // Create the real user directly (email verification will be prompted in dashboard).
    // Rely on DB unique constraints to handle race conditions atomically.
    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: email || null,
            phone: phone || null,
            password: passwordHash,
            firstName,
            lastName,
            role,
            userType: userType || null,
            emailVerified: true,
            isVerified: true,
          },
        });

        if (role === 'CLIENT') {
          await tx.clientProfile.create({ data: { userId: newUser.id } });
        }

        return newUser;
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[] | undefined) || [];
        if (target.includes('email')) {
          return NextResponse.json({ success: false, error: 'Cet email est déjà utilisé' }, { status: 409 });
        }
        if (target.includes('phone')) {
          return NextResponse.json({ success: false, error: 'Ce numéro de téléphone est déjà utilisé' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: 'Compte déjà existant' }, { status: 409 });
      }
      throw err;
    }

    // Create session immediately
    const deviceInfo = request.headers.get('user-agent') || undefined;
    const ipAddress = clientId;
    const sessionToken = await createSession(user.id, deviceInfo, ipAddress);

    logger.info(`[REGISTER] ✓ Account created for ${email}`);

    // Mail de bienvenue aux professionnels (userType renseigné) : les inviter à
    // créer/compléter leur fiche dès l'inscription. Fire-and-forget : ne bloque
    // jamais et ne fait jamais échouer l'inscription.
    if (userType && email) {
      void (async () => {
        try {
          const [{ buildWelcomeProEmail }, { sendBrevoEmail }, { signMagicToken }] = await Promise.all([
            import('@/lib/crm/conformity'),
            import('@/lib/crm/brevo'),
            import('@/lib/auth/magic-link'),
          ]);
          // Lien de connexion magique (1 clic, sans mot de passe) → espace pro.
          // Repli : si la signature est indisponible, lien vers /login pré-rempli.
          const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://madaspot.com';
          const magicToken = signMagicToken(user.id);
          const ctaHref = magicToken
            ? `${base}/api/auth/magic?token=${encodeURIComponent(magicToken)}&redirect=${encodeURIComponent('/dashboard')}&email=${encodeURIComponent(email)}`
            : `${base}/login?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent('/dashboard')}`;
          const { subject, html } = buildWelcomeProEmail(firstName, userType, ctaHref);
          await sendBrevoEmail({
            to: email,
            subject,
            html,
            senderName: 'Metosaela RANDRIAMAZAORO — Mada Spot',
            senderEmail: 'contact@madaspot.com',
            tag: 'onboarding-fiche',
          });
        } catch (e) {
          logger.error('[REGISTER] Welcome email failed:', e as Error);
        }
      })();
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Compte créé avec succès ! Bienvenue sur Mada Spot.',
        user: { email, firstName, lastName, role },
      },
      { status: 201, headers: getRateLimitHeaders(rateLimitResult) }
    );

    // Set session cookie (user is logged in immediately)
    const cookieConfig = getSessionCookieConfig(sessionToken);
    response.cookies.set(cookieConfig);

    return response;
  } catch (error) {
    logger.error('Erreur inscription:', error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de l'inscription" },
      { status: 500 }
    );
  }
}
