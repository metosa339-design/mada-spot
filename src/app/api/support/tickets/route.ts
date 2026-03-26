import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError } from '@/lib/api-response'
import crypto from 'crypto'

function generateReference(): string {
  return 'TK-' + crypto.randomBytes(3).toString('hex').toUpperCase()
}

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('mada-spot-session')?.value
  if (!sessionToken) return apiError('Non authentifié', 401)
  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    select: { userId: true, expiresAt: true },
  })
  if (!session || session.expiresAt < new Date()) return apiError('Session expirée', 401)

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { replies: true } } },
  })
  return NextResponse.json({ tickets })
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('mada-spot-session')?.value
  let userId: string | null = null
  if (sessionToken) {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      select: { userId: true, expiresAt: true, user: { select: { email: true } } },
    })
    if (session && session.expiresAt > new Date()) userId = session.userId
  }

  const body = await request.json()
  const { subject, description, category, email } = body
  if (!subject || !description || !category) return apiError('Champs requis: subject, description, category')

  const ticketEmail = email || ''
  if (!ticketEmail && !userId) return apiError('Email requis')

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      email: ticketEmail,
      subject,
      description,
      category,
      reference: generateReference(),
    },
  })

  return NextResponse.json({ success: true, ticket }, { status: 201 })
}
