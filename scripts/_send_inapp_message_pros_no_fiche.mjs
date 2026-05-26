// Envoie un message in-app (Message + Notification) à chaque pro typé
// qui n'a JAMAIS publié de fiche.
// - Expéditeur : utilisateur ADMIN existant
// - Personnalisation : prénom + libellé userType + ancienneté du compte
// - DRY-RUN par défaut. Passe --apply pour insérer en DB.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const CAMPAIGN_START = new Date('2026-03-29T00:00:00Z');

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

const buildMessage = (firstName, userType, ageInDays) => {
  const lbl = LABEL[userType] || LABEL.PROVIDER;
  const ageStr = ageInDays < 2
    ? "ces dernières heures"
    : ageInDays < 7
      ? `il y a ${Math.round(ageInDays)} jours`
      : ageInDays < 30
        ? `il y a ${Math.round(ageInDays)} jours`
        : `il y a environ ${Math.round(ageInDays / 30)} mois`;

  return `Bonjour ${firstName},

J'ai vu que vous aviez créé votre compte Mada Spot pour ${lbl.thing} ${ageStr}, mais que votre fiche n'est pas encore publiée.

C'est l'étape qui rend ${lbl.article} visible auprès des voyageurs qui consultent la plateforme — sans ça, votre compte existe mais personne ne peut vous trouver.

Publier votre fiche prend 5 minutes :
→ https://madaspot.com/inscrire-etablissement

(photos, prix, contacts, horaires : tout est éditable plus tard)

Si vous bloquez sur une étape (photos à préparer, géolocalisation, description…), répondez directement à ce message — on vous accompagne.

À très vite,
L'équipe Mada Spot`;
};

const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
if (!admin) { console.error('Aucun ADMIN trouvé.'); process.exit(1); }
console.log(`Expéditeur ADMIN : ${admin.email} (id=${admin.id})`);

const pros = await prisma.user.findMany({
  where: { createdAt: { gte: CAMPAIGN_START }, userType: { not: null } },
  select: { id: true, email: true, firstName: true, lastName: true, userType: true, createdAt: true },
});

const noFicheTargets = [];
for (const u of pros) {
  const cnt = await prisma.establishment.count({
    where: { OR: [{ createdByUserId: u.id }, { claimedByUserId: u.id }] },
  });
  if (cnt === 0) noFicheTargets.push(u);
}

const now = Date.now();
console.log(`Pros sans aucune fiche : ${noFicheTargets.length}`);

// Skip ceux qui ont déjà reçu ce type de message (anti-doublon par contenu prefix)
const PREFIX = 'Bonjour ';
const PREFIX2 = 'créé votre compte Mada Spot';
const skipIds = new Set();
for (const u of noFicheTargets) {
  const existing = await prisma.message.findFirst({
    where: {
      senderId: admin.id,
      receiverId: u.id,
      content: { contains: 'compte Mada Spot' },
    },
  });
  if (existing) skipIds.add(u.id);
}
const finalTargets = noFicheTargets.filter(u => !skipIds.has(u.id));
console.log(`Déjà contactés (skip) : ${skipIds.size}`);
console.log(`À traiter : ${finalTargets.length}`);

if (!APPLY) {
  console.log('\n=== DRY-RUN — 3 exemples ===\n');
  finalTargets.slice(0, 3).forEach(u => {
    const ageDays = (now - u.createdAt.getTime()) / 86400000;
    const msg = buildMessage(_fix(u.firstName), u.userType, ageDays);
    console.log(`--- [${u.userType}] ${u.email} (${ageDays.toFixed(0)}j) ---`);
    console.log(msg);
    console.log();
  });
  console.log(`Relance avec --apply pour insérer ${finalTargets.length} Message + Notification.`);
  await prisma.$disconnect();
  process.exit(0);
}

// APPLY: insert messages + notifications
let inserted = 0;
for (const u of finalTargets) {
  const ageDays = (now - u.createdAt.getTime()) / 86400000;
  const content = buildMessage(_fix(u.firstName), u.userType, ageDays);

  await prisma.$transaction([
    prisma.message.create({
      data: {
        senderId: admin.id,
        receiverId: u.id,
        content,
      },
    }),
    prisma.notification.create({
      data: {
        userId: u.id,
        type: 'MESSAGE_NEW',
        title: 'Nouveau message — Équipe Mada Spot',
        message: 'Conseils pour publier votre fiche en 5 minutes',
      },
    }),
  ]);

  inserted++;
  if (inserted % 10 === 0) console.log(`  ${inserted}/${finalTargets.length}`);
}
console.log(`\n✅ ${inserted} messages + notifications insérés.`);

await prisma.$disconnect();
