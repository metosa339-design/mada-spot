import { prisma } from '@/lib/db';

// Generate a URL-friendly slug from a name
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')    // Remove special chars
    .replace(/\s+/g, '-')            // Spaces to hyphens
    .replace(/-+/g, '-')             // Collapse multiple hyphens
    .replace(/^-|-$/g, '');          // Trim leading/trailing hyphens
}

// Generate a unique slug by checking DB for duplicates
export async function generateUniqueSlug(name: string, city?: string): Promise<string> {
  const base = city ? `${slugify(name)}-${slugify(city)}` : slugify(name);

  // Check if slug exists
  const existing = await prisma.establishment.findUnique({
    where: { slug: base },
    select: { id: true },
  });

  if (!existing) return base;

  // Try with incrementing suffix
  for (let i = 2; i <= 100; i++) {
    const candidate = `${base}-${i}`;
    const exists = await prisma.establishment.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }

  // Fallback: append random string
  const random = Math.random().toString(36).substring(2, 8);
  return `${base}-${random}`;
}
