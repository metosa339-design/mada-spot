// Envoie un message in-app aux ex-PendingRegistration qui ONT AUJOURD'HUI un User.
// Pour les orphelins (pas de User → pas de boîte mail in-app), on signale juste.
//
// Source des emails : pending_relance_targets.json (79 contacts)
// DRY-RUN par défaut. --apply pour insérer.

import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

const LABEL = {
  HOTEL:      { thing: 'votre hôtel',         article: 'votre hôtel' },
  RESTAURANT: { thing: 'votre restaurant',    article: 'votre restaurant' },
  ATTRACTION: { thing: 'votre site touristique', article: 'votre site' },
  PROVIDER:   { thing: 'votre activité',      article: 'votre activité' },
};

const _fix = n => {
  const t = (n || '').trim();
  if (!t) return 'bonjour';
  return (t.toLowerCase() === t || t.toUpperCase() === t)
    ? t.split(' ').map(w => w[0]?.toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    : t;
};

const buildMessage = (firstName, userType) => {
  const lbl = LABEL[userType] || LABEL.PROVIDER;
  return `Bonjour ${firstName},

Votre compte Mada Spot pour ${lbl.thing} est actif — bonne nouvelle.

Il vous reste UNE chose à faire pour décrocher votre premier client : publier votre fiche. C'est en UN SEUL CLIC.

→ https://madaspot.com/inscrire-etablissement

Une fois votre fiche en ligne, vous êtes visible auprès des milliers de voyageurs qui consultent Mada Spot chaque mois pour préparer leur voyage à Madagascar — Français, Italiens, Allemands, Réunionnais qui cherchent un hôtel, un guide, une activité.

Photos, prix, contacts, horaires : tout est éditable plus tard. Ce qui compte c'est d'être visible.

Vous bloquez sur quelque chose ? Répondez directement à ce message — je vous aide.

À très vite,
L'équipe Mada Spot`;
};

const targetsFile = 'C:/Users/ISIM NICE/Desktop/campagne madaspot/pending_relance_targets.json';
const exPendingEmails = JSON.parse(fs.readFileSync(targetsFile, 'utf-8'));
console.log(`Ex-pending dans pending_relance_targets.json : ${exPendingEmails.length}`);

const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
if (!admin) { console.error('Aucun ADMIN trouvé.'); process.exit(1); }

const haveAccount = [];
const orphans = [];
for (const c of exPendingEmails) {
  const u = await prisma.user.findFirst({
    where: { email: c.email },
    select: { id: true, email: true, firstName: true, lastName: true, userType: true },
  });
  if (u) haveAccount.push(u);
  else orphans.push(c);
}

console.log(`Avec compte User : ${haveAccount.length}`);
console.log(`Orphelins (pas de User, joignables uniquement par email) : ${orphans.length}`);

// Skip ceux qui ont déjà reçu ce type de message
const skipIds = new Set();
for (const u of haveAccount) {
  const existing = await prisma.message.findFirst({
    where: {
      senderId: admin.id,
      receiverId: u.id,
      content: { contains: 'premier client' },
    },
  });
  if (existing) skipIds.add(u.id);
}
const toSend = haveAccount.filter(u => !skipIds.has(u.id));
console.log(`Déjà contactés avec ce template (skip) : ${skipIds.size}`);
console.log(`À envoyer : ${toSend.length}`);

if (!APPLY) {
  console.log('\n=== DRY-RUN — 2 exemples ===\n');
  toSend.slice(0, 2).forEach(u => {
    console.log(`--- [${u.userType || '?'}] ${u.email} (${_fix(u.firstName)}) ---`);
    console.log(buildMessage(_fix(u.firstName), u.userType || 'PROVIDER'));
    console.log();
  });
  console.log(`\nOrphelins (joignables uniquement via Brevo email) :`);
  orphans.forEach(o => console.log(`  [${o.userType || '?'}] ${o.email} — ${o.firstName} ${o.lastName}`));
  console.log(`\nRelance avec --apply pour insérer ${toSend.length} Message + Notification.`);
  await prisma.$disconnect();
  process.exit(0);
}

let inserted = 0;
for (const u of toSend) {
  const content = buildMessage(_fix(u.firstName), u.userType || 'PROVIDER');
  await prisma.$transaction([
    prisma.message.create({
      data: { senderId: admin.id, receiverId: u.id, content },
    }),
    prisma.notification.create({
      data: {
        userId: u.id,
        type: 'MESSAGE_NEW',
        title: 'Nouveau message — Équipe Mada Spot',
        message: 'Décrochez votre premier client en 1 clic',
      },
    }),
  ]);
  inserted++;
  if (inserted % 10 === 0) console.log(`  ${inserted}/${toSend.length}`);
}
console.log(`\n✅ ${inserted} messages in-app insérés.`);
console.log(`\nReste ${orphans.length} orphelins joignables uniquement par email Brevo. À faire séparément si souhaité.`);

await prisma.$disconnect();
