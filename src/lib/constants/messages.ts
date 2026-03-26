// Centralized error/success messages — Mada Spot

export const MSG = {
  // Auth
  UNAUTHORIZED: 'Non autorisé',
  FORBIDDEN: 'Accès interdit',
  SESSION_EXPIRED: 'Session expirée',

  // Validation
  INVALID_DATA: 'Données invalides',
  MISSING_FIELDS: 'Champs requis manquants',
  INVALID_ID: 'ID invalide',

  // Server
  SERVER_ERROR: 'Erreur serveur',
  NOT_FOUND: 'Ressource introuvable',

  // Rate limiting
  TOO_MANY_REQUESTS: 'Trop de tentatives. Réessayez plus tard.',

  // CSRF
  CSRF_INVALID: 'Token CSRF invalide',

  // Generic
  DELETE_SUCCESS: 'Supprimé avec succès',
  UPDATE_SUCCESS: 'Mis à jour avec succès',
  CREATE_SUCCESS: 'Créé avec succès',
} as const;
