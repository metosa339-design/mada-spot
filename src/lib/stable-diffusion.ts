import logger from '@/lib/logger';
/**
 * Service Stable Diffusion / Flux unifié
 *
 * Supporte plusieurs backends:
 * 1. REPLICATE - Flux & Stable Diffusion via API cloud (recommandé)
 * 2. STABILITY - Stable Diffusion officiel via API
 * 3. LOCAL - Automatic1111 local si installé
 *
 * Mode img2img: Transforme une vraie image en gardant la composition
 * tout en la rendant unique (changement de style, couleurs, etc.)
 */

export interface SDConfig {
  backend: 'replicate' | 'stability' | 'local';
  model?: string;
}

export interface Img2ImgOptions {
  // Image source
  imageUrl: string;

  // Prompt décrivant l'image souhaitée
  prompt: string;

  // Prompt négatif (ce qu'on ne veut pas)
  negativePrompt?: string;

  // Force de transformation (0.0 = identique, 1.0 = complètement nouveau)
  // Pour garder les visages reconnaissables, utiliser 0.15-0.35
  strength?: number;

  // Dimensions de sortie
  width?: number;
  height?: number;

  // Nombre d'étapes (plus = meilleure qualité mais plus lent)
  steps?: number;

  // Guidance scale (plus haut = suit plus le prompt)
  guidanceScale?: number;

  // Seed pour reproductibilité
  seed?: number;
}

export interface SDResult {
  success: boolean;
  imageUrl?: string;
  backend: string;
  model?: string;
  processingTime?: number;
  error?: string;
}

/**
 * Transforme une image avec Replicate (Flux ou SDXL)
 */
export async function replicateImg2Img(options: Img2ImgOptions): Promise<SDResult> {
  const startTime = Date.now();
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    return {
      success: false,
      backend: 'replicate',
      error: 'REPLICATE_API_TOKEN non configuré. Obtenez une clé sur https://replicate.com/account/api-tokens'
    };
  }

  try {
    // Utiliser Flux Dev pour img2img (meilleure qualité)
    // Alternative: stability-ai/sdxl pour SDXL
    const modelVersion = 'black-forest-labs/flux-dev';

    logger.info(`[SD] Replicate img2img: strength=${options.strength || 0.25}`);

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: modelVersion,
        input: {
          image: options.imageUrl,
          prompt: options.prompt,
          num_outputs: 1,
          guidance: options.guidanceScale || 3.5,
          num_inference_steps: options.steps || 28,
          output_format: 'jpg',
          output_quality: 90,
          prompt_strength: options.strength || 0.25, // Garder 75% de l'original
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error('[SD] Replicate API error:', response.status, errorData);
      return {
        success: false,
        backend: 'replicate',
        error: `API error: ${response.status}`
      };
    }

    const prediction = await response.json();

    // Polling pour attendre le résultat
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 60; // 60 secondes max

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pollResponse = await fetch(result.urls.get, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (pollResponse.ok) {
        result = await pollResponse.json();
      }
      attempts++;
    }

    if (result.status === 'succeeded' && result.output) {
      const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      return {
        success: true,
        imageUrl: outputUrl,
        backend: 'replicate',
        model: 'flux-dev',
        processingTime: Date.now() - startTime
      };
    }

    return {
      success: false,
      backend: 'replicate',
      error: result.error || 'Processing failed'
    };

  } catch (error) {
    logger.error('[SD] Replicate error:', error);
    return {
      success: false,
      backend: 'replicate',
      error: (error as Error).message
    };
  }
}

/**
 * Transforme une image avec Stability AI (SDXL officiel)
 */
export async function stabilityImg2Img(options: Img2ImgOptions): Promise<SDResult> {
  const startTime = Date.now();
  const apiKey = process.env.STABILITY_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      backend: 'stability',
      error: 'STABILITY_API_KEY non configuré. Obtenez une clé sur https://platform.stability.ai/account/keys'
    };
  }

  try {
    // Télécharger l'image source
    const imageResponse = await fetch(options.imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch source image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    logger.info(`[SD] Stability img2img: strength=${options.strength || 0.25}`);

    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [
            { text: options.prompt, weight: 1 },
            { text: options.negativePrompt || 'blurry, low quality, distorted, ugly, deformed', weight: -1 }
          ],
          init_image: base64Image,
          init_image_mode: 'IMAGE_STRENGTH',
          image_strength: 1 - (options.strength || 0.25), // Stability utilise l'inverse
          cfg_scale: options.guidanceScale || 7,
          samples: 1,
          steps: options.steps || 30,
          style_preset: 'photographic',
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      logger.error('[SD] Stability API error:', response.status, errorData);
      return {
        success: false,
        backend: 'stability',
        error: `API error: ${response.status}`
      };
    }

    const result = await response.json();

    if (result.artifacts?.[0]?.base64) {
      // Retourner comme data URL
      const dataUrl = `data:image/png;base64,${result.artifacts[0].base64}`;
      return {
        success: true,
        imageUrl: dataUrl,
        backend: 'stability',
        model: 'sdxl-1.0',
        processingTime: Date.now() - startTime
      };
    }

    return {
      success: false,
      backend: 'stability',
      error: 'No image generated'
    };

  } catch (error) {
    logger.error('[SD] Stability error:', error);
    return {
      success: false,
      backend: 'stability',
      error: (error as Error).message
    };
  }
}

/**
 * Transforme une image avec Automatic1111 local
 * Nécessite que le serveur soit lancé avec --api
 */
export async function localImg2Img(options: Img2ImgOptions): Promise<SDResult> {
  const startTime = Date.now();
  const localUrl = process.env.SD_LOCAL_URL || 'http://127.0.0.1:7860';

  try {
    // Vérifier si le serveur local est disponible
    const healthCheck = await fetch(`${localUrl}/sdapi/v1/sd-models`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!healthCheck.ok) {
      return {
        success: false,
        backend: 'local',
        error: 'Serveur Automatic1111 non disponible. Lancez-le avec: webui.bat --api'
      };
    }

    // Télécharger l'image source et convertir en base64
    const imageResponse = await fetch(options.imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    logger.info(`[SD] Local img2img: strength=${options.strength || 0.25}`);

    const response = await fetch(`${localUrl}/sdapi/v1/img2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        init_images: [base64Image],
        prompt: options.prompt,
        negative_prompt: options.negativePrompt || 'blurry, low quality, distorted, ugly',
        denoising_strength: options.strength || 0.25,
        width: options.width || 1024,
        height: options.height || 576,
        steps: options.steps || 25,
        cfg_scale: options.guidanceScale || 7,
        seed: options.seed || -1,
        sampler_name: 'DPM++ 2M Karras',
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        backend: 'local',
        error: `Local API error: ${response.status}`
      };
    }

    const result = await response.json();

    if (result.images?.[0]) {
      const dataUrl = `data:image/png;base64,${result.images[0]}`;
      return {
        success: true,
        imageUrl: dataUrl,
        backend: 'local',
        model: 'local-sdxl',
        processingTime: Date.now() - startTime
      };
    }

    return {
      success: false,
      backend: 'local',
      error: 'No image generated'
    };

  } catch (error) {
    logger.error('[SD] Local error:', error);
    return {
      success: false,
      backend: 'local',
      error: (error as Error).message
    };
  }
}

/**
 * Construit un prompt optimisé pour la transformation d'images news
 */
export function buildNewsPrompt(_title: string, category: string): {
  prompt: string;
  negativePrompt: string;
} {
  const categoryStyles: Record<string, string> = {
    'Politique': 'professional political photograph, government officials, formal attire, conference room',
    'Économie': 'professional business photograph, corporate setting, modern office',
    'Sport': 'dynamic sports photograph, athletic action, stadium lighting',
    'Culture': 'vibrant cultural photograph, traditional elements, celebration',
    'Société': 'documentary photograph, community gathering, urban setting',
    'International': 'diplomatic photograph, international setting, formal',
    'Santé': 'medical photograph, healthcare setting, professional',
    'Éducation': 'educational photograph, academic setting, bright',
    'Actualités': 'professional news photograph, journalistic style, editorial quality',
  };

  const style = categoryStyles[category] || categoryStyles['Actualités'];

  return {
    prompt: `${style}, Madagascar Africa, high resolution, natural lighting, sharp focus, realistic, photojournalistic, editorial quality photograph`,
    negativePrompt: 'blurry, low quality, distorted, ugly, deformed faces, bad anatomy, watermark, text overlay, cartoon, anime, illustration, painting, drawing, sketch'
  };
}

/**
 * Fonction principale: Transforme une image avec le meilleur backend disponible
 * Essaie dans l'ordre: Local > Replicate > Stability > Fallback
 */
export async function transformImageWithSD(
  imageUrl: string,
  title: string,
  category: string,
  options: {
    strength?: number;
    preferredBackend?: 'local' | 'replicate' | 'stability' | 'auto';
  } = {}
): Promise<SDResult> {
  const { prompt, negativePrompt } = buildNewsPrompt(title, category);
  const strength = options.strength || 0.2; // Par défaut très faible pour garder les visages

  const img2imgOptions: Img2ImgOptions = {
    imageUrl,
    prompt,
    negativePrompt,
    strength,
    width: 1024,
    height: 576,
    steps: 25,
    guidanceScale: 7,
  };

  const preferredBackend = options.preferredBackend ||
    (process.env.IMAGE_TRANSFORM_MODE as 'local' | 'replicate' | 'stability') || 'auto';

  // Si un backend spécifique est demandé
  if (preferredBackend !== 'auto') {
    switch (preferredBackend) {
      case 'local':
        return localImg2Img(img2imgOptions);
      case 'replicate':
        return replicateImg2Img(img2imgOptions);
      case 'stability':
        return stabilityImg2Img(img2imgOptions);
    }
  }

  // Mode auto: essayer dans l'ordre de préférence
  logger.info('[SD] Auto mode: trying backends in order...');

  // 1. Essayer local d'abord (gratuit et rapide si disponible)
  const localResult = await localImg2Img(img2imgOptions);
  if (localResult.success) {
    logger.info('[SD] Using local backend');
    return localResult;
  }

  // 2. Essayer Replicate (Flux)
  if (process.env.REPLICATE_API_TOKEN) {
    const replicateResult = await replicateImg2Img(img2imgOptions);
    if (replicateResult.success) {
      logger.info('[SD] Using Replicate backend');
      return replicateResult;
    }
  }

  // 3. Essayer Stability
  if (process.env.STABILITY_API_KEY) {
    const stabilityResult = await stabilityImg2Img(img2imgOptions);
    if (stabilityResult.success) {
      logger.info('[SD] Using Stability backend');
      return stabilityResult;
    }
  }

  // 4. Aucun backend disponible
  return {
    success: false,
    backend: 'none',
    error: 'Aucun backend SD disponible. Configurez REPLICATE_API_TOKEN ou STABILITY_API_KEY, ou lancez Automatic1111 localement.'
  };
}

export default transformImageWithSD;
