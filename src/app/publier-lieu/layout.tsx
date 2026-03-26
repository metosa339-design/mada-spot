import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Publier un lieu — Mada Spot',
  description:
    'Ajoutez un restaurant, hôtel ou attraction sur Mada Spot et partagez vos bons plans.',
  openGraph: {
    title: 'Publier un lieu — Mada Spot',
    description:
      'Ajoutez un restaurant, hôtel ou attraction sur Mada Spot et partagez vos bons plans.',
  },
};

export default function PublierLieuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
