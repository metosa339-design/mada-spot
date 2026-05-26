import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const NEEDLES = ['dreamjourney', 'dream journey', 'dream-journey'];

// Users
console.log('=== USERS ===');
for (const needle of NEEDLES) {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: needle, mode: 'insensitive' } },
        { firstName: { contains: needle, mode: 'insensitive' } },
        { lastName: { contains: needle, mode: 'insensitive' } },
      ]
    },
    select: { id: true, email: true, firstName: true, lastName: true, userType: true, role: true, emailVerified: true, createdAt: true, lastLoginAt: true }
  });
  users.forEach(u => console.log(`  [${u.userType||u.role}] <${u.email}> "${u.firstName} ${u.lastName}" created ${u.createdAt.toISOString().slice(0,16)} verif=${u.emailVerified} lastLogin=${u.lastLoginAt?.toISOString().slice(0,16) || 'NEVER'}`));
}

// PendingRegistration
console.log('\n=== PENDING ===');
const pending = await prisma.pendingRegistration.findMany({
  where: {
    OR: NEEDLES.flatMap(n => [
      { email: { contains: n, mode: 'insensitive' } },
      { firstName: { contains: n, mode: 'insensitive' } },
      { lastName: { contains: n, mode: 'insensitive' } },
    ])
  },
  select: { email: true, firstName: true, lastName: true, userType: true, expiresAt: true, createdAt: true, otpExpiresAt: true }
});
pending.forEach(p => console.log(`  <${p.email}> "${p.firstName} ${p.lastName}" type=${p.userType} created ${p.createdAt.toISOString().slice(0,16)} OTPexp=${p.otpExpiresAt.toISOString().slice(0,16)} (active=${p.expiresAt > new Date()})`));
if (!pending.length) console.log('  (none)');

// Establishments
console.log('\n=== ESTABLISHMENTS ===');
const ests = await prisma.establishment.findMany({
  where: { name: { contains: 'dream', mode: 'insensitive' } },
  select: { id: true, name: true, type: true, city: true, isActive: true, createdAt: true, createdByUserId: true, claimedByUserId: true, isClaimed: true, description: true, phone: true, coverImage: true }
});
ests.forEach(e => {
  console.log(`  [${e.type}] "${e.name}" city=${e.city} active=${e.isActive} claimed=${e.isClaimed} created=${e.createdAt.toISOString().slice(0,16)}`);
  console.log(`     owner: created=${e.createdByUserId || '-'} claimed=${e.claimedByUserId || '-'}`);
  console.log(`     desc=${e.description ? `"${e.description.slice(0,60)}..."` : 'EMPTY'} phone=${e.phone || 'EMPTY'} cover=${e.coverImage ? 'OK' : 'EMPTY'}`);
});
if (!ests.length) console.log('  (none matching "dream")');

await prisma.$disconnect();
