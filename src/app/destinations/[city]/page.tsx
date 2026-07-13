import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCities, getCityData } from '@/lib/data/cities';
import { getImageUrl } from '@/lib/image-url';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 3600;

const TYPE_LABEL: Record<string, string> = { HOTEL: 'Hôtels', RESTAURANT: 'Restaurants', ATTRACTION: 'Activités & sites', PROVIDER: 'Prestataires & guides' };

export async function generateStaticParams() {
  const cities = await getCities();
  return cities.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const data = await getCityData(city);
  if (!data) return { title: 'Destination introuvable | Mada Spot' };
  const n = data.city.name;
  const title = `${n} : hôtels, restaurants et activités | Mada Spot`;
  const description = `Que faire à ${n} ? Découvrez les meilleurs hôtels, restaurants et activités à ${n}, Madagascar — ${data.total} établissements sélectionnés et vérifiés sur Mada Spot.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/destinations/${city}` },
    openGraph: { title, description, url: `${SITE_URL}/destinations/${city}`, type: 'website' },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const data = await getCityData(city);
  if (!data) notFound();
  const n = data.city.name;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Destinations', item: `${SITE_URL}/destinations` },
          { '@type': 'ListItem', position: 3, name: n, item: `${SITE_URL}/destinations/${city}` },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `${n} — hôtels, restaurants et activités`,
        description: `Sélection d'établissements à ${n}, Madagascar.`,
        url: `${SITE_URL}/destinations/${city}`,
      },
    ],
  };

  const sections = ['HOTEL', 'RESTAURANT', 'ATTRACTION', 'PROVIDER'].filter((t) => data.byType[t]?.length);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-xs text-gray-500 mb-4">
        <Link href="/" className="hover:text-orange-600">Accueil</Link> · <Link href="/destinations" className="hover:text-orange-600">Destinations</Link> · <span className="text-gray-700">{n}</span>
      </nav>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">{n} : hôtels, restaurants et activités</h1>
      <p className="text-gray-600 leading-relaxed max-w-3xl mb-8">
        {n} est l&apos;une des destinations incontournables de Madagascar. Retrouvez ci-dessous notre sélection
        d&apos;<strong>hôtels</strong>, de <strong>restaurants</strong> et d&apos;<strong>activités à {n}</strong>,
        classés par qualité et complétude de fiche — {data.total} établissement{data.total > 1 ? 's' : ''} vérifié{data.total > 1 ? 's' : ''} par Mada Spot.
        Réservez, contactez et préparez votre séjour à {n} en toute confiance.
      </p>

      {sections.map((t) => (
        <section key={t} className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{TYPE_LABEL[t]} à {n}</h2>
            <Link href={`/${data.typePath[t]}?city=${encodeURIComponent(n)}`} className="text-sm text-orange-600 hover:underline">Voir tout →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.byType[t].slice(0, 9).map((e) => (
              <Link key={e.id} href={`/${data.typePath[t]}/${e.slug}`} className="block rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow bg-white">
                {e.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getImageUrl(e.coverImage)} alt={`${e.name} — ${TYPE_LABEL[t]} à ${n}`} loading="lazy" className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gray-100" />
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{e.name}</h3>
                  {e.rating > 0 && <p className="text-xs text-yellow-600 mt-0.5">★ {e.rating.toFixed(1)} ({e.reviewCount})</p>}
                  {e.shortDescription && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{e.shortDescription}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {data.articles.length > 0 && (
        <section className="mb-6 border-t border-gray-100 pt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Nos guides sur {n}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.articles.map((a) => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className="block rounded-xl border border-gray-200 overflow-hidden hover:shadow-md bg-white">
                {a.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getImageUrl(a.imageUrl)} alt={a.title} loading="lazy" className="w-full h-32 object-cover" />
                )}
                <div className="p-3"><h3 className="text-sm font-medium text-gray-900 line-clamp-2">{a.title}</h3></div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
