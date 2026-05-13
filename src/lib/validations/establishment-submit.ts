import { z } from 'zod';
import { Prisma, RestaurantCategory, PriceRange, ProviderServiceType } from '@prisma/client';
import { prisma } from '@/lib/db';

const optStr = z.string().trim().min(1).optional().nullable().or(z.literal('').transform(() => undefined));
const optNum = z.coerce.number().finite().optional().nullable();
const optBool = z.boolean().optional().default(false);

const baseSchema = z.object({
  name: z.string().trim().min(2, 'Nom trop court').max(200),
  shortDescription: optStr,
  description: z.string().trim().min(10, 'Description trop courte').max(5000),

  province: optStr,
  region: optStr,
  city: z.string().trim().min(2, 'Ville requise').max(100),
  district: optStr,
  latitude: optNum,
  longitude: optNum,

  coverImage: optStr,
  images: z.array(z.string()).optional().nullable(),

  phone: optStr,
  email: optStr,
  website: optStr,
  facebook: optStr,
  instagram: optStr,
  whatsapp: optStr,
});

export const hotelSubmitSchema = baseSchema.extend({
  hotelType: z.string().trim().min(1, "Type d'hébergement requis"),
  starRating: optNum,
  amenities: z.array(z.string()).optional().nullable(),
  checkInTime: optStr,
  checkOutTime: optStr,
  roomTypes: z.array(z.object({
    name: z.string().trim().min(1),
    description: optStr,
    capacity: z.coerce.number().int().positive().optional(),
    pricePerNight: z.coerce.number().nonnegative(),
    priceWeekend: z.coerce.number().nonnegative().optional(),
  })).optional().nullable(),
});

export const restaurantSubmitSchema = baseSchema.extend({
  category: z.nativeEnum(RestaurantCategory, { message: 'Catégorie invalide' }),
  priceRange: z.nativeEnum(PriceRange, { message: 'Gamme de prix invalide' }),
  cuisineTypes: z.array(z.string()).optional().nullable(),
  avgMainCourse: optNum,
  avgBeer: optNum,
  specialties: z.array(z.string()).optional().nullable(),
  hasDelivery: optBool,
  hasTakeaway: optBool,
  hasReservation: optBool,
  hasParking: optBool,
  hasWifi: optBool,
  hasGenerator: optBool,
});

export const attractionSubmitSchema = baseSchema.extend({
  attractionType: z.string().trim().min(1, "Type d'attraction requis"),
  isFree: optBool,
  entryFeeLocal: optNum,
  entryFeeForeign: optNum,
  visitDuration: optStr,
  bestTimeToVisit: optStr,
  bestSeason: optStr,
  isAccessible: optBool,
  hasGuide: optBool,
  hasParking: optBool,
  hasRestaurant: optBool,
  highlights: z.array(z.string()).optional().nullable(),
});

export const providerSubmitSchema = baseSchema.extend({
  serviceType: z.nativeEnum(ProviderServiceType, { message: 'Type de service invalide' }),
  languages: z.array(z.string()).optional().nullable(),
  experience: optStr,
  priceRange: z.nativeEnum(PriceRange).optional().nullable(),
  priceFrom: optNum,
  priceTo: optNum,
  priceUnit: optStr,
  operatingZone: z.array(z.string()).optional().nullable(),
  vehicleType: optStr,
  vehicleCapacity: z.coerce.number().int().positive().optional().nullable(),
  licenseNumber: optStr,
  certifications: z.array(z.string()).optional().nullable(),
});

export type HotelSubmitInput = z.infer<typeof hotelSubmitSchema>;
export type RestaurantSubmitInput = z.infer<typeof restaurantSubmitSchema>;
export type AttractionSubmitInput = z.infer<typeof attractionSubmitSchema>;
export type ProviderSubmitInput = z.infer<typeof providerSubmitSchema>;

export function baseSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

/**
 * Wraps a Prisma transaction with slug-conflict retry.
 * If `tx.establishment.create({ data: { slug, ... } })` throws P2002 on `slug`,
 * we retry with a fresh random suffix (max 4 attempts).
 */
export async function withUniqueSlug<T>(
  baseName: string,
  build: (tx: Prisma.TransactionClient, slug: string) => Promise<T>,
): Promise<T> {
  const base = baseSlug(baseName);
  let slug = base;
  const existing = await prisma.establishment.findUnique({ where: { slug } });
  if (existing) slug = `${base}-${randomSuffix()}`;

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await prisma.$transaction((tx) => build(tx, slug));
    } catch (err) {
      const isSlugConflict =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        (err.meta?.target as string[] | undefined)?.includes('slug');
      if (attempt < 3 && isSlugConflict) {
        slug = `${base}-${randomSuffix()}`;
        continue;
      }
      throw err;
    }
  }
  throw new Error('Slug conflict: max retries reached');
}
