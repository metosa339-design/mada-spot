import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const CAMPAIGN_START = new Date('2026-03-29T00:00:00Z');

console.log('=== Cross-checks pour "combien d\'inscriptions" depuis 2026-03-29 ===\n');

// 1. All users by role (any time + since campaign)
const allByRole = await prisma.user.groupBy({ by:['role'], _count:{ _all:true } });
const sinceByRole = await prisma.user.groupBy({ by:['role'], _count:{ _all:true }, where:{ createdAt:{ gte: CAMPAIGN_START } } });
console.log('Users by role (total / since campaign):');
const roleMap = Object.fromEntries(sinceByRole.map(r=>[r.role, r._count._all]));
allByRole.forEach(r => console.log(`  ${r.role}: ${r._count._all} total / ${roleMap[r.role]||0} since`));

// 2. Users by userType (any time + since campaign)
const allByType = await prisma.user.groupBy({ by:['userType'], _count:{ _all:true } });
const sinceByType = await prisma.user.groupBy({ by:['userType'], _count:{ _all:true }, where:{ createdAt:{ gte: CAMPAIGN_START } } });
console.log('\nUsers by userType (total / since campaign):');
const typeMap = Object.fromEntries(sinceByType.map(t=>[String(t.userType), t._count._all]));
allByType.forEach(t => console.log(`  ${t.userType||'(null)'}: ${t._count._all} total / ${typeMap[String(t.userType)]||0} since`));

// 3. Cross: users with userType set, by role
const cross = await prisma.user.groupBy({
  by:['role','userType'],
  _count:{ _all:true },
  where:{ createdAt:{ gte: CAMPAIGN_START }, userType:{ not: null } }
});
console.log('\nSince campaign — role × userType:');
cross.forEach(c => console.log(`  ${c.role} + ${c.userType}: ${c._count._all}`));

// 4. Establishment ownership: how many distinct ownerIds since campaign?
const estabsSince = await prisma.establishment.count({ where:{ createdAt:{ gte: CAMPAIGN_START } } });
const distinctOwners = await prisma.establishment.findMany({
  where:{ createdAt:{ gte: CAMPAIGN_START } },
  select:{ createdByUserId:true, claimedByUserId:true, type:true, isClaimed:true }
});
const ownerIds = new Set(distinctOwners.map(e=>e.createdByUserId||e.claimedByUserId).filter(Boolean));
const typeBreak = {};
distinctOwners.forEach(e=>{ typeBreak[e.type||'?']=(typeBreak[e.type||'?']||0)+1; });
console.log(`\nEstablishments since campaign: ${estabsSince}`);
console.log(`  Distinct owners: ${ownerIds.size}`);
console.log('  By type:', typeBreak);

// 5. PendingRegistration breakdown
try {
  const pending = await prisma.pendingRegistration.count();
  const pendingSince = await prisma.pendingRegistration.count({ where:{ createdAt:{ gte: CAMPAIGN_START } } }).catch(()=>'no createdAt');
  console.log(`\nPendingRegistration: ${pending} total / ${pendingSince} since`);
} catch(e) { console.log('PendingRegistration: err', e.message); }

// 6. Provider model
const provSince = await prisma.provider.count({ where:{ createdAt:{ gte: CAMPAIGN_START } } }).catch(()=>null);
const provTotal = await prisma.provider.count();
console.log(`\nProvider model: ${provTotal} total / ${provSince ?? 'no createdAt field'} since`);

// 7. Unique counting: users with userType not null since campaign (no double-count)
const uniquePros = await prisma.user.count({ where:{ createdAt:{ gte: CAMPAIGN_START }, userType:{ not: null } } });
console.log(`\n** Unique users with userType set since campaign: ${uniquePros} **`);

// 8. Duplicates check: same email?
const emails = await prisma.user.findMany({ where:{ createdAt:{ gte: CAMPAIGN_START }, userType:{ not: null } }, select:{ email:true } });
const emailCounts = {};
emails.forEach(u=>{ if(u.email) emailCounts[u.email]=(emailCounts[u.email]||0)+1; });
const dupes = Object.entries(emailCounts).filter(([_,n])=>n>1);
console.log(`Duplicate emails among typed signups: ${dupes.length}`, dupes.slice(0,5));

await prisma.$disconnect();
