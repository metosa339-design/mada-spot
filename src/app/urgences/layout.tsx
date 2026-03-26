import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Numéros d'urgence à Madagascar — Mada Spot",
  description:
    "Numéros d'urgence essentiels à Madagascar : police, pompiers, SAMU et ambassades.",
  openGraph: {
    title: "Numéros d'urgence à Madagascar — Mada Spot",
    description:
      "Numéros d'urgence essentiels à Madagascar : police, pompiers, SAMU et ambassades.",
  },
};

export default function UrgencesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
