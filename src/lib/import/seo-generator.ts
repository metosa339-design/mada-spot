// Auto-generate SEO meta title and description for imported establishments

interface EstablishmentSEOInput {
  type: string;
  name: string;
  city: string;
  district?: string;
  category?: string;
  priceRange?: string;
  starRating?: number;
  attractionType?: string;
}

const categoryLabels: Record<string, string> = {
  GARGOTE: 'Gargote',
  RESTAURANT: 'Restaurant',
  LOUNGE: 'Lounge & Bar',
  CAFE: 'Café',
  FAST_FOOD: 'Fast Food',
  STREET_FOOD: 'Street Food',
};

const priceLabels: Record<string, string> = {
  BUDGET: 'pas cher',
  MODERATE: 'prix modéré',
  UPSCALE: 'haut de gamme',
  LUXURY: 'luxe',
};

export function generateMetaTitle(est: EstablishmentSEOInput): string {
  const parts: string[] = [];

  if (est.type === 'HOTEL') {
    parts.push(est.name);
    if (est.starRating) parts.push(`${est.starRating} étoiles`);
    parts.push(`à ${est.city}`);
  } else if (est.type === 'RESTAURANT') {
    const cat = est.category ? categoryLabels[est.category] || est.category : 'Restaurant';
    parts.push(`${est.name} - ${cat}`);
    parts.push(`à ${est.city}`);
  } else {
    parts.push(est.name);
    parts.push(`à ${est.city}`);
  }

  const title = parts.join(' ') + ' | Mada Spot';
  // Truncate to 60 chars for SEO
  return title.length > 60 ? title.substring(0, 57) + '...' : title;
}

export function generateMetaDescription(est: EstablishmentSEOInput): string {
  const parts: string[] = [];

  if (est.type === 'HOTEL') {
    parts.push(`Découvrez ${est.name}`);
    if (est.starRating) parts.push(`hôtel ${est.starRating} étoiles`);
    parts.push(`à ${est.city}${est.district ? `, ${est.district}` : ''}.`);
    parts.push('Photos, tarifs, avis et itinéraire sur Mada Spot.');
  } else if (est.type === 'RESTAURANT') {
    const cat = est.category ? categoryLabels[est.category] || '' : '';
    parts.push(`${est.name}${cat ? `, ${cat.toLowerCase()}` : ''}`);
    parts.push(`à ${est.city}${est.district ? `, ${est.district}` : ''}.`);
    if (est.priceRange) parts.push(`${priceLabels[est.priceRange] || ''}.`);
    parts.push('Menu, horaires, prix et itinéraire sur Mada Spot.');
  } else {
    parts.push(`${est.name} à ${est.city}${est.district ? `, ${est.district}` : ''}.`);
    parts.push('Infos pratiques, tarifs, photos et itinéraire sur Mada Spot.');
  }

  const desc = parts.join(' ');
  // Truncate to 160 chars for SEO
  return desc.length > 160 ? desc.substring(0, 157) + '...' : desc;
}
