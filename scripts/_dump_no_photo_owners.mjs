// Extract owners of fiches without any photo (cover + gallery empty).
// Output: campagne madaspot/no_photo_owners.json
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
const CAMPAIGN_START = new Date('2026-03-29T00:00:00Z');
const OUT = 'C:/Users/ISIM NICE/Desktop/campagne madaspot/no_photo_owners.json';

const isEmpty = (v) => !v || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
const parseImages = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { const j = JSON.parse(raw); return Array.isArray(j) ? j : []; } catch { return []; }
};

const ests = await prisma.establishment.findMany({
  where: { createdAt: { gte: CAMPAIGN_START } },
  select: {
    id: true, slug: true, name: true, type: true, city: true,
    coverImage: true, images: true,
    createdByUserId: true, claimedByUserId: true,
  },
});

const noPhoto = ests.filter(e => isEmpty(e.coverImage) && parseImages(e.images).length === 0);

const userIds = new Set();
noPhoto.forEach(e => {
  if (e.createdByUserId) userIds.add(e.createdByUserId);
  if (e.claimedByUserId) userIds.add(e.claimedByUserId);
});

const users = await prisma.user.findMany({
  where: { id: { in: [...userIds] }, email: { not: null } },
  select: { id: true, email: true, firstName: true, lastName: true },
});
const usersById = Object.fromEntries(users.map(u => [u.id, u]));

const out = [];
const seenEmails = new Set();
for (const e of noPhoto) {
  const u = usersById[e.createdByUserId] || usersById[e.claimedByUserId];
  if (!u || !u.email || seenEmails.has(u.email.toLowerCase())) continue;
  seenEmails.add(u.email.toLowerCase());
  out.push({
    email: u.email,
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    establishmentName: e.name,
    establishmentType: e.type,
    city: e.city,
    slug: e.slug,
  });
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf-8');
console.log(`Fiches sans photo: ${noPhoto.length}`);
console.log(`Owners distincts avec email: ${out.length}`);
console.log(`Exporté vers ${OUT}`);
out.slice(0, 5).forEach(o => console.log(`  ${o.email} | ${o.establishmentName} (${o.establishmentType})`));

await prisma.$disconnect();
