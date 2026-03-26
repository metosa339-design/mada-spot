import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

// Vlog model has been removed from the schema.
// This endpoint returns empty results for backward compatibility.

export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    vlogs: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    message: 'Le module vlogs n\'est pas encore disponible.',
  });
}

export async function POST(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  return NextResponse.json(
    { success: false, error: 'Le module vlogs n\'est pas encore disponible.' },
    { status: 501 }
  );
}
