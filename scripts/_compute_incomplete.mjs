// Calcule la cible "fiche à compléter" :
// - Cas A : user typé pro sans aucun établissement (à CRÉER)
// - Cas B : user typé pro avec établissement(s) mais champ(s) critique(s) manquants
//
// Champs critiques pour une fiche utile : description, coverImage, phone, address

import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
const CAMPAIGN_START = new Date('2026-03-29T00:00:00Z');
const OUT = 'C:/Users/ISIM NICE/Desktop/campagne madaspot/incomplete_targets.json';

const pros = await prisma.user.findMany({
  where: { createdAt: { gte: CAMPAIGN_START }, userType: { not: null }, email: { not: null } },
  select: { id: true, email: true, firstName: true, lastName: true, userType: true, emailVerified: true, lastLoginAt: true, createdAt: true }
});

const A_no_establishment = [];
const B_incomplete_establishment = [];
const C_complete = [];

for (const u of pros) {
  const ests = await prisma.establishment.findMany({
    where: { OR: [{ createdByUserId: u.id }, { claimedByUserId: u.id }] },
    select: { id: true, name: true, description: true, coverImage: true, images: true, phone: true, address: true, city: true, type: true }
  });

  if (ests.length === 0) {
    A_no_establishment.push({
      email: u.email, firstName: u.firstName, lastName: u.lastName,
      userType: u.userType, emailVerified: u.emailVerified,
    });
    continue;
  }

  // Check completeness of best establishment
  const incomplete = ests.map(e => {
    const missing = [];
    if (!e.description || e.description.length < 50) missing.push('description');
    if (!e.coverImage && (!e.images || e.images === '[]' || e.images === 'null')) missing.push('photos');
    if (!e.phone) missing.push('téléphone');
    if (!e.address) missing.push('adresse');
    return missing.length > 0 ? { ...e, missing } : null;
  }).filter(Boolean);

  if (incomplete.length > 0) {
    const worst = incomplete[0];
    B_incomplete_establishment.push({
      email: u.email, firstName: u.firstName, lastName: u.lastName,
      userType: u.userType, emailVerified: u.emailVerified,
      establishmentName: worst.name,
      establishmentId: worst.id,
      missing: worst.missing,
      establishmentsTotal: ests.length,
    });
  } else {
    C_complete.push({ email: u.email, firstName: u.firstName, userType: u.userType });
  }
}

console.log(`Pros typés depuis campagne : ${pros.length}`);
console.log(`  A — Sans aucun établissement : ${A_no_establishment.length}`);
console.log(`     dont vérifiés : ${A_no_establishment.filter(u => u.emailVerified).length}`);
console.log(`     dont non vérifiés : ${A_no_establishment.filter(u => !u.emailVerified).length}`);
console.log(`  B — Avec établissement mais incomplet : ${B_incomplete_establishment.length}`);
console.log(`  C — Avec établissement complet : ${C_complete.length}`);

// Breakdown des champs manquants dans B
const missingCounts = {};
B_incomplete_establishment.forEach(u => u.missing.forEach(m => { missingCounts[m] = (missingCounts[m]||0) + 1; }));
console.log('\n  Champs manquants dans B :', missingCounts);

const out = { A_no_establishment, B_incomplete_establishment };
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf-8');
console.log(`\nExporté vers ${OUT}`);

await prisma.$disconnect();
