// Principales lignes de Taxi-Be (minibus) d'Antananarivo
// Source : données publiques Moovit / connaissances locales

export interface BusLine {
  lineNumber: string;
  name: string;
  route: string[]; // Points principaux du trajet
  color: string;
  zones: string[]; // Quartiers desservis
}

export const antananarivooBusLines: BusLine[] = [
  {
    lineNumber: '104',
    name: 'Analakely - Ivandry',
    route: ['Analakely', 'Antaninarenina', 'Ambatomena', 'Ankorondrano', 'Ivandry'],
    color: '#3b82f6',
    zones: ['Analakely', 'Antaninarenina', 'Ambatomena', 'Ankorondrano', 'Ivandry'],
  },
  {
    lineNumber: '119',
    name: 'Analakely - Ambohimanarina',
    route: ['Analakely', 'Ampefiloha', 'Andavamamba', 'Ambohimanarina'],
    color: '#ef4444',
    zones: ['Analakely', 'Ampefiloha', 'Andavamamba', 'Ambohimanarina'],
  },
  {
    lineNumber: '134',
    name: 'Analakely - Ambohidratrimo',
    route: ['Analakely', 'Ankorondrano', 'Ivandry', 'Ambatobe', 'Ambohidratrimo'],
    color: '#22c55e',
    zones: ['Analakely', 'Ankorondrano', 'Ivandry', 'Ambatobe', 'Ambohidratrimo'],
  },
  {
    lineNumber: '135',
    name: 'Analakely - Ivato (Aéroport)',
    route: ['Analakely', 'Ankorondrano', 'Ivandry', 'Ivato Aéroport'],
    color: '#f59e0b',
    zones: ['Analakely', 'Ankorondrano', 'Ivandry', 'Ivato'],
  },
  {
    lineNumber: '140',
    name: 'Analakely - Ambohimangakely',
    route: ['Analakely', 'Ambodivona', 'Ankadifotsy', 'Ambohimangakely'],
    color: '#8b5cf6',
    zones: ['Analakely', 'Ambodivona', 'Ankadifotsy', 'Ambohimangakely'],
  },
  {
    lineNumber: '153',
    name: 'Analakely - Itaosy',
    route: ['Analakely', 'Anosibe', 'Andoharanofotsy', 'Itaosy'],
    color: '#ec4899',
    zones: ['Analakely', 'Anosibe', 'Andoharanofotsy', 'Itaosy'],
  },
  {
    lineNumber: '161',
    name: 'Analakely - Tanjombato',
    route: ['Analakely', 'Anosibe', 'Tanjombato'],
    color: '#14b8a6',
    zones: ['Analakely', 'Anosibe', 'Tanjombato'],
  },
  {
    lineNumber: '163',
    name: 'Ambohijatovo - Andoharanofotsy',
    route: ['Ambohijatovo', 'Mahazo', 'Andoharanofotsy'],
    color: '#f97316',
    zones: ['Ambohijatovo', 'Mahazo', 'Andoharanofotsy'],
  },
  {
    lineNumber: '175',
    name: 'Analakely - Ambanidia',
    route: ['Analakely', 'Isoraka', 'Ambanidia'],
    color: '#06b6d4',
    zones: ['Analakely', 'Isoraka', 'Ambanidia'],
  },
  {
    lineNumber: '191',
    name: 'Analakely - Ambohipo',
    route: ['Analakely', 'Ampefiloha', 'Ambohipo'],
    color: '#a855f7',
    zones: ['Analakely', 'Ampefiloha', 'Ambohipo'],
  },
  {
    lineNumber: '194',
    name: 'Soarano - Andravoahangy',
    route: ['Soarano', 'Behoririka', 'Andravoahangy'],
    color: '#84cc16',
    zones: ['Soarano', 'Behoririka', 'Andravoahangy'],
  },
  {
    lineNumber: 'J',
    name: 'Tana Gare - By-Pass',
    route: ['Gare Soarano', 'Analakely', 'By-Pass', 'Galaxy'],
    color: '#0ea5e9',
    zones: ['Soarano', 'Analakely', 'Ankorondrano', 'Galaxy'],
  },
];

// Find bus lines near a given zone/quartier
export function findBusLinesNearZone(zone: string): BusLine[] {
  const normalized = zone.toLowerCase();
  return antananarivooBusLines.filter((line) =>
    line.zones.some((z) => z.toLowerCase().includes(normalized)) ||
    line.route.some((r) => r.toLowerCase().includes(normalized))
  );
}

// Get all unique zones covered by bus
export function getAllBusZones(): string[] {
  const zones = new Set<string>();
  antananarivooBusLines.forEach((line) => {
    line.zones.forEach((z) => zones.add(z));
  });
  return Array.from(zones).sort();
}
