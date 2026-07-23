import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import HeroClean from '@/components/home/HeroClean';

// Tout ce qui est SOUS le hero est chargé en code-split (next/dynamic).
// Le HTML reste rendu côté serveur (ssr par défaut → SEO intact), mais le
// JavaScript de ces sections (framer-motion, carrousel, fetch) est téléchargé
// APRÈS le premier rendu. Résultat : l'image hero (élément LCP) ne se bat plus
// pour la bande passante avec ~900 Ko de JS au chargement initial → LCP réduit
// sur les connexions mobiles lentes.
const HomeSections = dynamic(() => import('@/components/home/HomeSections'), {
  loading: () => <div className="min-h-[60vh] bg-[#F8FAFC]" />,
});

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Header />

      {/* Hero — chemin critique, peint immédiatement (CSS, image priority) */}
      <HeroClean />

      {/* Sections sous la ligne de flottaison — JS différé */}
      <HomeSections />
    </main>
  );
}
