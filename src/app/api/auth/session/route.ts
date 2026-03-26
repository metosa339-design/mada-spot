// API Route - Vérification de session
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, getClearSessionCookieConfig } from '@/lib/auth';

import { logger } from '@/lib/logger';
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getAuthUser(request);

    if (!sessionUser) {
      // Supprimer le cookie si la session est invalide
      const response = NextResponse.json(
        { success: false, error: 'Session invalide ou expirée' },
        { status: 401 }
      );
      const clearCookieConfig = getClearSessionCookieConfig();
      response.cookies.set(clearCookieConfig);
      return response;
    }

    // Récupérer les informations complètes de l'utilisateur
    // Utilise select explicite pour TOUJOURS inclure userType
    let user: Record<string, unknown> | null = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          userType: true,
          emailVerified: true,
          phoneVerified: true,
          isVerified: true,
          createdAt: true,
          clientProfile: {
            select: {
              id: true,
              companyName: true,
              city: true,
            },
          },
        },
      }) as Record<string, unknown> | null;
    } catch {
      // Fallback si userType n'existe pas encore en DB
      user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          emailVerified: true,
          phoneVerified: true,
          isVerified: true,
          createdAt: true,
          clientProfile: {
            select: {
              id: true,
              companyName: true,
              city: true,
            },
          },
        },
      }) as Record<string, unknown> | null;
    }

    if (!user) {
      const response = NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 401 }
      );
      const clearCookieConfig = getClearSessionCookieConfig();
      response.cookies.set(clearCookieConfig);
      return response;
    }

    // Si userType est null, tenter de l'inférer depuis les établissements revendiqués
    let resolvedUserType = user.userType || null;
    if (!resolvedUserType) {
      try {
        const claimedEstablishment = await prisma.establishment.findFirst({
          where: { claimedByUserId: user.id as string },
          select: { type: true },
          orderBy: { createdAt: 'desc' },
        });
        if (claimedEstablishment) {
          resolvedUserType = claimedEstablishment.type;
          // Persister le userType pour les prochaines sessions (auto-heal)
          await prisma.user.update({
            where: { id: user.id as string },
            data: { userType: claimedEstablishment.type as 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'PROVIDER' },
          }).catch(() => {}); // silently fail if column doesn't exist yet
        }
      } catch {
        // pas grave si cette inférence échoue
      }
    }

    // Construire la réponse selon le rôle
    const clientProfile = user.clientProfile as Record<string, unknown> | null;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        userType: resolvedUserType,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        isVerified: user.isVerified ?? false,
        createdAt: user.createdAt,
        clientProfile: clientProfile || null,
      },
    });
  } catch (error) {
    logger.error('Erreur vérification session:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
