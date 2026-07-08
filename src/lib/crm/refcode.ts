import { prisma } from '@/lib/db';

const COUNTER = 'contact';

/** Incrémente le compteur unique et renvoie le prochain identifiant lisible (ID001…). */
export async function nextRefCode(): Promise<string> {
  const c = await prisma.counter.upsert({
    where: { name: COUNTER },
    create: { name: COUNTER, value: 1 },
    update: { value: { increment: 1 } },
  });
  return format(c.value);
}

export function format(n: number): string {
  return 'ID' + String(n).padStart(3, '0');
}

/** Assigne un refCode à un contact s'il n'en a pas (lazy). Renvoie le code. */
export async function ensureUserRefCode(userId: string, current: string | null): Promise<string> {
  if (current) return current;
  const code = await nextRefCode();
  await prisma.user.update({ where: { id: userId }, data: { refCode: code } }).catch(() => {});
  return code;
}

export async function ensureProspectRefCode(prospectId: string, current: string | null): Promise<string> {
  if (current) return current;
  const code = await nextRefCode();
  await prisma.prospect.update({ where: { id: prospectId }, data: { refCode: code } }).catch(() => {});
  return code;
}
