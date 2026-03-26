/**
 * Service de transformation d'images UNIFIÉ
 * Utilise plusieurs stratégies pour créer des images uniques à partir de vraies photos:
 *
 * 1. PROXY SIMPLE: Applique des filtres (saturation, contraste, watermark) - GRATUIT & RAPIDE
 * 2. SD/FLUX: Transformation IA haute qualité via Replicate/Stability - PREMIUM
 *
 * Configuration via .env IMAGE_TRANSFORM_MODE:
 * - "proxy" (défaut): Transformation rapide via Sharp
 * - "replicate": Flux/SDXL via Replicate API
 * - "stability": SDXL via Stability AI
 * - "auto": Essaie SD puis fallback sur proxy
 *
 * L'objectif: Garder l'essence de l'image (vraies personnes, vrais événements)
 * tout en la rendant techniquement unique et attribuée.
 */

import { transformImageWithSD } from './stable-diffusion';
import logger from '@/lib/logger';

export interface TransformOptions {
  mode: 'proxy' | 'flux' | 'stability';
  style?: 'news' | 'vibrant' | 'muted' | 'artistic' | 'painting';
  strength?: number; // 0.1 à 0.9 - plus bas = plus fidèle à l'original
  width?: number;
  height?: number;
  source?: string; // Nom de la source pour attribution
}

export interface TransformResult {
  url: string;
  method: 'proxy' | 'flux' | 'stability' | 'original';
  processingTime?: number;
  error?: string;
}

/**
 * Transforme une image via le proxy local
 * Rapide, gratuit, ajoute watermark et légers ajustements
 */
export function getProxyImageUrl(
  originalUrl: string,
  source: string,
  options: { width?: number; height?: number; style?: string } = {}
): string {
  const params = new URLSearchParams({
    url: originalUrl,
    source: source,
    w: String(options.width || 800),
    style: options.style || 'news',
  });

  if (options.height) {
    params.set('h', String(options.height));
  }

  return `/api/image-proxy?${params.toString()}`;
}

/**
 * Transforme une image avec Flux AI (img2img)
 * Crée une version similaire mais générée par IA
 */
export async function transformWithFlux(
  imageUrl: string,
  prompt: string,
  options: {
    strength?: number;
    width?: number;
    height?: number;
  } = {}
): Promise<TransformResult> {
  const startTime = Date.now();
  const replicateToken = process.env.REPLICATE_API_TOKEN;

  if (!replicateToken) {
    logger.info('[ImageTransformer] No REPLICATE_API_TOKEN, falling back to proxy');
    return {
      url: imageUrl,
      method: 'original',
      error: 'REPLICATE_API_TOKEN not configured',
    };
  }

  try {
    // Flux img2img via Replicate
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Flux Schnell (rapide) ou Flux Dev (qualité)
        version: 'black-forest-labs/flux-schnell',
        input: {
          image: imageUrl,
          prompt: prompt,
          num_outputs: 1,
          guidance_scale: 3.5,
          num_inference_steps: 4,
          output_format: 'jpg',
          output_quality: 90,
          // Pour img2img, on garde une partie de l'original
          prompt_strength: options.strength || 0.3, // 0.3 = 70% de l'original conservé
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[ImageTransformer] Replicate error:', errorText);
      return {
        url: imageUrl,
        method: 'original',
        error: `Replicate API error: ${response.status}`,
      };
    }

    const prediction = await response.json();

    // Attendre que la prédiction soit terminée (polling)
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 30; // 30 secondes max

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch(result.urls.get, {
        headers: {
          'Authorization': `Token ${replicateToken}`,
        },
      });

      result = await statusResponse.json();
      attempts++;
    }

    if (result.status === 'succeeded' && result.output?.[0]) {
      return {
        url: result.output[0],
        method: 'flux',
        processingTime: Date.now() - startTime,
      };
    }

    logger.error('[ImageTransformer] Flux failed:', result.error);
    return {
      url: imageUrl,
      method: 'original',
      error: result.error || 'Processing failed',
    };

  } catch (error) {
    logger.error('[ImageTransformer] Flux error:', error);
    return {
      url: imageUrl,
      method: 'original',
      error: (error as Error).message,
    };
  }
}

/**
 * Transforme une image avec Stability AI (img2img)
 * Alternative à Flux, parfois meilleur pour certains styles
 */
export async function transformWithStability(
  imageUrl: string,
  prompt: string,
  options: {
    strength?: number;
    style?: 'photographic' | 'cinematic' | 'enhance';
  } = {}
): Promise<TransformResult> {
  const startTime = Date.now();
  const stabilityKey = process.env.STABILITY_API_KEY;

  if (!stabilityKey) {
    logger.info('[ImageTransformer] No STABILITY_API_KEY, falling back to original');
    return {
      url: imageUrl,
      method: 'original',
      error: 'STABILITY_API_KEY not configured',
    };
  }

  try {
    // Télécharger l'image d'abord
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stabilityKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: prompt,
            weight: 1,
          },
          {
            text: 'blurry, low quality, distorted, ugly',
            weight: -1,
          },
        ],
        init_image: base64Image,
        init_image_mode: 'IMAGE_STRENGTH',
        image_strength: 1 - (options.strength || 0.3), // Stability utilise l'inverse
        cfg_scale: 7,
        samples: 1,
        steps: 30,
        style_preset: options.style || 'photographic',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[ImageTransformer] Stability error:', errorText);
      return {
        url: imageUrl,
        method: 'original',
        error: `Stability API error: ${response.status}`,
      };
    }

    const result = await response.json();

    if (result.artifacts?.[0]?.base64) {
      // Convertir en data URL ou uploader quelque part
      // Pour l'instant, on retourne une data URL
      const dataUrl = `data:image/png;base64,${result.artifacts[0].base64}`;
      return {
        url: dataUrl,
        method: 'stability',
        processingTime: Date.now() - startTime,
      };
    }

    return {
      url: imageUrl,
      method: 'original',
      error: 'No image generated',
    };

  } catch (error) {
    logger.error('[ImageTransformer] Stability error:', error);
    return {
      url: imageUrl,
      method: 'original',
      error: (error as Error).message,
    };
  }
}

/**
 * Construit un prompt pour la transformation img2img
 * Le prompt doit décrire l'image de manière à la préserver
 */
export function buildTransformPrompt(
  _title: string,
  category: string,
  options: { style?: string } = {}
): string {
  const style = options.style || 'news';

  // Base: description réaliste pour préserver le contenu
  const basePrompts: Record<string, string> = {
    news: 'Professional news photograph, realistic, high quality, sharp focus, natural lighting',
    vibrant: 'Vibrant professional photograph, vivid colors, high contrast, dynamic',
    muted: 'Soft muted photograph, pastel tones, gentle lighting, professional',
    artistic: 'Artistic photograph, cinematic lighting, dramatic composition, editorial',
    painting: 'Oil painting style, artistic interpretation, painterly brushstrokes',
  };

  // Ajouter le contexte de la catégorie
  const categoryContext: Record<string, string> = {
    'Politique': 'political event, government officials, formal setting',
    'Économie': 'business, economic, professional setting',
    'Sport': 'sports event, athletic, dynamic action',
    'Culture': 'cultural event, traditional, artistic',
    'Société': 'social event, community, people',
    'International': 'international event, diplomatic',
    'Santé': 'healthcare, medical setting',
    'Éducation': 'educational setting, academic',
  };

  const context = categoryContext[category] || 'news event';

  return `${basePrompts[style] || basePrompts.news}, ${context}, Madagascar, African setting`;
}

/**
 * Transforme une image en utilisant la meilleure méthode disponible
 */
export async function transformImage(
  imageUrl: string,
  title: string,
  category: string,
  source: string,
  options: TransformOptions = { mode: 'proxy' }
): Promise<TransformResult> {
  const startTime = Date.now();

  // Mode proxy: transformation locale rapide
  if (options.mode === 'proxy') {
    const proxyUrl = getProxyImageUrl(imageUrl, source, {
      width: options.width || 800,
      height: options.height,
      style: options.style,
    });

    return {
      url: proxyUrl,
      method: 'proxy',
      processingTime: Date.now() - startTime,
    };
  }

  // Mode Flux: transformation AI
  if (options.mode === 'flux') {
    const prompt = buildTransformPrompt(title, category, { style: options.style });
    return transformWithFlux(imageUrl, prompt, {
      strength: options.strength || 0.25, // Par défaut, garder 75% de l'original
      width: options.width,
      height: options.height,
    });
  }

  // Mode Stability: alternative AI
  if (options.mode === 'stability') {
    const prompt = buildTransformPrompt(title, category, { style: options.style });
    return transformWithStability(imageUrl, prompt, {
      strength: options.strength || 0.25,
      style: 'photographic',
    });
  }

  // Fallback: retourner l'original
  return {
    url: imageUrl,
    method: 'original',
  };
}

/**
 * Transformation automatique basée sur la configuration .env
 * Utilise IMAGE_TRANSFORM_MODE pour déterminer le backend
 */
export async function autoTransformImage(
  imageUrl: string,
  title: string,
  category: string,
  source: string,
  options: { strength?: number; width?: number; height?: number } = {}
): Promise<TransformResult> {
  const configuredMode = process.env.IMAGE_TRANSFORM_MODE || 'proxy';
  const startTime = Date.now();

  logger.info(`[ImageTransformer] Auto transform mode: ${configuredMode}`);

  // Mode proxy: toujours disponible, gratuit et rapide
  if (configuredMode === 'proxy') {
    const proxyUrl = getProxyImageUrl(imageUrl, source, {
      width: options.width || 1200,
      style: 'news',
    });
    return {
      url: proxyUrl,
      method: 'proxy',
      processingTime: Date.now() - startTime,
    };
  }

  // Modes SD (replicate, stability, auto)
  if (['replicate', 'stability', 'auto', 'sd'].includes(configuredMode)) {
    const sdResult = await transformImageWithSD(imageUrl, title, category, {
      strength: options.strength || 0.2,
      preferredBackend: configuredMode === 'auto' || configuredMode === 'sd'
        ? 'auto'
        : configuredMode as 'replicate' | 'stability',
    });

    if (sdResult.success && sdResult.imageUrl) {
      return {
        url: sdResult.imageUrl,
        method: sdResult.backend as 'flux' | 'stability',
        processingTime: sdResult.processingTime,
      };
    }

    // SD a échoué, fallback sur proxy
    logger.info(`[ImageTransformer] SD failed (${sdResult.error}), falling back to proxy`);
    const proxyUrl = getProxyImageUrl(imageUrl, source, {
      width: options.width || 1200,
      style: 'news',
    });
    return {
      url: proxyUrl,
      method: 'proxy',
      processingTime: Date.now() - startTime,
      error: `SD fallback: ${sdResult.error}`,
    };
  }

  // Mode inconnu, utiliser proxy
  const proxyUrl = getProxyImageUrl(imageUrl, source, {
    width: options.width || 1200,
    style: 'news',
  });
  return {
    url: proxyUrl,
    method: 'proxy',
    processingTime: Date.now() - startTime,
  };
}

export default transformImage;
