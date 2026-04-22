/**
 * Cache en mémoire simple avec TTL pour les données rarement modifiées.
 * Utilisé côté serveur uniquement (API routes, Server Components).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// Nettoyage périodique des entrées expirées (toutes les 5 minutes)
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= now) {
        cache.delete(key);
      }
    }
  }, 10 * 60 * 1000);
  // Ne pas bloquer le shutdown Node.js
  if (cleanupInterval && typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    cleanupInterval.unref();
  }
}

/**
 * Exécute une requête avec mise en cache.
 * Si les données sont en cache et valides, les retourne directement.
 * Sinon, exécute la fonction et met le résultat en cache.
 *
 * @param key - Clé unique du cache
 * @param ttlSeconds - Durée de vie en secondes
 * @param queryFn - Fonction asynchrone à exécuter si le cache est vide/expiré
 */
export async function cachedQuery<T>(
  key: string,
  ttlSeconds: number,
  queryFn: () => Promise<T>,
): Promise<T> {
  ensureCleanup();

  const existing = cache.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > Date.now()) {
    return existing.data;
  }

  const data = await queryFn();
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  return data;
}

/**
 * Invalide une entrée spécifique du cache.
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/**
 * Invalide toutes les entrées dont la clé commence par le préfixe donné.
 */
export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Vide entièrement le cache.
 */
export function clearCache(): void {
  cache.clear();
}
