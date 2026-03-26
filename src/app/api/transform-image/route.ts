import { NextRequest, NextResponse } from 'next/server';
import { transformImageWithSD } from '@/lib/stable-diffusion';
import { getProxyImageUrl } from '@/lib/image-transformer';

import { logger } from '@/lib/logger';
/**
 * API de transformation d'images
 *
 * Modes disponibles:
 * - "proxy": Transformation rapide via Sharp (watermark, filtres) - GRATUIT
 * - "sd": Transformation IA via Stable Diffusion/Flux - HAUTE QUALITÉ
 * - "auto": Essaie SD puis fallback sur proxy
 *
 * Usage:
 * POST /api/transform-image
 * {
 *   "imageUrl": "https://example.com/image.jpg",
 *   "title": "Titre de l'article",
 *   "category": "Politique",
 *   "source": "2424.mg",
 *   "mode": "proxy" | "sd" | "auto",
 *   "strength": 0.2  // Pour SD: 0.1-0.4 garde les visages reconnaissables
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
    const {
      imageUrl,
      title = 'Article',
      category = 'Actualités',
      source = 'Source',
      mode = 'proxy',
      strength = 0.2
    } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Mode proxy: transformation rapide via Sharp
    if (mode === 'proxy') {
      const proxyUrl = getProxyImageUrl(imageUrl, source, {
        width: 1200,
        style: 'news'
      });

      return NextResponse.json({
        success: true,
        mode: 'proxy',
        originalUrl: imageUrl,
        transformedUrl: proxyUrl,
        processingTime: Date.now() - startTime,
        info: 'Image transformée via proxy (watermark + filtres)'
      });
    }

    // Mode SD: transformation IA haute qualité
    if (mode === 'sd') {
      const result = await transformImageWithSD(imageUrl, title, category, {
        strength,
        preferredBackend: 'auto'
      });

      if (result.success && result.imageUrl) {
        return NextResponse.json({
          success: true,
          mode: 'sd',
          backend: result.backend,
          model: result.model,
          originalUrl: imageUrl,
          transformedUrl: result.imageUrl,
          processingTime: result.processingTime,
          info: `Image transformée via ${result.backend} (${result.model})`
        });
      }

      // SD a échoué, retourner l'erreur
      return NextResponse.json({
        success: false,
        mode: 'sd',
        error: result.error,
        fallbackAvailable: true,
        info: 'SD non disponible. Utilisez mode="proxy" ou configurez les clés API.'
      }, { status: 503 });
    }

    // Mode auto: essaie SD puis fallback sur proxy
    if (mode === 'auto') {
      // Essayer SD d'abord
      const sdResult = await transformImageWithSD(imageUrl, title, category, {
        strength,
        preferredBackend: 'auto'
      });

      if (sdResult.success && sdResult.imageUrl) {
        return NextResponse.json({
          success: true,
          mode: 'auto',
          usedMode: 'sd',
          backend: sdResult.backend,
          model: sdResult.model,
          originalUrl: imageUrl,
          transformedUrl: sdResult.imageUrl,
          processingTime: sdResult.processingTime,
          info: `Image transformée via ${sdResult.backend}`
        });
      }

      // Fallback sur proxy
      const proxyUrl = getProxyImageUrl(imageUrl, source, {
        width: 1200,
        style: 'news'
      });

      return NextResponse.json({
        success: true,
        mode: 'auto',
        usedMode: 'proxy',
        originalUrl: imageUrl,
        transformedUrl: proxyUrl,
        processingTime: Date.now() - startTime,
        sdError: sdResult.error,
        info: 'SD non disponible, fallback sur proxy'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid mode. Use "proxy", "sd", or "auto"' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('[TransformImage] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du traitement de l\'image' },
      { status: 500 }
    );
  }
}

/**
 * GET: Affiche les informations sur les backends disponibles
 */
export async function GET() {
  const backends = {
    proxy: {
      available: true,
      description: 'Transformation rapide via Sharp (watermark, filtres)',
      cost: 'Gratuit',
      quality: 'Moyenne',
      speed: 'Très rapide (<1s)'
    },
    replicate: {
      available: !!process.env.REPLICATE_API_TOKEN,
      description: 'Flux/SDXL via Replicate API',
      cost: 'Gratuit (limité) puis ~$0.005/image',
      quality: 'Haute',
      speed: 'Moyen (10-30s)',
      setupUrl: 'https://replicate.com/account/api-tokens'
    },
    stability: {
      available: !!process.env.STABILITY_API_KEY,
      description: 'SDXL officiel via Stability AI',
      cost: '~$0.01/image',
      quality: 'Très haute',
      speed: 'Moyen (5-15s)',
      setupUrl: 'https://platform.stability.ai/account/keys'
    },
    local: {
      available: false, // Sera vérifié dynamiquement si demandé
      description: 'Automatic1111 local',
      cost: 'Gratuit (électricité)',
      quality: 'Variable selon GPU',
      speed: 'Dépend du GPU',
      setupUrl: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui'
    }
  };

  const currentMode = process.env.IMAGE_TRANSFORM_MODE || 'proxy';

  return NextResponse.json({
    currentMode,
    backends,
    usage: {
      endpoint: 'POST /api/transform-image',
      body: {
        imageUrl: 'URL de l\'image source (requis)',
        title: 'Titre de l\'article (optionnel)',
        category: 'Catégorie (optionnel)',
        source: 'Nom de la source pour attribution (optionnel)',
        mode: 'proxy | sd | auto (défaut: proxy)',
        strength: '0.1-0.4 pour SD (défaut: 0.2)'
      }
    }
  });
}
