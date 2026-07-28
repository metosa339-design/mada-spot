/**
 * Cree ou reinitialise un compte administrateur.
 *
 * Le mot de passe passe par une variable d'environnement, jamais par argv :
 * les arguments de ligne de commande finissent dans l'historique du shell et
 * dans la liste des processus, visibles par tout utilisateur de la machine.
 *
 * Usage :
 *   ADMIN_EMAIL="toi@exemple.mg" ADMIN_PASSWORD='...' npx tsx scripts/set-admin-password.ts
 *
 * Le script est idempotent : relance = simple changement de mot de passe.
 */
import { prisma } from '../src/lib/db';
import { hashPassword, validatePasswordStrength } from '../src/lib/auth/password';

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      'Il manque ADMIN_EMAIL ou ADMIN_PASSWORD.\n' +
        "Exemple : ADMIN_EMAIL=\"toi@exemple.mg\" ADMIN_PASSWORD='...' npx tsx scripts/set-admin-password.ts"
    );
    process.exit(1);
  }

  const strength = validatePasswordStrength(password);
  if (!strength.isValid) {
    console.error('Mot de passe refuse :');
    strength.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, isActive: true, isBanned: true, totpEnabled: true },
  });

  const passwordHash = await hashPassword(password);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: passwordHash,
        role: 'ADMIN',
        isActive: true,
        isBanned: false,
        emailVerified: true,
      },
    });
    console.log(`Compte existant mis a jour : ${email}`);
    if (existing.role !== 'ADMIN') console.log(`  role passe de ${existing.role} a ADMIN`);
    if (existing.isBanned) console.log('  bannissement leve');
    // Le 2FA conditionne la connexion : sans le code, le mot de passe ne suffit pas.
    console.log(
      existing.totpEnabled
        ? '  2FA ACTIVE : un code a 6 chiffres sera demande en plus du mot de passe.'
        : '  2FA inactive : le mot de passe suffit.'
    );
  } else {
    await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'Mada Spot',
        isActive: true,
        emailVerified: true,
      },
    });
    console.log(`Compte administrateur cree : ${email}`);
    console.log('  2FA inactive : le mot de passe suffit.');
  }

  // Les sessions admin en cours restent valides 24 h apres un changement de mot de
  // passe. On les revoque pour que l'operation ait un effet immediat.
  const revoked = await prisma.session.deleteMany({
    where: { user: { email }, deviceInfo: 'admin-panel' },
  });
  if (revoked.count > 0) console.log(`  ${revoked.count} session(s) admin revoquee(s)`);

  console.log('\nConnexion : https://madaspot.com/admin/login');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
