/**
 * Detection des pannes de base de donnees, par opposition aux erreurs applicatives.
 *
 * Le distinguo compte pour le visiteur : une requete invalide merite un 400 et un
 * message d'erreur, une base injoignable merite un 503 et un « revenez dans un
 * instant ». Sans ce tri, les deux cas remontaient en 500 et les pages publiques
 * affichaient leur etat « aucun resultat », donnant l'impression d'un site vide
 * plutot que d'une indisponibilite passagere.
 */

// Codes Prisma d'infrastructure : serveur injoignable, timeout, connexion fermee.
const PRISMA_INFRA_CODES = ['P1000', 'P1001', 'P1002', 'P1008', 'P1010', 'P1017', 'P2024'];

// Signatures textuelles rencontrees avec Neon (quota, endpoint en veille, pooler).
const UNAVAILABLE_SIGNATURES = [
  'exceeded the compute time quota',
  "can't reach database server",
  'cannot reach database server',
  'connection refused',
  'connection terminated',
  'timed out fetching a new connection',
  'the database system is starting up',
  'econnreset',
  'etimedout',
];

export function isDatabaseUnavailable(error: unknown): boolean {
  if (!error) return false;

  const code = (error as { code?: unknown }).code;
  if (typeof code === 'string' && PRISMA_INFRA_CODES.includes(code)) return true;

  const message = error instanceof Error ? error.message : String(error);
  const haystack = message.toLowerCase();
  return UNAVAILABLE_SIGNATURES.some((signature) => haystack.includes(signature));
}

/** Code renvoye au client, teste par les pages pour afficher le bon ecran. */
export const SERVICE_UNAVAILABLE_CODE = 'SERVICE_UNAVAILABLE';
