'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour gérer les tokens CSRF côté client.
 * Récupère un token depuis /api/csrf et le rafraîchit automatiquement.
 */
export function useCsrf() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch('/api/csrf');
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
      }
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();
    // Rafraîchir le token toutes les 45 minutes (expire en 1h)
    const interval = setInterval(fetchToken, 45 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchToken]);

  return { csrfToken: token, csrfLoading: loading, refreshCsrf: fetchToken };
}
