// Mada Spot - Systeme d'authentification
// Export principal de toutes les fonctionnalités d'auth

export {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from './password';

export {
  SESSION_COOKIE_NAME,
  createSession,
  verifySession,
  deleteSession,
  deleteAllUserSessions,
  cleanExpiredSessions,
  updateLastLogin,
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetUsed,
  type SessionUser,
} from './session';

export {
  getAuthUser,
  requireAuth,
  requireRole,
  requireAdmin,
  requireClient,
  getSessionCookieConfig,
  getClearSessionCookieConfig,
} from './middleware';

export {
  getSession,
  validateCredentials,
} from './admin-session';

// Réexporter les types utiles
export type { UserRole } from '@prisma/client';
