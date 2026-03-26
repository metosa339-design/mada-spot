import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — Mada Spot',
  description:
    "Contactez l'équipe Mada Spot pour toute question ou suggestion.",
  openGraph: {
    title: 'Contact — Mada Spot',
    description:
      "Contactez l'équipe Mada Spot pour toute question ou suggestion.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
