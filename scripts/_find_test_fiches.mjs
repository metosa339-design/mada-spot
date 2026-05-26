import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const CAMPAIGN_START = new Date('2026-03-29T00:00:00Z');

const all = await prisma.establishment.findMany({
  where: {
    createdAt: { gte: CAMPAIGN_START },
    OR: [{ createdByUserId: { not: null } }, { isClaimed: true }],
  },
  select: {
    id: true, name: true, type: true, city: true, description: true,
    phone: true, coverImage: true, images: true, moderationStatus: true, isActive: true,
    createdAt: true,
  },
});

console.log(`Total fiches user-créées: ${all.length}\n`);

const tests = [];
const suspects = [];
const legit = [];

for (const e of all) {
  const name = (e.name || '').trim();
  const desc = (e.description || '').trim();
  const reasons = [];

  // Vide
  if (!name) reasons.push('name vide');
  // Très court (< 4 caractères)
  else if (name.length < 4) reasons.push(`name trop court ("${name}")`);
  // Gibberish: pas d'espace, mix consonnes-only, ratio voyelles/consonnes faible
  else if (!name.includes(' ') && name.length < 8) {
    const vowels = (name.toLowerCase().match(/[aeiouy]/g) || []).length;
    const ratio = vowels / name.length;
    if (ratio < 0.2 || ratio > 0.7) reasons.push(`gibberish probable ("${name}", ratio voyelles=${ratio.toFixed(2)})`);
  }
  // Mots-clés test évidents
  if (/^(test|asd|xxx|qwerty|aaa|bbb|abc)/i.test(name)) reasons.push(`mot-clé test ("${name}")`);
  // Description et photos vides : fiche jamais complétée
  const noPhoto = !e.coverImage && (!e.images || e.images === '[]' || e.images === 'null');
  const noDesc = desc.length < 30;
  if (noPhoto && noDesc && !e.phone) reasons.push('zéro contenu (no desc, no photo, no phone)');

  if (reasons.length >= 2) tests.push({ ...e, reasons });
  else if (reasons.length === 1) suspects.push({ ...e, reasons });
  else legit.push(e);
}

console.log(`=== TESTS PROBABLES (${tests.length}) — au moins 2 signaux ===`);
tests.forEach(e => console.log(`  [${e.type}] "${e.name}" — ${e.reasons.join(' + ')} (active=${e.isActive}, mod=${e.moderationStatus}, created=${e.createdAt.toISOString().slice(0,10)})`));

console.log(`\n=== SUSPECTS (${suspects.length}) — 1 seul signal, à regarder ===`);
suspects.slice(0, 15).forEach(e => console.log(`  [${e.type}] "${e.name}" — ${e.reasons[0]}`));
if (suspects.length > 15) console.log(`  ... et ${suspects.length - 15} autres`);

console.log(`\n=== LÉGITIMES (${legit.length}) ===`);

await prisma.$disconnect();
