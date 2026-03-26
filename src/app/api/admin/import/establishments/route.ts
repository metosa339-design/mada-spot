import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { getSession } from '@/lib/auth';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';
import { parseCSV } from '@/lib/import/csv-parser';
import { transformCSVRow, validateImportRow } from '@/lib/import/establishment-validator';
import { generateUniqueSlug } from '@/lib/import/slug-generator';
import { geocodeAddress } from '@/lib/import/geocoder';
import { generateMetaTitle, generateMetaDescription } from '@/lib/import/seo-generator';

import { logger } from '@/lib/logger';
// POST /api/admin/import/establishments - Bulk import from CSV/JSON
export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionId) return apiError('Non autorisé', 401);
  const user = await getSession(sessionId);
  if (!user) return apiError('Non autorisé', 401);

  try {
    const contentType = request.headers.get('content-type') || '';

    let records: Record<string, any>[] = [];
    let fileName = 'unknown';
    let source = 'csv';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
      }

      fileName = file.name;
      const text = await file.text();

      if (file.name.endsWith('.json')) {
        source = 'json';
        const parsed = JSON.parse(text);
        records = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        source = 'csv';
        const csvRows = parseCSV(text);
        records = csvRows.map(transformCSVRow);
      }
    } else if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => null);
      if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
      source = 'json';
      records = Array.isArray(body.records) ? body.records : body.establishments || [];
      fileName = body.fileName || 'api-import.json';
    } else {
      return NextResponse.json({ error: 'Format non supporté. Utilisez CSV, JSON ou multipart.' }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ error: 'Aucun enregistrement trouvé dans le fichier' }, { status: 400 });
    }

    // Create import batch
    const batch = await prisma.importBatch.create({
      data: {
        source,
        fileName,
        totalRecords: records.length,
        status: 'processing',
      },
    });

    const errors: { row: number; errors: string[] }[] = [];
    let successCount = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const validation = validateImportRow(row);

      if (!validation.valid) {
        errors.push({ row: i + 1, errors: validation.errors || ['Validation échouée'] });
        continue;
      }

      const data = validation.data!;

      try {
        // Generate unique slug
        const slug = await generateUniqueSlug(data.name, data.city);

        // Geocode if no coordinates provided
        let latitude = data.latitude || null;
        let longitude = data.longitude || null;

        if (!latitude && !longitude && data.address) {
          const geo = await geocodeAddress(data.address, data.city);
          if (geo) {
            latitude = geo.lat;
            longitude = geo.lng;
          }
        }

        // Parse JSON fields
        let images: string | null = null;
        if (data.images) {
          try {
            // Check if it's already JSON
            JSON.parse(data.images);
            images = data.images;
          } catch {
            // Treat as comma-separated URLs
            const urls = data.images.split(',').map((u: string) => u.trim()).filter(Boolean);
            images = JSON.stringify(urls);
          }
        }

        // Generate SEO if not provided
        const metaTitle = generateMetaTitle({
          type: data.type,
          name: data.name,
          city: data.city,
          district: data.district,
          category: data.category,
          priceRange: data.priceRange,
          starRating: data.starRating,
          attractionType: data.attractionType,
        });

        const metaDescription = generateMetaDescription({
          type: data.type,
          name: data.name,
          city: data.city,
          district: data.district,
          category: data.category,
          priceRange: data.priceRange,
          starRating: data.starRating,
        });

        // Build type-specific nested data
        const typeData: any = {};

        if (data.type === 'HOTEL') {
          typeData.hotel = {
            create: {
              starRating: data.starRating || null,
              hotelType: data.hotelType || null,
              amenities: data.amenities || null,
              checkInTime: data.checkInTime || null,
              checkOutTime: data.checkOutTime || null,
            },
          };
        } else if (data.type === 'RESTAURANT') {
          let cuisineTypes: string | null = null;
          if (data.cuisineTypes) {
            try {
              JSON.parse(data.cuisineTypes);
              cuisineTypes = data.cuisineTypes;
            } catch {
              cuisineTypes = JSON.stringify(data.cuisineTypes.split(',').map((c: string) => c.trim()));
            }
          }

          typeData.restaurant = {
            create: {
              category: data.category || 'RESTAURANT',
              cuisineTypes,
              priceRange: data.priceRange || 'MODERATE',
              openingHours: data.openingHours || null,
              hasDelivery: data.hasDelivery || false,
              hasTakeaway: data.hasTakeaway || false,
              hasReservation: data.hasReservation || false,
              hasParking: data.hasParking || false,
              hasWifi: data.hasWifi || false,
              hasGenerator: data.hasGenerator || false,
              avgMainCourse: data.avgMainCourse || null,
              avgBeer: data.avgBeer || null,
            },
          };
        } else if (data.type === 'ATTRACTION') {
          typeData.attraction = {
            create: {
              attractionType: data.attractionType || 'other',
              isFree: data.isFree || false,
              entryFeeForeign: data.entryFeeForeign || null,
              entryFeeLocal: data.entryFeeLocal || null,
              visitDuration: data.visitDuration || null,
              bestTimeToVisit: data.bestTimeToVisit || null,
            },
          };
        }

        // Create establishment
        await prisma.establishment.create({
          data: {
            type: data.type,
            name: data.name,
            slug,
            description: data.description || null,
            shortDescription: data.shortDescription || null,
            address: data.address || null,
            city: data.city,
            district: data.district || null,
            region: data.region || null,
            latitude,
            longitude,
            phone: data.phone || null,
            phone2: data.phone2 || null,
            email: data.email || null,
            website: data.website || null,
            facebook: data.facebook || null,
            instagram: data.instagram || null,
            whatsapp: data.whatsapp || null,
            coverImage: data.coverImage || null,
            images,
            isFeatured: data.isFeatured || false,
            metaTitle,
            metaDescription,
            // Import metadata
            dataSource: 'csv_import',
            sourceUrl: data.sourceUrl || null,
            sourceAttribution: data.sourceAttribution || null,
            moderationStatus: 'pending_review',
            importedAt: new Date(),
            importBatchId: batch.id,
            ...typeData,
          },
        });

        successCount++;
      } catch (err: any) {
        errors.push({ row: i + 1, errors: [err.message || 'Erreur de création'] });
      }
    }

    // Update batch status
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: errors.length === records.length ? 'failed' : 'completed',
        successCount,
        errorCount: errors.length,
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      batchId: batch.id,
      total: records.length,
      success: successCount,
      errors: errors.length,
      errorDetails: errors.slice(0, 20), // Limit error details in response
    });
  } catch (error: unknown) {
    logger.error('Import error:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: 'Erreur lors de l\'import', details: message },
      { status: 500 }
    );
  }
}
