import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { logger } from '@/lib/logger';

// GET /api/admin/verification — List verification documents with filters
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autoris\u00e9', 401);

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const VALID_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'];

    // Build where clause
    const where: Record<string, unknown> = {};

    if (statusParam && VALID_STATUSES.includes(statusParam)) {
      where.status = statusParam;
    }

    if (search) {
      const q = search.trim();
      where.user = {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    const [documents, total, pending, verified, rejected] = await Promise.all([
      prisma.verificationDocument.findMany({
        where: where as any,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              userType: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // PENDING sorts first alphabetically
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.verificationDocument.count({ where: where as any }),
      prisma.verificationDocument.count({ where: { status: 'PENDING' } }),
      prisma.verificationDocument.count({ where: { status: 'VERIFIED' } }),
      prisma.verificationDocument.count({ where: { status: 'REJECTED' } }),
    ]);

    return NextResponse.json({
      documents,
      total,
      stats: { pending, verified, rejected },
    });
  } catch (error) {
    logger.error('[ADMIN VERIFICATION] Error fetching documents:', error);
    return apiError('Erreur serveur', 500);
  }
}

// PUT /api/admin/verification — Approve or reject a verification document
export async function PUT(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autoris\u00e9', 401);

  try {
    const body = await request.json().catch(() => null);
    if (body === null) {
      return NextResponse.json({ error: 'Corps de requ\u00eate JSON invalide' }, { status: 400 });
    }

    const { documentId, action, note } = body;

    if (!documentId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'documentId et action (approve/reject) requis' },
        { status: 400 }
      );
    }

    // Fetch the document
    const doc = await prisma.verificationDocument.findUnique({
      where: { id: documentId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document non trouv\u00e9' }, { status: 404 });
    }

    if (doc.status !== 'PENDING') {
      return NextResponse.json({ error: 'Ce document a d\u00e9j\u00e0 \u00e9t\u00e9 trait\u00e9' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'VERIFIED' : 'REJECTED';

    // Update document status
    const updated = await prisma.verificationDocument.update({
      where: { id: documentId },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: admin.id,
        note: note || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            userType: true,
          },
        },
      },
    });

    // Document type labels for notification messages
    const docTypeLabels: Record<string, string> = {
      nif: 'NIF',
      stat: 'STAT',
      business_license: 'Licence commerciale',
      id_card: 'Pi\u00e8ce d\'identit\u00e9',
    };
    const docLabel = docTypeLabels[doc.documentType] || doc.documentType;

    // Create notification for the user
    const notifTitle = action === 'approve'
      ? `Document v\u00e9rifi\u00e9 : ${docLabel}`
      : `Document refus\u00e9 : ${docLabel}`;
    const notifMessage = action === 'approve'
      ? `Votre document ${docLabel} a \u00e9t\u00e9 v\u00e9rifi\u00e9 et approuv\u00e9 par l'administration.`
      : `Votre document ${docLabel} a \u00e9t\u00e9 refus\u00e9.${note ? ` Motif : ${note}` : ''}`;

    await prisma.notification.create({
      data: {
        userId: doc.userId,
        type: 'SYSTEM' as any,
        title: notifTitle,
        message: notifMessage,
      },
    });

    // Audit log
    const meta = getRequestMeta(request);
    logAudit({
      userId: admin.id,
      action: action === 'approve' ? 'verification_approve' : 'verification_reject',
      entityType: 'verification_document',
      entityId: documentId,
      details: {
        documentType: doc.documentType,
        userId: doc.userId,
        userName: `${doc.user.firstName || ''} ${doc.user.lastName || ''}`.trim(),
        newStatus,
        note: note || null,
      },
      ...meta,
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    logger.error('[ADMIN VERIFICATION] Error processing document:', error);
    return apiError('Erreur serveur', 500);
  }
}
