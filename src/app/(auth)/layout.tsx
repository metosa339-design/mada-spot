import type { Metadata } from 'next';
import AuthLayoutClient from './AuthLayoutClient';

export const metadata: Metadata = {
  title: 'Authentification — Mada Spot',
  description: 'Connectez-vous ou créez votre compte Mada Spot pour accéder à tous nos services.',
  openGraph: {
    title: 'Authentification — Mada Spot',
    description: 'Connectez-vous ou créez votre compte Mada Spot pour accéder à tous nos services.',
    images: [{ url: '/logo.png', width: 1200, height: 630, alt: 'Mada Spot — Authentification' }],
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}
