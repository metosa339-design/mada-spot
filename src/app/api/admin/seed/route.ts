// API Route - Créer le compte admin par défaut
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import crypto from 'crypto';

import { logger } from '@/lib/logger';
export async function POST(_request: NextRequest) {
  // Seed is only allowed in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Non autorisé en production' }, { status: 403 });
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@madaspot.mg';

    // Vérifier si un admin existe déjà
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Un compte admin existe déjà',
        email: existingAdmin.email,
      }, { status: 409 });
    }

    // Générer un mot de passe aléatoire sécurisé
    const generatedPassword = crypto.randomBytes(16).toString('base64url');
    const passwordHash = await hashPassword(generatedPassword);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        firstName: 'Admin',
        lastName: 'Mada Spot',
        password: passwordHash,
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Compte admin créé avec succès. Conservez le mot de passe, il ne sera plus affiché.',
      credentials: {
        email: adminEmail,
        password: generatedPassword,
      },
      user: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
    }, { status: 201 });
  } catch (error) {
    logger.error('Erreur création admin:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du compte admin' },
      { status: 500 }
    );
  }
}
