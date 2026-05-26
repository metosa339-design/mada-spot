import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const CAMPAIGN_START = new Date('2026-03-29T00:00:00Z');

// 1. Verified users since campaign — were they verified within minutes of signup ?
const verified = await prisma.user.findMany({
  where: { createdAt: { gte: CAMPAIGN_START }, emailVerified: true, userType: { not: null } },
  select: { email: true, firstName: true, userType: true, createdAt: true, lastLoginAt: true }
});
console.log(`Verified pros depuis campagne: ${verified.length}`);
console.log('Échantillon (createdAt + lastLogin):');
verified.slice(0, 10).forEach(u => {
  console.log(`  ${u.userType.padEnd(10)} ${u.email} - création ${u.createdAt.toISOString().slice(0,16)} - last login ${u.lastLoginAt? u.lastLoginAt.toISOString().slice(0,16) : 'JAMAIS'}`);
});

// 2. Unverified — ont-ils essayé de se connecter ?
const unverified = await prisma.user.findMany({
  where: { createdAt: { gte: CAMPAIGN_START }, emailVerified: false, userType: { not: null } },
  select: { email: true, firstName: true, userType: true, createdAt: true, lastLoginAt: true }
});
const unverif_loggedin = unverified.filter(u => u.lastLoginAt && u.lastLoginAt > u.createdAt);
console.log(`\nNon vérifiés (${unverified.length}):`);
console.log(`  - se sont reconnectés au moins une fois: ${unverif_loggedin.length}`);
console.log(`  - jamais reconnectés: ${unverified.length - unverif_loggedin.length}`);

// 3. PendingRegistration encore actives = OTP en attente
const pendingActive = await prisma.pendingRegistration.count({
  where: { expiresAt: { gt: new Date() }, otpExpiresAt: { gt: new Date() } }
});
console.log(`\nPending avec OTP encore valide (last 24h): ${pendingActive}`);

// 4. PasswordReset = aussi utilisé pour verify-email link flow
const recentResets = await prisma.passwordReset.count({
  where: { createdAt: { gte: new Date(Date.now() - 7*24*3600*1000) } }
}).catch(()=>'no createdAt');
console.log(`PasswordReset créés ces 7 derniers jours: ${recentResets}`);

await prisma.$disconnect();
