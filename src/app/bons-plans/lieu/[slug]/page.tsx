import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { SITE_NAME } from '@/lib/constants';
import LieuClient from './LieuClient';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getGhostEstablishment(slug: string) {
  const establishment = await prisma.establishment.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      city: true,
      region: true,
      description: true,
      rating: true,
      reviewCount: true,
      isGhost: true,
      isClaimed: true,
      createdAt: true,
      reviews: {
        where: { isPublished: true },
        select: {
          id: true,
          authorName: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!establishment || !establishment.isGhost) return null;
  return establishment;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const est = await getGhostEstablishment(slug);

  if (!est) {
    return { title: `Lieu introuvable | ${SITE_NAME}` };
  }

  return {
    title: `${est.name} — ${est.city} | ${SITE_NAME}`,
    description: `Fiche communautaire pour ${est.name} à ${est.city}. Ajouté par la communauté Mada Spot.`,
    robots: { index: false, follow: false },
  };
}

export default async function GhostLieuPage({ params }: Props) {
  const { slug } = await params;
  const est = await getGhostEstablishment(slug);

  if (!est) notFound();

  return (
    <div className="min-h-screen bg-[#0c0c16] pt-24 pb-16">
      <LieuClient est={est} />
    </div>
  );
}
