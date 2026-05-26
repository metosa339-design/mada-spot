// Migration : suppression de l'étape OTP/PendingRegistration.
// 1. Marque tous les Users avec emailVerified=false / isVerified=false comme vérifiés
// 2. Supprime toutes les PendingRegistration (devenues inutiles)
//
// Effets côté UI :
//   - La bannière "Confirmez votre adresse email" disparaît
//   - La page /verify-account devient inutile (peut être supprimée plus tard)
//   - Les futurs inscrits arrivent direct vérifiés via le nouveau register/route.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 1. Promote unverified users to verified
const beforeUnverified = await prisma.user.count({
  where: { OR: [{ emailVerified: false }, { isVerified: false }] }
});
console.log(`Users avec emailVerified=false OR isVerified=false : ${beforeUnverified}`);

const updated = await prisma.user.updateMany({
  where: { OR: [{ emailVerified: false }, { isVerified: false }] },
  data: { emailVerified: true, isVerified: true },
});
console.log(`  → ${updated.count} users mis à jour (verified=true)`);

// 2. Drop all pending registrations
const beforePending = await prisma.pendingRegistration.count();
console.log(`\nPendingRegistration en base : ${beforePending}`);

const deleted = await prisma.pendingRegistration.deleteMany({});
console.log(`  → ${deleted.count} PendingRegistration supprimées`);

// 3. Verify final state
const afterUnverified = await prisma.user.count({
  where: { OR: [{ emailVerified: false }, { isVerified: false }] }
});
const afterPending = await prisma.pendingRegistration.count();
console.log(`\n=== État final ===`);
console.log(`  Users non vérifiés restants : ${afterUnverified}`);
console.log(`  PendingRegistration restantes : ${afterPending}`);

await prisma.$disconnect();
