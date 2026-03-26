// Import scraped articles from JSON file to Prisma
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function generateSlug(title: string): Promise<string> {
  let slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }
  return slug;
}

async function main() {
  console.log('Importing scraped articles from JSON...\n');

  const jsonPath = path.join(process.cwd(), 'automation', 'articles_export.json');
  const data = readFileSync(jsonPath, 'utf-8');
  const articles = JSON.parse(data);

  console.log(`Found ${articles.length} articles to import\n`);

  let count = 0;
  for (const article of articles) {
    try {
      const slug = await generateSlug(article.title);

      await prisma.article.create({
        data: {
          title: article.title,
          slug,
          summary: article.summary || null,
          content: article.content,
          imageUrl: article.imageUrl || null,
          sourceName: article.sourceName || 'Automation',
          sourceUrl: article.sourceUrl || null,
          status: 'published',
          publishedAt: new Date(),
          isFromRSS: true,
          isAiEnhanced: true,
        },
      });

      console.log(`[OK] ${article.title.substring(0, 50)}...`);
      count++;
    } catch (error: any) {
      console.log(`[ERR] ${article.title?.substring(0, 30) || 'Unknown'}... - ${error.message}`);
    }
  }

  console.log(`\nTotal: ${count} articles imported`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
