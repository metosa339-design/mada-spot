import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion — Mada Spot',
  description: 'Connectez-vous à votre espace Mada Spot.',
  openGraph: {
    title: 'Connexion — Mada Spot',
    description: 'Connectez-vous à votre espace Mada Spot.',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
