import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Mada Spot",
  description: "Conditions générales d'utilisation de la plateforme Mada Spot.",
};

export default function CGULayout({ children }: { children: React.ReactNode }) {
  return children;
}
