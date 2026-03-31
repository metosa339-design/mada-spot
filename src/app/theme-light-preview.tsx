'use client';

import { useState, useEffect } from 'react';
import './globals-light.css';
import './globals-carnet.css';

type Theme = 'light' | 'carnet';
const STORAGE_KEY = 'mada-spot-theme';

export default function ThemeLightPreview() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const t = saved === 'carnet' ? 'carnet' : 'light';
    setTheme(t);
    applyTheme(t);
  }, []);

  const applyTheme = (t: Theme) => {
    document.body.classList.remove('light-mode', 'carnet-mode');
    if (t === 'carnet') {
      document.body.classList.add('carnet-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  };

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'carnet' : 'light';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Passer en mode Carnet de Voyage' : 'Passer en mode Standard'}
      title={theme === 'light' ? 'Mode Carnet de Voyage' : 'Mode Standard'}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        padding: '10px 16px',
        borderRadius: '12px',
        border: '1px solid',
        borderColor: theme === 'carnet' ? '#D4CBBC' : '#E5E7EB',
        background: theme === 'carnet' ? '#FDFBF7' : '#ffffff',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease',
        fontSize: '13px',
        fontWeight: 600,
        color: theme === 'carnet' ? '#D97706' : '#6B7280',
      }}
    >
      {theme === 'carnet' ? '📖' : '🎨'}
      <span>{theme === 'carnet' ? 'Carnet' : 'Standard'}</span>
    </button>
  );
}
