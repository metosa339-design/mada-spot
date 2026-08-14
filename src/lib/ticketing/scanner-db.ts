// Mada Spot — Scanner : base locale hors-ligne (IndexedDB via Dexie).
// Stocke le manifeste d'un événement (billets payés) et la file des scans en
// attente de synchronisation cloud. Utilisable uniquement côté navigateur.

import Dexie, { type Table } from 'dexie';

export interface LocalEventMeta {
  eventId: string;
  title: string;
  startDate: string;
  generatedAt: string;
  signature: string;
  count: number;
}

export interface LocalTicket {
  qrHash: string;
  eventId: string;
  securityCode: string;
  holderName: string;
  category: string;
  /** Heure du 1er scan connue côté serveur au moment du préchargement. */
  serverScannedAt: string | null;
  /** Heure du 1er scan effectué localement sur cet appareil. */
  localScannedAt: string | null;
}

export interface PendingScan {
  id?: number;
  qrHash: string;
  eventId: string;
  scannedAt: string;
  synced: 0 | 1;
}

class ScannerDatabase extends Dexie {
  events!: Table<LocalEventMeta, string>;
  tickets!: Table<LocalTicket, string>;
  scans!: Table<PendingScan, number>;

  constructor() {
    super('madaspot_scanner');
    this.version(1).stores({
      events: 'eventId',
      tickets: 'qrHash, eventId, securityCode',
      scans: '++id, qrHash, synced',
    });
  }
}

let _db: ScannerDatabase | null = null;
export function scannerDb(): ScannerDatabase {
  if (!_db) _db = new ScannerDatabase();
  return _db;
}

export type ValidationOutcome =
  | { result: 'VALID'; ticket: LocalTicket }
  | { result: 'ALREADY_SCANNED'; ticket: LocalTicket; firstScannedAt: string | null }
  | { result: 'INVALID' }
  | { result: 'WRONG_EVENT' };

/**
 * Remplace intégralement le manifeste local d'un événement par la version
 * fraîchement téléchargée (billets payés + états de scan serveur).
 */
export async function storeManifest(
  meta: LocalEventMeta,
  tickets: Array<Omit<LocalTicket, 'eventId' | 'localScannedAt'>>
): Promise<void> {
  const db = scannerDb();
  await db.transaction('rw', db.events, db.tickets, async () => {
    await db.events.put(meta);
    // On conserve les scans locaux déjà faits pour cet événement (offline mesh).
    const existing = await db.tickets.where('eventId').equals(meta.eventId).toArray();
    const localMap = new Map(existing.map((t) => [t.qrHash, t.localScannedAt]));
    await db.tickets.where('eventId').equals(meta.eventId).delete();
    await db.tickets.bulkPut(
      tickets.map((t) => ({
        ...t,
        eventId: meta.eventId,
        localScannedAt: localMap.get(t.qrHash) ?? null,
      }))
    );
  });
}

/** Valide un QR hors-ligne et marque le billet comme scanné (premier scan gagne). */
export async function validateQr(eventId: string, qrHash: string): Promise<ValidationOutcome> {
  const db = scannerDb();
  return db.transaction('rw', db.tickets, db.scans, async () => {
    const ticket = await db.tickets.get(qrHash);
    if (!ticket) return { result: 'INVALID' };
    if (ticket.eventId !== eventId) return { result: 'WRONG_EVENT' };

    const already = ticket.serverScannedAt || ticket.localScannedAt;
    if (already) {
      return { result: 'ALREADY_SCANNED', ticket, firstScannedAt: already };
    }

    const now = new Date().toISOString();
    ticket.localScannedAt = now;
    await db.tickets.put(ticket);
    await db.scans.add({ qrHash, eventId, scannedAt: now, synced: 0 });
    return { result: 'VALID', ticket };
  });
}

/** Recherche manuelle d'un billet par code de secours à 6 chiffres. */
export async function findBySecurityCode(
  eventId: string,
  securityCode: string
): Promise<LocalTicket | null> {
  const db = scannerDb();
  const matches = await db.tickets.where('securityCode').equals(securityCode).toArray();
  return matches.find((t) => t.eventId === eventId) ?? null;
}

/** Valide un billet trouvé manuellement (mêmes règles que le scan QR). */
export async function validateBySecurityCode(
  eventId: string,
  securityCode: string
): Promise<ValidationOutcome> {
  const ticket = await findBySecurityCode(eventId, securityCode);
  if (!ticket) return { result: 'INVALID' };
  return validateQr(eventId, ticket.qrHash);
}

export interface ScanStats {
  total: number;
  scanned: number;
  pendingSync: number;
}

export async function getStats(eventId: string): Promise<ScanStats> {
  const db = scannerDb();
  const tickets = await db.tickets.where('eventId').equals(eventId).toArray();
  const scanned = tickets.filter((t) => t.serverScannedAt || t.localScannedAt).length;
  const pendingSync = await db.scans.where('synced').equals(0).count();
  return { total: tickets.length, scanned, pendingSync };
}

/**
 * Envoie les scans locaux non synchronisés au serveur puis reflète la réponse
 * (conflits « déjà scanné » avec l'heure du premier passage).
 */
export async function syncPendingScans(
  eventId: string
): Promise<{ synced: number; conflicts: number } | null> {
  const db = scannerDb();
  const pending = await db.scans.where('synced').equals(0).toArray();
  if (pending.length === 0) return { synced: 0, conflicts: 0 };

  const res = await fetch('/api/ticketing/scan/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId,
      scans: pending.map((p) => ({ qrHash: p.qrHash, scannedAt: p.scannedAt })),
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.success) return null;

  const results: Array<{ qrHash: string; status: string; firstScannedAt?: string | null }> =
    json.data.results;
  let conflicts = 0;

  await db.transaction('rw', db.tickets, db.scans, async () => {
    for (const r of results) {
      const scan = pending.find((p) => p.qrHash === r.qrHash);
      if (scan?.id != null) await db.scans.update(scan.id, { synced: 1 });
      if (r.status === 'ALREADY_SCANNED') {
        conflicts += 1;
        const ticket = await db.tickets.get(r.qrHash);
        if (ticket) {
          ticket.serverScannedAt = r.firstScannedAt ?? ticket.serverScannedAt;
          await db.tickets.put(ticket);
        }
      }
    }
    // Purge des scans confirmés pour garder la file légère.
    await db.scans.where('synced').equals(1).delete();
  });

  return { synced: results.length, conflicts };
}
