import { z } from 'zod';

import { logger } from '@/lib/logger';
// Server-side environment variables schema
const serverEnvSchema = z.object({
  // Database (required)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_DATABASE_URL: z.string().optional(),

  // Security
  CSRF_SECRET: z.string().min(16, 'CSRF_SECRET should be at least 16 characters').optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),

  // Email
  EMAIL_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),

  // External APIs (optional)
  GROQ_API_KEY: z.string().optional(),
  PIXABAY_API_KEY: z.string().optional(),
  PEXELS_API_KEY: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),
  STABILITY_API_KEY: z.string().optional(),

  // Runtime
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional(),
});

// Client-side environment variables schema (NEXT_PUBLIC_*)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://madaspot.mg'),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
});

// Validate and export server env
function validateServerEnv() {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(', ')}`)
      .join('\n');
    logger.error(`❌ Invalid environment variables:\n${errorMessages}`);

    // Only throw in production — in development, warn but continue
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables');
    }
  }
  return result.success ? result.data : serverEnvSchema.parse({
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || 'missing',
  });
}

function validateClientEnv() {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  });
  if (!result.success) {
    // Client env validation warnings — non-critical in development
  }
  return result.data ?? {};
}

export const serverEnv = validateServerEnv();
export const clientEnv = validateClientEnv();
