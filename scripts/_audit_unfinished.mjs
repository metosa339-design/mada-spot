import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const CAMPAIGN_START = new Date('2026-03-29T00:00:00Z');
const NOW = new Date();

// --- Group A: PendingRegistration (jamais validé l'OTP) ---
const pending = await prisma.pendingRegistration.findMany({
  where: { createdAt: { gte: CAMPAIGN_START } },
  select: { email:true, phone:true, firstName:true, lastName:true, userType:true, expiresAt:true, createdAt:true }
});
const pendingActive = pending.filter(p => p.expiresAt > NOW);
const pendingExpired = pending.filter(p => p.expiresAt <= NOW);
console.log(`PendingRegistration: ${pending.length} total`);
console.log(`  - actif (expiresAt futur): ${pendingActive.length}`);
console.log(`  - expiré (>24h, OTP mort): ${pendingExpired.length}`);
console.log(`  - avec email: ${pending.filter(p=>p.email).length}`);
console.log(`  - sans email (téléphone only): ${pending.filter(p=>!p.email).length}`);
const ptypes = {};
pending.forEach(p => { ptypes[p.userType||'(null)']=(ptypes[p.userType||'(null)']||0)+1; });
console.log('  by userType:', ptypes);

// --- Group B: Comptes créés mais email non vérifié ---
const unverifiedUsers = await prisma.user.findMany({
  where: { createdAt:{ gte: CAMPAIGN_START }, userType:{ not: null }, emailVerified: false, email: { not: null } },
  select: { email:true, firstName:true, lastName:true, userType:true, createdAt:true }
});
console.log(`\nComptes créés, userType set, email non vérifié: ${unverifiedUsers.length}`);
const utypes = {};
unverifiedUsers.forEach(u => { utypes[u.userType||'(null)']=(utypes[u.userType||'(null)']||0)+1; });
console.log('  by userType:', utypes);

// --- Group C: Comptes vérifiés mais SANS établissement créé ---
const verifiedNoEst = await prisma.user.findMany({
  where: {
    createdAt:{ gte: CAMPAIGN_START },
    userType:{ not: null },
    emailVerified: true,
    email: { not: null },
  },
  select: { id:true, email:true, firstName:true, lastName:true, userType:true, createdAt:true }
});
const noEstabUsers = [];
for (const u of verifiedNoEst) {
  const n = await prisma.establishment.count({ where:{ OR:[{ createdByUserId: u.id }, { claimedByUserId: u.id }] } });
  if (n === 0) noEstabUsers.push(u);
}
console.log(`\nComptes vérifiés mais sans établissement: ${noEstabUsers.length}`);

// --- Group D: Comptes typés non vérifiés ET sans établissement (le pire des cas, "abandon total") ---
const allTypedSince = await prisma.user.findMany({
  where: { createdAt:{ gte: CAMPAIGN_START }, userType:{ not: null }, email:{ not: null } },
  select: { id:true, email:true, firstName:true, lastName:true, userType:true, emailVerified:true, createdAt:true }
});
const stuck = [];
for (const u of allTypedSince) {
  const n = await prisma.establishment.count({ where:{ OR:[{ createdByUserId: u.id }, { claimedByUserId: u.id }] } });
  if (n === 0) stuck.push({ ...u, hasEstablishment: false });
}
console.log(`\nTOTAL "pas finalisé" (compte créé, 0 établissement): ${stuck.length}`);
const stuckTypes = {};
stuck.forEach(u => { stuckTypes[u.userType]=(stuckTypes[u.userType]||0)+1; });
console.log('  by userType:', stuckTypes);
const stuckVerif = { verified: stuck.filter(u=>u.emailVerified).length, unverified: stuck.filter(u=>!u.emailVerified).length };
console.log('  verified/unverified:', stuckVerif);

// Affiche 10 exemples pour validation visuelle
console.log('\nExemples "pas finalisé":');
stuck.slice(0,10).forEach(u => console.log(`  ${u.userType} ${u.email} - ${u.firstName} ${u.lastName} verif=${u.emailVerified}`));

console.log('\nExemples PendingRegistration (OTP non saisi):');
pending.filter(p=>p.email).slice(0,10).forEach(p => console.log(`  ${p.userType} ${p.email} - ${p.firstName} ${p.lastName} expired=${p.expiresAt<=NOW}`));

await prisma.$disconnect();
