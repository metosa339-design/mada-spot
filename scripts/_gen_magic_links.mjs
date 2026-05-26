// Génère des magic-links de vérification pour la cohorte B "jamais reconnectés".
// - Filtre: createdAt >= CAMPAIGN_START, userType set, emailVerified=false,
//   et (lastLoginAt IS NULL OR lastLoginAt <= createdAt + 1min)
// - Crée une PasswordReset row par user (token utilisé par GET /api/auth/verify-email)
// - Expiration: 14 jours (laisse le temps de cliquer même tardivement)
// - Exporte vers campagne madaspot/relance_magic_targets.json

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';

const prisma = new PrismaClient();
const CAMPAIGN_START = new Date('2026-03-29T00:00:00Z');
const TOKEN_EXPIRES_AT = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
const OUT = 'C:/Users/ISIM NICE/Desktop/campagne madaspot/relance_magic_targets.json';

const candidates = await prisma.user.findMany({
  where: {
    createdAt: { gte: CAMPAIGN_START },
    userType: { not: null },
    emailVerified: false,
    email: { not: null },
  },
  select: { id: true, email: true, firstName: true, lastName: true, userType: true, createdAt: true, lastLoginAt: true },
});

// "Jamais reconnectés" = lastLoginAt NULL, ou <= createdAt + 60s (= juste session initiale)
const targets = candidates.filter(u => {
  if (!u.lastLoginAt) return true;
  const diffMs = u.lastLoginAt.getTime() - u.createdAt.getTime();
  return diffMs <= 60 * 1000;
});

console.log(`Candidats unverified: ${candidates.length}`);
console.log(`Jamais reconnectés (cible magic-link): ${targets.length}`);

const out = [];
for (const u of targets) {
  const token = crypto.randomBytes(32).toString('hex');
  // Crée la ligne PasswordReset que GET /api/auth/verify-email consomme
  await prisma.passwordReset.create({
    data: {
      email: u.email,
      token,
      expiresAt: TOKEN_EXPIRES_AT,
    },
  });
  out.push({
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    userType: u.userType,
    token,
  });
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf-8');
console.log(`\n${out.length} tokens créés, exportés vers ${OUT}`);
console.log(`Expiration: ${TOKEN_EXPIRES_AT.toISOString()}`);

await prisma.$disconnect();
