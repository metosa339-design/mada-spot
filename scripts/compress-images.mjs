import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve('public/images');
const MAX_WIDTH = 1200;
const JPEG_QUALITY = 75;
const PNG_QUALITY = 75;

function getAllImages(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllImages(fullPath));
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
      const stats = fs.statSync(fullPath);
      files.push({ fullPath, size: stats.size });
    }
  }
  return files;
}

async function compressOne(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const originalSize = fs.statSync(filePath).size;

  // Skip small files (< 100KB)
  if (originalSize < 100 * 1024) return { skipped: true, filePath };

  try {
    let pipeline = sharp(filePath).resize(MAX_WIDTH, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });

    let buffer;
    if (ext === '.png') {
      buffer = await pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9 }).toBuffer();
    } else {
      // Convert everything else to JPEG
      buffer = await pipeline.jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true }).toBuffer();
    }

    // Only write if smaller
    if (buffer.length < originalSize) {
      fs.writeFileSync(filePath, buffer);
      return { success: true, filePath, before: originalSize, after: buffer.length };
    }
    return { skipped: true, filePath, reason: 'already optimal' };
  } catch (err) {
    return { error: true, filePath, message: err.message };
  }
}

async function main() {
  console.log('Scanning images...');
  const images = getAllImages(PUBLIC_DIR);
  const totalBefore = images.reduce((s, i) => s + i.size, 0);
  console.log(`Found ${images.length} images (${(totalBefore / 1024 / 1024).toFixed(1)}MB)\n`);

  let compressed = 0, skipped = 0, errors = 0;
  let savedBytes = 0;

  for (let i = 0; i < images.length; i++) {
    const result = await compressOne(images[i].fullPath);

    if (result.success) {
      compressed++;
      const saved = result.before - result.after;
      savedBytes += saved;
      const pct = ((saved / result.before) * 100).toFixed(0);
      if (i % 20 === 0 || i === images.length - 1) {
        console.log(`[${i + 1}/${images.length}] Compressed ${compressed}, saved ${(savedBytes / 1024 / 1024).toFixed(1)}MB so far`);
      }
    } else if (result.error) {
      errors++;
      console.log(`[ERROR] ${result.filePath}: ${result.message}`);
    } else {
      skipped++;
    }
  }

  // Recalculate total
  const imagesAfter = getAllImages(PUBLIC_DIR);
  const totalAfter = imagesAfter.reduce((s, i) => s + i.size, 0);

  console.log(`\n=== Results ===`);
  console.log(`Compressed: ${compressed}, Skipped: ${skipped}, Errors: ${errors}`);
  console.log(`Before: ${(totalBefore / 1024 / 1024).toFixed(1)}MB`);
  console.log(`After:  ${(totalAfter / 1024 / 1024).toFixed(1)}MB`);
  console.log(`Saved:  ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(1)}MB (${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(0)}%)`);
}

main().catch(console.error);
