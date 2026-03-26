import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRestaurantBySlug } from '@/lib/data/establishments';
import { SITE_NAME } from '@/lib/constants';
import EstablishmentJsonLd from '@/components/bons-plans/EstablishmentJsonLd';
import BreadcrumbJsonLd from '@/components/bons-plans/BreadcrumbJsonLd';
import RestaurantDetail from './RestaurantDetail';

// ISR: revalidate every hour
export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getRestaurantBySlug(slug);

  if (!data) {
    return { title: `Restaurant introuvable | ${SITE_NAME}` };
  }

  const { restaurant } = data;
  const title = `${restaurant.name} — Restaurant à ${restaurant.city} | ${SITE_NAME}`;
  const description = restaurant.shortDescription
    || restaurant.description?.slice(0, 160)
    || `Découvrez ${restaurant.name} à ${restaurant.city} sur ${SITE_NAME}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/bons-plans/restaurants/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/bons-plans/restaurants/${slug}`,
      images: restaurant.coverImage ? [{ url: restaurant.coverImage }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params;
  const data = await getRestaurantBySlug(slug);

  if (!data) {
    notFound();
  }

  const { restaurant } = data;

  return (
    <>
      <EstablishmentJsonLd
        type="RESTAURANT"
        name={restaurant.name}
        description={restaurant.description || undefined}
        city={restaurant.city}
        district={restaurant.district || undefined}
        region={restaurant.region || undefined}
        latitude={restaurant.latitude || undefined}
        longitude={restaurant.longitude || undefined}
        phone={restaurant.phone || undefined}
        website={restaurant.website || undefined}
        coverImage={restaurant.coverImage || undefined}
        rating={restaurant.rating || undefined}
        reviewCount={restaurant.reviewCount || undefined}
        cuisineTypes={restaurant.cuisineTypes}
        priceRange={restaurant.priceRange || undefined}
        openingHours={restaurant.openingHours}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Bons Plans', url: '/bons-plans' },
          { name: 'Restaurants', url: '/bons-plans/restaurants' },
          { name: restaurant.name, url: `/bons-plans/restaurants/${slug}` },
        ]}
      />
      <RestaurantDetail />
    </>
  );
}
