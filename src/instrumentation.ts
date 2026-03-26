/**
 * Next.js Instrumentation
 * Ce fichier s'exécute au démarrage du serveur
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Ne s'exécute que côté serveur Node.js (pas Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { default: logger } = await import('./lib/logger');
    logger.info('Server starting...', 'Instrumentation');

    // Vérifie si l'automatisation est activée
    const autoEnabled = process.env.AUTOMATION_ENABLED !== 'false';

    if (autoEnabled) {
      // Import dynamique pour éviter les erreurs côté client
      const { startScheduler } = await import('./lib/scheduler');

      // Démarre le scheduler après un court délai (laisse le serveur s'initialiser)
      setTimeout(() => {
        logger.info('Starting automation scheduler...', 'Instrumentation');
        startScheduler();
      }, 5000); // 5 secondes après le démarrage
    } else {
      logger.info('Automation disabled (AUTOMATION_ENABLED=false)', 'Instrumentation');
    }
  }
}
