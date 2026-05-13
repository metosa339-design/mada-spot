import { prisma } from '../src/lib/db';
import { generateSecret, otpauthUrl, generateTotp } from '../src/lib/totp';

async function main() {
  const adminEmail = 'admin@madaflash.mg';
  const admin = await prisma.user.findFirst({
    where: { email: adminEmail, role: 'ADMIN' },
  });
  if (!admin) {
    console.error(`Admin ${adminEmail} introuvable`);
    process.exit(1);
  }

  if (admin.totpEnabled) {
    console.log('2FA déjà activée pour cet admin. Aucun changement.');
    process.exit(0);
  }

  const secret = generateSecret();
  const url = otpauthUrl(secret, adminEmail, 'Mada Spot Admin');

  await prisma.user.update({
    where: { id: admin.id },
    data: { totpSecret: secret, totpEnabled: false, totpVerifiedAt: null },
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('Setup 2FA pour', adminEmail);
  console.log('═══════════════════════════════════════════════════════');
  console.log();
  console.log('SECRET BASE32 (à entrer manuellement si pas de QR) :');
  console.log('  ', secret);
  console.log();
  console.log('otpauth URL (à scanner via QR code generator) :');
  console.log('  ', url);
  console.log();
  console.log('CODE ACTUEL (test, valide 30s) :', generateTotp(secret));
  console.log();
  console.log('Étapes pour activer :');
  console.log('  1. Ouvre Google Authenticator / Authy / 1Password');
  console.log('  2. Ajoute un compte en collant l\'URL ou le secret');
  console.log('  3. Login normalement sur /admin/login');
  console.log('  4. POST /api/admin/2fa/verify-setup avec { code: <code à 6 chiffres> }');
  console.log('  5. À partir de là, login requiert le code TOTP');
  console.log('═══════════════════════════════════════════════════════');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
