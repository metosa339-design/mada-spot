import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

import { logger } from '@/lib/logger';
/**
 * Image Proxy API - Transforme les images sources avec:
 * 1. Léger ajustement des couleurs (saturation, contraste)
 * 2. Watermark/attribution en overlay
 * 3. Recadrage intelligent si nécessaire
 * 4. Compression optimisée
 *
 * Cela permet d'utiliser de vraies images (vraies personnes, vrais événements)
 * tout en les rendant uniques à notre plateforme.
 */


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const source = searchParams.get('source') || 'Source';
  const width = parseInt(searchParams.get('w') || '800');
  const height = parseInt(searchParams.get('h') || '0'); // 0 = auto
  const quality = parseInt(searchParams.get('q') || '85');
  const style = searchParams.get('style') || 'news'; // news, vibrant, muted, bw

  if (!imageUrl) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  // SSRF protection: block internal/private network URLs
  try {
    const parsed = new URL(imageUrl);
    const hostname = parsed.hostname.toLowerCase();
    const protocol = parsed.protocol;

    // Only allow http/https
    if (protocol !== 'http:' && protocol !== 'https:') {
      return NextResponse.json({ error: 'Only HTTP(S) URLs are allowed' }, { status: 400 });
    }

    // Block private/internal IPs and hostnames
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /^\[::1\]/,
      /^\[fc/i,
      /^\[fd/i,
      /^\[fe80/i,
      /^metadata\.google\.internal$/i,
    ];

    if (blockedPatterns.some(pattern => pattern.test(hostname))) {
      return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
    }

    // Only allow known image domains
    const allowedDomains = [
      '.mg', '.unsplash.com', '.pexels.com', '.pixabay.com',
      '.wikimedia.org', '.wikipedia.org', '.pollinations.ai',
      '.googleapis.com', 'picsum.photos',
    ];
    const isAllowed = allowedDomains.some(domain => hostname.endsWith(domain) || hostname === domain.replace('.', ''));
    if (!isAllowed) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    // Récupérer l'image originale
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'MadaSpotBot/1.0 (+https://madaspot.mg)',
        'Accept': 'image/*',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      logger.error(`[ImageProxy] Failed to fetch: ${response.status} - ${imageUrl}`);
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Vérifier que c'est bien une image
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Traiter l'image avec Sharp
    let sharpInstance = sharp(imageBuffer);

    // Obtenir les métadonnées
    const metadata = await sharpInstance.metadata();
    const originalWidth = metadata.width || 800;
    const originalHeight = metadata.height || 600;

    // Calculer les dimensions de sortie
    let outputWidth = width;
    let outputHeight = height || Math.round((width / originalWidth) * originalHeight);

    // Limiter les dimensions max
    if (outputWidth > 1200) outputWidth = 1200;
    if (outputHeight > 900) outputHeight = 900;

    // Redimensionner
    sharpInstance = sharpInstance.resize(outputWidth, outputHeight, {
      fit: 'cover',
      position: 'attention', // Focus intelligent sur les visages/sujets importants
    });

    // Appliquer le style de transformation
    switch (style) {
      case 'vibrant':
        // Style vibrant - couleurs plus vives
        sharpInstance = sharpInstance.modulate({
          brightness: 1.02,
          saturation: 1.15,
        }).sharpen({ sigma: 0.5 });
        break;

      case 'muted':
        // Style atténué - couleurs douces
        sharpInstance = sharpInstance.modulate({
          brightness: 1.0,
          saturation: 0.9,
        }).gamma(1.1);
        break;

      case 'bw':
        // Noir et blanc artistique
        sharpInstance = sharpInstance.grayscale().modulate({
          brightness: 1.05,
        }).sharpen({ sigma: 0.3 });
        break;

      case 'news':
      default:
        // Style "news" - léger ajustement pour un look professionnel
        // Augmente légèrement le contraste et la netteté
        sharpInstance = sharpInstance
          .modulate({
            brightness: 1.01,
            saturation: 1.05,
          })
          .sharpen({ sigma: 0.4 })
          .gamma(1.05); // Léger éclaircissement des tons moyens
        break;
    }

    // Créer le watermark/overlay avec le nom de la source
    const watermarkSvg = createWatermarkSvg(source, outputWidth);

    // Composer l'image finale avec le watermark
    const watermarkBuffer = Buffer.from(watermarkSvg);

    sharpInstance = sharpInstance.composite([
      {
        input: watermarkBuffer,
        gravity: 'southeast', // Coin inférieur droit
      },
    ]);

    // Convertir en JPEG optimisé (meilleure compression pour les photos)
    const outputBuffer = await sharpInstance
      .jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();

    return new NextResponse(new Uint8Array(outputBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Image-Source': 'processed',
        'X-Original-Source': source,
      },
    });

  } catch (error) {
    logger.error('[ImageProxy] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de l\'image' },
      { status: 500 }
    );
  }
}

/**
 * Crée un SVG de watermark avec le nom de la source
 */
function createWatermarkSvg(source: string, imageWidth: number): string {
  // Taille adaptative basée sur la largeur de l'image
  const fontSize = Math.max(10, Math.min(14, imageWidth / 60));
  const padding = fontSize * 0.8;
  const textWidth = source.length * fontSize * 0.6 + padding * 2 + 20; // +20 pour "Photo:"
  const height = fontSize + padding * 2;

  // Position: coin inférieur droit avec marge
  const margin = 8;

  return `
    <svg width="${textWidth + margin}" height="${height + margin}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
        </filter>
      </defs>
      <rect
        x="${margin}"
        y="${margin}"
        width="${textWidth}"
        height="${height}"
        rx="${height / 2}"
        ry="${height / 2}"
        fill="rgba(0, 0, 0, 0.6)"
        filter="url(#shadow)"
      />
      <text
        x="${margin + padding + 2}"
        y="${margin + height / 2 + fontSize / 3}"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${fontSize}px"
        font-weight="500"
        fill="white"
      >
        <tspan fill="rgba(255,255,255,0.7)">Photo:</tspan>
        <tspan dx="4" fill="white">${escapeXml(source)}</tspan>
      </text>
    </svg>
  `;
}

/**
 * Échappe les caractères spéciaux XML
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
