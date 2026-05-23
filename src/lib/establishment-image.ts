/**
 * Intelligent fallback image system for establishments without a coverImage.
 *
 * Strategy:
 *   1. If coverImage is provided -> resolve via getImageUrl.
 *   2. Match by normalised city -> pick a real local photo of that destination.
 *   3. Fallback by type (HOTEL / RESTAURANT / ATTRACTION / PROVIDER).
 *   4. Ultimate fallback -> sunset highlight.
 *
 * Selection inside a candidate list is deterministic (hash of name),
 * so a given establishment always renders with the same image (no flicker
 * on re-render, no mismatch between list and detail pages).
 */
import { getImageUrl } from './image-url';

/* ---------- City -> local images map ---------- */
/* Only references files that actually exist in public/images/Attractions/. */
const CITY_IMAGES: Record<string, string[]> = {
  'nosy-be': [
    '/images/Attractions/nosy-be/nosy-be.jpg',
    '/images/Attractions/nosy-be/nosy-be-1.jpg',
    '/images/Attractions/nosy-be/nosy-be-2.jpg',
    '/images/Attractions/nosy-be/nosy-be-3.jpg',
    '/images/Attractions/nosy-be/nosy-be-4.jpg',
    '/images/Attractions/nosy-be/nosy-be-madagascar-201.jpg',
    '/images/Attractions/nosy-be/nosy-be-vie-311.jpg',
    '/images/Attractions/nosy-be/nosy-lojo-420.jpg',
    '/images/Attractions/nosy-be/nosy-lojo-421.jpg',
  ],
  antananarivo: [
    '/images/Attractions/antananarivo/antananarivo.jpg',
    '/images/Attractions/antananarivo/antananarivo-2.jpg',
    '/images/Attractions/antananarivo/antananarivo-1771190298922.jpg',
    '/images/Attractions/antananarivo/antananarivo4.png',
    '/images/Attractions/antananarivo/antananarivo5.png',
    '/images/Attractions/antananarivo/antananarivo6.png',
  ],
  'diego-suarez': [
    '/images/Attractions/diego-suarez/diego-suarez.jpg',
    '/images/Attractions/diego-suarez/diego-suarez-1.jpg',
    '/images/Attractions/diego-suarez/antsiranana-428-1.jpg',
    '/images/Attractions/diego-suarez/place-joffre-422.jpg',
    '/images/Attractions/diego-suarez/plage-ramena-et-les-pirogues-444.jpg',
    '/images/Attractions/diego-suarez/port-antsiranana-451.jpg',
    '/images/Attractions/diego-suarez/Diego-Suarez-441.jpg',
  ],
  morondava: [
    '/images/Attractions/baobabs/allee-des-baobabs.jpg',
    '/images/Attractions/baobabs/allee-des-baobabs-1.jpg',
    '/images/Attractions/baobabs/allee-des-baobabs-2.jpg',
    '/images/Attractions/baobabs/allee-des-baobabs-3.jpg',
    '/images/Attractions/baobabs/avenue-des-baobabs-a-madagascar-130.jpg',
    '/images/Attractions/baobabs/baobab-couche-de-soleil.jpg',
    '/images/Attractions/baobabs/coucher-de-soleil-baobab-335.jpg',
  ],
  'sainte-marie': [
    '/images/Attractions/sainte-marie/ile-sainte-marie.jpg',
    '/images/Attractions/sainte-marie/ile-sainte-marie-1.jpg',
  ],
  andasibe: [
    '/images/Attractions/andasibe/andasibe-mantadia.jpg',
    '/images/Attractions/andasibe/andasibe-mantadia-1.jpg',
    '/images/Attractions/andasibe/andasibe-mantadia-2.jpg',
    '/images/Attractions/andasibe/andasibe-mantadia-3.jpg',
    '/images/Attractions/andasibe/andasibe-mantadia.png',
    '/images/Attractions/andasibe/Andasibe-386.jpg',
    '/images/Attractions/andasibe/andasibe-et-les-gidro-312.jpg',
  ],
  antsirabe: [
    '/images/Attractions/antsirabe/antsirabe.jpg',
    '/images/Attractions/antsirabe/antsirabe-1.jpg',
    '/images/Attractions/antsirabe/antsirabe-2.jpg',
    '/images/Attractions/antsirabe/antsirabe-3.jpg',
    '/images/Attractions/antsirabe/antsirabe-4.jpg',
    '/images/Attractions/antsirabe/lac-tritriva.jpg',
    '/images/Attractions/antsirabe/andraikiba.jpg',
    '/images/Attractions/antsirabe/source-thermal.png',
  ],
  fianarantsoa: [
    '/images/Attractions/fianarantsoa/fianarantsoa.jpg',
    '/images/Attractions/fianarantsoa/fianarantsoa-1.jpg',
    '/images/Attractions/fianarantsoa/fianarantsoa-2.jpg',
    '/images/Attractions/fianarantsoa/fianarantsoa-3.jpg',
    '/images/Attractions/fianarantsoa/fianarantsoa-4.jpg',
  ],
  tulear: [
    '/images/Attractions/ifaty/ifaty-tulear.jpg',
    '/images/Attractions/ifaty/ifatytulear.png',
  ],
  ranomafana: [
    '/images/Attractions/ranomafana/parc-ranomafana.jpg',
  ],
  isalo: [
    '/images/Attractions/isalo/parc-isalo.jpg',
    '/images/Attractions/isalo/piscine-naturelle-isalo-144.jpg',
    '/images/Attractions/isalo/parc-national-disalo-au-sud-ouest-de-madagascar-15-378.jpg',
    '/images/Attractions/isalo/route-nationale-7-isalo.jpg',
    '/images/Attractions/isalo/rn7-pk-54-ihosy-376.jpg',
  ],
  masoala: [
    '/images/Attractions/masoala/parc-masoala.jpg',
    '/images/Attractions/masoala/parc-masoala-1.jpg',
    '/images/Attractions/masoala/parc-masoala-2.jpg',
    '/images/Attractions/masoala/parc-masoala-3.jpg',
  ],
  ankarana: [
    '/images/Attractions/ankarana/ankarana.jpg',
    '/images/Attractions/ankarana/ankarana-1.jpg',
    '/images/Attractions/ankarana/ankarana-2.jpg',
    '/images/Attractions/ankarana/Ankarana-469.jpg',
    '/images/Attractions/ankarana/Ankarana-479.jpg',
    '/images/Attractions/ankarana/tsingy-ankarana.jpg',
    '/images/Attractions/ankarana/tsingy-ankarana-472.jpg',
    '/images/Attractions/ankarana/lac-ankarana.jpg',
    '/images/Attractions/ankarana/grotte-ankarana-424.jpg',
    '/images/Attractions/ankarana/la-grotte-ankarana-470.jpg',
    '/images/Attractions/ankarana/paysage-ankarana-473.jpg',
    '/images/Attractions/ankarana/paysage-ankarana-476.jpg',
  ],
  bemaraha: [
    '/images/Attractions/bemaraha/bemaraha.jpg',
    '/images/Attractions/bemaraha/tsingy-bemaraha.jpg',
    '/images/Attractions/bemaraha/tsingy-bemaraha-415.jpg',
    '/images/Attractions/bemaraha/tsingy-bemaraha-416.jpg',
    '/images/Attractions/bemaraha/tsingy-bemaraha-417.jpg',
    '/images/Attractions/bemaraha/tsingy-de-bemaraha-260.jpg',
    '/images/Attractions/bemaraha/tsingy-de-bemahara-330.jpg',
    '/images/Attractions/bemaraha/dans-la-nature-de-bemahara-439-1.jpg',
  ],
  pangalanes: [
    '/images/Attractions/pangalanes/canal-pangalanes.jpg',
    '/images/Attractions/pangalanes/canal-pangalanes-1.jpg',
    '/images/Attractions/pangalanes/canal-pangalanes-2.jpg',
    '/images/Attractions/pangalanes/canal-pangalanes-3.jpg',
  ],
  'fort-dauphin': [
    '/images/Attractions/fort-dauphin/fort-dauphin.jpg',
    '/images/Attractions/fort-dauphin/fort-dauphin-1.jpg',
    '/images/Attractions/fort-dauphin/fort-dauphin13.png',
  ],
  ambositra: [
    '/images/Attractions/ambositra/artisanat.jpg',
    '/images/Attractions/ambositra/art-malagasy-zafimaniry-ambositra-336.jpg',
    '/images/Attractions/ambositra/sculpture-zafimaniry-ambositra-339.jpg',
    '/images/Attractions/ambositra/charrue-de-boeuf-ambositra-454.jpg',
  ],
};

/* ---------- City aliases (normalised form -> CITY_IMAGES key) ---------- */
const CITY_ALIASES: Record<string, string> = {
  // Nosy Be
  'nosy be': 'nosy-be',
  'nosy-be': 'nosy-be',
  'nosybe': 'nosy-be',
  'hell ville': 'nosy-be',
  'hellville': 'nosy-be',
  // Antananarivo
  'antananarivo': 'antananarivo',
  'tana': 'antananarivo',
  'tananarive': 'antananarivo',
  'tnr': 'antananarivo',
  // Diego Suarez / Antsiranana
  'diego suarez': 'diego-suarez',
  'diego-suarez': 'diego-suarez',
  'diego': 'diego-suarez',
  'antsiranana': 'diego-suarez',
  // Morondava (baobabs)
  'morondava': 'morondava',
  'menabe': 'morondava',
  // Sainte-Marie
  'sainte marie': 'sainte-marie',
  'sainte-marie': 'sainte-marie',
  'saint marie': 'sainte-marie',
  'saint-marie': 'sainte-marie',
  'ile sainte marie': 'sainte-marie',
  'ile sainte-marie': 'sainte-marie',
  'nosy boraha': 'sainte-marie',
  // Andasibe
  'andasibe': 'andasibe',
  'mantadia': 'andasibe',
  // Antsirabe
  'antsirabe': 'antsirabe',
  // Fianarantsoa
  'fianarantsoa': 'fianarantsoa',
  'fianar': 'fianarantsoa',
  // Tuléar / Toliara (Ifaty proche)
  'tulear': 'tulear',
  'tuléar': 'tulear',
  'toliara': 'tulear',
  'ifaty': 'tulear',
  'mangily': 'tulear',
  'anakao': 'tulear',
  // Ranomafana
  'ranomafana': 'ranomafana',
  // Isalo
  'isalo': 'isalo',
  'ranohira': 'isalo',
  // Masoala
  'masoala': 'masoala',
  'maroantsetra': 'masoala',
  // Ankarana
  'ankarana': 'ankarana',
  // Bemaraha / Tsingy
  'bemaraha': 'bemaraha',
  'tsingy': 'bemaraha',
  'tsingy de bemaraha': 'bemaraha',
  // Pangalanes
  'pangalanes': 'pangalanes',
  'manakara': 'pangalanes',
  // Fort-Dauphin
  'fort dauphin': 'fort-dauphin',
  'fort-dauphin': 'fort-dauphin',
  'tolagnaro': 'fort-dauphin',
  'taolagnaro': 'fort-dauphin',
  // Ambositra
  'ambositra': 'ambositra',
};

/* ---------- Type-based fallback pools ---------- */
const TYPE_IMAGES: Record<string, string[]> = {
  HOTEL: [
    '/images/highlights/sunset.jpg',
    '/images/highlights/hero-pool-madagascar.jpg',
    '/images/highlights/fond page hotel.png',
    '/images/Attractions/baobabs/baobab-couche-de-soleil.jpg',
    '/images/Attractions/baobabs/coucher-de-soleil-baobab-335.jpg',
    '/images/highlights/plage.jpg',
    '/images/highlights/plage-madagascar-202.jpg',
  ],
  RESTAURANT: [
    '/images/highlights/restaurant-plage.png',
    '/images/highlights/restaurant-interne.png',
    '/images/highlights/village.jpg',
    '/images/highlights/village-hovatraha-308.jpg',
    '/images/highlights/marche.jpg',
    '/images/highlights/marchande-bonbon-coco-tamatave-448.jpg',
    '/images/highlights/vrai-vie-madagascar.jpg',
  ],
  ATTRACTION: [
    '/images/highlights/foret.jpg',
    '/images/highlights/montagne.jpg',
    '/images/highlights/lac.jpg',
    '/images/highlights/lemur.jpg',
    '/images/highlights/baobabs.jpg',
    '/images/highlights/tsingy.jpg',
  ],
  PROVIDER: [
    '/images/highlights/pirogue.jpg',
    '/images/highlights/randonnee.jpg',
    '/images/highlights/Pirogue-426.jpg',
    '/images/highlights/Chauffeur.png',
    '/images/highlights/Guide.png',
    '/images/highlights/pousse-pousse.jpg',
    '/images/highlights/plongee.jpg',
  ],
};

const ULTIMATE_FALLBACK = '/images/highlights/sunset.jpg';

/* ---------- Helpers ---------- */
function stripAccents(input: string): string {
  return input.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalise(input: string | null | undefined): string {
  if (!input) return '';
  return stripAccents(input.toLowerCase())
    .replace(/['’`]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Deterministic non-negative hash from a string. */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pick(images: string[], seed: string): string {
  if (images.length === 0) return ULTIMATE_FALLBACK;
  return images[hashString(seed) % images.length];
}

function resolveCityKey(city: string | undefined | null): string | null {
  const norm = normalise(city);
  if (!norm) return null;
  // exact alias match
  if (CITY_ALIASES[norm]) return CITY_ALIASES[norm];
  // partial match (handles "Hotel Trianon, Antsirabe" or "Nosy Be / Hell Ville")
  for (const alias of Object.keys(CITY_ALIASES)) {
    if (norm.includes(alias)) return CITY_ALIASES[alias];
  }
  return null;
}

/* ---------- Public API ---------- */
export function getEstablishmentImage(
  type: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'PROVIDER' | string,
  city: string | undefined | null,
  name: string,
  coverImage?: string | null,
): string {
  // 1. Real cover image -> use it (goes through getImageUrl since it may be a
  // Cloudinary upload or remote URL).
  if (coverImage && coverImage.trim().length > 0) {
    return getImageUrl(coverImage);
  }

  const seed = name && name.length > 0 ? name : `${type}-${city ?? ''}`;

  // 2-4. Fallbacks are local-only assets in /public/images/. Return the path
  // as-is so Next.js Image serves them directly (passing through getImageUrl
  // would rewrite to Cloudinary, which 404s for these never-uploaded files).
  // Combine type + city images for variety AND type relevance.
  // Type images are weighted 2x to favour visual coherence (a restaurant
  // should look like a restaurant, not a generic city street).
  const cityKey = resolveCityKey(city);
  const cityImages = cityKey && CITY_IMAGES[cityKey] ? CITY_IMAGES[cityKey] : [];
  const typeKey = (type || '').toUpperCase();
  const typeImages = TYPE_IMAGES[typeKey] || [];

  const pool = [...typeImages, ...typeImages, ...cityImages];
  if (pool.length > 0) {
    return pick(pool, seed);
  }

  // Ultimate fallback (should never hit if type is valid).
  return ULTIMATE_FALLBACK;
}

/* ---------- Highlight (points forts) image matcher ---------- */
/* Used by /attractions/[slug] to give each highlight card a real background. */
const HIGHLIGHT_KEYWORDS: Array<{ keywords: string[]; images: string[] }> = [
  {
    keywords: ['lemur', 'lémur', 'maki', 'sifaka', 'indri', 'varika', 'aye-aye', 'primate'],
    images: [
      '/images/highlights/lemur.jpg',
      '/images/highlights/indri.jpg',
      '/images/highlights/lemurien-sifaka-madagascar2.jpg',
      '/images/highlights/Varika-370.jpg',
      '/images/Attractions/andasibe/andasibe-et-les-gidro-312.jpg',
    ],
  },
  {
    keywords: ['baleine', 'whale', 'requin-baleine'],
    images: [
      '/images/highlights/baleine.jpg',
      '/images/highlights/Baleine-391.jpg',
    ],
  },
  {
    keywords: ['plage', 'beach', 'sable', 'mer', 'ocean', 'océan', 'lagon', 'snorkel', 'corail'],
    images: [
      '/images/highlights/plage.jpg',
      '/images/highlights/plage-madagascar-202.jpg',
      '/images/highlights/Mer-425.jpg',
      '/images/highlights/corail.jpg',
    ],
  },
  {
    keywords: ['pirogue', 'voile', 'boutre', 'bateau', 'sail'],
    images: [
      '/images/highlights/pirogue.jpg',
      '/images/highlights/Pirogue-426.jpg',
    ],
  },
  {
    keywords: ['baobab'],
    images: [
      '/images/highlights/baobabs.jpg',
      '/images/Attractions/baobabs/allee-des-baobabs.jpg',
      '/images/Attractions/baobabs/baobab-couche-de-soleil.jpg',
    ],
  },
  {
    keywords: ['tsingy', 'bemaraha', 'karst', 'pinacle'],
    images: [
      '/images/highlights/tsingy.jpg',
      '/images/Attractions/bemaraha/tsingy-bemaraha.jpg',
      '/images/Attractions/ankarana/tsingy-ankarana.jpg',
    ],
  },
  {
    keywords: ['forêt', 'foret', 'jungle', 'canopée', 'canopee', 'arbre'],
    images: [
      '/images/highlights/foret.jpg',
      '/images/Attractions/masoala/parc-masoala.jpg',
    ],
  },
  {
    keywords: ['rando', 'trek', 'hike', 'marche', 'sentier'],
    images: [
      '/images/highlights/randonnee.jpg',
      '/images/highlights/montagne.jpg',
    ],
  },
  {
    keywords: ['montagne', 'massif', 'sommet', 'pic', 'mont', 'ambre', 'andringitra', 'makay'],
    images: [
      '/images/highlights/montagne.jpg',
      '/images/highlights/montagnes-madagascar-141.jpg',
      '/images/Attractions/divers/massif-andringitra.jpg',
    ],
  },
  {
    keywords: ['lac', 'tritriva', 'andraikiba', 'mer d emeraude'],
    images: [
      '/images/highlights/lac.jpg',
      '/images/Attractions/antsirabe/lac-tritriva.jpg',
    ],
  },
  {
    keywords: ['cascade', 'chute', 'waterfall', 'rivière', 'riviere'],
    images: [
      '/images/highlights/foret.jpg',
      '/images/highlights/lac.jpg',
    ],
  },
  {
    keywords: ['source', 'thermes', 'thermal'],
    images: [
      '/images/highlights/thermes.jpg',
      '/images/Attractions/antsirabe/source-thermal.png',
    ],
  },
  {
    keywords: ['grotte', 'cave', 'caverne'],
    images: [
      '/images/Attractions/ankarana/grotte-ankarana-424.jpg',
      '/images/Attractions/ankarana/la-grotte-ankarana-470.jpg',
    ],
  },
  {
    keywords: ['train', 'fce', 'rail'],
    images: ['/images/highlights/train.jpg'],
  },
  {
    keywords: ['village', 'tribu', 'tribu', 'culture', 'tradition', 'famadihana'],
    images: [
      '/images/highlights/village.jpg',
      '/images/highlights/vrai-vie-madagascar.jpg',
      '/images/highlights/village-hovatraha-308.jpg',
    ],
  },
  {
    keywords: ['marché', 'marche', 'market', 'artisan'],
    images: [
      '/images/highlights/marche.jpg',
      '/images/highlights/artisanat.jpg',
    ],
  },
  {
    keywords: ['plongée', 'plongee', 'dive', 'snorkel'],
    images: ['/images/highlights/plongee.jpg'],
  },
  {
    keywords: ['surf', 'vague', 'kite'],
    images: ['/images/highlights/surf.jpg'],
  },
  {
    keywords: ['caméléon', 'cameleon', 'gecko', 'reptile', 'lézard', 'lezard'],
    images: [
      '/images/highlights/cameleon.jpg',
      '/images/highlights/lezard.jpg',
    ],
  },
  {
    keywords: ['orchidée', 'orchidee', 'fleur', 'flore', 'plante'],
    images: [
      '/images/highlights/orchidee.jpg',
      '/images/highlights/Fleure-429.jpg',
    ],
  },
  {
    keywords: ['rizière', 'riziere', 'paddy', 'riz'],
    images: ['/images/highlights/rizieres.jpg'],
  },
  {
    keywords: ['ile', 'île', 'nosy', 'iranja', 'tanikely', 'komba'],
    images: [
      '/images/Attractions/nosy-be/nosy-be.jpg',
      '/images/Attractions/sainte-marie/ile-sainte-marie.jpg',
    ],
  },
  {
    keywords: ['mangrove'],
    images: ['/images/highlights/mangrove.jpg'],
  },
  {
    keywords: ['coucher', 'sunset', 'soleil'],
    images: [
      '/images/highlights/sunset.jpg',
      '/images/Attractions/baobabs/coucher-de-soleil-baobab-335.jpg',
    ],
  },
];

const HIGHLIGHT_DEFAULTS = [
  '/images/highlights/foret.jpg',
  '/images/highlights/montagne.jpg',
  '/images/highlights/sunset.jpg',
  '/images/highlights/baobabs.jpg',
  '/images/highlights/lac.jpg',
  '/images/highlights/plage.jpg',
];

export function getHighlightImage(label: string, fallbackSeed?: string): string {
  // Highlights are local-only assets — return path as-is (skip getImageUrl
  // rewriting to Cloudinary which would 404 for never-uploaded files).
  const norm = normalise(label);
  if (norm) {
    for (const { keywords, images } of HIGHLIGHT_KEYWORDS) {
      for (const kw of keywords) {
        const nkw = normalise(kw);
        if (nkw && norm.includes(nkw)) {
          return pick(images, label);
        }
      }
    }
  }
  const seed = fallbackSeed && fallbackSeed.length > 0 ? `${fallbackSeed}-${label}` : label || 'highlight';
  return pick(HIGHLIGHT_DEFAULTS, seed);
}
