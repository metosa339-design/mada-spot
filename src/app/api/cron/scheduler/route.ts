import { NextRequest, NextResponse } from 'next/server';
import { getScheduler } from '@/lib/scheduler';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';

// Vérification d'authentification admin
function isAuthorized(request: NextRequest): boolean {
  // Check admin session
  const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (sessionId) return true;

  // Check API key
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  const validApiKey = process.env.AUTOMATION_API_KEY || process.env.CRON_SECRET;
  if (validApiKey && apiKey === validApiKey) return true;

  return false;
}

// GET - Statut du scheduler
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const scheduler = getScheduler();
    const status = scheduler.getStatus();

    return NextResponse.json({
      success: true,
      scheduler: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

// POST - Contrôler le scheduler
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const _body = await request.json().catch(() => null);
    if (_body === null) return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    const { action, jobName } = _body;
    const scheduler = getScheduler();

    switch (action) {
      case 'start':
        scheduler.start();
        return NextResponse.json({ success: true, message: 'Scheduler démarré' });

      case 'stop':
        // Note: Arrêter le scheduler n'est généralement pas recommandé
        // car il redémarrera au prochain redémarrage du serveur
        return NextResponse.json({
          success: false,
          message: 'Pour arrêter le scheduler, définissez AUTOMATION_ENABLED=false'
        });

      case 'force-run':
        if (!jobName) {
          return NextResponse.json({ success: false, error: 'jobName requis' }, { status: 400 });
        }
        const ran = await scheduler.forceRun(jobName);
        return NextResponse.json({
          success: ran,
          message: ran ? `Job ${jobName} exécuté` : `Job ${jobName} non trouvé`
        });

      case 'status':
        return NextResponse.json({
          success: true,
          scheduler: scheduler.getStatus()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Action invalide. Actions valides: start, status, force-run'
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
