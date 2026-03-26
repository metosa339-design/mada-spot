'use client';

import { useState } from 'react';
import { getImageUrl as cloudinaryUrl } from '@/lib/image-url';

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
}

// Images thématiques par catégorie - URLs Unsplash directes
const IMAGES: Record<string, string[]> = {
  tsingy: [
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  ],
  baobab: [
    'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
    'https://images.unsplash.com/photo-1625576553878-6a28f9733cd8?w=800&q=80',
  ],
  ile: [
    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80',
    'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800&q=80',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  ],
  plage: [
    'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&q=80',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80',
    'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=800&q=80',
  ],
  montagne: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80',
  ],
  parc: [
    'https://images.unsplash.com/photo-1590418606746-018840f9cd0f?w=800&q=80',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
    'https://images.unsplash.com/photo-1596005554384-d293674c91d7?w=800&q=80',
  ],
  reserve: [
    'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80',
    'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800&q=80',
  ],
  cascade: [
    'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80',
    'https://images.unsplash.com/photo-1467890947394-8171244e5410?w=800&q=80',
  ],
  train: [
    'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&q=80',
    'https://images.unsplash.com/photo-1527684651001-731c474bbb5a?w=800&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
    'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&q=80',
    'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
    'https://images.unsplash.com/photo-1590418606746-018840f9cd0f?w=800&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80',
    'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80',
    'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&q=80',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
  ],
};

// Mots-clés pour détecter la catégorie
const KEYWORDS: Record<string, string[]> = {
  tsingy: ['tsingy', 'bemaraha'],
  baobab: ['baobab', 'morondava', 'allée'],
  ile: ['nosy', 'île', 'ile', 'iranja', 'tanikely', 'komba', 'nattes'],
  plage: ['plage', 'beach', 'anakao', 'ifaty'],
  montagne: ['montagne', 'makay', 'ambre', 'andringitra', 'massif', 'isalo'],
  parc: ['parc', 'ranomafana', 'andasibe', 'masoala', 'mantadia'],
  reserve: ['réserve', 'reserve', 'anja', 'berenty', 'ankarana', 'reniala'],
  cascade: ['cascade', 'chute', 'waterfall'],
  train: ['train', 'fce', 'fianarantsoa'],
};

// Fonction pour obtenir une image appropriée basée sur le nom
function getImageForName(name: string): string {
  const lowerName = name.toLowerCase();

  // Chercher la catégorie correspondante
  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        const images = IMAGES[category];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash) + name.charCodeAt(i);
        }
        return images[Math.abs(hash) % images.length];
      }
    }
  }

  // Image par défaut basée sur le hash du nom
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
  }
  return IMAGES.default[Math.abs(hash) % IMAGES.default.length];
}

// Calculer l'URL de l'image
function getImageUrl(src: string | null | undefined, alt: string): string {
  if (!src) {
    return getImageForName(alt);
  }
  // Accepter les URLs externes et les chemins locaux
  if (src.startsWith('http') || src.startsWith('/')) {
    return cloudinaryUrl(src);
  }
  return getImageForName(alt);
}

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fill = false,
  style,
  onLoad,
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  // Calculer l'URL directement (pas besoin de useMemo car c'est une fonction pure)
  const imageUrl = hasError ? getImageForName(alt) : getImageUrl(src, alt);

  // Styles pour mode fill avec z-index approprié
  const imgStyle: React.CSSProperties = fill
    ? {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 1,
        ...style,
      }
    : {
        objectFit: 'cover',
        ...style,
      };

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={imgStyle}
      onError={() => {
        if (!hasError) {
          setHasError(true);
        }
      }}
      onLoad={onLoad}
      loading="lazy"
      crossOrigin="anonymous"
    />
  );
}
