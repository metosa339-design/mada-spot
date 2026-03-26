// API Route - Déconnexion
import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, SESSION_COOKIE_NAME, getClearSessionCookieConfig } from '@/lib/auth';

import { logger } from '@/lib/logger';
export async function POST(request: NextRequest) {
  try {
    // Récupérer le token de session
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    // Supprimer la session de la base de données
    if (token) {
      await deleteSession(token);
    }

    // Préparer la réponse
    const response = NextResponse.json({
      success: true,
      message: 'Déconnexion réussie',
    });

    // Supprimer le cookie de session
    const clearCookieConfig = getClearSessionCookieConfig();
    response.cookies.set(clearCookieConfig);

    return response;
  } catch (error) {
    logger.error('Erreur déconnexion:', error);

    // Même en cas d'erreur, supprimer le cookie
    const response = NextResponse.json(
      { success: true, message: 'Déconnexion effectuée' },
      { status: 200 }
    );
    const clearCookieConfig = getClearSessionCookieConfig();
    response.cookies.set(clearCookieConfig);

    return response;
  }
}
