import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/admin/messages/intervene — inject admin message into a conversation
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  try {
    const body = await request.json();
    const { receiverId, establishmentId, content, reason } = body;

    if (!receiverId) return apiError('receiverId requis', 400);
    if (!content?.trim()) return apiError('Message requis', 400);
    if (!reason?.trim()) return apiError('Raison d\'intervention requise', 400);

    // Create the message with admin prefix
    const prefixedContent = `[Admin MadaSpot] ${content.trim()}`;

    const message = await prisma.message.create({
      data: {
        senderId: admin.id,
        receiverId,
        establishmentId: establishmentId || null,
        content: prefixedContent,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'god_mode_message',
        entityType: 'message',
        entityId: message.id,
        userId: admin.id,
        details: JSON.stringify({
          receiverId,
          establishmentId,
          reason: reason.trim(),
          contentPreview: prefixedContent.slice(0, 100),
        }),
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error('Intervene error:', err);
    return apiError('Erreur serveur', 500);
  }
}
