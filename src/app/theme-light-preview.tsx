'use client';

import { useEffect } from 'react';
import './globals-carnet.css';

export default function ThemeLightPreview() {
  useEffect(() => {
    document.body.classList.remove('light-mode');
    document.body.classList.add('carnet-mode');
  }, []);

  return null;
}
