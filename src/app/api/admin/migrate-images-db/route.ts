import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { getImageUrl } from '@/lib/image-url';

/**
 * Migrate all /images/... paths in the database to Cloudinary URLs.
 * POST /api/admin/migrate-images-db?dryRun=true  → preview changes
 * POST /api/admin/migrate-images-db               → apply changes
 */
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get('dryRun') === 'true';

  const results: { model: string; id: string; field: string; old: string; new: string }[] = [];

  // Helper: convert a single image path
  function convert(path: string | null | undefined): string | null {
    if (!path) return null;
    if (!path.startsWith('/images/')) return null; // no change needed
    return getImageUrl(path);
  }

  // Helper: convert JSON array of image paths
  function convertJsonArray(json: string | null | undefined): string | null {
    if (!json) return null;
    try {
      const arr = JSON.parse(json);
      if (!Array.isArray(arr)) return null;
      let changed = false;
      const newArr = arr.map((p: string) => {
        if (typeof p === 'string' && p.startsWith('/images/')) {
          changed = true;
          return getImageUrl(p);
        }
        return p;
      });
      return changed ? JSON.stringify(newArr) : null;
    } catch {
      return null;
    }
  }

  // 1. Establishments: coverImage + images (JSON array)
  const establishments = await prisma.establishment.findMany({
    select: { id: true, name: true, coverImage: true, images: true },
  });

  for (const est of establishments) {
    const newCover = convert(est.coverImage);
    const newImages = convertJsonArray(est.images);

    if (newCover) {
      results.push({ model: 'Establishment', id: est.id, field: 'coverImage', old: est.coverImage!, new: newCover });
    }
    if (newImages) {
      results.push({ model: 'Establishment', id: est.id, field: 'images', old: est.images!, new: newImages });
    }

    if (!dryRun && (newCover || newImages)) {
      await prisma.establishment.update({
        where: { id: est.id },
        data: {
          ...(newCover ? { coverImage: newCover } : {}),
          ...(newImages ? { images: newImages } : {}),
        },
      });
    }
  }

  // 2. EditorialContent: coverImage + images
  const contents = await prisma.editorialContent.findMany({
    select: { id: true, coverImage: true, images: true },
  });

  for (const c of contents) {
    const newCover = convert(c.coverImage);
    const newImages = convertJsonArray(c.images);

    if (newCover) results.push({ model: 'EditorialContent', id: c.id, field: 'coverImage', old: c.coverImage!, new: newCover });
    if (newImages) results.push({ model: 'EditorialContent', id: c.id, field: 'images', old: c.images!, new: newImages });

    if (!dryRun && (newCover || newImages)) {
      await prisma.editorialContent.update({
        where: { id: c.id },
        data: {
          ...(newCover ? { coverImage: newCover } : {}),
          ...(newImages ? { images: newImages } : {}),
        },
      });
    }
  }

  // 3. Events: coverImage
  const events = await prisma.event.findMany({
    select: { id: true, coverImage: true },
  });

  for (const e of events) {
    const newCover = convert(e.coverImage);
    if (newCover) {
      results.push({ model: 'Event', id: e.id, field: 'coverImage', old: e.coverImage!, new: newCover });
      if (!dryRun) {
        await prisma.event.update({ where: { id: e.id }, data: { coverImage: newCover } });
      }
    }
  }

  // 4. Cities: coverImage
  const cities = await prisma.city.findMany({
    select: { id: true, coverImage: true },
  });

  for (const city of cities) {
    const newCover = convert(city.coverImage);
    if (newCover) {
      results.push({ model: 'City', id: city.id, field: 'coverImage', old: city.coverImage!, new: newCover });
      if (!dryRun) {
        await prisma.city.update({ where: { id: city.id }, data: { coverImage: newCover } });
      }
    }
  }

  // 5. Articles: imageUrl
  const articles = await prisma.article.findMany({
    select: { id: true, imageUrl: true },
  });

  for (const a of articles) {
    const newUrl = convert(a.imageUrl);
    if (newUrl) {
      results.push({ model: 'Article', id: a.id, field: 'imageUrl', old: a.imageUrl!, new: newUrl });
      if (!dryRun) {
        await prisma.article.update({ where: { id: a.id }, data: { imageUrl: newUrl } });
      }
    }
  }

  // 6. Advertisements: imageUrl
  const ads = await prisma.advertisement.findMany({
    select: { id: true, imageUrl: true },
  });

  for (const ad of ads) {
    const newUrl = convert(ad.imageUrl);
    if (newUrl) {
      results.push({ model: 'Advertisement', id: ad.id, field: 'imageUrl', old: ad.imageUrl, new: newUrl });
      if (!dryRun) {
        await prisma.advertisement.update({ where: { id: ad.id }, data: { imageUrl: newUrl } });
      }
    }
  }

  // 7. Users: avatar
  const users = await prisma.user.findMany({
    where: { avatar: { startsWith: '/images/' } },
    select: { id: true, avatar: true },
  });

  for (const u of users) {
    const newAvatar = convert(u.avatar);
    if (newAvatar) {
      results.push({ model: 'User', id: u.id, field: 'avatar', old: u.avatar!, new: newAvatar });
      if (!dryRun) {
        await prisma.user.update({ where: { id: u.id }, data: { avatar: newAvatar } });
      }
    }
  }

  // 8. EstablishmentReview: images
  const reviews = await prisma.establishmentReview.findMany({
    where: { images: { not: null } },
    select: { id: true, images: true },
  });

  for (const r of reviews) {
    const newImages = convertJsonArray(r.images);
    if (newImages) {
      results.push({ model: 'EstablishmentReview', id: r.id, field: 'images', old: r.images!, new: newImages });
      if (!dryRun) {
        await prisma.establishmentReview.update({ where: { id: r.id }, data: { images: newImages } });
      }
    }
  }

  // 9. HistoricalEra: coverImage
  try {
    const eras = await prisma.historicalEra.findMany({
      select: { id: true, coverImage: true },
    });
    for (const era of eras) {
      const newCover = convert(era.coverImage);
      if (newCover) {
        results.push({ model: 'HistoricalEra', id: era.id, field: 'coverImage', old: era.coverImage!, new: newCover });
        if (!dryRun) {
          await prisma.historicalEra.update({ where: { id: era.id }, data: { coverImage: newCover } });
        }
      }
    }
  } catch { /* model may not exist */ }

  // 10. ExportProduct, HistoricalEvent, HistoricalFigure, FamousThing, MiningResource: imageUrl
  const imageUrlModels = [
    { name: 'ExportProduct', model: prisma.exportProduct },
    { name: 'HistoricalEvent', model: prisma.historicalEvent },
    { name: 'HistoricalFigure', model: prisma.historicalFigure },
    { name: 'FamousThing', model: prisma.famousThing },
    { name: 'MiningResource', model: prisma.miningResource },
  ] as const;

  for (const { name, model } of imageUrlModels) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = await (model as any).findMany({
        select: { id: true, imageUrl: true },
      });
      for (const item of items) {
        const newUrl = convert(item.imageUrl);
        if (newUrl) {
          results.push({ model: name, id: item.id, field: 'imageUrl', old: item.imageUrl, new: newUrl });
          if (!dryRun) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (model as any).update({ where: { id: item.id }, data: { imageUrl: newUrl } });
          }
        }
      }
    } catch { /* model may not exist in DB */ }
  }

  return NextResponse.json({
    success: true,
    dryRun,
    totalChanges: results.length,
    changes: results,
  });
}
