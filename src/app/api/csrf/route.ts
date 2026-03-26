import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';

// GET /api/csrf - Obtenir un token CSRF
export async function GET() {
  const token = generateCsrfToken();
  return NextResponse.json({ token });
}
