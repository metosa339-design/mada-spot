import { z } from 'zod';

// Schema for validating imported establishment data
export const importEstablishmentSchema = z.object({
  type: z.enum(['HOTEL', 'RESTAURANT', 'ATTRACTION']),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(2, 'La ville est requise'),
  district: z.string().optional(),
  region: z.string().optional(),
  latitude: z.number().min(-26).max(-11).optional(), // Madagascar bounds
  longitude: z.number().min(43).max(51).optional(),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  whatsapp: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  images: z.string().optional(), // JSON array or comma-separated URLs
  isFeatured: z.boolean().optional(),

  // Source attribution
  sourceUrl: z.string().url().optional().or(z.literal('')),
  sourceAttribution: z.string().optional(),

  // Restaurant-specific
  category: z.enum(['GARGOTE', 'RESTAURANT', 'LOUNGE', 'CAFE', 'FAST_FOOD', 'STREET_FOOD']).optional(),
  cuisineTypes: z.string().optional(), // JSON array or comma-separated
  priceRange: z.enum(['BUDGET', 'MODERATE', 'UPSCALE', 'LUXURY']).optional(),
  openingHours: z.string().optional(), // JSON object
  hasDelivery: z.boolean().optional(),
  hasTakeaway: z.boolean().optional(),
  hasReservation: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  hasWifi: z.boolean().optional(),
  hasGenerator: z.boolean().optional(),
  avgMainCourse: z.number().positive().optional(),
  avgBeer: z.number().positive().optional(),

  // Hotel-specific
  starRating: z.number().min(1).max(5).optional(),
  hotelType: z.string().optional(),
  amenities: z.string().optional(), // JSON array or comma-separated
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),

  // Attraction-specific
  attractionType: z.string().optional(),
  isFree: z.boolean().optional(),
  entryFeeForeign: z.number().positive().optional(),
  entryFeeLocal: z.number().positive().optional(),
  visitDuration: z.string().optional(),
  bestTimeToVisit: z.string().optional(),
});

export type ImportEstablishmentInput = z.infer<typeof importEstablishmentSchema>;

// Transform raw CSV row to typed input (handles string→number, string→boolean conversions)
export function transformCSVRow(row: Record<string, string>): Record<string, any> {
  const transformed: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    if (value === '' || value === undefined || value === null) continue;

    // Boolean conversions
    if (['isFeatured', 'hasDelivery', 'hasTakeaway', 'hasReservation', 'hasParking', 'hasWifi', 'hasGenerator', 'isFree'].includes(key)) {
      transformed[key] = ['true', '1', 'oui', 'yes', 'x'].includes(value.toLowerCase());
      continue;
    }

    // Number conversions
    if (['latitude', 'longitude', 'starRating', 'avgMainCourse', 'avgBeer', 'entryFeeForeign', 'entryFeeLocal'].includes(key)) {
      const num = parseFloat(value);
      if (!isNaN(num)) transformed[key] = num;
      continue;
    }

    // String fields
    transformed[key] = value;
  }

  return transformed;
}

// Validate and return errors
export function validateImportRow(row: Record<string, any>): {
  valid: boolean;
  data?: ImportEstablishmentInput;
  errors?: string[];
} {
  const result = importEstablishmentSchema.safeParse(row);

  if (result.success) {
    return { valid: true, data: result.data };
  }

  return {
    valid: false,
    errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
  };
}
