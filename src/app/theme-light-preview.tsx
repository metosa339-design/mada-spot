'use client';

/**
 * ThemeLightInit
 * Activates light mode by default on mount.
 * Imports the light mode CSS overrides.
 */

import { useEffect } from 'react';
import './globals-light.css';

export default function ThemeLightPreview() {
  useEffect(() => {
    document.body.classList.add('light-mode');
  }, []);

  return null;
}
