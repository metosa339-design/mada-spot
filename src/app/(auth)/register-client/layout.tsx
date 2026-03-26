import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription — Mada Spot',
  description: 'Créez votre compte Mada Spot pour découvrir les meilleurs bons plans de Madagascar.',
  openGraph: {
    title: 'Inscription — Mada Spot',
    description: 'Créez votre compte Mada Spot pour découvrir les meilleurs bons plans de Madagascar.',
  },
};

export default function RegisterClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
