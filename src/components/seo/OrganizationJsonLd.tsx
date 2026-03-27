import { SITE_URL, SITE_NAME } from '@/lib/constants';

export default function OrganizationJsonLd() {
  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'Plateforme de référence pour découvrir les meilleurs restaurants, hôtels et attractions touristiques à Madagascar.',
    areaServed: {
      '@type': 'Country',
      name: 'Madagascar',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contact@madaspot.com',
      url: `${SITE_URL}/contact`,
      availableLanguage: ['fr', 'mg'],
    },
    sameAs: [
      'https://www.facebook.com/madaspot',
      'https://www.instagram.com/madaspot',
    ],
  };

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'fr',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
    </>
  );
}
