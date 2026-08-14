// Mada Spot — Billetterie
// Distribution des billets par canal avec circuit breaker et repli en cascade :
//   WhatsApp (Green API)  →  SMS  →  Téléchargement direct dans la PWA.
//
// La commande reste PAID quel que soit le résultat : ce module ne lève JAMAIS
// d'exception, il renvoie un journal des tentatives. Un billet non délivré par
// message reste disponible dans l'espace « Mes billets » de la PWA.

import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

export type NotificationChannel = 'WHATSAPP' | 'SMS' | 'PWA_ONLY';

export interface NotifyAttempt {
  channel: 'WHATSAPP' | 'SMS';
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  at: string;
}

export interface NotifyResult {
  delivered: NotificationChannel;
  attempts: NotifyAttempt[];
}

export interface TicketNotificationPayload {
  clientName: string;
  clientPhone: string; // format international +261…
  eventTitle: string;
  ticketCount: number;
  securityCodes: string[];
  walletUrl: string; // lien vers l'espace billets / téléchargement PWA
}

const WHATSAPP_TIMEOUT_MS = 6000;
const SMS_TIMEOUT_MS = 6000;

/** fetch avec timeout dur via AbortController. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Disjoncteur simple par canal. Après `threshold` échecs consécutifs, le canal
 * est « ouvert » : les envois suivants sont court-circuités (repli immédiat)
 * pendant `cooldownMs`, ce qui évite d'attendre le timeout à chaque commande
 * quand un fournisseur est en panne.
 */
class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  constructor(
    private readonly name: string,
    private readonly threshold = 3,
    private readonly cooldownMs = 30_000
  ) {}

  isOpen(): boolean {
    if (this.failures < this.threshold) return false;
    if (Date.now() - this.openedAt >= this.cooldownMs) {
      // Fin du cooldown : on repasse en half-open (une sonde retentera).
      this.failures = this.threshold - 1;
      this.openedAt = 0;
      return false;
    }
    return true;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.openedAt = 0;
  }

  recordFailure(): void {
    this.failures += 1;
    if (this.failures >= this.threshold) {
      this.openedAt = Date.now();
      logger.warn(`Circuit breaker ouvert : canal ${this.name} en panne`);
    }
  }
}

// Disjoncteurs partagés au niveau du module (persistants entre requêtes).
const whatsappBreaker = new CircuitBreaker('whatsapp');
const smsBreaker = new CircuitBreaker('sms');

function buildMessage(p: TicketNotificationPayload): string {
  const codes = p.securityCodes.join(', ');
  return (
    `Bonjour ${p.clientName}, votre paiement est confirmé pour « ${p.eventTitle} ».\n` +
    `${p.ticketCount} billet(s). Code(s) de contrôle : ${codes}.\n` +
    `Vos billets : ${p.walletUrl}`
  );
}

function isWhatsAppConfigured(): boolean {
  return Boolean(serverEnv.GREEN_API_URL && serverEnv.GREEN_API_TOKEN);
}

function isSmsConfigured(): boolean {
  return Boolean(serverEnv.SMS_API_URL && serverEnv.SMS_API_KEY);
}

async function sendWhatsApp(p: TicketNotificationPayload): Promise<void> {
  const base = serverEnv.GREEN_API_URL!.replace(/\/$/, '');
  const url = `${base}/sendMessage/${serverEnv.GREEN_API_TOKEN}`;
  const chatId = `${p.clientPhone.replace(/\D/g, '')}@c.us`;
  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message: buildMessage(p) }),
    },
    WHATSAPP_TIMEOUT_MS
  );
  if (!res.ok) {
    throw new Error(`WhatsApp HTTP ${res.status}`);
  }
}

async function sendSms(p: TicketNotificationPayload): Promise<void> {
  const res = await fetchWithTimeout(
    serverEnv.SMS_API_URL!,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverEnv.SMS_API_KEY}`,
      },
      body: JSON.stringify({
        to: p.clientPhone,
        from: serverEnv.SMS_SENDER || 'MadaSpot',
        text: buildMessage(p),
      }),
    },
    SMS_TIMEOUT_MS
  );
  if (!res.ok) {
    throw new Error(`SMS HTTP ${res.status}`);
  }
}

/**
 * Tente de délivrer les billets par WhatsApp, puis par SMS, puis retombe sur le
 * mode PWA (téléchargement direct). Ne lève jamais : retourne le canal effectif
 * et le détail des tentatives à journaliser sur la commande.
 */
export async function deliverTicketNotification(
  payload: TicketNotificationPayload
): Promise<NotifyResult> {
  const attempts: NotifyAttempt[] = [];

  // 1) WhatsApp
  if (isWhatsAppConfigured()) {
    if (whatsappBreaker.isOpen()) {
      attempts.push({
        channel: 'WHATSAPP',
        ok: false,
        skipped: true,
        reason: 'circuit-open',
        at: new Date().toISOString(),
      });
    } else {
      try {
        await sendWhatsApp(payload);
        whatsappBreaker.recordSuccess();
        attempts.push({ channel: 'WHATSAPP', ok: true, at: new Date().toISOString() });
        return { delivered: 'WHATSAPP', attempts };
      } catch (err) {
        whatsappBreaker.recordFailure();
        attempts.push({
          channel: 'WHATSAPP',
          ok: false,
          reason: err instanceof Error ? err.message : 'error',
          at: new Date().toISOString(),
        });
      }
    }
  }

  // 2) Repli SMS
  if (isSmsConfigured()) {
    if (smsBreaker.isOpen()) {
      attempts.push({
        channel: 'SMS',
        ok: false,
        skipped: true,
        reason: 'circuit-open',
        at: new Date().toISOString(),
      });
    } else {
      try {
        await sendSms(payload);
        smsBreaker.recordSuccess();
        attempts.push({ channel: 'SMS', ok: true, at: new Date().toISOString() });
        return { delivered: 'SMS', attempts };
      } catch (err) {
        smsBreaker.recordFailure();
        attempts.push({
          channel: 'SMS',
          ok: false,
          reason: err instanceof Error ? err.message : 'error',
          at: new Date().toISOString(),
        });
      }
    }
  }

  // 3) Repli ultime : le billet reste disponible en téléchargement dans la PWA.
  logger.info('Billets délivrés en mode PWA (aucun canal message disponible)', 'ticketing.notify', {
    phone: payload.clientPhone,
    event: payload.eventTitle,
  });
  return { delivered: 'PWA_ONLY', attempts };
}
