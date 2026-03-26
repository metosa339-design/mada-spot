import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await verifySession(token)
    if (!user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    const replies = await prisma.quickReply.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      replies: replies.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content,
      })),
    })
  } catch (error) {
    logger.error('Error fetching quick replies', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await verifySession(token)
    if (!user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    const { title, content } = await request.json()
    if (!title || !content) {
      return NextResponse.json({ error: 'Titre et contenu requis' }, { status: 400 })
    }

    const reply = await prisma.quickReply.create({
      data: {
        userId: user.id,
        title,
        content,
      },
    })

    return NextResponse.json({ reply: { id: reply.id, title: reply.title, content: reply.content } }, { status: 201 })
  } catch (error) {
    logger.error('Error creating quick reply', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await verifySession(token)
    if (!user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const reply = await prisma.quickReply.findUnique({ where: { id } })
    if (!reply || reply.userId !== user.id) {
      return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
    }

    await prisma.quickReply.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting quick reply', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
