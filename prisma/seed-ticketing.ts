// Mada Spot — Seed billetterie (démo de bout en bout).
// Crée (idempotent) : la config de commissions, un organisateur, un agent de
// contrôle, un vendeur POS, et un événement publié avec des types de billets.
//
// Lancer : npm run db:seed:ticketing

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'MadaSpot2026!';

async function upsertUser(opts: {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: 'ORGANIZER' | 'AGENT' | 'POS_VENDOR';
}) {
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email: opts.email },
    update: { role: opts.role, phone: opts.phone, isActive: true, isVerified: true },
    create: {
      email: opts.email,
      phone: opts.phone,
      firstName: opts.firstName,
      lastName: opts.lastName,
      password: passwordHash,
      role: opts.role,
      isActive: true,
      isVerified: true,
      emailVerified: true,
    },
    select: { id: true, email: true, role: true },
  });
}

async function main() {
  console.log('🎟️  Seed billetterie Mada Spot…\n');

  // 1) Config de commissions (ligne unique)
  await prisma.ticketingConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  console.log('  ✅ Configuration des commissions');

  // 2) Comptes de démonstration
  const organizer = await upsertUser({
    email: 'organisateur.demo@madaspot.mg',
    phone: '+261340000001',
    firstName: 'Organisateur',
    lastName: 'Démo',
    role: 'ORGANIZER',
  });
  const agent = await upsertUser({
    email: 'agent.demo@madaspot.mg',
    phone: '+261340000002',
    firstName: 'Agent',
    lastName: 'Contrôle',
    role: 'AGENT',
  });
  const vendor = await upsertUser({
    email: 'pos.demo@madaspot.mg',
    phone: '+261340000003',
    firstName: 'Vendeur',
    lastName: 'Guichet',
    role: 'POS_VENDOR',
  });
  await prisma.posWallet.upsert({
    where: { vendorId: vendor.id },
    update: {},
    create: { vendorId: vendor.id },
  });
  console.log('  ✅ Comptes : organisateur, agent, vendeur POS');

  // 3) Événement publié, appartenant à l'organisateur
  const startDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
  const event = await prisma.event.upsert({
    where: { slug: 'concert-demo-madaspot' },
    update: { submittedByUserId: organizer.id, status: 'APPROVED', startDate, endDate },
    create: {
      title: 'Concert Démo MadaSpot',
      slug: 'concert-demo-madaspot',
      description: 'Événement de démonstration pour tester la billetterie de bout en bout.',
      startDate,
      endDate,
      location: 'Palais des Sports Mahamasina',
      city: 'Antananarivo',
      region: 'Analamanga',
      category: 'FESTIVAL',
      status: 'APPROVED',
      organizer: 'Organisateur Démo',
      submittedByUserId: organizer.id,
    },
    select: { id: true, slug: true },
  });
  console.log(`  ✅ Événement : ${event.slug}`);

  // 4) Types de billets (seulement si l'événement n'en a pas encore)
  const existing = await prisma.ticketType.count({ where: { eventId: event.id } });
  if (existing === 0) {
    await prisma.ticketType.createMany({
      data: [
        { eventId: event.id, name: 'Standard', priceMga: 20000, totalQuantity: 500, remainingQuantity: 500, maxPerOrder: 10 },
        { eventId: event.id, name: 'VIP', priceMga: 60000, totalQuantity: 100, remainingQuantity: 100, maxPerOrder: 6 },
        { eventId: event.id, name: 'Pass 2 jours', priceMga: 100000, totalQuantity: 50, remainingQuantity: 50, maxPerOrder: 4 },
      ],
    });
    console.log('  ✅ 3 types de billets créés (Standard, VIP, Pass 2 jours)');
  } else {
    console.log(`  ↷ Types de billets déjà présents (${existing}), aucun ajout`);
  }

  console.log('\n🎉 Seed billetterie terminé.');
  console.log('   Comptes de démo (mot de passe commun) :');
  console.log(`   • Organisateur : organisateur.demo@madaspot.mg`);
  console.log(`   • Agent scan   : agent.demo@madaspot.mg`);
  console.log(`   • Vendeur POS  : pos.demo@madaspot.mg`);
  console.log(`   • Mot de passe : ${DEMO_PASSWORD}`);
  console.log(`   Événement      : /evenements/${event.slug}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed billetterie:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
