'use client';

import { useEffect } from 'react';

/**
 * Legacy carnet/light-mode preview helper.
 *
 * Le projet est désormais en dark mode permanent (#0A0A0F).
 * On nettoie au montage toute classe `carnet-mode` / `light-mode` héritée
 * d'une session précédente, et on n'ajoute plus rien.
 */
export default function ThemeLightPreview() {
  useEffect(() => {
    document.body.classList.remove('light-mode');
    document.body.classList.remove('carnet-mode');
  }, []);

  return null;
}
