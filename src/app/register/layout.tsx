import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'S\'inscrire | Mada Spot',
  description: 'Inscrivez-vous sur Mada Spot pour publier votre hôtel, restaurant, attraction ou service touristique à Madagascar.',
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
