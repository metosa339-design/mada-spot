interface EstablishmentJsonLdProps {
  type: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'PROVIDER';
  name: string;
  description?: string;
  address?: string;
  city: string;
  district?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  coverImage?: string;
  rating?: number;
  reviewCount?: number;
  // Restaurant
  cuisineTypes?: string[];
  priceRange?: string;
  openingHours?: Record<string, { open: string; close: string; closed?: boolean }>;
  hasReservation?: boolean;
  hasDelivery?: boolean;
  // Hotel
  starRating?: number;
  checkInTime?: string;
  checkOutTime?: string;
  amenities?: string[];
  lowestPrice?: number;
  // Attraction
  isFree?: boolean;
  entryFeeLocal?: number;
}

const priceRangeSymbol: Record<string, string> = {
  BUDGET: '$',
  MODERATE: '$$',
  UPSCALE: '$$$',
  LUXURY: '$$$$',
};

function buildOpeningHoursSpec(
  openingHours: Record<string, { open: string; close: string; closed?: boolean }>
) {
  const dayMap: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  return Object.entries(openingHours)
    .filter(([, hours]) => !hours.closed)
    .map(([day, hours]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: dayMap[day],
      opens: hours.open,
      closes: hours.close,
    }));
}

export default function EstablishmentJsonLd(props: EstablishmentJsonLdProps) {
  let schemaType = 'LocalBusiness';
  const jsonLd: any = {
    '@context': 'https://schema.org',
    name: props.name,
    description: props.description,
    telephone: props.phone,
    url: props.website,
    image: props.coverImage,
  };

  // Address
  jsonLd.address = {
    '@type': 'PostalAddress',
    streetAddress: props.address,
    addressLocality: props.city,
    addressRegion: props.region || props.district,
    addressCountry: 'MG',
  };

  // Geo
  if (props.latitude && props.longitude) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: props.latitude,
      longitude: props.longitude,
    };
  }

  // Aggregate rating
  if (props.rating && props.reviewCount && props.reviewCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: props.rating.toFixed(1),
      reviewCount: props.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Type-specific
  if (props.type === 'RESTAURANT') {
    schemaType = 'Restaurant';
    if (props.cuisineTypes?.length) {
      jsonLd.servesCuisine = props.cuisineTypes;
    }
    if (props.priceRange) {
      jsonLd.priceRange = priceRangeSymbol[props.priceRange] || props.priceRange;
    }
    if (props.openingHours) {
      jsonLd.openingHoursSpecification = buildOpeningHoursSpec(props.openingHours);
    }
    if (props.hasReservation) {
      jsonLd.acceptsReservations = true;
    }
    if (props.hasDelivery) {
      jsonLd.hasDeliveryMethod = { '@type': 'DeliveryMethod' };
    }
  } else if (props.type === 'HOTEL') {
    schemaType = 'Hotel';
    if (props.starRating) {
      jsonLd.starRating = {
        '@type': 'Rating',
        ratingValue: props.starRating,
      };
    }
    if (props.checkInTime) jsonLd.checkinTime = props.checkInTime;
    if (props.checkOutTime) jsonLd.checkoutTime = props.checkOutTime;
    if (props.amenities?.length) {
      jsonLd.amenityFeature = props.amenities.map(a => ({
        '@type': 'LocationFeatureSpecification',
        name: a,
        value: true,
      }));
    }
    if (props.lowestPrice) {
      jsonLd.priceRange = `À partir de ${props.lowestPrice.toLocaleString()} MGA`;
    }
  } else if (props.type === 'ATTRACTION') {
    schemaType = 'TouristAttraction';
    if (props.isFree !== undefined) {
      jsonLd.isAccessibleForFree = props.isFree;
    }
  }

  jsonLd['@type'] = schemaType;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
