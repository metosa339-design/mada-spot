import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hors ligne — Mada Spot',
  description: 'Vous êtes actuellement hors ligne.',
};

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
