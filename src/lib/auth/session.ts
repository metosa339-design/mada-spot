// Gestion des sessions basée sur la base de données
import crypto from 'crypto';
import { prisma } from '../db';
import type { UserRole } from '@prisma/client';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours
const SESSION_COOKIE_NAME = 'mada-spot-session';

export { SESSION_COOKIE_NAME };

export interface SessionUser {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar: string | null;
  userType: string | null;
}

/**
 * Génère un token de session sécurisé
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Crée une nouvelle session pour un utilisateur
 */
export async function createSession(
  userId: string,
  deviceInfo?: string,
  ipAddress?: string
): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await prisma.session.create({
    data: {
      userId,
      token,
      deviceInfo,
      ipAddress,
      expiresAt,
    },
  });

  return token;
}

/**
 * Vérifie une session et retourne l'utilisateur
 */
export async function verifySession(token: string): Promise<SessionUser | null> {
  if (!token) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
            userType: true,
            isActive: true,
            isBanned: true,
          },
        },
      },
    });

    if (!session) return null;

    // Vérifier l'expiration
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    // Vérifier que l'utilisateur est actif
    if (!session.user.isActive || session.user.isBanned) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      phone: session.user.phone,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      role: session.user.role,
      avatar: session.user.avatar,
      userType: session.user.userType || null,
    };
  } catch {
    return null;
  }
}

/**
 * Supprime une session (déconnexion)
 */
export async function deleteSession(token: string): Promise<void> {
  try {
    await prisma.session.delete({ where: { token } });
  } catch {
    // Session déjà supprimée ou inexistante
  }
}

/**
 * Supprime toutes les sessions d'un utilisateur (déconnexion globale)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

/**
 * Nettoie les sessions expirées (à exécuter périodiquement)
 */
export async function cleanExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  return result.count;
}

/**
 * Met à jour la dernière connexion de l'utilisateur
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

/**
 * Crée un token de réinitialisation de mot de passe
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

  await prisma.passwordReset.create({
    data: {
      email,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Vérifie un token de réinitialisation de mot de passe
 */
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const reset = await prisma.passwordReset.findUnique({ where: { token } });

  if (!reset) return null;
  if (reset.usedAt) return null;
  if (reset.expiresAt < new Date()) return null;

  return reset.email;
}

/**
 * Marque un token de réinitialisation comme utilisé
 */
export async function markPasswordResetUsed(token: string): Promise<void> {
  await prisma.passwordReset.update({
    where: { token },
    data: { usedAt: new Date() },
  });
}
