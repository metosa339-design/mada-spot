import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getHotelBySlug } from '@/lib/data/establishments';
import { SITE_NAME } from '@/lib/constants';
import EstablishmentJsonLd from '@/components/bons-plans/EstablishmentJsonLd';
import BreadcrumbJsonLd from '@/components/bons-plans/BreadcrumbJsonLd';
import HotelDetail from './HotelDetail';

// ISR: revalidate every hour
export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getHotelBySlug(slug);

  if (!data) {
    return { title: `Hôtel introuvable | ${SITE_NAME}` };
  }

  const { hotel } = data;
  const starLabel = hotel.starRating ? `${hotel.starRating}★ ` : '';
  const title = `${hotel.name} — ${starLabel}Hôtel à ${hotel.city} | ${SITE_NAME}`;
  const description = hotel.shortDescription
    || hotel.description?.slice(0, 160)
    || `Découvrez ${hotel.name} à ${hotel.city} sur ${SITE_NAME}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/bons-plans/hotels/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/bons-plans/hotels/${slug}`,
      images: hotel.coverImage ? [{ url: hotel.coverImage }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function HotelPage({ params }: Props) {
  const { slug } = await params;
  const data = await getHotelBySlug(slug);

  if (!data) {
    notFound();
  }

  const { hotel } = data;

  return (
    <>
      <EstablishmentJsonLd
        type="HOTEL"
        name={hotel.name}
        description={hotel.description || undefined}
        city={hotel.city}
        district={hotel.district || undefined}
        region={hotel.region || undefined}
        latitude={hotel.latitude || undefined}
        longitude={hotel.longitude || undefined}
        phone={hotel.phone || undefined}
        website={hotel.website || undefined}
        coverImage={hotel.coverImage || undefined}
        rating={hotel.rating || undefined}
        reviewCount={hotel.reviewCount || undefined}
        starRating={hotel.starRating || undefined}
        checkInTime={hotel.checkInTime || undefined}
        checkOutTime={hotel.checkOutTime || undefined}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Bons Plans', url: '/bons-plans' },
          { name: 'Hôtels', url: '/bons-plans/hotels' },
          { name: hotel.name, url: `/bons-plans/hotels/${slug}` },
        ]}
      />
      <HotelDetail />
    </>
  );
}
