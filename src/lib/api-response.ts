import { NextResponse } from 'next/server';
import { SERVICE_UNAVAILABLE_CODE } from './db-health';

/**
 * Standardized API success response
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Standardized API error response
 */
export function apiError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Reponse a servir quand la base est injoignable (quota Neon epuise, endpoint en
 * veille, pooler sature). Le 503 et le Retry-After disent aux navigateurs et aux
 * crawlers de repasser plus tard, au lieu de laisser Google indexer des pages vides.
 *
 * `payload` permet de conserver la forme attendue par l'appelant, par exemple
 * `{ hotels: [], total: 0 }`, pour ne pas casser le typage cote client.
 */
export function apiUnavailable(payload: Record<string, unknown> = {}, retryAfterSeconds = 300) {
  return NextResponse.json(
    {
      success: false,
      code: SERVICE_UNAVAILABLE_CODE,
      error: 'Service momentanement indisponible',
      ...payload,
    },
    { status: 503, headers: { 'Retry-After': String(retryAfterSeconds), 'Cache-Control': 'no-store' } }
  );
}

/**
 * Extract error message from unknown caught error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Erreur inconnue';
}

/**
 * Safely parse JSON strings from database columns.
 * Returns fallback on null/undefined/malformed input.
 */
export function safeJsonParse<T = unknown>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
