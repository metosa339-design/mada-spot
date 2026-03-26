import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getClientIdentifier(request)
  const limit = checkRateLimit(ip, 'write')
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { establishmentId, clickType, sessionId } = await request.json()
    if (!establishmentId || !clickType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Get userId from session if available
    let userId: string | null = null
    const sessionToken = request.cookies.get('mada-spot-session')?.value
    if (sessionToken) {
      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        select: { userId: true },
      })
      if (session) userId = session.userId
    }

    await prisma.outboundClick.create({
      data: { establishmentId, clickType, userId, sessionId },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
