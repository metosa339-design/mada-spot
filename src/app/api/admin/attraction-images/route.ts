import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET: List establishments with their images
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return apiError('Non autorisé', 401);

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const slug = searchParams.get('slug');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (slug) {
      where.slug = slug;
    } else if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const establishments = await prisma.establishment.findMany({
      where,
      select: { id: true, name: true, slug: true, city: true, coverImage: true, images: true, type: true },
      orderBy: { name: 'asc' },
    });

    const result = establishments.map((a) => {
      let gallery: string[] = [];
      if (a.images) {
        try { gallery = JSON.parse(a.images); } catch { /* ignore */ }
      }
      return {
        id: a.id, name: a.name, slug: a.slug, city: a.city, type: a.type,
        coverImage: a.coverImage, gallery,
        totalImages: (a.coverImage ? 1 : 0) + gallery.length,
        hasRealImages: !!a.coverImage,
      };
    });

    return NextResponse.json({ attractions: result });
  } catch (error) {
    logger.error('Error listing establishment images:', error);
    return apiError('Erreur serveur', 500);
  }
}

// POST: Upload image via Cloudinary
export async function POST(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return apiError('Non autorisé', 401);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const attractionId = formData.get('attractionId') as string;
    const setAsCover = formData.get('setAsCover') === 'true';

    if (!file || !attractionId) {
      return NextResponse.json({ error: 'Fichier et attractionId requis' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Format non supporté (JPG, PNG, WebP, GIF)' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 });
    }

    const attraction = await prisma.establishment.findUnique({
      where: { id: attractionId },
      select: { slug: true, coverImage: true, images: true },
    });
    if (!attraction) return NextResponse.json({ error: 'Attraction non trouvée' }, { status: 404 });

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: `madaspot/attractions/${attraction.slug}`, resource_type: 'image' },
        (err, result) => { if (err || !result) reject(err); else resolve(result); }
      ).end(buffer);
    });

    const publicPath = uploadResult.secure_url;

    if (setAsCover || !attraction.coverImage) {
      const oldCover = attraction.coverImage;
      await prisma.establishment.update({ where: { id: attractionId }, data: { coverImage: publicPath } });

      if (oldCover && oldCover !== publicPath) {
        let gallery: string[] = [];
        if (attraction.images) { try { gallery = JSON.parse(attraction.images); } catch { /* ignore */ } }
        gallery.unshift(oldCover);
        await prisma.establishment.update({ where: { id: attractionId }, data: { images: JSON.stringify(gallery) } });
      }
    } else {
      let gallery: string[] = [];
      if (attraction.images) { try { gallery = JSON.parse(attraction.images); } catch { /* ignore */ } }
      gallery.push(publicPath);
      await prisma.establishment.update({ where: { id: attractionId }, data: { images: JSON.stringify(gallery) } });
    }

    return NextResponse.json({ success: true, path: publicPath, message: setAsCover ? 'Image de couverture mise à jour' : 'Image ajoutée à la galerie' });
  } catch (error) {
    logger.error('Error uploading image:', error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}

// PUT: Set cover image
export async function PUT(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return apiError('Non autorisé', 401);

  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
    const { attractionId, action, imagePath } = body;

    if (!attractionId || !action) return NextResponse.json({ error: 'attractionId et action requis' }, { status: 400 });

    const attraction = await prisma.establishment.findUnique({ where: { id: attractionId }, select: { coverImage: true, images: true } });
    if (!attraction) return NextResponse.json({ error: 'Attraction non trouvée' }, { status: 404 });

    let gallery: string[] = [];
    if (attraction.images) { try { gallery = JSON.parse(attraction.images); } catch { /* ignore */ } }

    if (action === 'set_cover' && imagePath) {
      const oldCover = attraction.coverImage;
      const newGallery = gallery.filter((img) => img !== imagePath);
      if (oldCover) newGallery.unshift(oldCover);

      await prisma.establishment.update({ where: { id: attractionId }, data: { coverImage: imagePath, images: newGallery.length > 0 ? JSON.stringify(newGallery) : null } });
      return NextResponse.json({ success: true, message: 'Image de couverture changée' });
    }

    return NextResponse.json({ error: 'Action non supportée' }, { status: 400 });
  } catch (error) {
    logger.error('Error updating images:', error);
    return apiError('Erreur serveur', 500);
  }
}

// DELETE: Remove image
export async function DELETE(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return apiError('Non autorisé', 401);

  try {
    const { searchParams } = new URL(request.url);
    const attractionId = searchParams.get('attractionId');
    const imagePath = searchParams.get('imagePath');

    if (!attractionId || !imagePath) return NextResponse.json({ error: 'attractionId et imagePath requis' }, { status: 400 });

    const attraction = await prisma.establishment.findUnique({ where: { id: attractionId }, select: { coverImage: true, images: true } });
    if (!attraction) return NextResponse.json({ error: 'Attraction non trouvée' }, { status: 404 });

    let gallery: string[] = [];
    if (attraction.images) { try { gallery = JSON.parse(attraction.images); } catch { /* ignore */ } }

    if (attraction.coverImage === imagePath) {
      const newCover = gallery.length > 0 ? gallery[0] : null;
      await prisma.establishment.update({ where: { id: attractionId }, data: { coverImage: newCover, images: gallery.length > 1 ? JSON.stringify(gallery.slice(1)) : null } });
    } else {
      const newGallery = gallery.filter((img) => img !== imagePath);
      await prisma.establishment.update({ where: { id: attractionId }, data: { images: newGallery.length > 0 ? JSON.stringify(newGallery) : null } });
    }

    // Optionally delete from Cloudinary
    // const publicId = imagePath.split('/').slice(-1)[0].split('.')[0];
    // await cloudinary.uploader.destroy(`madaspot/attractions/${publicId}`);

    return NextResponse.json({ success: true, message: 'Image supprimée' });
  } catch (error) {
    logger.error('Error deleting image:', error);
    return apiError('Erreur serveur', 500);
  }
}
