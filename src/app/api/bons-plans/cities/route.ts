import { NextResponse } from 'next/server';
import { getCities } from '@/lib/data/cities';

// Liste des villes/destinations (fiches publiées) pour l'autocomplete du hero.
// Cache 1h côté route : la liste bouge peu.
export const revalidate = 3600;

export async function GET() {
  try {
    // minCount = 1 pour une liste large de suggestions.
    const cities = await getCities(1);
    return NextResponse.json({ cities });
  } catch {
    return NextResponse.json({ cities: [] });
  }
}
