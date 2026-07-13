import { Metadata } from 'next';
import Link from 'next/link';
import { getCities } from '@/lib/data/cities';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Destinations à Madagascar — hôtels, restaurants & activités | Mada Spot',
  description: 'Explorez toutes les destinations de Madagascar : Antananarivo, Nosy Be, Diego Suarez, Antsirabe… Trouvez hôtels, restaurants et activités ville par ville sur Mada Spot.',
  alternates: { canonical: `${SITE_URL}/destinations` },
};

export default async function DestinationsPage() {
  const cities = await getCities();
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-xs text-gray-500 mb-4"><Link href="/" className="hover:text-orange-600">Accueil</Link> · <span className="text-gray-700">Destinations</span></nav>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Destinations à Madagascar</h1>
      <p className="text-gray-600 leading-relaxed max-w-3xl mb-8">
        Où aller à Madagascar ? Choisissez votre destination pour découvrir les meilleurs <strong>hôtels</strong>,
        <strong> restaurants</strong> et <strong>activités</strong>, ville par ville — sélection vérifiée par Mada Spot.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cities.map((c) => (
          <Link key={c.slug} href={`/destinations/${c.slug}`} className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-orange-300 hover:shadow-sm transition-all bg-white">
            <span className="font-medium text-gray-900">{c.name}</span>
            <span className="text-xs text-gray-400">{c.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
