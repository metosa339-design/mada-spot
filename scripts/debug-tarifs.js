const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  // Find Metosaela
  const u = await p.user.findFirst({ where: { firstName: { startsWith: 'Meto' } } })
  if (!u) { console.log('User not found'); return }
  console.log('User:', u.id, u.email)

  // Check establishments
  const estabs = await p.establishment.findMany({
    where: { claimedByUserId: u.id },
    select: { id: true, name: true, type: true, hotel: { select: { roomTypes: { select: { name: true, pricePerNight: true } } } } },
  })
  console.log('Establishments:', JSON.stringify(estabs, null, 2))

  // Check sessions
  const sessions = await p.session.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, expiresAt: true },
    take: 3,
  })
  console.log('Sessions:', JSON.stringify(sessions, null, 2))
}

main().finally(() => p.$disconnect())
