'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface Props {
  establishmentId: string;
  className?: string;
  size?: number;
}

export default function EstablishmentFavoriteButton({ establishmentId, className = '', size = 20 }: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // Vérifier si l'établissement est en favori au montage
  useEffect(() => {
    fetch('/api/establishments/favorites', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const found = data.favorites.some((f: any) => f.id === establishmentId);
          setIsFavorite(found);
        }
      })
      .catch(() => {});
  }, [establishmentId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);

    try {
      if (isFavorite) {
        await fetch(`/api/establishments/favorites?establishmentId=${establishmentId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        setIsFavorite(false);
      } else {
        const res = await fetch('/api/establishments/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ establishmentId }),
        });
        if (res.ok) setIsFavorite(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`p-1.5 rounded-full transition-all ${
        isFavorite
          ? 'text-red-500 hover:text-red-600'
          : 'text-gray-400 hover:text-red-400'
      } ${className}`}
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart
        className={`transition-all ${loading ? 'animate-pulse' : ''}`}
        style={{ width: size, height: size }}
        fill={isFavorite ? 'currentColor' : 'none'}
      />
    </button>
  );
}
