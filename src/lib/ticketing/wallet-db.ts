// Mada Spot — Porte-monnaie client : sauvegarde hors-ligne des billets (Dexie).
// Permet d'afficher ses billets (QR + code) sans réseau, une fois enregistrés.

import Dexie, { type Table } from 'dexie';

export interface SavedTicket {
  id: string;
  orderId: string;
  qrHash: string;
  securityCode: string;
  category: string;
  priceMga: string;
  isForResale: boolean;
  isScanned: boolean;
  eventTitle: string;
  eventStartDate: string;
  eventLocation: string | null;
  eventCity: string;
  holderName: string;
  savedAt: string;
}

class WalletDatabase extends Dexie {
  tickets!: Table<SavedTicket, string>;

  constructor() {
    super('madaspot_wallet');
    this.version(1).stores({
      tickets: 'id, orderId',
    });
  }
}

let _db: WalletDatabase | null = null;
export function walletDb(): WalletDatabase {
  if (!_db) _db = new WalletDatabase();
  return _db;
}

export async function saveTickets(tickets: SavedTicket[]): Promise<void> {
  if (tickets.length === 0) return;
  await walletDb().tickets.bulkPut(tickets);
}

export async function getSavedByOrder(orderId: string): Promise<SavedTicket[]> {
  return walletDb().tickets.where('orderId').equals(orderId).sortBy('id');
}

export async function getAllSaved(): Promise<SavedTicket[]> {
  return walletDb().tickets.toArray();
}

export async function isOrderSaved(orderId: string): Promise<boolean> {
  const n = await walletDb().tickets.where('orderId').equals(orderId).count();
  return n > 0;
}

export async function removeOrder(orderId: string): Promise<void> {
  await walletDb().tickets.where('orderId').equals(orderId).delete();
}

export async function updateSavedTicket(
  id: string,
  patch: Partial<SavedTicket>
): Promise<void> {
  await walletDb().tickets.update(id, patch);
}
