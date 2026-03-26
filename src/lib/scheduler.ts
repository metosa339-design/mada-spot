import logger from '@/lib/logger';
/**
 * Scheduler interne pour l'automatisation
 * Fonctionne indépendamment de l'hébergement (Render, Vercel, VPS, etc.)
 */

type ScheduledJob = {
  name: string;
  intervalMinutes: number;
  handler: () => Promise<void>;
  lastRun?: Date;
  isRunning: boolean;
};

class AutomationScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isStarted = false;
  private baseUrl: string;

  constructor() {
    // Détecte l'URL de base selon l'environnement
    // En production, utilise les variables d'environnement
    // En dev, utilise le port dynamique
    const port = process.env.PORT || '3000';
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      || process.env.VERCEL_URL
      || process.env.RENDER_EXTERNAL_URL
      || `http://localhost:${port}`;

    // Assure que l'URL a le protocole
    if (!this.baseUrl.startsWith('http')) {
      this.baseUrl = `https://${this.baseUrl}`;
    }
  }

  /**
   * Met à jour l'URL de base (utile si le port change)
   */
  setBaseUrl(url: string) {
    this.baseUrl = url;
    logger.info(`[Scheduler] Base URL updated to: ${url}`);
  }

  /**
   * Appelle un endpoint cron interne
   */
  private async callCronEndpoint(endpoint: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/cron/${endpoint}`;
      logger.info(`[Scheduler] Calling ${url}...`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Internal-Scheduler',
          'x-api-key': process.env.AUTOMATION_API_KEY || '',
        },
        // Timeout de 5 minutes pour les longues tâches
        signal: AbortSignal.timeout(300000),
      });

      const data = await response.json();

      if (data.success) {
        logger.info(`[Scheduler] ✓ ${endpoint} completed successfully`);
        return true;
      } else {
        logger.error(`[Scheduler] ✗ ${endpoint} failed:`, data.error);
        return false;
      }
    } catch (error) {
      logger.error(`[Scheduler] ✗ ${endpoint} error:`, error);
      return false;
    }
  }

  /**
   * Enregistre un job
   */
  registerJob(name: string, intervalMinutes: number, endpoint: string) {
    const handler = async () => {
      await this.callCronEndpoint(endpoint);
    };

    this.jobs.set(name, {
      name,
      intervalMinutes,
      handler,
      isRunning: false,
    });

    logger.info(`[Scheduler] Job registered: ${name} (every ${intervalMinutes} min)`);
  }

  /**
   * Exécute un job avec protection contre les exécutions multiples
   */
  private async runJob(name: string) {
    const job = this.jobs.get(name);
    if (!job) return;

    // Évite les exécutions simultanées
    if (job.isRunning) {
      logger.info(`[Scheduler] ${name} is already running, skipping...`);
      return;
    }

    job.isRunning = true;
    job.lastRun = new Date();

    try {
      await job.handler();
    } catch (error) {
      logger.error(`[Scheduler] Error in job ${name}:`, error);
    } finally {
      job.isRunning = false;
    }
  }

  /**
   * Démarre le scheduler
   */
  start() {
    if (this.isStarted) {
      logger.info('[Scheduler] Already started');
      return;
    }

    logger.info('[Scheduler] Starting automation scheduler...');
    logger.info(`[Scheduler] Base URL: ${this.baseUrl}`);

    // Enregistre les jobs par défaut
    this.registerJob('sync-rss', 30, 'sync-rss');           // Toutes les 30 min
    this.registerJob('enhance-articles', 120, 'enhance-articles'); // Toutes les 2h
    this.registerJob('publish', 15, 'publish');              // Toutes les 15 min
    this.registerJob('booking-relance', 240, 'booking-relance'); // Toutes les 4h — relance réservations PENDING

    // Démarre chaque job
    for (const [name, job] of this.jobs) {
      const intervalMs = job.intervalMinutes * 60 * 1000;

      // Exécute immédiatement au démarrage (après un délai initial)
      const initialDelay = name === 'sync-rss' ? 10000 : // 10s pour sync-rss
                          name === 'enhance-articles' ? 60000 : // 1min pour enhance
                          30000; // 30s pour publish

      setTimeout(() => {
        logger.info(`[Scheduler] Initial run of ${name}...`);
        this.runJob(name);
      }, initialDelay);

      // Puis exécute périodiquement
      const interval = setInterval(() => {
        this.runJob(name);
      }, intervalMs);

      this.intervals.set(name, interval);
    }

    this.isStarted = true;
    logger.info('[Scheduler] ✓ Automation scheduler started successfully');
    logger.info('[Scheduler] Jobs scheduled:');
    for (const [name, job] of this.jobs) {
      logger.info(`  - ${name}: every ${job.intervalMinutes} minutes`);
    }
  }

  /**
   * Arrête le scheduler
   */
  stop() {
    logger.info('[Scheduler] Stopping...');

    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      logger.info(`[Scheduler] Stopped job: ${name}`);
    }

    this.intervals.clear();
    this.isStarted = false;
    logger.info('[Scheduler] ✓ Stopped');
  }

  /**
   * Retourne le statut des jobs
   */
  getStatus() {
    const status: Record<string, any> = {
      isStarted: this.isStarted,
      baseUrl: this.baseUrl,
      jobs: {},
    };

    for (const [name, job] of this.jobs) {
      status.jobs[name] = {
        intervalMinutes: job.intervalMinutes,
        lastRun: job.lastRun?.toISOString() || null,
        isRunning: job.isRunning,
      };
    }

    return status;
  }

  /**
   * Force l'exécution d'un job
   */
  async forceRun(name: string): Promise<boolean> {
    if (!this.jobs.has(name)) {
      logger.error(`[Scheduler] Job not found: ${name}`);
      return false;
    }

    logger.info(`[Scheduler] Force running ${name}...`);
    await this.runJob(name);
    return true;
  }
}

// Singleton instance
let schedulerInstance: AutomationScheduler | null = null;

export function getScheduler(): AutomationScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new AutomationScheduler();
  }
  return schedulerInstance;
}

export function startScheduler() {
  const scheduler = getScheduler();
  scheduler.start();
  return scheduler;
}

export function stopScheduler() {
  if (schedulerInstance) {
    schedulerInstance.stop();
  }
}
