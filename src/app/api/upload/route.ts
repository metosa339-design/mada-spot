// API pour l'upload de fichiers (images, PDF, vidéos, audio)
import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api-response';
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { getAuthUser } from '@/lib/auth'
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit'
import { verifyCsrfToken } from '@/lib/csrf'

import { logger } from '@/lib/logger';
// Route segment config pour Next.js App Router
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Types de fichiers autorisés
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}

// Taille maximale par type (en bytes)
const MAX_SIZES = {
  image: 10 * 1024 * 1024,      // 10 MB
  video: 100 * 1024 * 1024,     // 100 MB
  audio: 25 * 1024 * 1024,      // 25 MB
  document: 50 * 1024 * 1024    // 50 MB
}

const MAX_SIZE_LABELS: Record<string, string> = {
  image: '10 MB',
  video: '100 MB',
  audio: '25 MB',
  document: '50 MB'
}

function getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' | null {
  for (const [type, mimes] of Object.entries(ALLOWED_TYPES)) {
    if (mimes.includes(mimeType)) {
      return type as 'image' | 'video' | 'audio' | 'document'
    }
  }
  return null
}

function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = path.extname(originalName) || '.bin'
  const safeName = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9]/g, '-')
    .substring(0, 30)
  return `${timestamp}-${random}-${safeName}${ext}`
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rl = checkRateLimit(clientId, 'write')
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez plus tard.', retryAfter: rl.resetIn },
        { status: 429, headers: getRateLimitHeaders(rl) }
      )
    }

    // Vérifier l'authentification
    const sessionUser = await getAuthUser(request)
    if (!sessionUser) {
      return apiError('Non authentifié', 401)
    }

    // Parser le formData
    let formData
    try {
      formData = await request.formData()
    } catch (parseError) {
      logger.error('Erreur parsing formData:', parseError)
      return NextResponse.json({
        error: 'Erreur lors de la lecture du fichier. Le fichier est peut-être trop volumineux.'
      }, { status: 400 })
    }

    // CSRF verification (mandatory)
    const csrfToken = formData.get('csrfToken') as string | null
    if (!csrfToken || !verifyCsrfToken(csrfToken)) {
      return NextResponse.json({ error: 'Token CSRF invalide ou manquant' }, { status: 403 })
    }

    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    if (files.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 fichiers par envoi' }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      // Vérifier le type de fichier
      const fileType = getFileType(file.type)
      if (!fileType) {
        return NextResponse.json(
          { error: `Type de fichier non supporté: ${file.type}. Types acceptés: images, vidéos, audio, PDF` },
          { status: 400 }
        )
      }

      // Vérifier la taille
      const maxSize = MAX_SIZES[fileType]
      if (file.size > maxSize) {
        const currentSize = (file.size / 1024 / 1024).toFixed(1)
        return NextResponse.json(
          { error: `"${file.name}" est trop volumineux (${currentSize} MB). Taille max pour ${fileType}: ${MAX_SIZE_LABELS[fileType]}` },
          { status: 400 }
        )
      }

      // Créer le dossier de destination
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', fileType)

      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      // Générer un nom de fichier unique
      const fileName = generateFileName(file.name)
      const filePath = path.join(uploadDir, fileName)

      // Convertir le fichier en buffer et écrire
      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)
      } catch (writeError) {
        logger.error('Erreur écriture fichier:', writeError)
        return NextResponse.json(
          { error: `Erreur lors de l'enregistrement du fichier "${file.name}"` },
          { status: 500 }
        )
      }

      // URL publique du fichier
      const fileUrl = `/uploads/${fileType}/${fileName}`

      uploadedFiles.push({
        url: fileUrl,
        name: file.name,
        type: fileType,
        mimeType: file.type,
        size: file.size
      })
    }

    return NextResponse.json({ files: uploadedFiles })

  } catch (error) {
    logger.error('Erreur upload générale:', error)

    // Erreur de taille de body (413)
    if (error instanceof Error && error.message.includes('body')) {
      return NextResponse.json({
        error: 'Fichier trop volumineux pour être uploadé. Essayez avec un fichier plus petit.'
      }, { status: 413 })
    }

    return NextResponse.json({
      error: 'Erreur serveur lors de l\'upload. Veuillez réessayer.'
    }, { status: 500 })
  }
}
