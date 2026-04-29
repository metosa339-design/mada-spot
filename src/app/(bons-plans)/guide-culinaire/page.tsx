import type { Metadata } from 'next';
import GuideCulinaire from './GuideCulinaire';

export const metadata: Metadata = {
  title: 'Guide Culinaire Madagascar - Plats Traditionnels, Marchés & Expériences | Mada Spot',
  description: 'Découvrez l\'aventure culinaire à Madagascar : plats traditionnels (romazava, ravitoto, vary amin\'anana), marchés locaux, épices, fruits de mer et expériences gastronomiques uniques.',
  keywords: 'cuisine madagascar, plats malgaches, romazava, ravitoto, marché analakely, vanille madagascar, gastronomie malgache, restaurants madagascar, street food tana',
  openGraph: {
    title: 'Aventure Culinaire à Madagascar - Guide Gastronomique | Mada Spot',
    description: 'Explorez les saveurs uniques de la Grande Île : 6 plats iconiques, 8 marchés à découvrir, 4 expériences culinaires immersives.',
    type: 'article',
    locale: 'fr_MG',
    images: [{
      url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=630&fit=crop&q=80',
      width: 1200,
      height: 630,
      alt: 'Aventure culinaire à Madagascar',
    }],
  },
};

export default function GuideCulinairePage() {
  return <GuideCulinaire />;
}
