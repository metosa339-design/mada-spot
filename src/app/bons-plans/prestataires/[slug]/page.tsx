import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProviderBySlug } from '@/lib/data/establishments';
import { SITE_NAME } from '@/lib/constants';
import EstablishmentJsonLd from '@/components/bons-plans/EstablishmentJsonLd';
import BreadcrumbJsonLd from '@/components/bons-plans/BreadcrumbJsonLd';
import ProviderDetail from './ProviderDetail';

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProviderBySlug(slug);

  if (!data) {
    return { title: `Prestataire introuvable | ${SITE_NAME}` };
  }

  const { provider } = data;
  const title = `${provider.name} — Prestataire à ${provider.city} | ${SITE_NAME}`;
  const description = provider.shortDescription
    || provider.description?.slice(0, 160)
    || `Découvrez ${provider.name} à ${provider.city} sur ${SITE_NAME}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/bons-plans/prestataires/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/bons-plans/prestataires/${slug}`,
      images: provider.coverImage ? [{ url: provider.coverImage }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ProviderPage({ params }: Props) {
  const { slug } = await params;
  const data = await getProviderBySlug(slug);

  if (!data) {
    notFound();
  }

  const { provider } = data;

  return (
    <>
      <EstablishmentJsonLd
        type="PROVIDER"
        name={provider.name}
        description={provider.description || undefined}
        city={provider.city}
        district={provider.district || undefined}
        region={provider.region || undefined}
        latitude={provider.latitude || undefined}
        longitude={provider.longitude || undefined}
        phone={provider.phone || undefined}
        website={provider.website || undefined}
        coverImage={provider.coverImage || undefined}
        rating={provider.rating || undefined}
        reviewCount={provider.reviewCount || undefined}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Bons Plans', url: '/bons-plans' },
          { name: 'Prestataires', url: '/bons-plans/prestataires' },
          { name: provider.name, url: `/bons-plans/prestataires/${slug}` },
        ]}
      />
      <ProviderDetail />
    </>
  );
}
