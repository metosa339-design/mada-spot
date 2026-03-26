// Input validation schemas using Zod for type safety and security
import { z } from 'zod';

// Helper to convert empty strings to undefined
const emptyToUndefined = (val: unknown) => (val === '' ? undefined : val);

// Simple string for URLs/paths - accepts anything
const imageString = z.string().max(2000);

// Optional image URL - accepts any string or empty
const optionalImageUrl = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    return String(val);
  },
  z.string().max(2000).optional().nullable()
);

// Optional datetime that allows empty strings
const optionalDatetime = z.preprocess(
  emptyToUndefined,
  z.string().datetime().optional().nullable()
);

// Optional CUID that allows empty strings
const optionalCuid = z.preprocess(
  emptyToUndefined,
  z.string().cuid().optional().nullable()
);

// Article validation schemas
export const articleCreateSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(500, 'Titre trop long'),
  content: z.string().min(1, 'Contenu requis').max(50000, 'Contenu trop long'),
  summary: z.string().max(1000, 'Résumé trop long').optional(),
  categoryId: optionalCuid,
  imageUrl: optionalImageUrl,
  additionalImages: z.preprocess(
    (val) => {
      if (!Array.isArray(val)) return [];
      return val.filter((v) => v !== '' && v != null && typeof v === 'string');
    },
    z.array(imageString).max(20).optional()
  ),
  sourceUrl: optionalImageUrl,
  sourceName: z.string().max(200).optional().nullable(),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).default('draft'),
  scheduledAt: optionalDatetime,
  isFeatured: z.boolean().default(false),
  isBreaking: z.boolean().default(false),
  metaTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  // Layout and styling
  layoutFormat: z.number().int().min(1).max(5).default(1),
  titleBold: z.boolean().default(false),
});

export const articleUpdateSchema = articleCreateSchema.partial();

// Category validation schemas
export const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug invalide'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide').default('#ff6b35'),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

// Media validation schemas
export const mediaCreateSchema = z.object({
  filename: z.string().min(1).max(255),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().regex(/^(image|video|application)\/.+$/, 'Type MIME invalide'),
  size: z.number().int().min(0).max(100 * 1024 * 1024), // Max 100MB
  url: z.string().url().max(2000),
  thumbnailUrl: z.string().url().max(2000).optional(),
  alt: z.string().max(255).optional(),
  caption: z.string().max(500).optional(),
  folder: z.string().max(100).default('general'),
});

// Query params validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
});

export const articleQuerySchema = z.object({
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).optional(),
  categoryId: z.string().cuid().optional(),
  search: z.string().max(200).optional(),
  isFromRSS: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isBreaking: z.coerce.boolean().optional(),
}).merge(paginationSchema);

// Auth validation schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Identifiant requis').max(100),
  password: z.string().min(1, 'Mot de passe requis').max(200),
});

// RSS Source validation
export const rssSourceSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  categoryId: z.string().cuid().optional(),
  isActive: z.boolean().default(true),
  autoPublish: z.boolean().default(false),
});

// Cron endpoint validation
export const cronQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  force: z.coerce.boolean().default(false),
});

// Helper function to validate and parse data
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true; data: T
} | {
  success: false; errors: z.ZodIssue[]
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
}

// Sanitize string to prevent XSS (basic)
export function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Sanitize HTML content (allow basic markdown-safe tags)
export function sanitizeContent(content: string): string {
  // Remove script tags and event handlers
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

export type ArticleCreateInput = z.infer<typeof articleCreateSchema>;
export type ArticleUpdateInput = z.infer<typeof articleUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ArticleQueryInput = z.infer<typeof articleQuerySchema>;
