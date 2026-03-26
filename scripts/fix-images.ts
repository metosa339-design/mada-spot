// Fix missing images in articles
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default images from Unsplash (high quality news-related images)
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80', // newspaper
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80', // news
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80', // reading news
  'https://images.unsplash.com/photo-1478641300939-0ec5188d3802?w=800&q=80', // press
  'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=800&q=80', // microphone
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80', // meeting
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80', // business
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80', // conference
];

async function main() {
  console.log('Fixing missing images...\n');

  // Find articles without images or with broken images
  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { imageUrl: null },
        { imageUrl: '' },
      ]
    },
    select: { id: true, title: true }
  });

  console.log(`Found ${articles.length} articles without images\n`);

  let count = 0;
  for (const article of articles) {
    const randomImage = DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];

    await prisma.article.update({
      where: { id: article.id },
      data: { imageUrl: randomImage }
    });

    console.log(`[OK] ${article.title.substring(0, 50)}...`);
    count++;
  }

  console.log(`\nFixed ${count} articles`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
