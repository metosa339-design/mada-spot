import logger from '@/lib/logger';
/**
 * Extracteur d'images intelligent pour articles de presse
 * Utilise plusieurs stratégies pour trouver l'image principale
 */

interface ExtractedImage {
  url: string | null;
  source: 'og' | 'twitter' | 'json-ld' | 'wordpress' | 'dom' | 'rss' | null;
  width?: number;
  height?: number;
}

// Patterns à exclure
const EXCLUDE_PATTERNS = [
  /logo/i,
  /icon/i,
  /avatar/i,
  /sidebar/i,
  /banner/i,
  /ads?[\-_\.]/i,
  /advert/i,
  /button/i,
  /placeholder/i,
  /spinner/i,
  /loading/i,
  /gravatar/i,
  /emoji/i,
  /badge/i,
  /share/i,
  /social/i,
  /pixel/i,
  /tracking/i,
  /spacer/i,
  /blank/i,
  /1x1/i,
  /widget/i,
];

// Extensions à exclure
const EXCLUDE_EXTENSIONS = ['.svg', '.gif', '.ico'];

/**
 * Vérifie si une URL d'image est valide et pertinente
 */
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;

  // Doit être une URL valide
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')) {
    return false;
  }

  // Vérifie les patterns exclus
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(url)) return false;
  }

  // Vérifie les extensions exclues
  const urlLower = url.toLowerCase();
  for (const ext of EXCLUDE_EXTENSIONS) {
    if (urlLower.includes(ext)) return false;
  }

  // Ignore les data URIs trop petits (probablement des placeholders)
  if (url.startsWith('data:image')) {
    return false;
  }

  return true;
}

/**
 * Convertit une URL relative en URL absolue
 */
function toAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url) return '';

  // Déjà absolue
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Protocol-relative
  if (url.startsWith('//')) {
    return 'https:' + url;
  }

  try {
    const base = new URL(baseUrl);

    // Relative au root
    if (url.startsWith('/')) {
      return `${base.protocol}//${base.host}${url}`;
    }

    // Relative au chemin actuel
    const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1);
    return `${base.protocol}//${base.host}${basePath}${url}`;
  } catch {
    return url;
  }
}

/**
 * Extrait l'URL réelle d'une image lazy-loaded
 */
function extractLazyLoadUrl(imgHtml: string): string | null {
  // Cherche dans les attributs data-*
  const lazyAttributes = [
    /data-src=["']([^"']+)["']/i,
    /data-lazy-src=["']([^"']+)["']/i,
    /data-original=["']([^"']+)["']/i,
    /data-srcset=["']([^"'\s,]+)/i,
    /srcset=["']([^"'\s,]+)/i,
  ];

  for (const pattern of lazyAttributes) {
    const match = imgHtml.match(pattern);
    if (match && match[1] && isValidImageUrl(match[1])) {
      return match[1];
    }
  }

  // Extrait src normal
  const srcMatch = imgHtml.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1] && isValidImageUrl(srcMatch[1])) {
    return srcMatch[1];
  }

  return null;
}

/**
 * STRATÉGIE 1: Extrait l'image depuis Open Graph meta tags
 */
function extractFromOpenGraph(html: string): string | null {
  // og:image
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

  if (ogMatch && ogMatch[1] && isValidImageUrl(ogMatch[1])) {
    return ogMatch[1];
  }

  return null;
}

/**
 * STRATÉGIE 2: Extrait l'image depuis Twitter Card meta tags
 */
function extractFromTwitterCard(html: string): string | null {
  const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

  if (twitterMatch && twitterMatch[1] && isValidImageUrl(twitterMatch[1])) {
    return twitterMatch[1];
  }

  return null;
}

/**
 * STRATÉGIE 3: Extrait l'image depuis JSON-LD structured data
 */
function extractFromJsonLd(html: string): string | null {
  // Trouve tous les scripts JSON-LD
  const jsonLdMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  for (const match of jsonLdMatches) {
    try {
      const jsonContent = match[1].trim();
      const data = JSON.parse(jsonContent);

      // Cherche image dans différentes structures
      const imageUrl = findImageInJsonLd(data);
      if (imageUrl && isValidImageUrl(imageUrl)) {
        return imageUrl;
      }
    } catch {
      // JSON invalide, continue
    }
  }

  return null;
}

/**
 * Cherche récursivement une image dans les données JSON-LD
 */
function findImageInJsonLd(data: any): string | null {
  if (!data) return null;

  // Tableau de données
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = findImageInJsonLd(item);
      if (result) return result;
    }
    return null;
  }

  // Objet
  if (typeof data === 'object') {
    // Propriétés d'image directes
    const imageProps = ['image', 'thumbnailUrl', 'primaryImageOfPage', 'contentUrl'];

    for (const prop of imageProps) {
      if (data[prop]) {
        // Peut être une string ou un objet
        if (typeof data[prop] === 'string') {
          return data[prop];
        }
        if (typeof data[prop] === 'object') {
          if (data[prop].url) return data[prop].url;
          if (data[prop].contentUrl) return data[prop].contentUrl;
          if (Array.isArray(data[prop]) && data[prop][0]) {
            const first = data[prop][0];
            if (typeof first === 'string') return first;
            if (first.url) return first.url;
          }
        }
      }
    }

    // Cherche dans @graph (Schema.org)
    if (data['@graph']) {
      return findImageInJsonLd(data['@graph']);
    }
  }

  return null;
}

/**
 * Extrait la meilleure URL depuis srcset
 */
function getBestUrlFromSrcset(srcset: string, baseUrl: string): string | null {
  if (!srcset) return null;

  const entries = srcset.split(',').map(entry => {
    const parts = entry.trim().split(/\s+/);
    const url = parts[0];
    const descriptor = parts[1] || '1x';
    // Parse width (e.g., "800w") or density (e.g., "2x")
    const widthMatch = descriptor.match(/(\d+)w/);
    const densityMatch = descriptor.match(/(\d+)x/);
    const width = widthMatch ? parseInt(widthMatch[1]) : (densityMatch ? parseInt(densityMatch[1]) * 400 : 400);
    return { url, width };
  });

  // Trier par largeur décroissante et prendre la plus grande (mais raisonnable)
  entries.sort((a, b) => b.width - a.width);

  // Prendre la première image avec une taille raisonnable (entre 400 et 1200px)
  const best = entries.find(e => e.width >= 400 && e.width <= 1200) || entries[0];

  if (best && isValidImageUrl(best.url)) {
    return toAbsoluteUrl(best.url, baseUrl);
  }
  return null;
}

/**
 * STRATÉGIE 4: Recherche spécifique WordPress
 * Cherche les images avec les classes WordPress typiques
 */
function extractFromWordPress(html: string, baseUrl: string): string | null {
  // Classes WordPress pour les images featured/principales
  const wpImagePatterns = [
    // Image featured principale (pas loop-related qui sont des articles connexes)
    /<img[^>]+class="[^"]*(?:attachment-(?:full|large|post-thumbnail)|wp-post-image(?![^"]*loop-related)|featured-image|entry-thumb)[^"]*"[^>]*>/gi,
    // Image dans le conteneur post-thumbnail
    /<div[^>]*class="[^"]*post-thumbnail[^"]*"[^>]*>[\s\S]*?<img[^>]+>/gi,
    // Image dans entry-content (première image)
    /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>[\s\S]*?<img[^>]+>/gi,
  ];

  for (const pattern of wpImagePatterns) {
    const matches = html.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Skip images from related/loop sections
        if (match.includes('loop-related') || match.includes('related-post')) continue;

        // Extraire l'img tag si c'est un conteneur
        const imgMatch = match.match(/<img[^>]+>/i);
        const imgTag = imgMatch ? imgMatch[0] : match;

        // Essayer srcset d'abord pour la meilleure qualité
        const srcsetMatch = imgTag.match(/srcset=["']([^"']+)["']/i);
        if (srcsetMatch) {
          const bestUrl = getBestUrlFromSrcset(srcsetMatch[1], baseUrl);
          if (bestUrl) return bestUrl;
        }

        // Sinon utiliser src
        const imgUrl = extractLazyLoadUrl(imgTag);
        if (imgUrl && isValidImageUrl(imgUrl)) {
          return toAbsoluteUrl(imgUrl, baseUrl);
        }
      }
    }
  }

  return null;
}

/**
 * STRATÉGIE 5: Analyse du DOM pour trouver l'image principale
 */
function extractFromDom(html: string, baseUrl: string): string | null {
  // Cherche dans plusieurs conteneurs potentiels par ordre de priorité
  const containers = [
    // Article principal
    /<article[^>]*class="[^"]*(?:post|single|entry)[^"]*"[^>]*>([\s\S]*?)<\/article>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    // Conteneur de contenu principal
    /<div[^>]*class="[^"]*(?:entry-content|post-content|article-content|content-area)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // Main
    /<main[^>]*>([\s\S]*?)<\/main>/i,
  ];

  let contentHtml = html;
  for (const pattern of containers) {
    const match = html.match(pattern);
    if (match?.[1]) {
      contentHtml = match[1];
      break;
    }
  }

  // Trouve toutes les images avec leurs attributs
  const imgMatches = contentHtml.matchAll(/<img[^>]+>/gi);

  interface ImageCandidate {
    url: string;
    width: number;
    isNearTitle: boolean;
    isWpImage: boolean;
    hasSrcset: boolean;
    index: number;
  }

  const candidates: ImageCandidate[] = [];
  let imgIndex = 0;

  // Position du h1 pour déterminer la proximité
  const h1Index = contentHtml.search(/<h1[^>]*>/i);

  for (const match of imgMatches) {
    const imgTag = match[0];
    imgIndex++;

    // Skip les images connexes/related
    if (imgTag.includes('loop-related') || imgTag.includes('related-post')) continue;

    // Vérifie si c'est une image WordPress featured
    const isWpImage = /class="[^"]*(?:wp-post-image|attachment-|featured)/i.test(imgTag);

    // Essayer srcset d'abord
    let imgUrl: string | null = null;
    const srcsetMatch = imgTag.match(/srcset=["']([^"']+)["']/i);
    const hasSrcset = !!srcsetMatch;

    if (srcsetMatch) {
      imgUrl = getBestUrlFromSrcset(srcsetMatch[1], baseUrl);
    }

    // Sinon utiliser src/data-src
    if (!imgUrl) {
      imgUrl = extractLazyLoadUrl(imgTag);
    }

    if (!imgUrl || !isValidImageUrl(imgUrl)) continue;

    // Convertit en URL absolue
    imgUrl = toAbsoluteUrl(imgUrl, baseUrl);

    // Extrait les dimensions
    const widthMatch = imgTag.match(/width=["']?(\d+)/i);
    const width = widthMatch ? parseInt(widthMatch[1]) : 0;

    // Vérifie si l'image est près du titre
    const imgPosition = contentHtml.indexOf(imgTag);
    const isNearTitle = h1Index > -1 && Math.abs(imgPosition - h1Index) < 2000;

    // Ignore les images trop petites (sauf si c'est une image WP featured)
    if (!isWpImage && width > 0 && width < 200) continue;

    candidates.push({
      url: imgUrl,
      width,
      isNearTitle,
      isWpImage,
      hasSrcset,
      index: imgIndex
    });
  }

  if (candidates.length === 0) return null;

  // Trie par pertinence
  candidates.sort((a, b) => {
    // Priorité aux images WordPress featured
    if (a.isWpImage && !b.isWpImage) return -1;
    if (!a.isWpImage && b.isWpImage) return 1;

    // Puis aux images près du titre
    if (a.isNearTitle && !b.isNearTitle) return -1;
    if (!a.isNearTitle && b.isNearTitle) return 1;

    // Puis par présence de srcset (meilleure qualité)
    if (a.hasSrcset && !b.hasSrcset) return -1;
    if (!a.hasSrcset && b.hasSrcset) return 1;

    // Puis par largeur (plus grande = mieux)
    if (a.width !== b.width) return b.width - a.width;

    // Enfin par position (première = mieux)
    return a.index - b.index;
  });

  return candidates[0]?.url || null;
}

/**
 * STRATÉGIE 5: Extrait depuis le flux RSS (media:content, enclosure, etc.)
 */
export function extractFromRssEntry(entry: {
  media_content?: { url: string }[];
  media_thumbnail?: { url: string }[];
  enclosures?: { url: string; type?: string }[];
  image?: { url: string } | string;
  content?: string;
  summary?: string;
}): string | null {
  // media:content
  if (entry.media_content?.[0]?.url && isValidImageUrl(entry.media_content[0].url)) {
    return entry.media_content[0].url;
  }

  // media:thumbnail
  if (entry.media_thumbnail?.[0]?.url && isValidImageUrl(entry.media_thumbnail[0].url)) {
    return entry.media_thumbnail[0].url;
  }

  // enclosure
  if (entry.enclosures) {
    for (const enc of entry.enclosures) {
      if (enc.type?.startsWith('image') && isValidImageUrl(enc.url)) {
        return enc.url;
      }
    }
  }

  // image directe
  if (entry.image) {
    const imgUrl = typeof entry.image === 'string' ? entry.image : entry.image.url;
    if (isValidImageUrl(imgUrl)) {
      return imgUrl;
    }
  }

  // Cherche dans le contenu HTML
  const htmlContent = entry.content || entry.summary || '';
  const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1] && isValidImageUrl(imgMatch[1])) {
    return imgMatch[1];
  }

  return null;
}

/**
 * Fonction principale: extrait l'image d'un article
 * Essaie toutes les stratégies par ordre de priorité
 */
export async function extractArticleImage(
  articleUrl: string,
  rssEntry?: any
): Promise<ExtractedImage> {
  // D'abord, essaie depuis l'entrée RSS si disponible
  if (rssEntry) {
    const rssImage = extractFromRssEntry(rssEntry);
    if (rssImage) {
      return { url: rssImage, source: 'rss' };
    }
  }

  // Sinon, récupère la page de l'article
  try {
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'MadaSpotBot/1.0 (+https://madaspot.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { url: null, source: null };
    }

    const html = await response.text();

    // STRATÉGIE 1: Open Graph
    const ogImage = extractFromOpenGraph(html);
    if (ogImage) {
      return { url: toAbsoluteUrl(ogImage, articleUrl), source: 'og' };
    }

    // STRATÉGIE 2: Twitter Card
    const twitterImage = extractFromTwitterCard(html);
    if (twitterImage) {
      return { url: toAbsoluteUrl(twitterImage, articleUrl), source: 'twitter' };
    }

    // STRATÉGIE 3: JSON-LD
    const jsonLdImage = extractFromJsonLd(html);
    if (jsonLdImage) {
      return { url: toAbsoluteUrl(jsonLdImage, articleUrl), source: 'json-ld' };
    }

    // STRATÉGIE 4: WordPress spécifique
    const wpImage = extractFromWordPress(html, articleUrl);
    if (wpImage) {
      return { url: wpImage, source: 'wordpress' };
    }

    // STRATÉGIE 5: Analyse DOM générale
    const domImage = extractFromDom(html, articleUrl);
    if (domImage) {
      return { url: domImage, source: 'dom' };
    }

    return { url: null, source: null };

  } catch (error) {
    logger.error(`[ImageExtractor] Error fetching ${articleUrl}:`, error);
    return { url: null, source: null };
  }
}

/**
 * Extrait l'image directement depuis le HTML (sans fetch)
 * Utile quand on a déjà le contenu de la page
 */
export function extractImageFromHtml(html: string, baseUrl: string): ExtractedImage {
  // STRATÉGIE 1: Open Graph
  const ogImage = extractFromOpenGraph(html);
  if (ogImage) {
    return { url: toAbsoluteUrl(ogImage, baseUrl), source: 'og' };
  }

  // STRATÉGIE 2: Twitter Card
  const twitterImage = extractFromTwitterCard(html);
  if (twitterImage) {
    return { url: toAbsoluteUrl(twitterImage, baseUrl), source: 'twitter' };
  }

  // STRATÉGIE 3: JSON-LD
  const jsonLdImage = extractFromJsonLd(html);
  if (jsonLdImage) {
    return { url: toAbsoluteUrl(jsonLdImage, baseUrl), source: 'json-ld' };
  }

  // STRATÉGIE 4: WordPress spécifique
  const wpImage = extractFromWordPress(html, baseUrl);
  if (wpImage) {
    return { url: wpImage, source: 'wordpress' };
  }

  // STRATÉGIE 5: Analyse DOM générale
  const domImage = extractFromDom(html, baseUrl);
  if (domImage) {
    return { url: domImage, source: 'dom' };
  }

  return { url: null, source: null };
}

/**
 * STRATÉGIE FALLBACK: Récupère une vraie image via Pixabay ou Pexels API
 * Ces APIs retournent des URLs d'images statiques et fiables
 */

// Mapping des catégories vers des mots-clés visuels
const categoryKeywords: Record<string, string[]> = {
  'Actualités': ['news', 'newspaper', 'press', 'media'],
  'Politique': ['government', 'politics', 'parliament', 'democracy', 'meeting'],
  'Économie': ['economy', 'business', 'finance', 'money', 'market'],
  'Sport': ['sports', 'football', 'stadium', 'athlete', 'competition'],
  'Culture': ['culture', 'art', 'music', 'theater', 'festival'],
  'Société': ['people', 'community', 'society', 'crowd', 'city'],
  'International': ['world', 'globe', 'international', 'diplomacy'],
  'Faits divers': ['city', 'street', 'urban', 'police'],
  'Environnement': ['nature', 'environment', 'green', 'forest', 'ocean'],
  'Technologie': ['technology', 'computer', 'digital', 'innovation'],
  'Santé': ['health', 'medical', 'hospital', 'doctor'],
  'Éducation': ['education', 'school', 'university', 'learning', 'books'],
};

/**
 * Récupère une image depuis l'API Pixabay
 */
async function fetchPixabayImage(query: string): Promise<string | null> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&min_width=640&per_page=10&safesearch=true`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      logger.info(`[ImageExtractor] Pixabay API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.hits && data.hits.length > 0) {
      // Prendre une image aléatoire parmi les résultats pour éviter les doublons
      const randomIndex = Math.floor(Math.random() * Math.min(data.hits.length, 5));
      const image = data.hits[randomIndex];
      // Utiliser webformatURL (640px) ou largeImageURL (1280px)
      return image.webformatURL || image.largeImageURL;
    }

    return null;
  } catch (error) {
    logger.error('[ImageExtractor] Pixabay fetch error:', error);
    return null;
  }
}

/**
 * Récupère une image depuis l'API Pexels
 */
async function fetchPexelsImage(query: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&size=medium&per_page=10`;

    const response = await fetch(url, {
      headers: {
        'Authorization': apiKey,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      logger.info(`[ImageExtractor] Pexels API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      // Prendre une image aléatoire parmi les résultats
      const randomIndex = Math.floor(Math.random() * Math.min(data.photos.length, 5));
      const photo = data.photos[randomIndex];
      // Utiliser la taille medium (environ 800x600)
      return photo.src?.medium || photo.src?.large;
    }

    return null;
  } catch (error) {
    logger.error('[ImageExtractor] Pexels fetch error:', error);
    return null;
  }
}

// Mots-clés malgaches à traduire en anglais pour la recherche d'images
const malagasyToEnglish: Record<string, string> = {
  'filoha': 'president',
  'governemanta': 'government',
  'mpilalao': 'player',
  'baolina': 'football',
  'sekoly': 'school',
  'hopitaly': 'hospital',
  'vola': 'money',
  'tanana': 'city',
  'trano': 'building',
  'lalana': 'road',
  'rano': 'water',
  'afo': 'fire',
  'polisy': 'police',
  'mpiasam-panjakana': 'official',
  'fivoriana': 'meeting',
  'fitsarana': 'court',
  'fampianarana': 'education',
  'fahasalamana': 'health',
  'toe-karena': 'economy',
  'kolontsaina': 'culture',
};

/**
 * Extrait les mots-clés pertinents d'un titre d'article
 */
function extractKeywordsFromTitle(title: string): string[] {
  const keywords: string[] = [];
  const titleLower = title.toLowerCase();

  // Vérifie les mots malgaches connus
  for (const [malagasy, english] of Object.entries(malagasyToEnglish)) {
    if (titleLower.includes(malagasy)) {
      keywords.push(english);
    }
  }

  // Mots-clés français courants dans les actualités
  const frenchKeywords: Record<string, string> = {
    'président': 'president',
    'ministre': 'minister',
    'gouvernement': 'government',
    'économie': 'economy',
    'économique': 'economy',
    'politique': 'politics',
    'sport': 'sports',
    'football': 'football',
    'basket': 'basketball',
    'santé': 'health',
    'éducation': 'education',
    'école': 'school',
    'université': 'university',
    'environnement': 'environment',
    'cyclone': 'storm',
    'inondation': 'flood',
    'sécheresse': 'drought',
    'agriculture': 'agriculture',
    'riz': 'rice',
    'pêche': 'fishing',
    'tourisme': 'tourism',
    'investissement': 'investment',
    'infrastructure': 'infrastructure',
    'route': 'road',
    'aéroport': 'airport',
    'port': 'port',
    'énergie': 'energy',
    'électricité': 'electricity',
    'justice': 'justice',
    'tribunal': 'court',
    'police': 'police',
    'sécurité': 'security',
    'accident': 'accident',
    'incendie': 'fire',
    'manifestation': 'protest',
    'élection': 'election',
    'vote': 'voting',
    'parlement': 'parliament',
    'assemblée': 'assembly',
    'céremonie': 'ceremony',
    'fête': 'celebration',
    'culture': 'culture',
    'musique': 'music',
    'cinéma': 'cinema',
    'art': 'art',
  };

  for (const [french, english] of Object.entries(frenchKeywords)) {
    if (titleLower.includes(french)) {
      keywords.push(english);
    }
  }

  // Limiter à 3 mots-clés max
  return [...new Set(keywords)].slice(0, 3);
}

/**
 * Génère les mots-clés de recherche pour une image
 */
function buildSearchKeywords(title: string, category: string): string {
  // Extraire les mots-clés du titre
  const titleKeywords = extractKeywordsFromTitle(title);

  // Obtenir les mots-clés de la catégorie
  const catKeywords = categoryKeywords[category] || categoryKeywords['Actualités'];

  // Combiner les mots-clés (priorité au titre)
  let keywords: string[] = [];

  if (titleKeywords.length > 0) {
    keywords = [...titleKeywords, catKeywords[0]];
  } else {
    // Si pas de mots-clés du titre, utiliser ceux de la catégorie
    keywords = catKeywords.slice(0, 2);
  }

  return keywords.join(' ');
}

/**
 * Récupère une vraie image depuis Pixabay ou Pexels basée sur les mots-clés
 * Cette fonction fait des appels API réels et retourne une URL d'image statique
 */
export async function fetchKeywordImage(
  title: string,
  category: string = 'Actualités'
): Promise<string | null> {
  const query = buildSearchKeywords(title, category);
  logger.info(`[ImageExtractor] Searching for: "${query}"`);

  // Essayer Pixabay d'abord (quota illimité)
  let imageUrl = await fetchPixabayImage(query);
  if (imageUrl) {
    logger.info(`[ImageExtractor] Found image on Pixabay for: ${title.substring(0, 40)}...`);
    return imageUrl;
  }

  // Essayer avec juste la catégorie si pas de résultat
  const catKeywords = categoryKeywords[category] || categoryKeywords['Actualités'];
  imageUrl = await fetchPixabayImage(catKeywords[0]);
  if (imageUrl) {
    logger.info(`[ImageExtractor] Found category image on Pixabay for: ${category}`);
    return imageUrl;
  }

  // Fallback Pexels (quota limité mais fiable)
  imageUrl = await fetchPexelsImage(query);
  if (imageUrl) {
    logger.info(`[ImageExtractor] Found image on Pexels for: ${title.substring(0, 40)}...`);
    return imageUrl;
  }

  // Dernier recours: image de news générique
  imageUrl = await fetchPixabayImage('africa news');
  if (imageUrl) {
    logger.info(`[ImageExtractor] Using generic news image`);
    return imageUrl;
  }

  return null;
}

/**
 * DEPRECATED: Génère une URL Unsplash (non fiable - utiliser fetchKeywordImage à la place)
 * Gardé pour compatibilité mais l'API Unsplash Source retourne souvent des 503
 */
export function generateKeywordImageUrl(
  title: string,
  _category: string = 'Actualités',
  width: number = 800,
  height: number = 600
): string {
  // Cette fonction est dépréciée - utiliser fetchKeywordImage() qui retourne des URLs fiables
  // Fallback vers Picsum qui est plus stable que Unsplash Source
  return generatePicsumImageUrl(title, width, height);
}

/**
 * Alternative: Utilise Picsum pour des images aléatoires avec seed basé sur le titre
 * Plus fiable que Unsplash Source qui peut être lent
 */
export function generatePicsumImageUrl(
  title: string,
  width: number = 800,
  height: number = 600
): string {
  // Créer un hash simple du titre pour avoir une image cohérente
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const seed = Math.abs(hash);

  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

export default extractArticleImage;
