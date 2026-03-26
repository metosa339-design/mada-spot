// Download real images from source articles
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'articles');

// Download image from URL
async function downloadImage(url: string, filename: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const protocol = url.startsWith('https') ? https : http;

      const request = protocol.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        }
      }, (response) => {
        // Follow redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            downloadImage(redirectUrl, filename).then(resolve);
            return;
          }
        }

        if (response.statusCode !== 200) {
          resolve(null);
          return;
        }

        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('image')) {
          resolve(null);
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks);
            if (buffer.length < 1000) {
              resolve(null);
              return;
            }

            // Create upload directory if needed
            if (!existsSync(UPLOAD_DIR)) {
              await mkdir(UPLOAD_DIR, { recursive: true });
            }

            // Determine extension
            let ext = '.jpg';
            if (contentType.includes('png')) ext = '.png';
            else if (contentType.includes('webp')) ext = '.webp';
            else if (contentType.includes('gif')) ext = '.gif';

            const finalFilename = `${filename}${ext}`;
            const filepath = path.join(UPLOAD_DIR, finalFilename);

            await writeFile(filepath, buffer);
            resolve(`/uploads/articles/${finalFilename}`);
          } catch (e) {
            resolve(null);
          }
        });
        response.on('error', () => resolve(null));
      });

      request.on('error', () => resolve(null));
      request.on('timeout', () => {
        request.destroy();
        resolve(null);
      });
    } catch (e) {
      resolve(null);
    }
  });
}

async function main() {
  console.log('Downloading real images from source articles...\n');

  // Get articles with external image URLs (not local uploads)
  const articles = await prisma.article.findMany({
    where: {
      imageUrl: {
        startsWith: 'http'
      }
    },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      sourceUrl: true
    }
  });

  console.log(`Found ${articles.length} articles with external images\n`);

  let downloaded = 0;
  let failed = 0;

  for (const article of articles) {
    if (!article.imageUrl) continue;

    // Generate unique filename
    const timestamp = Date.now();
    const hash = article.id.substring(0, 8);
    const filename = `${timestamp}-${hash}`;

    console.log(`[...] ${article.title.substring(0, 40)}...`);

    const localPath = await downloadImage(article.imageUrl, filename);

    if (localPath) {
      await prisma.article.update({
        where: { id: article.id },
        data: { imageUrl: localPath }
      });
      console.log(`  [OK] Saved: ${localPath}`);
      downloaded++;
    } else {
      console.log(`  [SKIP] Could not download`);
      failed++;
    }

    // Small delay to avoid overwhelming servers
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n========================================`);
  console.log(`Downloaded: ${downloaded} images`);
  console.log(`Failed: ${failed} images`);
  console.log(`========================================`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
