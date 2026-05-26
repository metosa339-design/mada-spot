import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();
const CAMPAIGN_START = new Date('2026-03-29T00:00:00Z');
const NOW = new Date();
const OUT = 'C:/Users/ISIM NICE/Desktop/campagne madaspot/relance_targets.json';

const pending = await prisma.pendingRegistration.findMany({
  where: { createdAt: { gte: CAMPAIGN_START }, email: { not: null } },
  select: { email: true, firstName: true, lastName: true, userType: true, expiresAt: true }
});
const A_otp_expired = pending.filter(p => p.expiresAt <= NOW).map(p => ({
  email: p.email, firstName: p.firstName, lastName: p.lastName, userType: p.userType
}));

const usersTyped = await prisma.user.findMany({
  where: { createdAt: { gte: CAMPAIGN_START }, userType: { not: null }, email: { not: null } },
  select: { id: true, email: true, firstName: true, lastName: true, userType: true, emailVerified: true }
});

const B_unverified = usersTyped.filter(u => !u.emailVerified)
  .map(({ email, firstName, lastName, userType }) => ({ email, firstName, lastName, userType }));

const C_no_establishment = [];
for (const u of usersTyped.filter(u => u.emailVerified)) {
  const n = await prisma.establishment.count({
    where: { OR: [{ createdByUserId: u.id }, { claimedByUserId: u.id }] }
  });
  if (n === 0) {
    C_no_establishment.push({ email: u.email, firstName: u.firstName, lastName: u.lastName, userType: u.userType });
  }
}

const out = { A_otp_expired, B_unverified, C_no_establishment };
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf-8');
console.log(`Exported to ${OUT}`);
console.log(`  A_otp_expired: ${A_otp_expired.length}`);
console.log(`  B_unverified: ${B_unverified.length}`);
console.log(`  C_no_establishment: ${C_no_establishment.length}`);
console.log(`  Total: ${A_otp_expired.length + B_unverified.length + C_no_establishment.length}`);

await prisma.$disconnect();
