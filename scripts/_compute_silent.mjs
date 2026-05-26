// Cible "silencieux" : ont reçu la campagne initiale (sent_design) mais
// n'ont JAMAIS interagi avec MadaSpot (ni User créé, ni PendingRegistration).
//
// Logique :
//   silent = sent_design MINUS (User.email since campaign) MINUS (PendingRegistration.email since campaign)
//
// On exporte aussi les emails déjà touchés par les relances V1/V2 pour info
// (mais on ne les exclut PAS de la cible : ces gens-là sont des inscrits, pas des silencieux).

import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
const CAMPAIGN_DIR = 'C:/Users/ISIM NICE/Desktop/campagne madaspot';
const CAMPAIGN_START = new Date('2026-03-29T00:00:00Z');
const OUT = `${CAMPAIGN_DIR}/silent_targets.json`;

// 1. Charger sent_design depuis campagne_progress.json (cp1252 historique)
const rawProgress = fs.readFileSync(`${CAMPAIGN_DIR}/campagne_progress.json`);
// Try utf-8 first, fall back to cp1252
let progressText;
try {
  progressText = rawProgress.toString('utf-8');
  JSON.parse(progressText);
} catch {
  progressText = rawProgress.toString('latin1');  // cp1252 ~ latin1 for JSON-safe content
}
const progress = JSON.parse(progressText);
const sentDesign = new Set(progress.sent_design.map(e => (e || '').toLowerCase().trim()).filter(Boolean));
console.log(`sent_design (campagne initiale): ${sentDesign.size} emails`);

// 2. Users avec email créés depuis campagne
const users = await prisma.user.findMany({
  where: { createdAt: { gte: CAMPAIGN_START }, email: { not: null } },
  select: { email: true }
});
const userEmails = new Set(users.map(u => u.email.toLowerCase().trim()));
console.log(`Users créés depuis campagne: ${userEmails.size}`);

// 3. PendingRegistration depuis campagne
const pending = await prisma.pendingRegistration.findMany({
  where: { createdAt: { gte: CAMPAIGN_START }, email: { not: null } },
  select: { email: true }
});
const pendingEmails = new Set(pending.map(p => p.email.toLowerCase().trim()));
console.log(`PendingRegistration depuis campagne: ${pendingEmails.size}`);

// 4. Intersection / différence
const acted = new Set([...userEmails, ...pendingEmails]);
console.log(`Total qui ont au moins commencé une action: ${acted.size}`);

const silent = [...sentDesign].filter(e => !acted.has(e));
console.log(`\nSILENCIEUX (cible): ${silent.length}`);

// 5. Récupérer le name + city + type depuis le CSV original (parse manuel)
const csvRaw = fs.readFileSync(`${CAMPAIGN_DIR}/campagne_madaspot_contacts.csv`, 'utf-8').replace(/^﻿/, '');
const lines = csvRaw.split(/\r?\n/).filter(Boolean);
const headers = lines[0].split(';').map(h => h.trim());
const csvRows = lines.slice(1).map(line => {
  const cells = line.split(';');
  const obj = {};
  headers.forEach((h, i) => { obj[h] = (cells[i] || '').trim(); });
  return obj;
});
const byEmail = new Map();
for (const r of csvRows) {
  const e = (r.email || '').toLowerCase().trim();
  if (e) byEmail.set(e, r);
}

const targets = silent.map(e => {
  const r = byEmail.get(e) || {};
  return {
    email: e,
    name: r.name || '',
    phone: r.phone || '',
    city: r.city || '',
    type: r.type || '',
  };
});

fs.writeFileSync(OUT, JSON.stringify(targets, null, 2), 'utf-8');

// 6. Stats par type
const byType = {};
for (const t of targets) byType[t.type || '?'] = (byType[t.type || '?'] || 0) + 1;
console.log('\nPar type:');
for (const [k, v] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}

console.log(`\nExporté vers ${OUT}`);

await prisma.$disconnect();
