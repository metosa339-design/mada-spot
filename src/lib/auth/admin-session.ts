// Gestion des sessions admin en base de données
import crypto from 'crypto';
import { prisma } from '../db';
import { verifyPassword } from './password';

interface AdminUser {
  id: string;
  username: string;
  role: string;
}

/**
 * Valide les identifiants admin (email/phone + mot de passe)
 */
export async function validateCredentials(
  username: string,
  password: string
): Promise<AdminUser | null> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: username }, { phone: username }],
      role: 'ADMIN',
      isActive: true,
    },
  });

  if (!user || !user.password) return null;

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;

  return {
    id: user.id,
    username: user.email || user.phone || 'admin',
    role: user.role,
  };
}

/**
 * Crée une session admin en base de données, retourne le token
 */
export async function createAdminSession(user: AdminUser): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // Rotation : supprimer les anciennes sessions admin de cet utilisateur
  await prisma.session.deleteMany({
    where: {
      userId: user.id,
      deviceInfo: 'admin-panel',
    },
  });

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      deviceInfo: 'admin-panel',
      expiresAt,
    },
  });

  return token;
}

/**
 * Récupère l'utilisateur admin à partir d'un token de session (depuis la DB)
 */
export async function getSession(sessionId: string): Promise<AdminUser | null> {
  try {
    const session = await prisma.session.findUnique({
      where: { token: sessionId },
      include: {
        user: {
          select: { id: true, email: true, phone: true, role: true, isActive: true },
        },
      },
    });

    if (!session) return null;

    // Vérifier expiration
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { token: sessionId } }).catch(() => {});
      return null;
    }

    // Vérifier que c'est bien un admin actif
    if (session.user.role !== 'ADMIN' || !session.user.isActive) {
      return null;
    }

    return {
      id: session.user.id,
      username: session.user.email || session.user.phone || 'admin',
      role: session.user.role,
    };
  } catch {
    return null;
  }
}
