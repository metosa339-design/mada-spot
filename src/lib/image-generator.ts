/**
 * Générateur d'images pour les articles
 * STRATÉGIE:
 * 1. Extraire la vraie image de la source (vraies personnes, vrais événements)
 * 2. Transformer via notre proxy (watermark, légers ajustements)
 * 3. Fallback vers Pollinations.ai si extraction échoue
 *
 * Cela permet d'avoir de VRAIES images avec de VRAIES personnes
 * tout en les rendant uniques à notre plateforme.
 */

import { extractArticleImage } from './image-extractor';
import { autoTransformImage } from './image-transformer';
import logger from '@/lib/logger';

// Contextes visuels détaillés par catégorie
const categoryVisualContext: Record<string, {
  scene: string;
  subjects: string[];
  setting: string;
  style: string;
}> = {
  'Politique': {
    scene: 'political press conference, government meeting',
    subjects: ['politicians in suits', 'government officials', 'diplomatic gathering'],
    setting: 'formal government building interior, conference room with flags',
    style: 'professional news photography, formal atmosphere'
  },
  'Économie': {
    scene: 'business meeting, financial district',
    subjects: ['business professionals', 'executives in meeting', 'traders at work'],
    setting: 'modern office building, stock exchange, bank interior',
    style: 'corporate photography, professional lighting'
  },
  'Sport': {
    scene: 'athletic competition, sports event',
    subjects: ['athletes in action', 'soccer players', 'basketball game', 'sports celebration'],
    setting: 'stadium, sports arena, playing field with crowd',
    style: 'dynamic sports photography, action shot, high energy'
  },
  'Culture': {
    scene: 'cultural festival, traditional celebration',
    subjects: ['performers in traditional dress', 'musicians', 'artists', 'dancers'],
    setting: 'outdoor festival, museum, theater, cultural venue',
    style: 'vibrant colors, cultural celebration, artistic'
  },
  'Société': {
    scene: 'community gathering, urban street life',
    subjects: ['diverse group of people', 'families', 'community members'],
    setting: 'city street, neighborhood, public space, market',
    style: 'documentary photography, candid street photography'
  },
  'International': {
    scene: 'diplomatic summit, international conference',
    subjects: ['world leaders', 'diplomats', 'international delegates'],
    setting: 'UN building, conference hall, diplomatic venue',
    style: 'formal diplomatic photography, global news'
  },
  'Santé': {
    scene: 'healthcare facility, medical care',
    subjects: ['doctors', 'nurses', 'medical staff', 'healthcare workers'],
    setting: 'hospital corridor, clinic, medical facility',
    style: 'clean medical photography, professional healthcare'
  },
  'Technologie': {
    scene: 'tech innovation, digital workspace',
    subjects: ['tech professionals', 'engineers', 'developers at computers'],
    setting: 'modern tech office, data center, innovation lab',
    style: 'modern tech photography, blue lighting, futuristic'
  },
  'Environnement': {
    scene: 'nature conservation, environmental scene',
    subjects: ['wildlife', 'conservationists', 'natural landscapes'],
    setting: 'tropical forest, wildlife reserve, natural habitat Madagascar',
    style: 'nature photography, environmental documentary'
  },
  'Éducation': {
    scene: 'educational setting, learning environment',
    subjects: ['students', 'teachers', 'graduates', 'classroom'],
    setting: 'university campus, school classroom, library',
    style: 'educational photography, bright academic setting'
  },
  'Faits divers': {
    scene: 'urban news scene, city event',
    subjects: ['city residents', 'urban scene', 'street activity'],
    setting: 'city street, urban environment, neighborhood',
    style: 'news photography, documentary style'
  },
  'Actualités': {
    scene: 'news event, press briefing',
    subjects: ['journalists', 'news reporters', 'press conference'],
    setting: 'press room, news studio, public event',
    style: 'professional news photography, journalistic'
  },
};

// Dictionnaire français -> anglais pour les mots-clés visuels
const frenchToEnglishVisual: Record<string, string> = {
  // Personnes et rôles
  'président': 'president official leader',
  'présidente': 'female president leader',
  'ministre': 'minister government official',
  'premier ministre': 'prime minister',
  'député': 'congressman politician',
  'maire': 'mayor city official',
  'ambassadeur': 'ambassador diplomat',
  'directeur': 'director executive',
  'chef': 'leader chief',
  'joueur': 'player athlete',
  'équipe': 'team sports group',
  'médecin': 'doctor physician',
  'professeur': 'professor teacher',
  'étudiant': 'student university',
  'policier': 'police officer',
  'militaire': 'soldier military',
  'artiste': 'artist performer',
  'musicien': 'musician performer',

  // Lieux
  'palais': 'palace government building',
  'assemblée': 'parliament assembly hall',
  'tribunal': 'courthouse justice',
  'hôpital': 'hospital medical center',
  'école': 'school education',
  'université': 'university campus',
  'stade': 'stadium sports arena',
  'marché': 'market marketplace',
  'port': 'harbor port',
  'aéroport': 'airport terminal',
  'route': 'road highway',
  'village': 'village rural',
  'ville': 'city urban',

  // Actions et événements
  'réunion': 'meeting conference',
  'conférence': 'press conference',
  'cérémonie': 'ceremony official event',
  'inauguration': 'inauguration opening ceremony',
  'élection': 'election voting polls',
  'manifestation': 'protest demonstration',
  'match': 'sports match game',
  'compétition': 'competition tournament',
  'festival': 'festival celebration',
  'concert': 'concert performance',
  'accident': 'accident scene emergency',
  'incendie': 'fire emergency',
  'inondation': 'flood disaster',
  'cyclone': 'cyclone storm tropical',

  // Madagascar spécifique
  'madagascar': 'Madagascar island Africa tropical',
  'malgache': 'Malagasy Madagascar',
  'antananarivo': 'Antananarivo capital city Madagascar',
  'tana': 'Antananarivo city',
  'toamasina': 'Toamasina port city coast',
  'fianarantsoa': 'Fianarantsoa highlands',
  'mahajanga': 'Mahajanga coast city',
  'diego': 'Diego Suarez northern Madagascar',
  'nosy be': 'Nosy Be island beach tropical',
  'barea': 'Barea Madagascar national football team',
  'ariary': 'Ariary currency money',
  'vanille': 'vanilla spice plantation',
  'riz': 'rice paddy fields farming',
  'zébu': 'zebu cattle livestock',
  'lémurien': 'lemur wildlife Madagascar',
  'baobab': 'baobab tree landscape',
};

// Mots à ignorer
const stopWords = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'à', 'au', 'aux',
  'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi',
  'ce', 'cet', 'cette', 'ces', 'mon', 'ton', 'son', 'notre', 'votre', 'leur',
  'dans', 'sur', 'sous', 'avec', 'sans', 'pour', 'par', 'en', 'vers',
  'est', 'sont', 'était', 'sera', 'été', 'avoir', 'fait', 'faire', 'être',
  'plus', 'moins', 'très', 'aussi', 'bien', 'tout', 'tous', 'toute',
]);

/**
 * Extrait les mots-clés visuels du titre
 */
function extractVisualKeywords(title: string, summary?: string): string[] {
  const text = `${title} ${summary || ''}`.toLowerCase();
  const keywords: string[] = [];
  const seen = new Set<string>();

  // Chercher les expressions et mots dans le dictionnaire
  for (const [french, english] of Object.entries(frenchToEnglishVisual)) {
    if (text.includes(french) && !seen.has(english)) {
      keywords.push(english);
      seen.add(english);
    }
  }

  // Si peu de mots-clés trouvés, extraire des mots significatifs
  if (keywords.length < 3) {
    const words = text.split(/[\s,.:;!?'"()\[\]{}]+/).filter(w => w.length > 4);
    for (const word of words) {
      const clean = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!stopWords.has(clean) && !seen.has(clean)) {
        keywords.push(clean);
        seen.add(clean);
      }
    }
  }

  return keywords.slice(0, 5);
}

/**
 * Construit un prompt détaillé pour Pollinations basé sur le contenu de l'article
 */
function buildDetailedPrompt(title: string, category: string, summary?: string): string {
  const context = categoryVisualContext[category] || categoryVisualContext['Actualités'];
  const keywords = extractVisualKeywords(title, summary);

  // Sélectionner un sujet aléatoire de la catégorie
  const subject = context.subjects[Math.floor(Math.random() * context.subjects.length)];

  // Construire le prompt
  const parts = [
    'Ultra realistic professional news photograph',
    context.scene,
    subject,
    context.setting,
    keywords.length > 0 ? `featuring ${keywords.slice(0, 3).join(', ')}` : '',
    'Madagascar Africa',
    context.style,
    'high resolution, natural lighting, editorial quality, photojournalistic, 16:9 aspect ratio',
    'shot with professional DSLR camera, sharp focus, realistic skin tones, authentic scene'
  ];

  return parts.filter(p => p).join(', ');
}

/**
 * Génère une image avec Pollinations.ai (100% gratuit, sans API key)
 */
export async function generatePollinationsImage(
  title: string,
  category: string,
  summary?: string
): Promise<string | null> {
  try {
    const prompt = buildDetailedPrompt(title, category, summary);
    logger.info(`[ImageGen] Prompt: "${prompt.substring(0, 100)}..."`);

    const encodedPrompt = encodeURIComponent(prompt);
    const width = 1200;
    const height = 675;
    const seed = Math.floor(Math.random() * 1000000);

    // URL Pollinations.ai - génère l'image à la volée
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    // Vérifier que l'URL est accessible
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(20000),
    });

    if (response.ok) {
      logger.info(`[ImageGen] Generated image for: "${title.substring(0, 40)}..."`);
      return imageUrl;
    }

    logger.info(`[ImageGen] Pollinations returned status: ${response.status}`);
    return null;
  } catch (error) {
    logger.error('[ImageGen] Pollinations error:', error);
    return null;
  }
}

/**
 * Fallback: Récupère une image depuis Pixabay
 */
async function fetchPixabayImage(query: string): Promise<string | null> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&min_width=1000&per_page=15&safesearch=true`;

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;

    const data = await response.json();
    if (data.hits && data.hits.length > 0) {
      const sorted = data.hits.sort((a: any, b: any) => b.views - a.views);
      const idx = Math.floor(Math.random() * Math.min(sorted.length, 8));
      return sorted[idx].largeImageURL || sorted[idx].webformatURL;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fallback: Récupère une image depuis Pexels
 */
async function fetchPexelsImage(query: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=15`;

    const response = await fetch(url, {
      headers: { 'Authorization': apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      const idx = Math.floor(Math.random() * Math.min(data.photos.length, 8));
      return data.photos[idx].src?.large2x || data.photos[idx].src?.large;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fonction principale: récupère une image pour un article
 * PRIORITÉ 1: Extraire la vraie image depuis l'article source (Open Graph, Twitter, etc.)
 * PRIORITÉ 2: Générer avec Pollinations AI si extraction échoue
 * PRIORITÉ 3: Fallback vers Pixabay/Pexels
 */
export async function generateArticleImage(
  title: string,
  category: string,
  summary?: string,
  sourceUrl?: string,
  rssEntry?: any
): Promise<{
  url: string | null;
  source: 'extracted' | 'ai' | 'pixabay' | 'pexels' | null;
  extractionMethod?: 'og' | 'twitter' | 'json-ld' | 'wordpress' | 'dom' | 'rss' | null;
  originalSource?: string;
}> {

  logger.info(`[ImageGen] Processing: "${title.substring(0, 50)}..."`);

  // PRIORITÉ 1: Extraire la vraie image depuis la source
  if (sourceUrl) {
    logger.info(`[ImageGen] Trying to extract real image from: ${sourceUrl}`);
    try {
      const extracted = await extractArticleImage(sourceUrl, rssEntry);
      if (extracted.url) {
        logger.info(`[ImageGen] ✓ Extracted real image via ${extracted.source}: ${extracted.url.substring(0, 80)}...`);

        // Extraire le nom de domaine pour l'attribution
        let originalSource = '';
        try {
          const urlObj = new URL(sourceUrl);
          originalSource = urlObj.hostname.replace('www.', '');
        } catch {
          originalSource = 'source';
        }

        // TRANSFORMER l'image via SD/Flux ou proxy
        // Mode auto: essaie SD/Flux d'abord, puis fallback sur proxy
        const transformResult = await autoTransformImage(
          extracted.url,
          title,
          category,
          originalSource,
          { strength: 0.25, width: 1200 } // 25% de transformation = garde 75% de l'original
        );

        logger.info(`[ImageGen] ✓ Transformed via ${transformResult.method}: ${transformResult.url.substring(0, 60)}...`);

        return {
          url: transformResult.url,
          source: 'extracted',
          extractionMethod: extracted.source,
          originalSource
        };
      }
    } catch (error) {
      logger.info(`[ImageGen] Extraction failed: ${error}`);
    }
  }

  // PRIORITÉ 2: Générer avec Pollinations AI
  logger.info(`[ImageGen] Falling back to AI generation...`);
  const aiImage = await generatePollinationsImage(title, category, summary);
  if (aiImage) {
    return { url: aiImage, source: 'ai' };
  }

  // PRIORITÉ 3: Fallback Pixabay
  const keywords = extractVisualKeywords(title, summary);
  const searchQuery = keywords.length > 0 ? keywords.slice(0, 2).join(' ') : category;

  const pixabayImage = await fetchPixabayImage(searchQuery);
  if (pixabayImage) {
    return { url: pixabayImage, source: 'pixabay' };
  }

  // PRIORITÉ 4: Fallback Pexels
  const pexelsImage = await fetchPexelsImage(searchQuery);
  if (pexelsImage) {
    return { url: pexelsImage, source: 'pexels' };
  }

  // Dernier recours
  const fallbackImage = await fetchPixabayImage('Madagascar Africa news');
  if (fallbackImage) {
    return { url: fallbackImage, source: 'pixabay' };
  }

  return { url: null, source: null };
}

export default generateArticleImage;
