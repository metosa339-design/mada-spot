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

    const documents = await prisma.verificationDocument.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      documents: documents.map(d => ({
        id: d.id,
        documentType: d.documentType,
        documentUrl: d.documentUrl,
        status: d.status,
        note: d.note,
        createdAt: d.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    logger.error('Error fetching verification docs', error instanceof Error ? error : undefined)
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

    const { documentType, documentUrl } = await request.json()
    if (!documentType || !documentUrl) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Check if document of this type already exists
    const existing = await prisma.verificationDocument.findFirst({
      where: { userId: user.id, documentType },
    })

    if (existing) {
      // Update existing
      await prisma.verificationDocument.update({
        where: { id: existing.id },
        data: {
          documentUrl,
          status: 'PENDING',
          note: null,
        },
      })
    } else {
      // Create new
      await prisma.verificationDocument.create({
        data: {
          userId: user.id,
          documentType,
          documentUrl,
        },
      })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    logger.error('Error uploading verification doc', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
