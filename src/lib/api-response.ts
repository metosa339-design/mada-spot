import { NextResponse } from 'next/server';

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
