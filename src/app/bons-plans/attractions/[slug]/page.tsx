import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAttractionBySlug } from '@/lib/data/establishments';
import { SITE_NAME } from '@/lib/constants';
import EstablishmentJsonLd from '@/components/bons-plans/EstablishmentJsonLd';
import BreadcrumbJsonLd from '@/components/bons-plans/BreadcrumbJsonLd';
import AttractionDetail from './AttractionDetail';

// ISR: revalidate every hour
export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAttractionBySlug(slug);

  if (!data) {
    return { title: `Attraction introuvable | ${SITE_NAME}` };
  }

  const { attraction } = data;
  const title = `${attraction.name} — Attraction à ${attraction.city} | ${SITE_NAME}`;
  const description = attraction.shortDescription
    || attraction.description?.slice(0, 160)
    || `Découvrez ${attraction.name} à ${attraction.city} sur ${SITE_NAME}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/bons-plans/attractions/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/bons-plans/attractions/${slug}`,
      images: attraction.coverImage ? [{ url: attraction.coverImage }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function AttractionPage({ params }: Props) {
  const { slug } = await params;
  const data = await getAttractionBySlug(slug);

  if (!data) {
    notFound();
  }

  const { attraction } = data;

  return (
    <>
      <EstablishmentJsonLd
        type="ATTRACTION"
        name={attraction.name}
        description={attraction.description || undefined}
        city={attraction.city}
        district={attraction.district || undefined}
        region={attraction.region || undefined}
        latitude={attraction.latitude || undefined}
        longitude={attraction.longitude || undefined}
        phone={attraction.phone || undefined}
        coverImage={attraction.coverImage || undefined}
        rating={attraction.rating || undefined}
        reviewCount={attraction.reviewCount || undefined}
        isFree={attraction.isFree ?? undefined}
        entryFeeLocal={attraction.entryFeeLocal || undefined}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Bons Plans', url: '/bons-plans' },
          { name: 'Attractions', url: '/bons-plans/attractions' },
          { name: attraction.name, url: `/bons-plans/attractions/${slug}` },
        ]}
      />
      <AttractionDetail />
    </>
  );
}
