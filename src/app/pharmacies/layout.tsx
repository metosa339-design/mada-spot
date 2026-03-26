import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pharmacies de garde à Madagascar — Mada Spot',
  description:
    'Trouvez les pharmacies de garde ouvertes à Antananarivo et dans toute Madagascar.',
  openGraph: {
    title: 'Pharmacies de garde à Madagascar — Mada Spot',
    description:
      'Trouvez les pharmacies de garde ouvertes à Antananarivo et dans toute Madagascar.',
  },
};

export default function PharmaciesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
