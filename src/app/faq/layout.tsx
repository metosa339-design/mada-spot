import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Questions Fréquentes (FAQ) — Mada Spot | Tourisme Madagascar',
  description: 'Trouvez les réponses à vos questions sur Mada Spot : inscription, réservation d\'hôtels et restaurants à Madagascar, attractions touristiques et plus.',
  keywords: ['FAQ Madagascar', 'questions tourisme Madagascar', 'aide réservation hôtel Madagascar', 'Mada Spot aide'],
  alternates: {
    canonical: '/faq',
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
