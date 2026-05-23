import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';

const prisma = new PrismaClient();
const sqlite = new Database('C:/Users/ISIM NICE/Desktop/campagne madaspot/outreach_tracking.db', { readonly: true });

const sentRows = sqlite.prepare(`
  SELECT email, name, type, city, sent_at
  FROM contacts
  WHERE status='sent' AND date(sent_at) < date('now','localtime')
`).all();

const sentEmails = new Set(sentRows.map(r => r.email.toLowerCase()));
console.log(`Brevo sent (avant aujourdhui): ${sentRows.length}`);

const owners = await prisma.establishment.findMany({
  select: {
    createdBy: { select: { email: true } },
    claimedBy: { select: { email: true } },
  }
});

const ownerEmails = new Set();
owners.forEach(e => {
  if (e.createdBy?.email) ownerEmails.add(e.createdBy.email.toLowerCase());
  if (e.claimedBy?.email) ownerEmails.add(e.claimedBy.email.toLowerCase());
});
console.log(`Owners d etablissement (Neon): ${ownerEmails.size}`);

const matched = [...ownerEmails].filter(e => sentEmails.has(e));
console.log(`Match Brevo<->Neon owner: ${matched.length}`);

const toRelance = sentRows.filter(r => !ownerEmails.has(r.email.toLowerCase()));
console.log(`Cible relance: ${toRelance.length}`);

console.log('\n=== 5 a relancer ===');
toRelance.slice(0,5).forEach(p => console.log(`  ${p.email} | ${p.name} | ${p.type}`));

const byType = {};
toRelance.forEach(r => { byType[r.type||'?'] = (byType[r.type||'?']||0) + 1; });
console.log('\n=== Cible par type ===');
Object.entries(byType).sort((a,b)=>b[1]-a[1]).forEach(([t,n]) => console.log(`  ${t}: ${n}`));

await prisma.$disconnect();
sqlite.close();
